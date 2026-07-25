import { Eye, Users, Building2, Search, Heart, MessageSquare } from "lucide-react";

const CARDS = [
  { key: "page_view", label: "Page Views", icon: Eye },
  { key: "sessions", label: "Unique Sessions", icon: Users },
  { key: "listing_view", label: "Listing Views", icon: Building2 },
  { key: "search", label: "Searches", icon: Search },
  { key: "favorite_add", label: "Favorites Added", icon: Heart },
  { key: "inquiry_submit", label: "Inquiries", icon: MessageSquare },
];

export default function SummaryCards({ counts }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {CARDS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-heading font-semibold text-coast-navy">
            {counts[key] ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}