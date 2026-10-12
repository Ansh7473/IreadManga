import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ScrollToTop } from "./ScrollToTop";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";
import { SearchCommand } from "./SearchCommand";
import { InstallBanner } from "./InstallBanner";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const isReader = location.pathname.startsWith("/read/");
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={`app-shell ${isReader ? "app-shell--reader" : ""}`}
    >
      {!isReader ? (
        <Sidebar />
      ) : null}

      <div className="app-main">
        {!isReader ? <TopBar onOpenSearch={() => setSearchOpen(true)} /> : null}
        {!isReader ? <InstallBanner /> : null}
        <main className="main">
          <Outlet />
        </main>
        {!isReader ? <Footer /> : null}
      </div>

      {!isReader ? (
        <nav className="mobile-nav" aria-label="Mobile">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/browse">Browse</NavLink>
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/community">Posts</NavLink>
          <NavLink to="/leaderboard">Ranks</NavLink>
          <NavLink to={user ? "/settings" : "/login"}>
            {user ? "Account" : "Sign in"}
          </NavLink>
        </nav>
      ) : null}

      <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
      {!isReader ? <ScrollToTop /> : null}
    </div>
  );
}
