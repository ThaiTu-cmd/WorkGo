"use client";

import * as React from "react";
import Image from "next/image";

export interface FiverrImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  gradient: [string, string];
  icon: React.ReactNode;
  eager?: boolean;
}

export function FiverrImage({
  src,
  alt,
  sizes,
  className,
  gradient,
  icon,
  eager = false,
}: FiverrImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(140deg, ${gradient[0]}, ${gradient[1]})`,
        }}
        aria-hidden="true"
      >
        <div className="flex h-full w-full items-center justify-center">{icon}</div>
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="img-shimmer absolute inset-0" aria-hidden="true" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={className}
      />
    </>
  );
}

export default FiverrImage;
