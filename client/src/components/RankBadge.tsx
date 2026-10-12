type Props = {
  label: string;
  size?: "sm" | "md";
};

export function RankBadge({ label, size = "sm" }: Props) {
  return (
    <span className={`rank-badge rank-badge--${size}`} title={label}>
      {label}
    </span>
  );
}
