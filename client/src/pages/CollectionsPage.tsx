import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type CollectionSummary } from "../api";
import { CollectionCard } from "../components/CollectionCard";
import { CommunitySidebar } from "../components/CommunitySidebar";
import { usePageTitle } from "../hooks/usePageTitle";

export default function CollectionsPage() {
  usePageTitle("Collections");
  const [items, setItems] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.collectionsLatest(48);
        if (alive) setItems(data);
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
    <div className="page-with-community">
      <div className="page-with-community__main">
        <div className="block-head">
          <h1>User collections</h1>
          <Link className="block-more" to="/library?tab=collections">
            Manage yours »
          </Link>
        </div>
        <p className="page-lead">
          Curated lists from readers — real covers, no filler blur.
        </p>

        {error ? <div className="alert">{error}</div> : null}

        {loading ? (
          <div className="collections-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="collection-card collection-card--skeleton skeleton"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            No collections published yet.{" "}
            <Link to="/library?tab=collections">Start a list</Link> from your
            library while signed in.
          </div>
        ) : (
          <div className="collections-grid">
            {items.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        )}
      </div>
      <CommunitySidebar />
    </div>
  );
}
