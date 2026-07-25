import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Nightly backup: reads ALL records from the app's core entities using the
// service role, then commits one JSON file per entity plus a manifest to the
// private GitHub repo `smv-base44-backup` (created if missing) in a single
// commit. Requires the GitHub shared connector to be authorized.
//
// Safety: the only GitHub write that makes content visible is the final ref
// update; all blobs/tree/commit creation happens before it, so a failure at
// any earlier step leaves the branch untouched (no partial writes). Entity
// reads happen before any GitHub write, so a read failure writes nothing.
//
// PRIVACY: every backup is an ORPHAN commit (no parent) and the branch ref is
// force-updated, so the repo only ever holds the latest snapshot. Git history
// is deliberately NOT kept — GuestProfile/Reservation PII must be purgeable to
// honor GDPR/CCPA deletion requests, and immutable history would defeat that.
// (Old unreachable objects are garbage-collected by GitHub over time.)

const REPO_NAME = 'smv-base44-backup';
const PAGE_SIZE = 5000;
const ENTITY_NAMES = [
  'Listing',
  'CalendarDay',
  'AreaGuide',
  'SiteImage',
  'Review',
  'GuestProfile',
  'Reservation',
  'Quote',
  'Inquiry',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // 1. GitHub connector — fail fast and clear if not connected (no writes yet).
    let ghToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('github');
      ghToken = conn.accessToken;
    } catch (_connErr) {
      return Response.json(
        {
          error:
            'GitHub connector is not connected. Authorize the GitHub connector before running the backup.',
        },
        { status: 503 }
      );
    }
    if (!ghToken) {
      return Response.json(
        {
          error:
            'GitHub connector is not connected. Authorize the GitHub connector before running the backup.',
        },
        { status: 503 }
      );
    }

    const ghFetch = async (path, opts = {}) => {
      const res = await fetch(`https://api.github.com${path}`, {
        method: opts.method || 'GET',
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'smv-base44-backup',
          ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
      return res;
    };

    // 2. Resolve the connected GitHub user (repo owner).
    const userRes = await ghFetch('/user');
    if (!userRes.ok) {
      const txt = await userRes.text().catch(() => '');
      return Response.json(
        { error: `GitHub /user request failed (${userRes.status}): ${txt}` },
        { status: 502 }
      );
    }
    const ghUser = await userRes.json();
    const owner = ghUser.login;

    // 3. Ensure the private repo exists.
    let repoRes = await ghFetch(`/repos/${owner}/${REPO_NAME}`);
    let repo;
    if (repoRes.status === 404) {
      const createRes = await ghFetch('/user/repos', {
        method: 'POST',
        body: { name: REPO_NAME, private: true, auto_init: false },
      });
      if (!createRes.ok) {
        const txt = await createRes.text().catch(() => '');
        return Response.json(
          { error: `GitHub repo creation failed (${createRes.status}): ${txt}` },
          { status: 502 }
        );
      }
      repo = await createRes.json();
    } else if (!repoRes.ok) {
      const txt = await repoRes.text().catch(() => '');
      return Response.json(
        { error: `GitHub repo lookup failed (${repoRes.status}): ${txt}` },
        { status: 502 }
      );
    } else {
      repo = await repoRes.json();
    }
    const branch = repo.default_branch || 'main';

    // 4. Read ALL records from each entity (paginate until exhausted).
    const entities = base44.asServiceRole.entities;
    const backups = {};
    const counts = {};
    for (const name of ENTITY_NAMES) {
      const entity = entities[name];
      if (!entity) {
        return Response.json(
          { error: `Entity not found in SDK: ${name}` },
          { status: 500 }
        );
      }
      let skip = 0;
      let all = [];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const page = await entity.list('-created_date', PAGE_SIZE, skip);
        const arr = Array.isArray(page) ? page : [];
        all = all.concat(arr);
        if (arr.length < PAGE_SIZE) break;
        skip += PAGE_SIZE;
      }
      backups[name] = all;
      counts[name] = all.length;
    }

    // 5. Prepare the commit.
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const commitMessage = `backup ${dateStr}`;
    const manifest = {
      runTimestamp: now.toISOString(),
      commitMessage,
      entities: counts,
    };

    // 6. Resolve the branch tip for the commit parent + base tree.
    //    Empty repos (no commits) reject git/blobs with 409, so bootstrap an
    //    initial commit via the Contents API when the branch ref is missing.
    let refRes = await ghFetch(`/repos/${owner}/${REPO_NAME}/git/refs/heads/${branch}`);
    if (!refRes.ok) {
      const initRes = await ghFetch(
        `/repos/${owner}/${REPO_NAME}/contents/README.md`,
        {
          method: 'PUT',
          body: {
            message: 'initial commit',
            content: btoa(`${REPO_NAME} nightly entity backups`),
          },
        }
      );
      if (!initRes.ok) {
        const txt = await initRes.text().catch(() => '');
        return Response.json(
          { error: `GitHub repo initialization failed (${initRes.status}): ${txt}` },
          { status: 502 }
        );
      }
      refRes = await ghFetch(`/repos/${owner}/${REPO_NAME}/git/refs/heads/${branch}`);
    }
    // parentSha is only used to decide PATCH vs POST on the ref — the new
    // commit is an orphan (see PRIVACY note in the header).
    let parentSha = null;
    if (refRes.ok) {
      const refObj = await refRes.json();
      parentSha = refObj?.object?.sha || null;
    }

    // 7. Create a blob per entity file + the manifest.
    const treeEntries = [];
    for (const name of ENTITY_NAMES) {
      const content = JSON.stringify(backups[name], null, 2);
      const blobRes = await ghFetch(`/repos/${owner}/${REPO_NAME}/git/blobs`, {
        method: 'POST',
        body: { content, encoding: 'utf-8' },
      });
      if (!blobRes.ok) {
        const txt = await blobRes.text().catch(() => '');
        return Response.json(
          { error: `GitHub blob creation failed for ${name} (${blobRes.status}): ${txt}` },
          { status: 502 }
        );
      }
      const blob = await blobRes.json();
      treeEntries.push({
        path: `backups/latest/${name}.json`,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }
    const manifestBlobRes = await ghFetch(`/repos/${owner}/${REPO_NAME}/git/blobs`, {
      method: 'POST',
      body: { content: JSON.stringify(manifest, null, 2), encoding: 'utf-8' },
    });
    if (!manifestBlobRes.ok) {
      const txt = await manifestBlobRes.text().catch(() => '');
      return Response.json(
        { error: `GitHub manifest blob creation failed (${manifestBlobRes.status}): ${txt}` },
        { status: 502 }
      );
    }
    const manifestBlob = await manifestBlobRes.json();
    treeEntries.push({
      path: 'backups/latest/manifest.json',
      mode: '100644',
      type: 'blob',
      sha: manifestBlob.sha,
    });

    // README kept in every snapshot (the orphan-commit tree fully replaces the
    // previous root, so anything not in treeEntries would disappear).
    const readmeBlobRes = await ghFetch(`/repos/${owner}/${REPO_NAME}/git/blobs`, {
      method: 'POST',
      body: {
        content: `${REPO_NAME} nightly entity backups.\n\nHistory is intentionally squashed to a single commit per backup so guest personal data can be fully purged when a deletion request is honored.\n`,
        encoding: 'utf-8',
      },
    });
    if (!readmeBlobRes.ok) {
      const txt = await readmeBlobRes.text().catch(() => '');
      return Response.json(
        { error: `GitHub README blob creation failed (${readmeBlobRes.status}): ${txt}` },
        { status: 502 }
      );
    }
    const readmeBlob = await readmeBlobRes.json();
    treeEntries.push({
      path: 'README.md',
      mode: '100644',
      type: 'blob',
      sha: readmeBlob.sha,
    });

    // 8. Create the tree referencing all blobs. No base_tree: each backup is
    // a complete, self-contained tree (nothing inherited from prior commits).
    const treeBody = { tree: treeEntries };
    const treeRes = await ghFetch(`/repos/${owner}/${REPO_NAME}/git/trees`, {
      method: 'POST',
      body: treeBody,
    });
    if (!treeRes.ok) {
      const txt = await treeRes.text().catch(() => '');
      return Response.json(
        { error: `GitHub tree creation failed (${treeRes.status}): ${txt}` },
        { status: 502 }
      );
    }
    const tree = await treeRes.json();

    // 9. Create the commit — ORPHAN, no parents (see PRIVACY note).
    const commitBody = { message: commitMessage, tree: tree.sha };
    const commitRes = await ghFetch(`/repos/${owner}/${REPO_NAME}/git/commits`, {
      method: 'POST',
      body: commitBody,
    });
    if (!commitRes.ok) {
      const txt = await commitRes.text().catch(() => '');
      return Response.json(
        { error: `GitHub commit creation failed (${commitRes.status}): ${txt}` },
        { status: 502 }
      );
    }
    const commitObj = await commitRes.json();

    // 10. Update (or create) the branch ref — this is the only visibility point.
    let refUpdateRes;
    if (parentSha) {
      refUpdateRes = await ghFetch(
        `/repos/${owner}/${REPO_NAME}/git/refs/heads/${branch}`,
        { method: 'PATCH', body: { sha: commitObj.sha, force: true } }
      );
    } else {
      refUpdateRes = await ghFetch(`/repos/${owner}/${REPO_NAME}/git/refs`, {
        method: 'POST',
        body: { ref: `refs/heads/${branch}`, sha: commitObj.sha },
      });
    }
    if (!refUpdateRes.ok) {
      const txt = await refUpdateRes.text().catch(() => '');
      return Response.json(
        { error: `GitHub ref update failed (${refUpdateRes.status}): ${txt}` },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      repo: `${owner}/${REPO_NAME}`,
      branch,
      commitSha: commitObj.sha,
      commitMessage,
      runTimestamp: manifest.runTimestamp,
      entities: counts,
      fileCount: treeEntries.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});