import { Link } from "react-router-dom";
import { proxyUrl } from "../api";
import { CoverImage } from "./CoverImage";
import type { MangaCard as Manga } from "../types";

type Props = {
  manga: Manga;
  subtitle?: string;
  variant?: "default" | "compact";
  href?: string;
};

export function MangaCard({
  manga,
  subtitle,
  variant = "default",
  href,
}: Props) {
  const to = href ?? `/manga/${manga.id}`;

  return (
    <Link className={`cover-card cover-card--${variant}`} to={to}>
      <div className="cover-card-art">
        {manga.coverUrl ? (
          <CoverImage src={proxyUrl(manga.coverUrl)} alt={manga.title} />
        ) : (
          <div className="cover-fallback" aria-label={manga.title} role="img" />
        )}
        <div className="cover-card-shade" />
        <div className="cover-card-label">
          <span className="cover-card-title">{manga.title}</span>
          {subtitle || manga.lastChapter ? (
            <span className="cover-card-sub">
              {subtitle || `Ch. ${manga.lastChapter}`}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
