import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type LatestCommentItem } from "../api";
import { usePageTitle } from "../hooks/usePageTitle";
import { UserMetaRow } from "../components/UserMetaRow";

function chapterContext(c: LatestCommentItem): string {
  if (c.chapterLabel) return c.chapterLabel;
  return "Chapter comment";
}

export default function CommunityCommentsPage() {
  usePageTitle("Latest comments");
  const [comments, setComments] = useState<LatestCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .latestComments(40)
      .then((data) => {
        if (alive) setComments(data);
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="community-page">
      <div className="community-page-head">
        <div>
          <h1>Latest comments</h1>
          <p>Recent discussion from chapter pages across the site.</p>
        </div>
        <Link className="btn btn-ghost btn-sm" to="/community">
          Community posts »
        </Link>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      {loading ? (
        <div className="skeleton" style={{ height: 240 }} />
      ) : comments.length === 0 ? (
        <div className="empty-state">
          No comments yet. Pick a manga, read a chapter, and leave a note.
        </div>
      ) : (
        <ul className="community-feed">
          {comments.map((c) => (
            <li key={c.id} className="community-feed-item">
              <Link
                to={`/read/${c.chapterId}${c.mangaId ? `?manga=${c.mangaId}` : ""}`}
                className="community-comment-context-link"
              >
                {chapterContext(c)}
                {c.mangaTitle ? ` · ${c.mangaTitle}` : ""}
              </Link>
              <p className="community-feed-body">{c.body}</p>
              <UserMetaRow
                displayName={c.displayName}
                createdAt={c.createdAt}
                profile={{
                  avatarId: c.avatarId,
                  avatarGlyph: c.avatarGlyph,
                  avatarGradient: c.avatarGradient,
                  rank: c.rank,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
