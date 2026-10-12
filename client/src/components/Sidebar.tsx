import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { isBrowseNavActive, isLibraryNavActive } from "../utils/navActive";

type Props = {
  collapsed?: boolean;
};

export function Sidebar({ collapsed }: Props) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { user } = useAuth();

  async function randomTitle() {
    try {
      const m = await api.random();
      navigate(`/manga/${m.id}`);
    } catch {
      /* ignore */
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar-top">
        <NavLink to="/" className="sidebar-brand" end>
          <span className="sidebar-logo" aria-hidden>
            読
          </span>
          {!collapsed ? (
            <span className="sidebar-title">
              I Read
              <em>Manga</em>
            </span>
          ) : null}
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">Browse</div>
        <NavLink to="/" end>
          Home
        </NavLink>
        <NavLink
          to="/browse"
          className={() =>
            isBrowseNavActive("search", pathname, search) ? "active" : ""
          }
        >
          Advanced search
        </NavLink>
        <NavLink
          to="/browse?sort=updated"
          className={() =>
            isBrowseNavActive("updated", pathname, search) ? "active" : ""
          }
        >
          Latest uploads
        </NavLink>
        <NavLink
          to="/browse?sort=recent"
          className={() =>
            isBrowseNavActive("recent", pathname, search) ? "active" : ""
          }
        >
          Recently added
        </NavLink>
        <button type="button" className="sidebar-link-btn" onClick={randomTitle}>
          Random series
        </button>
        <NavLink
          to="/library"
          className={() =>
            isLibraryNavActive("library", pathname, search) ? "active" : ""
          }
        >
          Library
        </NavLink>
        <NavLink to="/collections">Collections</NavLink>
        <NavLink
          to="/library?tab=history"
          className={() =>
            isLibraryNavActive("history", pathname, search) ? "active" : ""
          }
        >
          Reading history
        </NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
        <NavLink to="/community">Community</NavLink>
        {user ? (
          <NavLink to="/settings">{user.displayName}</NavLink>
        ) : (
          <NavLink to="/login">Sign in</NavLink>
        )}
      </nav>

      <div className="sidebar-foot">
        <small>Catalog via MangaDex · swap provider later</small>
      </div>
    </aside>
  );
}
