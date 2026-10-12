import { Link } from "react-router-dom";
import type { CollectionSummary } from "../api";
import { timeAgo } from "../utils/time";
import { CollectionMosaic } from "./CollectionMosaic";
import { ProfileAvatar } from "./ProfileAvatar";
import { RankBadge } from "./RankBadge";

type Props = {
  collection: CollectionSummary;
};

export function CollectionCard({ collection }: Props) {
  const count = collection.titleCount;
  const countLabel = count === 1 ? "1 title" : `${count} titles`;

  return (
    <Link
      className="collection-card"
      to={`/collections/${collection.id}`}
    >
      <CollectionMosaic
        coverUrls={collection.coverUrls}
        title={collection.title}
      />
      <div className="collection-card__body">
        <div className="collection-card__author">
          <ProfileAvatar
            avatarId={collection.avatarId}
            glyph={collection.avatarGlyph}
            gradient={collection.avatarGradient}
            size="sm"
            title={collection.displayName}
          />
          <span className="collection-card__name">{collection.displayName}</span>
          {collection.rank ? (
            <RankBadge label={collection.rank.label} size="sm" />
          ) : null}
        </div>
        <h3 className="collection-card__title">{collection.title}</h3>
        <p className="collection-card__meta">
          {countLabel}
          <span aria-hidden> · </span>
          {timeAgo(collection.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
