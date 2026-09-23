import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root,
  },
  images: {
    // BrandMark uses quality={100} for crisp club icons
    qualities: [75, 100],
  },
};

export default nextConfig;
