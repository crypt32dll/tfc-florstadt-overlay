import Image from "next/image";

export function BrandLogo({
  className = "",
  priority = false,
  width = 200,
  height = 84,
}: {
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src="/brand/tfc-florstadt-logo.png"
      alt="Tischfußball Club Florstadt"
      width={width}
      height={height}
      className={className}
      style={{ width: "auto", height: "auto", maxWidth: "100%" }}
      priority={priority}
    />
  );
}
