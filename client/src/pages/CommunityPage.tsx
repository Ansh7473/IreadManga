import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type PostCategory, type PostItem } from "../api";
import { useAuth } from "../auth/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { UserMetaRow } from "../components/UserMetaRow";

const CATEGORIES: { id: PostCategory; label: string }[] = [
  { id: "general", label: "General" },
  { id: "feature", label: "Feature Requests" },
  { id: "discussion", label: "Discussion" },
];

const CATEGORY_LABEL: Record<PostCategory, string> = {
  general: "General",
  feature: "Feature Requests",
  discussion: "Discussion",
};

export default function CommunityPage() {
  usePageTitle("Community");
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<PostCategory>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function loadPosts() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listPosts(30, 0);
      setPosts(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const created = await api.createPost({
        category,
        title: title.trim(),
        body: body.trim(),
      });
      setPosts((prev) => [created, ...prev]);
      setTotal((n) => n + 1);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="community-page">
      <div className="community-page-head">
        <div>
          <h1>Community</h1>
          <p>Discuss features, share finds, and talk with other readers.</p>
        </div>
        <Link className="btn btn-ghost btn-sm" to="/community/comments">
          Latest comments »
        </Link>
      </div>

      {user ? (
        <form className="community-compose block" onSubmit={submit}>
          <h2>New post</h2>
          <div className="chip-row chip-row--tight">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip chip--sm ${category === c.id ? "chip--on" : ""}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={200}
            required
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            maxLength={8000}
            required
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={posting || title.trim().length < 3 || body.trim().length < 10}
          >
            {posting ? "Posting…" : "Publish post"}
          </button>
        </form>
      ) : (
        <p className="community-signin">
          <Link to="/login">Sign in</Link> to start a new thread.
        </p>
      )}

      {error ? <div className="alert">{error}</div> : null}

      <section className="block">
        <div className="block-head">
          <h2>All posts</h2>
          <span className="results-count">{total} threads</span>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 200 }} />
        ) : posts.length === 0 ? (
          <div className="empty-state">
            No posts yet — be the first to share something with the community.
          </div>
        ) : (
          <ul className="community-feed">
            {posts.map((p) => (
              <li key={p.id} id={`post-${p.id}`} className="community-feed-item">
                <span className="community-post-cat">
                  {CATEGORY_LABEL[p.category]}
                </span>
                <h3>{p.title}</h3>
                <p className="community-feed-body">{p.body}</p>
                <UserMetaRow
                  displayName={p.displayName}
                  createdAt={p.createdAt}
                  replyCount={p.replyCount}
                  profile={{
                    avatarId: p.avatarId,
                    avatarGlyph: p.avatarGlyph,
                    avatarGradient: p.avatarGradient,
                    rank: p.rank,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
