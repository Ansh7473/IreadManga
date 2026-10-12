import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type LeaderboardEntry } from "../api";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { RankBadge } from "../components/RankBadge";
import { usePageTitle } from "../hooks/usePageTitle";

export default function LeaderboardPage() {
  usePageTitle("Leaderboard");
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.leaderboard(20);
        if (alive) setRows(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="leaderboard-page">
      <h1>Top readers</h1>
      <p className="leaderboard-intro">
        Rank up by reading chapters while signed in. Each chapter counts once per
        account.
      </p>

      {loading ? (
        <div className="skeleton" style={{ height: 240 }} />
      ) : error ? (
        <div className="alert">{error}</div>
      ) : rows.length === 0 ? (
        <p className="empty-state">
          No ranked readers yet.{" "}
          <Link to="/login">Sign in</Link> and start a chapter.
        </p>
      ) : (
        <ol className="leaderboard-list">
          {rows.map((row, i) => (
            <li key={row.id} className="leaderboard-row">
              <span className="leaderboard-rank-num">{i + 1}</span>
              <ProfileAvatar
                avatarId={row.avatarId}
                glyph={row.avatarGlyph}
                gradient={row.avatarGradient}
                size="md"
              />
              <div className="leaderboard-meta">
                <strong>{row.displayName}</strong>
                <RankBadge label={row.rank.label} />
              </div>
              <span className="leaderboard-chapters">
                {row.chaptersRead} ch.
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="settings-note">
        Local library history still works offline; server ranks only grow when you
        read while signed in.
      </p>
    </div>
  );
}
