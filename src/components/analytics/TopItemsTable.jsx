import { Link } from "react-router-dom";

export default function TopItemsTable({ items, emptyMessage }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage || "No data yet for this range."}
      </div>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-muted-foreground">
        <tr>
          <th className="text-left font-medium px-4 py-2 w-8">#</th>
          <th className="text-left font-medium px-4 py-2">Title</th>
          <th className="text-right font-medium px-4 py-2 w-16">Views</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item.slug || i} className="border-t border-border">
            <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
            <td className="px-4 py-2">
              {item.href ? (
                <Link to={item.href} className="text-coast-ocean hover:underline">
                  {item.title}
                </Link>
              ) : (
                item.title || item.slug
              )}
            </td>
            <td className="px-4 py-2 text-right font-medium">{item.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}