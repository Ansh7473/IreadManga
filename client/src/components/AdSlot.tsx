import { useEffect, useState } from "react";

type Props = {
  minHeight?: number;
};

/** Lazy ad placeholder — swap for AdSense/script later without blocking LCP */
export function AdSlot({ minHeight = 90 }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 500);
    return () => window.clearTimeout(id);
  }, []);

  if (!ready) {
    return (
      <div
        className="ad-slot ad-slot--loading"
        style={{ minHeight }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className="ad-slot"
      style={{ minHeight }}
      data-ad-slot
      role="complementary"
      aria-label="Advertisement"
    />
  );
}
