type Props = {
  avatarId: string;
  glyph?: string;
  gradient?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
};

const FALLBACK = {
  glyph: "📜",
  gradient: "linear-gradient(135deg, #ff5c28, #cc4520)",
};

export function ProfileAvatar({
  avatarId,
  glyph,
  gradient,
  size = "md",
  title,
}: Props) {
  return (
    <span
      className={`profile-avatar profile-avatar--${size}`}
      style={{ background: gradient ?? FALLBACK.gradient }}
      title={title ?? avatarId}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {glyph ?? FALLBACK.glyph}
    </span>
  );
}
