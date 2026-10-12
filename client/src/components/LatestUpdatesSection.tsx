import { useState } from "react";
import { Link } from "react-router-dom";
import { proxyUrl } from "../api";
import { CoverImage } from "./CoverImage";
import type { LatestItem } from "../types";
import { timeAgo } from "../utils/time";

type View = "table" | "grid";

type Props = {
  items: LatestItem[];
  loading: boolean;
};

const VIEW_KEY = "irm:latestView";

export function LatestUpdatesSection({ items, loading }: Props) {
  const [view, setView] = useState<View>(() =>
    localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "table",
  );
  const [limit, setLimit] = useState(16);

  function setViewMode(next: View) {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  }

  const visible = items.slice(0, limit);

  return (
    <section className="block">
      <div className="block-head">
        <h2>
          <span className="block-icon" aria-hidden>
            ≡
          </span>
          Latest updates
        </h2>
        <div className="block-tools">
          <button
            type="button"
            className={`chip chip--sm ${view === "table" ? "chip--on" : ""}`}
            onClick={() => setViewMode("table")}
            aria-pressed={view === "table"}
          >
            List
          </button>
          <button
            type="button"
            className={`chip chip--sm ${view === "grid" ? "chip--on" : ""}`}
            onClick={() => setViewMode("grid")}
            aria-pressed={view === "grid"}
          >
            Grid
          </button>
        </div>
      </div>

      {!loading && items.length === 0 ? (
        <div className="empty-state">No recent updates right now.</div>
      ) : view === "grid" ? (
        <div className="latest-grid">
          {visible.map((item) => (
            <Link
              key={`${item.id}-${item.latestChapter.id}`}
              className="latest-grid-card"
              to={`/read/${item.latestChapter.id}?manga=${item.id}`}
            >
              {item.coverUrl ? (
                <CoverImage src={proxyUrl(item.coverUrl)} alt={item.title} />
              ) : (
                <div className="cover-fallback" />
              )}
              <div className="latest-grid-meta">
                <strong>{item.title}</strong>
                <span>
                  Ch. {item.latestChapter.chapter ?? "?"} ·{" "}
                  {timeAgo(item.latestChapter.publishAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="update-table">
          <div className="update-table-head">
            <span>Series</span>
            <span>Chapter</span>
            <span>Group</span>
            <span>When</span>
          </div>
          {visible.map((item) => (
            <Link
              key={`${item.id}-${item.latestChapter.id}`}
              className="update-row"
              to={`/read/${item.latestChapter.id}?manga=${item.id}`}
            >
              <span className="update-series">
                {item.coverUrl ? (
                  <CoverImage src={proxyUrl(item.coverUrl)} alt="" />
                ) : null}
                <strong>{item.title}</strong>
              </span>
              <span>
                {item.latestChapter.volume
                  ? `Vol. ${item.latestChapter.volume} `
                  : ""}
                Ch. {item.latestChapter.chapter ?? "?"}
              </span>
              <span className="update-muted">
                {item.latestChapter.group || "—"}
              </span>
              <span className="update-muted">
                {timeAgo(item.latestChapter.publishAt)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {items.length > limit ? (
        <button
          type="button"
          className="btn btn-ghost view-more-btn"
          onClick={() => setLimit((n) => n + 16)}
        >
          View more…
        </button>
      ) : null}
    </section>
  );
}
