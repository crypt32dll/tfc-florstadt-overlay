import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";

export default function NotFound() {
  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="glass-panel-strong max-w-md space-y-4 p-8">
        <BrandMark size={96} className="mx-auto" />
        <h1 className="font-display text-4xl tracking-wide text-white uppercase">
          Raum nicht gefunden
        </h1>
        <p className="text-sm text-muted">
          Der Raum existiert nicht (mehr) oder ist abgelaufen.
        </p>
        <Link href="/" className="btn btn-primary inline-flex px-6 text-xl">
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
