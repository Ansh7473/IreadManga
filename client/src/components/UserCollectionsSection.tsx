import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type CollectionSummary } from "../api";
import { CollectionCard } from "./CollectionCard";
import { HorizontalCarousel } from "./HorizontalCarousel";

export function UserCollectionsSection() {
  const [items, setItems] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.collectionsLatest(12);
        if (alive) setItems(data);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && items.length === 0) {
    return (
      <section className="block">
        <div className="block-head">
          <h2>User collections</h2>
          <Link className="block-more" to="/collections">
            View all »
          </Link>
        </div>
        <div className="empty-state empty-state--compact">
          No public collections yet.{" "}
          <Link to="/library?tab=collections">Create one</Link> while signed in.
        </div>
      </section>
    );
  }

  return (
    <section className="block">
      <div className="block-head">
        <h2>User collections</h2>
        <Link className="block-more" to="/collections">
          View all »
        </Link>
      </div>
      <HorizontalCarousel
        ariaLabel="user collections"
        className="carousel-wrap--collections"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="collection-card collection-card--skeleton skeleton" />
            ))
          : items.map((c) => <CollectionCard key={c.id} collection={c} />)}
      </HorizontalCarousel>
    </section>
  );
}
