import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical, Building2, CalendarDays, AlertTriangle } from "lucide-react";

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