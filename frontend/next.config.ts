import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";
const isDev = process.env.NODE_ENV === "development";

function apiMediaRemotePattern() {
  try {
    const origin = new URL(apiUrl);
    origin.pathname = "";
    return {
      protocol: origin.protocol.replace(":", "") as "http" | "https",
      hostname: origin.hostname,
      ...(origin.port ? { port: origin.port } : {}),
      pathname: "/media/**",
    };
  } catch {
    return {
      protocol: "http" as const,
      hostname: "localhost",
      port: "8001",
      pathname: "/media/**",
    };
  }
}

const nextConfig: NextConfig = {
  images: {
    // Fallback if any absolute localhost media URLs slip through.
    dangerouslyAllowLocalIP: isDev,
    localPatterns: [
      { pathname: "/media/**" },
      { pathname: "/images/**" },
    ],
    remotePatterns: [
      apiMediaRemotePattern(),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const backendRoot = apiUrl.replace(/\/api\/v1\/?$/, "");
    return [
      {
        source: "/api-backend/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${backendRoot}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
