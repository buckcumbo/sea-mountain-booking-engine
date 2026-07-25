import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Admin-only Google Drive image browser + importer for the photo manager.
// op "list": browse/search image files in Buck's Drive (read-only scope).
// op "import": download selected files server-side and re-upload them to
// Base44 file storage, returning permanent URLs. We never hand Drive URLs
// to the site directly — thumbnailLink/webContentLink require auth and expire.

const MAX_IMPORT = 10;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let payload: any = {};
    try { payload = await req.json(); } catch { payload = {}; }

    const conn = await base44.asServiceRole.connectors.getConnection("googledrive");
    if (!conn?.accessToken) {
      return Response.json({ error: "Google Drive is not connected." }, { status: 502 });
    }
    const auth = { Authorization: `Bearer ${conn.accessToken}` };

    if (payload.op === "list") {
      const terms = ["mimeType contains 'image/'", "trashed = false"];
      if (payload.search) {
        const safe = String(payload.search).replace(/\\/g, "").replace(/'/g, "\\'");
        terms.push(`name contains '${safe}'`);
      }
      const params = new URLSearchParams({
        q: terms.join(" and "),
        pageSize: "30",
        orderBy: "modifiedTime desc",
        fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink)",
      });
      if (payload.pageToken) params.set("pageToken", String(payload.pageToken));
      const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: auth });
      if (!r.ok) {
        console.error("Drive list failed:", r.status, await r.text());
        return Response.json({ error: "Could not browse Google Drive." }, { status: 502 });
      }
      const body = await r.json();
      return Response.json({
        files: (body.files || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          size: Number(f.size || 0),
          modifiedTime: f.modifiedTime,
          thumbnailLink: f.thumbnailLink || null,
        })),
        nextPageToken: body.nextPageToken || null,
      });
    }

    if (payload.op === "import") {
      const ids: string[] = Array.isArray(payload.fileIds) ? payload.fileIds.slice(0, MAX_IMPORT) : [];
      if (ids.length === 0) {
        return Response.json({ error: "fileIds is required." }, { status: 400 });
      }
      const imported: any[] = [];
      const failed: any[] = [];
      for (const id of ids) {
        try {
          const metaRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType`,
            { headers: auth },
          );
          if (!metaRes.ok) throw new Error(`metadata ${metaRes.status}`);
          const meta = await metaRes.json();
          if (!String(meta.mimeType || "").startsWith("image/")) {
            throw new Error("not an image");
          }
          const mediaRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`,
            { headers: auth },
          );
          if (!mediaRes.ok) throw new Error(`download ${mediaRes.status}`);
          const bytes = new Uint8Array(await mediaRes.arrayBuffer());
          const file = new File([bytes], meta.name || `drive-${id}.jpg`, { type: meta.mimeType });
          const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
          if (!file_url) throw new Error("upload returned no URL");
          imported.push({ id, name: meta.name, url: file_url });
        } catch (e) {
          console.error(`driveImages import failed for ${id}:`, e);
          failed.push({ id, error: "Import failed" });
        }
      }
      return Response.json({ imported, failed });
    }

    return Response.json({ error: "Unknown op. Use 'list' or 'import'." }, { status: 400 });
  } catch (e) {
    console.error("driveImages failed:", e);
    return Response.json({ error: "Drive request failed." }, { status: 500 });
  }
});
