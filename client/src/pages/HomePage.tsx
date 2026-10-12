import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, proxyUrl } from "../api";
import { getHistory, getProgress } from "../library";
import { usePageTitle } from "../hooks/usePageTitle";
import type { LatestItem, MangaCard } from "../types";
import { MangaCard as CoverCard } from "../components/MangaCard";
import { CoverImage } from "../components/CoverImage";
import { LatestUpdatesSection } from "../components/LatestUpdatesSection";
import { AdSlot } from "../components/AdSlot";
import { UserCollectionsSection } from "../components/UserCollectionsSection";
import { CommunitySidebar } from "../components/CommunitySidebar";

type Trend = "popular" | "recent" | "updated";

export default function HomePage() {
  usePageTitle("Home");
  const [latest, setLatest] = useState<LatestItem[]>([]);
  const [recent, setRecent] = useState<MangaCard[]>([]);
  const [trending, setTrending] = useState<MangaCard[]>([]);
  const [trend, setTrend] = useState<Trend>("popular");
  const [history] = useState(() => getHistory().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [l, r, t] = await Promise.all([
          api.latest(32),
          api.recent(12),
          api.browse({ sort: "popular", limit: 12 }),
        ]);
        if (!alive) return;
        setLatest(l);
        setRecent(r);
        setTrending(t);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.browse({ sort: trend, limit: 12 });
        if (alive) setTrending(data);
      } catch {
        /* keep previous */
      }
    })();
    return () => {
      alive = false;
    };
  }, [trend]);

  const hot = latest.slice(0, 14);
  const continueItems = history.slice(0, 6);

  return (
    <div className="page-home">
      {error ? <div className="alert">{error}</div> : null}

      <section className="block">
        <div className="block-head">
          <h2>
            <span className="block-icon" aria-hidden>
              ◆
            </span>
            Hot updates
          </h2>
          <Link className="block-more" to="/browse?sort=updated">
            More »
          </Link>
        </div>
        <div className="grid grid--covers">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="cover-card skeleton"
                  style={{ aspectRatio: "2 / 3" }}
                />
              ))
            : hot.map((item) => (
                <CoverCard
                  key={item.id}
                  manga={item}
                  subtitle={`Ch. ${item.latestChapter.chapter ?? "?"}`}
                  href={`/read/${item.latestChapter.id}?manga=${item.id}`}
                />
              ))}
        </div>
      </section>

      {continueItems.length > 0 ? (
        <section className="block">
          <div className="block-head">
            <h2>Continue reading</h2>
          </div>
          <div className="grid grid--covers">
            {continueItems.map((h) => {
              const progress = getProgress(h.manga.id);
              return (
                <CoverCard
                  key={h.manga.id}
                  manga={h.manga}
                  subtitle={progress?.chapterLabel || h.chapterLabel}
                  href={`/read/${progress?.chapterId || h.chapterId}?manga=${h.manga.id}`}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="block">
          <div className="block-head">
            <h2>History</h2>
            <Link className="block-more" to="/library?tab=history">
              Open library »
            </Link>
          </div>
          <div className="history-strip">
            {history.map((h) => (
              <Link
                key={`${h.manga.id}-${h.chapterId}`}
                className="history-pill"
                to={`/read/${h.chapterId}?manga=${h.manga.id}`}
              >
                {h.manga.coverUrl ? (
                  <CoverImage src={proxyUrl(h.manga.coverUrl)} alt="" />
                ) : (
                  <span className="cover-fallback" />
                )}
                <span>
                  <strong>{h.manga.title}</strong>
                  <small>{h.chapterLabel}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="page-with-community">
        <div className="page-with-community__main">
          <LatestUpdatesSection items={latest} loading={loading} />
          <AdSlot minHeight={90} />
          <UserCollectionsSection />
        </div>
        <CommunitySidebar />
      </div>

      <section className="block">
        <div className="block-head">
          <h2>Hot series</h2>
          <div className="chip-row" style={{ margin: 0 }}>
            {(
              [
                ["popular", "All-time"],
                ["updated", "Weekly"],
                ["recent", "New"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`chip chip--sm ${trend === id ? "chip--on" : ""}`}
                onClick={() => setTrend(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid--covers">
          {trending.map((m) => (
            <CoverCard key={m.id} manga={m} />
          ))}
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <h2>Recently added</h2>
        </div>
        <div className="grid grid--covers">
          {recent.map((m) => (
            <CoverCard key={m.id} manga={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
