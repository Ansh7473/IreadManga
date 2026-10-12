import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  ariaLabel: string;
};

export function HorizontalCarousel({ children, className, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function scrollByDir(dir: -1 | 1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.75), behavior: "smooth" });
  }

  return (
    <div className={`carousel-wrap ${className ?? ""}`}>
      <button
        type="button"
        className="carousel-btn"
        aria-label={`Scroll ${ariaLabel} left`}
        onClick={() => scrollByDir(-1)}
      >
        ‹
      </button>
      <div className="carousel-track" ref={ref}>
        {children}
      </div>
      <button
        type="button"
        className="carousel-btn"
        aria-label={`Scroll ${ariaLabel} right`}
        onClick={() => scrollByDir(1)}
      >
        ›
      </button>
    </div>
  );
}
