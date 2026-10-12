import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type CollectionSummary } from "../api";
import { useAuth } from "../auth/AuthContext";
import { CollectionMosaic } from "../components/CollectionMosaic";
import { MangaCard as CoverCard } from "../components/MangaCard";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { RankBadge } from "../components/RankBadge";
import { usePageTitle } from "../hooks/usePageTitle";
import { timeAgo } from "../utils/time";
import type { MangaCard } from "../types";

export default function CollectionDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [collection, setCollection] = useState<CollectionSummary | null>(null);
  const [manga, setManga] = useState<MangaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  usePageTitle(collection?.title);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.collection(id);
        if (!alive) return;
        setCollection(data);
        setEditTitle(data.title);
        setEditDesc(data.description ?? "");
        const cards = await Promise.all(
          data.mangaIds.map(async (mid) => {
            try {
              return await api.manga(mid);
            } catch {
              return null;
            }
          }),
        );
        if (alive) setManga(cards.filter(Boolean) as MangaCard[]);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Not found");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const isOwner = user && collection && user.id === collection.userId;

  async function saveMeta() {
    if (!collection || !isOwner) return;
    setSaving(true);
    try {
      const updated = await api.patchCollection(collection.id, {
        title: editTitle,
        description: editDesc,
      });
      setCollection(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeTitle(mangaId: string) {
    if (!collection || !isOwner) return;
    try {
      const updated = await api.removeFromCollection(collection.id, mangaId);
      setCollection(updated);
      setManga((prev) => prev.filter((m) => m.id !== mangaId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    }
  }

  async function deleteList() {
    if (!collection || !isOwner) return;
    if (!window.confirm("Delete this collection permanently?")) return;
    try {
      await api.deleteCollection(collection.id);
      window.location.href = "/collections";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) {
    return <div className="skeleton" style={{ height: 420 }} />;
  }

  if (error || !collection) {
    return (
      <div className="empty-state">
        {error || "Collection not found"}.{" "}
        <Link to="/collections">Back to collections</Link>
      </div>
    );
  }

  const countLabel =
    collection.titleCount === 1
      ? "1 title"
      : `${collection.titleCount} titles`;

  return (
    <div className="collection-detail">
      <Link className="collection-detail__back" to="/collections">
        ← All collections
      </Link>

      <header className="collection-detail__hero">
        <div className="collection-detail__mosaic-wrap">
          <CollectionMosaic
            coverUrls={collection.coverUrls}
            title={collection.title}
          />
        </div>
        <div className="collection-detail__intro">
          <div className="collection-card__author">
            <ProfileAvatar
              avatarId={collection.avatarId}
              glyph={collection.avatarGlyph}
              gradient={collection.avatarGradient}
              size="md"
              title={collection.displayName}
            />
            <span className="collection-card__name">{collection.displayName}</span>
            <RankBadge label={collection.rank.label} />
          </div>

          {isOwner ? (
            <div className="collection-detail__edit">
              <label>
                Title
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={120}
                />
              </label>
              <label>
                Description
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  maxLength={2000}
                />
              </label>
              <div className="collection-detail__edit-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => void saveMeta()}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => void deleteList()}
                >
                  Delete collection
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1>{collection.title}</h1>
              {collection.description ? (
                <p className="collection-detail__desc">{collection.description}</p>
              ) : null}
            </>
          )}

          <p className="collection-card__meta">
            {countLabel}
            <span aria-hidden> · </span>
            Updated {timeAgo(collection.updatedAt)}
          </p>
        </div>
      </header>

      {manga.length === 0 ? (
        <div className="empty-state empty-state--compact">
          {isOwner ? (
            <>
              This collection is empty. Save titles from a manga page or your{" "}
              <Link to="/library">library</Link>.
            </>
          ) : (
            "This collection has no titles yet."
          )}
        </div>
      ) : (
        <div className="grid grid--covers">
          {manga.map((m) => (
            <div key={m.id} className="collection-detail__tile">
              <CoverCard manga={m} />
              {isOwner ? (
                <button
                  type="button"
                  className="btn btn-ghost collection-detail__remove"
                  onClick={() => void removeTitle(m.id)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
