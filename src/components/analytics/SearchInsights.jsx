export default function SearchInsights({ areaCounts, collectionCounts }) {
  const hasArea = areaCounts.length > 0;
  const hasCollection = collectionCounts.length > 0;

  if (!hasArea && !hasCollection) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No searches in this range yet.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-medium text-coast-navy mb-3">Top Area Filters</h4>
        {hasArea ? (
          <BarList items={areaCounts} />
        ) : (
          <p className="text-sm text-muted-foreground">No area filters used.</p>
        )}
      </div>
      <div>
        <h4 className="text-sm font-medium text-coast-navy mb-3">Top Collection Filters</h4>
        {hasCollection ? (
          <BarList items={collectionCounts} />
        ) : (
          <p className="text-sm text-muted-foreground">No collection filters used.</p>
        )}
      </div>
    </div>
  );
}

function BarList({ items }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map(({ label, count }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="w-36 text-sm text-muted-foreground truncate capitalize">
            {label.replace(/-/g, " ")}
          </div>
          <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
            <div
              className="bg-coast-ocean h-full rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <div className="text-sm font-medium w-8 text-right">{count}</div>
        </div>
      ))}
    </div>
  );
}