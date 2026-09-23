import Image from "next/image";

/** Native favicon is 96px — larger files are upscales and look soft. */
const SRC = {
  16: "/brand/icons/icon-16.png",
  32: "/brand/icons/icon-32.png",
  48: "/brand/icons/icon-48.png",
  96: "/brand/icons/icon-96.png",
  192: "/brand/icons/icon-96.png",
  512: "/brand/icons/icon-96.png",
} as const;

type Size = keyof typeof SRC;

export function BrandMark({
  size = 48,
  className = "",
  priority = false,
}: {
  size?: Size;
  className?: string;
  priority?: boolean;
}) {
  const src = SRC[size] ?? SRC[96];
  // Cap display size so upscaling stays mild (source is 96px)
  const display = Math.min(size, 120);
  return (
    <Image
      src={src}
      alt=""
      width={display}
      height={display}
      className={`object-contain ${className}`}
      style={{ width: display, height: display }}
      priority={priority}
      quality={100}
      aria-hidden
    />
  );
}
