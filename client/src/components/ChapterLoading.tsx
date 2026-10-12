type Props = {
  title?: string;
};

export function ChapterLoading({ title }: Props) {
  return (
    <div className="chapter-load" role="status" aria-live="polite">
      <div className="chapter-load__mark" aria-hidden>
        <span className="chapter-load__arc" />
      </div>
      <div className="chapter-load__track" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className="chapter-load__title">{title || "Opening chapter"}</p>
    </div>
  );
}
