import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, proxyUrl, type CollectionBrief } from "../api";
import { useAuth } from "../auth/AuthContext";
import { getProgress, isInLibrary, toggleLibrary } from "../library";
import { usePageTitle } from "../hooks/usePageTitle";
import { CoverImage } from "../components/CoverImage";
import type { ChapterItem, MangaCard } from "../types";
import { AdSlot } from "../components/AdSlot";

export default function MangaPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [manga, setManga] = useState<MangaCard | null>(null);
  const [myCollections, setMyCollections] = useState<CollectionBrief[]>([]);
  const [collectionMsg, setCollectionMsg] = useState<string | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [total, setTotal] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chapterFilter, setChapterFilter] = useState("");

  usePageTitle(manga?.title);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setChapterFilter("");
      try {
        const [m, feed] = await Promise.all([
          api.manga(id),
          api.chapters(id, 100, 0),
        ]);
        if (!alive) return;
        setManga(m);
        setChapters(feed.chapters);
        setTotal(feed.total);
        setSaved(isInLibrary(m.id));
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load manga");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setMyCollections([]);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const data = await api.collectionsMine();
        if (alive) setMyCollections(data);
      } catch {
        /* optional */
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const progress = manga ? getProgress(manga.id) : null;

  async function saveToCollection(collectionId: string) {
    if (!manga) return;
    setCollectionMsg(null);
    try {
      await api.addToCollection(collectionId, manga.id);
      setCollectionMsg("Added to collection.");
      const data = await api.collectionsMine();
      setMyCollections(data);
    } catch (e) {
      setCollectionMsg(e instanceof Error ? e.message : "Could not save");
    }
  }

  const filtered = useMemo(() => {
    const q = chapterFilter.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter(
      (c) =>
        c.chapter?.includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.group?.toLowerCase().includes(q),
    );
  }, [chapters, chapterFilter]);

  async function loadMore() {
    if (!manga || loadingMore || chapters.length >= total) return;
    setLoadingMore(true);
    try {
      const feed = await api.chapters(manga.id, 100, chapters.length);
      setChapters((prev) => [...prev, ...feed.chapters]);
      setTotal(feed.total);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) {
    return <div className="skeleton" style={{ height: 420 }} />;
  }

  if (error || !manga) {
    return <div className="empty-state">{error || "Not found"}</div>;
  }

  const first = chapters[chapters.length - 1];
  const continueChapter = progress
    ? chapters.find((c) => c.id === progress.chapterId) || first
    : first;

  function label(ch: ChapterItem) {
    const num = ch.chapter ? `Ch. ${ch.chapter}` : "Oneshot";
    return ch.title ? `${num} — ${ch.title}` : num;
  }

  return (
    <div>
      <div className="detail-layout">
        <div className="detail-cover">
          {manga.coverUrl ? (
            <CoverImage src={proxyUrl(manga.coverUrl)} alt={manga.title} />
          ) : null}
        </div>
        <div className="detail-main">
          <h1>{manga.title}</h1>
          <div className="detail-meta">
            {[manga.author, manga.artist, manga.status, manga.year]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div className="tag-row">
            {manga.tags.map((t) => (
              <Link
                className="tag tag--link"
                key={t}
                to={`/browse?tag=${encodeURIComponent(t)}&sort=popular`}
              >
                {t}
              </Link>
            ))}
          </div>
          <p className="detail-desc">
            {manga.description || "No synopsis available."}
          </p>
          <div className="detail-actions">
            {continueChapter ? (
              <Link
                className="btn btn-primary"
                to={`/read/${continueChapter.id}?manga=${manga.id}`}
              >
                {progress ? "Continue" : "Start reading"}
              </Link>
            ) : null}
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setSaved(toggleLibrary(manga))}
            >
              {saved ? "Saved" : "Add to library"}
            </button>
            {user && myCollections.length > 0 ? (
              <label className="collection-save">
                <span>Save to collection</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const cid = e.target.value;
                    if (cid) void saveToCollection(cid);
                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>
                    Choose…
                  </option>
                  {myCollections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                      {c.mangaIds.includes(manga.id) ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {user && myCollections.length === 0 ? (
              <Link className="btn btn-ghost" to="/library?tab=collections">
                Create a collection
              </Link>
            ) : null}
            {collectionMsg ? (
              <p className="collection-save-msg" role="status">
                {collectionMsg}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <AdSlot minHeight={72} />

      <section className="block">
        <div className="block-head">
          <h2>Chapters</h2>
          <span className="results-count" style={{ margin: 0 }}>
            {total} English · groups credited
          </span>
        </div>
        <input
          className="chapter-filter"
          placeholder="Filter chapters or group…"
          value={chapterFilter}
          onChange={(e) => setChapterFilter(e.target.value)}
        />
        <div className="chapter-list">
          {filtered.map((ch) => (
            <Link
              key={ch.id}
              className={`chapter-row ${progress?.chapterId === ch.id ? "chapter-row--current" : ""}`}
              to={`/read/${ch.id}?manga=${manga.id}`}
            >
              <div>
                <div>{label(ch)}</div>
                <small>{ch.group || "Unknown group"}</small>
              </div>
              <small>
                {ch.publishAt
                  ? new Date(ch.publishAt).toLocaleDateString()
                  : ""}
              </small>
            </Link>
          ))}
        </div>
        {chapters.length < total ? (
          <button
            type="button"
            className="btn btn-ghost view-more-btn"
            disabled={loadingMore}
            onClick={loadMore}
          >
            {loadingMore ? "Loading…" : `Load more (${chapters.length}/${total})`}
          </button>
        ) : null}
      </section>
    </div>
  );
}
