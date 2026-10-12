import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, proxyUrl } from "../api";
import { pushHistory, setProgress } from "../library";
import { usePageTitle } from "../hooks/usePageTitle";
import type { ChapterPages, MangaCard } from "../types";
import { useAuth } from "../auth/AuthContext";
import { AdSlot } from "../components/AdSlot";
import { ChapterComments } from "../components/ChapterComments";

export default function ReaderPage() {
  const { chapterId = "" } = useParams();
  const [params] = useSearchParams();
  const mangaId = params.get("manga") || "";
  const navigate = useNavigate();
  const { user, refresh } = useAuth();

  const [pages, setPages] = useState<ChapterPages | null>(null);
  const [manga, setManga] = useState<MangaCard | null>(null);
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSaver, setDataSaver] = useState(
    () => localStorage.getItem("irm:dataSaver") === "1",
  );
  const [readPct, setReadPct] = useState(0);
  const [commentChapterLabel, setCommentChapterLabel] = useState<string>();
  const [commentMangaTitle, setCommentMangaTitle] = useState<string>();

  usePageTitle(manga ? `${manga.title} — Reader` : "Reader");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const pageData = await api.pages(chapterId);
        if (!alive) return;
        setPages(pageData);

        if (user && chapterId) {
          void api
            .recordReading(chapterId)
            .then((r) => {
              if (r.newRead) void refresh();
            })
            .catch(() => {
              /* ignore tracking errors */
            });
        }

        if (mangaId) {
          const [m, feed] = await Promise.all([
            api.manga(mangaId),
            api.chapters(mangaId, 100, 0),
          ]);
          if (!alive) return;
          setManga(m);
          setCommentMangaTitle(m.title);
          setChapterIds(feed.chapters.map((c) => c.id));
          const ch = feed.chapters.find((c) => c.id === chapterId);
          const label = `Ch. ${ch?.chapter ?? "?"}`;
          const chNum = ch?.chapter ?? "?";
          const chTitle = ch?.title?.trim();
          setCommentChapterLabel(
            chTitle
              ? `CHAPTER ${chNum} - ${chTitle.toUpperCase()}`
              : `CHAPTER ${chNum}`,
          );
          pushHistory(m, chapterId, label);
          setProgress(m.id, chapterId, label, 0);
        } else {
          setCommentMangaTitle(undefined);
          setCommentChapterLabel(undefined);
        }
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load chapter");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [chapterId, mangaId, user, refresh]);

  const index = useMemo(
    () => chapterIds.findIndex((id) => id === chapterId),
    [chapterIds, chapterId],
  );
  const prevId = index >= 0 ? chapterIds[index + 1] : undefined;
  const nextId = index > 0 ? chapterIds[index - 1] : undefined;

  const images = dataSaver ? pages?.dataSaver : pages?.pages;

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setReadPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapterId, pages]);

  useEffect(() => {
    const go = (id: string | undefined) => {
      if (!id) return;
      navigate(`/read/${id}${mangaId ? `?manga=${mangaId}` : ""}`);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(prevId);
      if (e.key === "ArrowRight") go(nextId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevId, nextId, mangaId, navigate]);

  function toggleSaver() {
    setDataSaver((v) => {
      const next = !v;
      localStorage.setItem("irm:dataSaver", next ? "1" : "0");
      return next;
    });
  }

  if (loading) {
    return <div className="skeleton" style={{ height: 600 }} />;
  }

  if (error || !pages) {
    return <div className="empty-state">{error || "Chapter unavailable"}</div>;
  }

  return (
    <>
      <div
        className="reader-progress"
        style={{ width: `${readPct}%` }}
        aria-hidden
      />
      <div className="reader-bar">
        <div>
          <div className="reader-bar-title">{manga?.title || "Reader"}</div>
          <div className="reader-bar-sub">
            {images?.length ?? 0} pages · ← → chapters
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" type="button" onClick={toggleSaver}>
            {dataSaver ? "HQ images" : "Data saver"}
          </button>
          {mangaId ? (
            <Link className="btn btn-ghost btn-sm" to={`/manga/${mangaId}`}>
              Chapters
            </Link>
          ) : (
            <Link className="btn btn-ghost btn-sm" to="/">
              Home
            </Link>
          )}
          {prevId ? (
            <Link
              className="btn btn-ghost btn-sm"
              to={`/read/${prevId}${mangaId ? `?manga=${mangaId}` : ""}`}
            >
              Prev
            </Link>
          ) : null}
          {nextId ? (
            <Link
              className="btn btn-primary btn-sm"
              to={`/read/${nextId}${mangaId ? `?manga=${mangaId}` : ""}`}
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>

      <div className="reader-pages">
        {images?.map((src, i) => (
          <img
            key={src}
            src={proxyUrl(src)}
            alt={`Page ${i + 1}`}
            loading={i < 3 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>

      <AdSlot minHeight={90} />

      <div className="reader-end">
        {prevId ? (
          <Link
            className="btn btn-ghost"
            to={`/read/${prevId}${mangaId ? `?manga=${mangaId}` : ""}`}
          >
            Previous chapter
          </Link>
        ) : null}
        {nextId ? (
          <Link
            className="btn btn-primary"
            to={`/read/${nextId}${mangaId ? `?manga=${mangaId}` : ""}`}
          >
            Next chapter
          </Link>
        ) : (
          <Link className="btn btn-ghost" to={mangaId ? `/manga/${mangaId}` : "/"}>
            Back to title
          </Link>
        )}
      </div>

      <ChapterComments
        chapterId={chapterId}
        mangaId={mangaId || undefined}
        chapterLabel={commentChapterLabel}
        mangaTitle={commentMangaTitle}
      />
    </>
  );
}
