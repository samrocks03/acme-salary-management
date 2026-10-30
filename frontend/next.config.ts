import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const isDev = process.env.NODE_ENV !== "production";
// Opt-in polling for file watching (set by docker-compose.yml): bind mounts don't always deliver
// filesystem events to the container, so Turbopack would miss edits made on the host.
const watchPollIntervalMs = Number(process.env.WATCH_POLL_INTERVAL_MS) || undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  ...(watchPollIntervalMs && { watchOptions: { pollIntervalMs: watchPollIntervalMs } }),
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Enables `forbidden()` + `forbidden.tsx` for role-gated (write) routes.
    authInterrupts: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: buildSecurityHeaders(isDev) }];
  },
  async redirects() {
    return [{ source: "/", destination: "/dashboard", permanent: false }];
  },
};

export default nextConfig;
