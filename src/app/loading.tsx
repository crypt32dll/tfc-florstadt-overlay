import { BrandMark } from "@/components/brand/BrandMark";

export default function Loading() {
  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4">
      <BrandMark size={64} className="animate-pulse opacity-80" />
      <p className="font-display text-2xl tracking-wide text-muted uppercase">
        Laden…
      </p>
    </div>
  );
}
