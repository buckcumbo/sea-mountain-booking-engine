import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical, Building2, CalendarDays, AlertTriangle, Trash2, Sparkles } from "lucide-react";

// One-time Hospitable seed import (see base44/functions/importFromHospitable).
// Workflow: Dry run (verify mapping) → Import listings → Import calendars.
// Everything lands with guestyId "hosp_..." so pre-Guesty cleanup is trivial.
export default function HospitableImport() {
  const [running, setRunning] = useState("");
  const [log, setLog] = useState([]);
  const [dryRunResult, setDryRunResult] = useState(null);
  const stopRef = useRef(false);

  const addLog = (line) => setLog((l) => [...l, `${new Date().toLocaleTimeString()} — ${line}`]);

  const invoke = async (payload) => {
    const res = await base44.functions.invoke("importFromHospitable", payload);
    const data = res?.data ?? res;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const dryRun = async () => {
    setRunning("dry-run");
    setDryRunResult(null);
    try {
      addLog("Dry run: fetching sample data from Hospitable…");
      const data = await invoke({ mode: "dry-run" });
      setDryRunResult(data);
      addLog(`Dry run OK — account reports ${data.totalProperties ?? "?"} properties. Review the mapping below.`);
    } catch (e) {
      addLog(`Dry run failed: ${e.message}`);
    } finally {
      setRunning("");
    }
  };

  const importListings = async () => {
    setRunning("listings");
    stopRef.current = false;
    try {
      let page = 1;
      let total = 0;
      while (page && !stopRef.current) {
        addLog(`Importing listings — page ${page}…`);
        const data = await invoke({ mode: "listings", page });
        total += data.imported || 0;
        addLog(`Page ${page}: ${data.imported} listings imported (running total ${total}).`);
        page = data.nextPage;
      }
      addLog(`Listings done — ${total} imported/updated. Now run the calendar import.`);
    } catch (e) {
      addLog(`Listings import stopped: ${e.message}`);
    } finally {
      setRunning("");
    }
  };

  const enrich = async () => {
    setRunning("enrich");
    stopRef.current = false;
    try {
      addLog("Merging descriptions & editorial content from the original same-named records…");
      const mergeRes = await invoke({ mode: "merge-legacy" });
      addLog(`Merged editorial content into ${mergeRes.merged} homes from their original records.`);
      if (Array.isArray(mergeRes.unmatched) && mergeRes.unmatched.length > 0) {
        addLog(`No original match found for: ${mergeRes.unmatched.join("; ")}`);
      }
      let offset = 0;
      let described = 0;
      let curated = 0;
      while (offset !== null && !stopRef.current) {
        addLog(`Enriching listings ${offset + 1} onward (descriptions + amenity cleanup)…`);
        const data = await invoke({ mode: "enrich", offset, limit: 15 });
        described += data.described || 0;
        curated += data.curated || 0;
        addLog(`Batch done — ${data.described} descriptions pulled, ${data.curated} amenity lists curated.`);
        if (data.noDescriptionFoundKeys) {
          addLog(`Note: Hospitable returned no description text. Property fields seen: ${data.noDescriptionFoundKeys.join(", ")}`);
        }
        offset = data.nextOffset;
      }
      if (!stopRef.current) {
        addLog("Filling same-building units that still lack copy from their siblings…");
        const fill = await invoke({ mode: "sibling-fill" });
        addLog(`Done — ${described} descriptions imported, ${fill.filled} borrowed from sibling units, ${curated} amenity lists cleaned. Manual edits are never overwritten.`);
      }
    } catch (e) {
      addLog(`Enrich stopped: ${e.message}`);
    } finally {
      setRunning("");
    }
  };

  const purgeSeeds = async () => {
    const ok = window.confirm(
      "Permanently delete all ORIGINAL listings (everything not imported from Hospitable) and their calendar rows? Their descriptions and editorial content should already be merged into the real homes (step 4). Real hosp_ homes are untouched. This cannot be undone."
    );
    if (!ok) return;
    setRunning("purge");
    stopRef.current = false;
    try {
      let remaining = 1;
      let listings = 0;
      let days = 0;
      while (remaining > 0 && !stopRef.current) {
        addLog("Purging old seed listings…");
        const res = await base44.functions.invoke("purgeSeedListings", { confirm: "PURGE" });
        const data = res?.data ?? res;
        if (data?.error) throw new Error(data.error);
        listings += data.listingsDeleted || 0;
        days += data.daysDeleted || 0;
        remaining = data.remaining || 0;
        addLog(`Removed ${data.listingsDeleted} listings + ${data.daysDeleted} calendar rows (${remaining} to go).`);
      }
      addLog(`Purge done — ${listings} mock listings and ${days} calendar rows removed. Now run \"2. Import listings\" once more so real homes reclaim the clean URLs.`);
    } catch (e) {
      addLog(`Purge stopped: ${e.message}`);
    } finally {
      setRunning("");
    }
  };

  const importCalendars = async () => {
    setRunning("calendars");
    stopRef.current = false;
    try {
      let offset = 0;
      while (offset !== null && !stopRef.current) {
        addLog(`Importing calendars — listings ${offset + 1} onward…`);
        const data = await invoke({ mode: "calendars", offset, limit: 5 });
        for (const r of data.results || []) {
          addLog(r.skipped ? `${r.listing}: skipped (${r.skipped})` : `${r.listing}: ${r.days} days imported.`);
        }
        offset = data.nextOffset;
      }
      addLog("Calendar import done. Search, maps, and the booking calendar now run on real-shaped data.");
    } catch (e) {
      addLog(`Calendar import stopped: ${e.message}`);
    } finally {
      setRunning("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 rounded-xl px-4 py-3 text-sm flex gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          One-time test seed from Hospitable — Streamline stays the source of truth. Imported records are
          keyed <code className="font-mono">hosp_…</code> and get deleted before Guesty go-live. Run the
          dry run first and check the field mapping. Guests are never imported.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={dryRun} disabled={!!running} variant="outline" className="gap-2">
          {running === "dry-run" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
          1. Dry run
        </Button>
        <Button onClick={importListings} disabled={!!running} className="gap-2">
          {running === "listings" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
          2. Import listings
        </Button>
        <Button onClick={importCalendars} disabled={!!running} className="gap-2">
          {running === "calendars" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
          3. Import calendars
        </Button>
        <Button onClick={enrich} disabled={!!running} variant="outline" className="gap-2">
          {running === "enrich" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          4. Merge content + amenity cleanup
        </Button>
        <Button onClick={purgeSeeds} disabled={!!running} variant="outline" className="gap-2 border-destructive/40 text-destructive">
          {running === "purge" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          5. Remove old seed listings (run 4 first!)
        </Button>
        {running && running !== "dry-run" && (
          <Button variant="outline" onClick={() => { stopRef.current = true; }} className="text-destructive">
            Stop after current batch
          </Button>
        )}
      </div>

      {log.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 max-h-64 overflow-y-auto text-xs font-mono space-y-1">
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {dryRunResult && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-medium mb-2">
            Dry-run result — raw Hospitable data vs. our mapping. Verify before importing.
          </p>
          <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
            {JSON.stringify(dryRunResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}