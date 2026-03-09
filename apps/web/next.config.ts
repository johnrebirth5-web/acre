import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@acre/backoffice", "@acre/ui"],
  turbopack: {
    root: fileURLToPath(new URL("../..", import.meta.url))
  }
};

export default nextConfig;
