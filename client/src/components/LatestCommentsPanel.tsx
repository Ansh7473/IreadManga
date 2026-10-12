import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type LatestCommentItem } from "../api";
import { UserMetaRow } from "./UserMetaRow";

function chapterContext(c: LatestCommentItem): string {
  if (c.chapterLabel) {
    const upper = c.chapterLabel.toUpperCase();
    if (c.mangaTitle) return `${upper} · ${c.mangaTitle.toUpperCase()}`;
    return upper;
  }
  if (c.mangaTitle) return c.mangaTitle.toUpperCase();
  return "CHAPTER COMMENT";
}

export function LatestCommentsPanel() {
  const [comments, setComments] = useState<LatestCommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .latestComments(10)
      .then((data) => {
        if (alive) setComments(data);
      })
      .catch(() => {
        if (alive) setComments([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="community-panel">
      <div className="community-panel-head">
        <h3>Latest Comments</h3>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : comments.length === 0 ? (
        <p className="community-empty">
          No chapter comments yet. Open a chapter and join the discussion.
        </p>
      ) : (
        <ul className="community-comment-list">
          {comments.map((c) => (
            <li key={c.id}>
              <Link
                to={`/read/${c.chapterId}${c.mangaId ? `?manga=${c.mangaId}` : ""}`}
                className="community-comment-item"
              >
                <span className="community-comment-context">
                  {chapterContext(c)}
                </span>
                <p className="community-comment-body">{c.body}</p>
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
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link className="community-panel-foot" to="/community/comments">
        View all comments »
      </Link>
    </section>
  );
}
