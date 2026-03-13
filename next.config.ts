import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent page from being embedded in an iframe — stops clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers guessing content types — prevents MIME-sniffing attacks
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send referrer URL on same-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Allow only resources from same origin; no inline scripts (helps with XSS)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed by Next.js dev; tighten in prod if possible
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  // Browsers must use HTTPS for 1 year (only effective when deployed with HTTPS)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Disable access to sensitive browser APIs the app doesn't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
