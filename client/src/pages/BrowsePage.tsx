import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type TagItem } from "../api";
import { usePageTitle } from "../hooks/usePageTitle";
import type { MangaCard } from "../types";
import { MangaCard as Card } from "../components/MangaCard";
import { CommunitySidebar } from "../components/CommunitySidebar";

const SORTS = [
  { id: "popular", label: "Popular" },
  { id: "updated", label: "Latest upload" },
  { id: "recent", label: "Recently added" },
] as const;

const STATUSES = [
  { id: "", label: "Any status" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "hiatus", label: "Hiatus" },
] as const;

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q")?.trim() || "";
  const sort = params.get("sort") || "popular";
  const status = params.get("status") || "";
  const tagParam = params.get("tag") || "";

  const [items, setItems] = useState<MangaCard[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);

  const tag = useMemo(() => {
    if (!tagParam) return "";
    const byId = tags.find((t) => t.id === tagParam);
    if (byId) return byId.id;
    const byName = tags.find(
      (t) => t.name.toLowerCase() === tagParam.toLowerCase(),
    );
    return byName?.id || tagParam;
  }, [tagParam, tags]);

  usePageTitle(q ? `Search: ${q}` : "Browse");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localQ, setLocalQ] = useState(q);
  const [showAllTags, setShowAllTags] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  useEffect(() => {
    api.tags().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = q
          ? await api.search(q, 48)
          : await api.browse({
              sort,
              status: status || undefined,
              tag: tag || undefined,
              limit: 48,
            });
        if (!alive) return;
        setItems(data);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [q, sort, status, tag]);

  function patch(next: Record<string, string>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p);
  }

  function onSubmitSearch(e: { preventDefault: () => void }) {
    e.preventDefault();
    patch({ q: localQ.trim() });
  }

  const visibleTags = showAllTags ? tags : tags.slice(0, 24);
  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? "Popular";
  const statusLabel = STATUSES.find((s) => s.id === status)?.label ?? "Any status";
  const tagLabel = tags.find((t) => t.id === tag)?.name;
  const filtersOn = sort !== "popular" || Boolean(status) || Boolean(tag);

  return (
    <div className="page-browse">
      <div className="browse-head">
        <div>
          <h1>Advanced search</h1>
          <p>Press Ctrl+K for quick search</p>
        </div>
      </div>

      <form className="browse-search" onSubmit={onSubmitSearch}>
        <input
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder="Title search…"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {!q ? (
        <div className="browse-toolbar">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setFiltersOpen(true)}
          >
            Sort & filter
          </button>
          <p className="browse-summary">
            {sortLabel}
            {status ? ` · ${statusLabel}` : ""}
            {tagLabel ? ` · ${tagLabel}` : ""}
          </p>
          {filtersOn ? (
            <button
              type="button"
              className="browse-clear"
              onClick={() => patch({ sort: "", status: "", tag: "" })}
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      {filtersOpen ? (
        <div className="filter-sheet" role="presentation">
          <button
            type="button"
            className="filter-sheet__backdrop"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div
            className="filter-sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-sheet-title"
          >
            <div className="filter-sheet__handle" aria-hidden />
            <div className="filter-sheet__head">
              <h2 id="filter-sheet-title">Sort & filter</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setFiltersOpen(false)}
              >
                Done
              </button>
            </div>
            <div className="filter-group">
              <span className="filter-label">Sort</span>
              <div className="chip-row chip-row--tight">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${sort === s.id ? "chip--on" : ""}`}
                    onClick={() => patch({ sort: s.id === "popular" ? "" : s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label">Status</span>
              <div className="chip-row chip-row--tight">
                {STATUSES.map((s) => (
                  <button
                    key={s.id || "any"}
                    type="button"
                    className={`chip ${status === s.id ? "chip--on" : ""}`}
                    onClick={() => patch({ status: s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {tags.length > 0 ? (
              <div className="filter-group">
                <span className="filter-label">Genres</span>
                <div className="chip-row chip-row--tags">
                  <button
                    type="button"
                    className={`chip chip--sm ${!tag ? "chip--on" : ""}`}
                    onClick={() => patch({ tag: "" })}
                  >
                    All genres
                  </button>
                  {visibleTags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`chip chip--sm ${tag === t.id ? "chip--on" : ""}`}
                      onClick={() => patch({ tag: t.id })}
                    >
                      {t.name}
                    </button>
                  ))}
                  {tags.length > 24 ? (
                    <button
                      type="button"
                      className="chip chip--sm chip--ghost"
                      onClick={() => setShowAllTags((v) => !v)}
                    >
                      {showAllTags ? "Show fewer" : `+${tags.length - 24} more`}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <div className="alert">{error}</div> : null}

      <p className="results-count">
        {loading ? "Loading…" : `${items.length} titles`}
        {q ? ` for “${q}”` : ""}
      </p>

      <div className="page-with-community">
        <div className="page-with-community__main">
          {loading ? (
            <div className="grid grid--covers">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="cover-card skeleton"
                  style={{ aspectRatio: "2/3" }}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">No titles match these filters.</div>
          ) : (
            <div className="grid grid--covers">
              {items.map((m) => (
                <Card key={m.id} manga={m} />
              ))}
            </div>
          )}
        </div>
        <CommunitySidebar />
      </div>
    </div>
  );
}
