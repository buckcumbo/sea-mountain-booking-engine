import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Mail, Phone, Home, RefreshCw } from "lucide-react";

export default function InquiriesTable() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Inquiry.list("-created_date", 500);
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (item) => {
    const next = item.status === "handled" ? "new" : "handled";
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
    try {
      await base44.entities.Inquiry.update(item.id, { status: next });
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)));
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-muted-foreground">
          {items.length} inquir{items.length === 1 ? "y" : "ies"}
        </span>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Type</th>
              <th className="text-left font-medium px-4 py-3">Name</th>
              <th className="text-left font-medium px-4 py-3">Contact</th>
              <th className="text-left font-medium px-4 py-3">Message</th>
              <th className="text-left font-medium px-4 py-3">Received</th>
              <th className="text-center font-medium px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No inquiries yet.</td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.id} className="border-t border-border hover:bg-muted/30 align-top">
                  <td className="px-4 py-3">
                    <span className="inline-flex text-xs font-medium px-2 py-1 rounded-full bg-coast-ocean/10 text-coast-ocean">
                      {it.type === "property-management" ? "PM" : "Contact"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{it.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      <a href={`mailto:${it.email}`} className="inline-flex items-center gap-1 hover:text-coast-navy">
                        <Mail className="w-3.5 h-3.5" />{it.email}
                      </a>
                      {it.phone && (
                        <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{it.phone}</span>
                      )}
                      {it.propertyAddress && (
                        <span className="inline-flex items-center gap-1"><Home className="w-3.5 h-3.5" />{it.propertyAddress}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-sm">
                    <p className="line-clamp-3">{it.message}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {it.created_date ? new Date(it.created_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggle(it)}
                      className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                        it.status === "handled"
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                      }`}
                    >
                      {it.status === "handled" ? "Handled" : "New"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}