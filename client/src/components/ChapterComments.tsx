import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type CommentItem } from "../api";
import { useAuth } from "../auth/AuthContext";
import { ProfileAvatar } from "./ProfileAvatar";
import { RankBadge } from "./RankBadge";
import { timeAgo } from "../utils/time";

type Props = {
  chapterId: string;
  mangaId?: string;
  chapterLabel?: string;
  mangaTitle?: string;
};

export function ChapterComments({
  chapterId,
  mangaId,
  chapterLabel,
  mangaTitle,
}: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await api.comments(chapterId);
        if (alive) setComments(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [chapterId]);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const created = await api.postComment(chapterId, body.trim(), {
        chapterLabel,
        mangaTitle,
        mangaId,
      });
      setComments((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="comments block">
      <div className="block-head">
        <h2>Chapter comments</h2>
        {mangaId ? (
          <a
            className="block-more"
            href={`https://mangadex.org/title/${mangaId}`}
            target="_blank"
            rel="noreferrer"
          >
            MangaDex thread »
          </a>
        ) : null}
      </div>

      {user ? (
        <form className="comment-form" onSubmit={submit}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share thoughts on this chapter…"
            rows={3}
            maxLength={2000}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={posting || body.trim().length < 2}
          >
            {posting ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="comment-signin">
          <Link to="/login">Sign in</Link> to join the discussion.
        </p>
      )}

      {error ? <div className="alert">{error}</div> : null}

      {loading ? (
        <div className="skeleton" style={{ height: 80 }} />
      ) : comments.length === 0 ? (
        <p className="empty-state" style={{ marginBottom: 0 }}>
          No comments yet. Be the first.
        </p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-head">
                <div className="comment-author">
                  <ProfileAvatar
                    avatarId={c.avatarId ?? "scroll-blue"}
                    glyph={c.avatarGlyph}
                    gradient={c.avatarGradient}
                    size="sm"
                  />
                  <strong>{c.displayName}</strong>
                  {c.rank ? <RankBadge label={c.rank.label} /> : null}
                </div>
                <span>{timeAgo(c.createdAt)}</span>
              </div>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
