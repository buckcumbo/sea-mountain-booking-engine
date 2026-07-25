import ReactMarkdown from "react-markdown";

// Shared markdown renderer for guide articles. Used by the GuideDetail page
// and the admin editor's live preview so both render identically.
const COMPONENTS = {
  h2: ({ node, ...p }) => <h2 className="font-heading text-2xl font-semibold text-coast-navy mt-8 mb-3" {...p} />,
  h3: ({ node, ...p }) => <h3 className="font-heading text-xl font-semibold text-coast-navy mt-6 mb-2" {...p} />,
  p: ({ node, ...p }) => <p className="mb-4 leading-relaxed text-muted-foreground" {...p} />,
  ul: ({ node, ...p }) => <ul className="list-disc pl-6 mb-4 space-y-1 text-muted-foreground" {...p} />,
  ol: ({ node, ...p }) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-muted-foreground" {...p} />,
  a: ({ node, ...p }) => <a className="text-coast-ocean underline" {...p} />,
  strong: ({ node, ...p }) => <strong className="font-semibold text-coast-navy" {...p} />,
};

export default function GuideMarkdown({ children, className = "" }) {
  if (!children) return null;
  return (
    <div className={className}>
      <ReactMarkdown components={COMPONENTS}>{children}</ReactMarkdown>
    </div>
  );
}