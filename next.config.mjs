/* AUDIT.md F18 - the §12.6 response headers.
 *
 * Four of the five controls §12.6 specifies were absent in production; only
 * HSTS was present, and that is Vercel's default rather than ours.
 *
 * ON THE CSP, AND WHERE IT FALLS SHORT OF §12.6, stated here so the deviation
 * is recorded next to the code rather than discovered later:
 *
 *   §12.6 asks for a CSP with no `unsafe-inline` script. Next's App Router
 *   streams its payload through inline <script> tags, so honouring that
 *   literally means a per-request nonce, which means middleware on every
 *   request, which forces every static page to render dynamically. Day 1 spent
 *   its effort getting time-to-usable from 8.4s to 2.4s on a 2G connection,
 *   largely by keeping these pages static and cacheable at the edge. Trading
 *   that back for a nonce, on a build with zero third-party scripts and no
 *   user-generated HTML, would cost the reader real seconds to close a hole
 *   nothing can currently reach through.
 *
 *   So script-src keeps 'unsafe-inline' and the policy is tightened everywhere
 *   that costs nothing: connect-src 'self' (nothing may phone out - the same
 *   claim /whats-real makes in words, now enforced by the browser), object-src
 *   and frame-ancestors 'none', base-uri 'self', form-action 'self'.
 *
 *   /whats-real carries this exact deviation rather than implying a stricter
 *   policy than ships.
 *
 * Permissions-Policy is the one worth reading twice. The build claims the
 * microphone button asks for nothing, and this header is how a reviewer
 * verifies that claim in devtools in five seconds instead of taking it on
 * trust. camera and geolocation are denied for the same reason: §12.6 names
 * all three, and a page that cannot request them cannot leak them.
 */

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // See the note above: Next inlines its own bootstrap and streaming payload.
  "script-src 'self' 'unsafe-inline'",
  // next/font inlines @font-face declarations.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data:",
  // Nothing leaves this origin. No model, no analytics, no government host.
  "connect-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests"
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(), camera=(), geolocation=(), interest-cohort=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  }
};

export default nextConfig;
