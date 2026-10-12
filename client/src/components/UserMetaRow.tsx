import type { UserProfileFields } from "../api";
import { ProfileAvatar } from "./ProfileAvatar";
import { RankBadge } from "./RankBadge";
import { timeAgo } from "../utils/time";

type Props = {
  displayName: string;
  createdAt: string;
  profile?: UserProfileFields;
  replyCount?: number;
};

export function UserMetaRow({
  displayName,
  createdAt,
  profile,
  replyCount,
}: Props) {
  return (
    <div className="community-user-row">
      <ProfileAvatar
        avatarId={profile?.avatarId ?? "scroll-blue"}
        glyph={profile?.avatarGlyph}
        gradient={profile?.avatarGradient}
        size="sm"
      />
      <span className="community-user-name">{displayName}</span>
      {profile?.rank && profile.rank.id !== "novice" ? (
        <RankBadge label={profile.rank.label} />
      ) : null}
      <span className="community-user-time">{timeAgo(createdAt)}</span>
      {replyCount !== undefined ? (
        <span className="community-replies" aria-label={`${replyCount} replies`}>
          <span aria-hidden>💬</span> {replyCount}
        </span>
      ) : null}
    </div>
  );
}
