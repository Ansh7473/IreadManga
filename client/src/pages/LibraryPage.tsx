import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type CollectionBrief } from "../api";
import { useAuth } from "../auth/AuthContext";
import { getHistory, getLibrary } from "../library";
import { usePageTitle } from "../hooks/usePageTitle";
import { MangaCard as Card } from "../components/MangaCard";
import { AdSlot } from "../components/AdSlot";

type Tab = "saved" | "history" | "collections";

function tabFromParams(params: URLSearchParams): Tab {
  const t = params.get("tab");
  if (t === "history") return "history";
  if (t === "collections") return "collections";
  return "saved";
}

export default function LibraryPage() {
  usePageTitle("Library");
  const [params, setParams] = useSearchParams();
  const tab = tabFromParams(params);
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionBrief[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const library = useMemo(
    () => (tab === "saved" ? getLibrary() : []),
    [tab],
  );
  const history = useMemo(
    () => (tab === "history" ? getHistory() : []),
    [tab],
  );

  const loadCollections = useCallback(async () => {
    if (!user) {
      setCollections([]);
      return;
    }
    setCollectionsLoading(true);
    setCollectionError(null);
    try {
      const data = await api.collectionsMine();
      setCollections(data);
    } catch (e) {
      setCollectionError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setCollectionsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (tab === "collections") void loadCollections();
  }, [tab, loadCollections]);

  function setTab(next: Tab) {
    if (next === "saved") setParams({});
    else setParams({ tab: next });
  }

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    setCreating(true);
    setCollectionError(null);
    try {
      await api.createCollection({ title: newTitle.trim() });
      setNewTitle("");
      await loadCollections();
    } catch (err) {
      setCollectionError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="page-library">
      <div className="block-head">
        <h1>Your library</h1>
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${tab === "saved" ? "chip--on" : ""}`}
            onClick={() => setTab("saved")}
          >
            Saved
          </button>
          <button
            type="button"
            className={`chip ${tab === "history" ? "chip--on" : ""}`}
            onClick={() => setTab("history")}
          >
            History
          </button>
          <button
            type="button"
            className={`chip ${tab === "collections" ? "chip--on" : ""}`}
            onClick={() => setTab("collections")}
          >
            Collections
          </button>
        </div>
      </div>

      <AdSlot minHeight={72} />

      {tab === "saved" ? (
        library.length === 0 ? (
          <div className="empty-state">
            Nothing saved yet.{" "}
            <Link to="/browse">Browse the catalog</Link>
          </div>
        ) : (
          <div className="grid grid--covers">
            {library.map((m) => (
              <Card key={m.id} manga={m} />
            ))}
          </div>
        )
      ) : tab === "history" ? (
        history.length === 0 ? (
          <div className="empty-state">No reading history in this browser.</div>
        ) : (
          <div className="grid grid--covers">
            {history.map((h) => (
              <Card
                key={`${h.manga.id}-${h.chapterId}`}
                manga={h.manga}
                subtitle={h.chapterLabel}
                href={`/read/${h.chapterId}?manga=${h.manga.id}`}
              />
            ))}
          </div>
        )
      ) : !user ? (
        <div className="empty-state">
          <Link to="/login">Sign in</Link> to create and manage collections.
        </div>
      ) : (
        <>
          {collectionError ? <div className="alert">{collectionError}</div> : null}
          <form className="collection-create" onSubmit={(e) => void createCollection(e)}>
            <label>
              New collection
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Peak psychological horror"
                maxLength={120}
                required
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </button>
          </form>
          {collectionsLoading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : collections.length === 0 ? (
            <div className="empty-state empty-state--compact">
              No collections yet. Create one above, then add titles from manga pages.
            </div>
          ) : (
            <ul className="collection-manage-list">
              {collections.map((c) => (
                <li key={c.id}>
                  <Link to={`/collections/${c.id}`}>
                    <strong>{c.title}</strong>
                    <span>
                      {c.mangaIds.length === 1
                        ? "1 title"
                        : `${c.mangaIds.length} titles`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
