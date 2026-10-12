import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  loading?: "lazy" | "eager";
  className?: string;
};

export function CoverImage({ src, alt, loading = "lazy", className }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`cover-fallback ${className ?? ""}`}
        aria-label={alt}
        role="img"
      />
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
