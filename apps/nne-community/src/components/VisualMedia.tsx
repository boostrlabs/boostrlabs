import { useEffect, useState } from "react";

interface VisualMediaProps {
  src: string | null;
  alt: string;
  fallback: string;
  className?: string;
  eager?: boolean;
}

export function VisualMedia({ src, alt, fallback, className = "", eager = false }: VisualMediaProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  return (
    <div className={`visual-media ${className} ${!src || failed ? "is-fallback" : ""}`.trim()}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
    </div>
  );
}
