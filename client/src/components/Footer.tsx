import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">I Read Manga</div>
          <p>
            Fast reader UI with lazy-loaded pages, local library, and chapter
            feeds. Built to feel like top catalog sites — not a template.
          </p>
        </div>
        <div>
          <h4>Discover</h4>
          <Link to="/">Home</Link>
          <Link to="/browse">Search</Link>
          <Link to="/browse?sort=updated">Updates</Link>
          <Link to="/library">Library</Link>
        </div>
        <div>
          <h4>Reader</h4>
          <Link to="/library?tab=history">History</Link>
          <span className="footer-note">Ctrl+K search · reader keys ← →</span>
        </div>
      </div>
      <div className="footer-copy">
        Scan groups credited per chapter · Content from current API provider
      </div>
    </footer>
  );
}
