/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — the entire site is pre-rendered to /out
  // and served by FastAPI's StaticFiles mount in production.
  output: "export",

  // Ensures every route folder gets its own index.html
  // (/dashboard → /dashboard/index.html) which FastAPI's html=True serves.
  trailingSlash: true,

  reactStrictMode: true,

  // Static export cannot use Next.js Image Optimization server.
  // unoptimized=true passes through <img> src as-is.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // NEXT_PUBLIC_API_URL is baked into the JS bundle at build time.
  // In production we serve frontend + backend from the same origin,
  // so /api/v1 resolves correctly with no CORS needed.
  // Override with the ARG passed in the Dockerfile (defaults to /api/v1).
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "/api/v1",
  },

  // headers() is a server-mode feature — not available in static export.
  // Security headers are injected by FastAPI's middleware instead.
};

export default nextConfig;
