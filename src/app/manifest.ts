import type { MetadataRoute } from "next";
import { siteManifest } from "@/lib/pwa/manifest";

export default function manifest(): MetadataRoute.Manifest {
  return siteManifest();
}
