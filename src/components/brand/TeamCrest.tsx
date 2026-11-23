"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
  /** Local /crests assets are already sized — skip Next optimizer. */
  priority?: boolean;
};

export function TeamCrest({
  src,
  alt,
  size = 28,
  className = "",
  priority,
}: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        unoptimized
        priority={priority}
        className="block size-full object-contain object-center"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
