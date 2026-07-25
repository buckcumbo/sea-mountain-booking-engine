import React, { useState, useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLLAPSE_HEIGHT = 350;

// Title-case an ALL-CAPS string: "KEY FEATURES" -> "Key Features"
function titleCase(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w === "&" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function extractHeadingText(line) {
  return line.replace(/^#+\s*/, "").trim();
}

// A line is a heading if it's a markdown heading (# ...) OR a short all-caps line.
function isHeading(line) {
  const trimmed = line.trim();
  if (/^#{1,6}\s+/.test(trimmed)) return true;
  const text = extractHeadingText(trimmed);
  if (!text || text.length > 60) return false;
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

// Title-case only if the heading text is all-caps; leave mixed-case as-is.
function maybeTitleCase(text) {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 3 && letters === letters.toUpperCase()) {
    return titleCase(text);
  }
  return text;
}

function isBullet(line) {
  return /^[-*+]\s+/.test(line.trim());
}

function isOrderedItem(line) {
  return /^\d+\.\s+/.test(line.trim());
}

function cleanBullet(line) {
  return line.trim().replace(/^[-*+]\s+/, "");
}

// Parse storyCopy markdown into typed blocks: section (heading + optional bullets),
// bullets, olist, or paragraph.
function parseBlocks(markdown, hideSleeping) {
  const lines = markdown.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }

    if (isHeading(line)) {
      const rawHeading = extractHeadingText(line);
      const upperKey = rawHeading.toUpperCase();

      // Hide the duplicated sleeping arrangements block when sleepsWhere exists.
      if (hideSleeping && upperKey.includes("SLEEPING")) {
        i++;
        while (i < lines.length && (lines[i].trim() === "" || isBullet(lines[i]) || isOrderedItem(lines[i]))) i++;
        continue;
      }

      // Collect a following bullet list that belongs to this heading.
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      const bullets = [];
      while (j < lines.length && isBullet(lines[j])) {
        bullets.push(cleanBullet(lines[j]));
        j++;
      }
      blocks.push({
        type: "section",
        heading: maybeTitleCase(rawHeading),
        isKeyFeatures: upperKey.includes("KEY FEATURES"),
        bullets,
      });
      i = j;
      continue;
    }

    if (isBullet(line)) {
      const bullets = [];
      while (i < lines.length && isBullet(lines[i])) {
        bullets.push(cleanBullet(lines[i]));
        i++;
      }
      blocks.push({ type: "bullets", items: bullets });
      continue;
    }

    if (isOrderedItem(line)) {
      const items = [];
      while (i < lines.length && isOrderedItem(lines[i])) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "olist", items });
      continue;
    }

    // Plain paragraph (collect consecutive non-special lines)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !isHeading(lines[i]) &&
      !isBullet(lines[i]) &&
      !isOrderedItem(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }
  return blocks;
}

// Inline markdown renderer (bold, italic, links) without block <p> wrappers.
function InlineMd({ children }) {
  return (
    <ReactMarkdown components={{ p: ({ children: c }) => <>{c}</> }}>
      {children}
    </ReactMarkdown>
  );
}

export default function StoryDescription({ storyCopy, hasSleepsWhere, className = "" }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const contentRef = useRef(null);

  const blocks = useMemo(
    () => parseBlocks(storyCopy, { hideSleeping: !!hasSleepsWhere }),
    [storyCopy, hasSleepsWhere]
  );

  // Pull the Key Features section to the top as a checklist grid.
  const keyFeatures = blocks.find((b) => b.type === "section" && b.isKeyFeatures && b.bullets.length > 0);
  const rest = blocks.filter((b) => !(b.type === "section" && b.isKeyFeatures));

  useEffect(() => {
    if (contentRef.current) {
      setOverflows(contentRef.current.scrollHeight > COLLAPSE_HEIGHT + 10);
    }
  }, [blocks]);

  return (
    <div className={className}>
      {keyFeatures && (
        <div className="mb-5">
          <h3 className="font-heading text-sm font-semibold text-coast-navy mb-3">Key Features</h3>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-2">
            {keyFeatures.bullets.map((b, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-coast-ocean shrink-0 mt-0.5" />
                <span><InlineMd>{b}</InlineMd></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        ref={contentRef}
        className={`relative overflow-hidden ${expanded ? "" : `max-h-[${COLLAPSE_HEIGHT}px]`}`}
        style={{ maxHeight: expanded ? "none" : `${COLLAPSE_HEIGHT}px` }}
      >
        <div className="space-y-3">
          {rest.map((block, idx) => {
            if (block.type === "section") {
              return (
                <div key={idx}>
                  <h3 className="font-heading text-base font-semibold text-coast-navy mt-5 mb-2">
                    {block.heading}
                  </h3>
                  {block.bullets.length > 0 && (
                    <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                      {block.bullets.map((b, i) => (
                        <li key={i}><InlineMd>{b}</InlineMd></li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }
            if (block.type === "bullets") {
              return (
                <ul key={idx} className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  {block.items.map((b, i) => <li key={i}><InlineMd>{b}</InlineMd></li>)}
                </ul>
              );
            }
            if (block.type === "olist") {
              return (
                <ol key={idx} className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                  {block.items.map((b, i) => <li key={i}><InlineMd>{b}</InlineMd></li>)}
                </ol>
              );
            }
            return (
              <div key={idx} className="text-sm text-muted-foreground leading-relaxed">
                <InlineMd>{block.text}</InlineMd>
              </div>
            );
          })}
        </div>

        {!expanded && overflows && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-coast-foam to-transparent pointer-events-none" />
        )}
      </div>

      {overflows && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-coast-ocean hover:text-coast-ocean"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
      )}
    </div>
  );
}