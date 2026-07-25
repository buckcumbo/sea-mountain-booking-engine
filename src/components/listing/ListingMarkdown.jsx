import ReactMarkdown from "react-markdown";

// Shared markdown renderer for listing descriptions. Used by the detail page
// and the admin editor's live preview so both render identically.
const COMPONENTS = {
  h2: ({ node, ...p }) => <h2 className="font-heading text-base font-semibold text-coast-navy mt-6 mb-2" {...p} />,
  h3: ({ node, ...p }) => <h3 className="font-heading text-sm font-semibold text-coast-navy mt-4 mb-1.5" {...p} />,
  p: ({ node, ...p }) => <p className="mb-3" {...p} />,
  ul: ({ node, ...p }) => <ul className="list-disc pl-6 space-y-1 my-3" {...p} />,
  ol: ({ node, ...p }) => <ol className="list-decimal pl-6 space-y-1 my-3" {...p} />,
  a: ({ node, ...p }) => <a className="text-coast-ocean underline" {...p} />,
  strong: ({ node, ...p }) => <strong className="font-semibold text-coast-navy" {...p} />,
  em: ({ node, ...p }) => <em className="italic" {...p} />,
};

export default function ListingMarkdown({ children, className = "" }) {
  if (!children) return null;
  return (
    <div className={`text-sm text-muted-foreground leading-relaxed ${className}`}>
      <ReactMarkdown components={COMPONENTS}>{children}</ReactMarkdown>
    </div>
  );
}