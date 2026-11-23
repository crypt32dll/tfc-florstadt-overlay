import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root,
  },
  images: {
    // Skip Vercel Image Optimization billing — assets are already sized in /public.
    unoptimized: true,
  },
};

export default nextConfig;
