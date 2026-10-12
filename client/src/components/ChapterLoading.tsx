type Props = {
  title?: string;
};

export function ChapterLoading({ title }: Props) {
  return (
    <div className="chapter-load" role="status" aria-live="polite">
      <div className="chapter-load__mark" aria-hidden>
        <span className="chapter-load__page">
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className="chapter-load__glass" />
      </div>
      <p className="chapter-load__title">{title || "Opening chapter"}</p>
      <p className="chapter-load__sub">Searching pages</p>
    </div>
  );
}
