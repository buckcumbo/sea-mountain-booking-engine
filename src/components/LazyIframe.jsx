import React, { useRef, useState, useEffect } from "react";

// Defers iframe loading until the container scrolls near the viewport.
// The reviews embed is heavy; loading it on first paint was dragging down
// every listing page and the homepage. loading="lazy" on iframes is
// inconsistently honored, so an IntersectionObserver does it reliably.
export default function LazyIframe({ height = 1200, rootMargin = "600px", style, ...iframeProps }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {visible && (
        <iframe height={height} style={{ border: 0, minHeight: height, ...style }} {...iframeProps} />
      )}
    </div>
  );
}