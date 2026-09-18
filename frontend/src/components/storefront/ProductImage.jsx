import { useState } from "react";
import { resolveImageUrl } from "../../lib/catalogApi";

export default function ProductImage({ src, alt, fallback, className }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const resolvedSrc = resolveImageUrl(src);

  if (!resolvedSrc || failedSrc === resolvedSrc) return fallback;

  return (
    <img
      className={className}
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(resolvedSrc)}
    />
  );
}
