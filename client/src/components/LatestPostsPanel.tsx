import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type PostItem } from "../api";
import { UserMetaRow } from "./UserMetaRow";

const CATEGORY_LABEL: Record<PostItem["category"], string> = {
  general: "General",
  feature: "Feature Requests",
  discussion: "Discussion",
};

function snippet(body: string, max = 120) {
  const t = body.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function LatestPostsPanel() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .latestPosts(8)
      .then((data) => {
        if (alive) setPosts(data);
      })
      .catch(() => {
        if (alive) setPosts([]);
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
        <h3>Latest Posts</h3>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : posts.length === 0 ? (
        <p className="community-empty">
          No community posts yet. Start a thread on the community page.
        </p>
      ) : (
        <ul className="community-post-list">
          {posts.map((p) => (
            <li key={p.id}>
              <Link to={`/community#post-${p.id}`} className="community-post-item">
                <span className="community-post-cat">
                  {CATEGORY_LABEL[p.category]}
                </span>
                <strong className="community-post-title">{p.title}</strong>
                <p className="community-post-snippet">{snippet(p.body)}</p>
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
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link className="community-panel-foot" to="/community">
        View all posts »
      </Link>
    </section>
  );
}
