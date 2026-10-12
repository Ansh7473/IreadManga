import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { ProfileAvatar } from "./ProfileAvatar";

type Props = {
  onOpenSearch: () => void;
};

export function TopBar({ onOpenSearch }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function randomSeries() {
    try {
      const m = await api.random();
      navigate(`/manga/${m.id}`);
    } catch {
      /* ignore */
    }
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-search"
        onClick={onOpenSearch}
      >
        <span className="topbar-search-icon" aria-hidden>
          ⌕
        </span>
        <span className="topbar-search-label">Quick search…</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className="topbar-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm topbar-hide-mobile"
          onClick={() => void randomSeries()}
        >
          Random
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm topbar-hide-mobile"
          onClick={() => navigate("/library")}
        >
          Library
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm topbar-hide-mobile"
          onClick={() => navigate("/leaderboard")}
        >
          Leaderboard
        </button>
        {user ? (
          <Link to="/settings" className="user-pill btn btn-ghost btn-sm">
            <ProfileAvatar
              avatarId={user.avatarId}
              glyph={user.avatarGlyph}
              gradient={user.avatarGradient}
              size="sm"
              title={user.displayName}
            />
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
