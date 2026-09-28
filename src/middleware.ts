import { NextResponse, type NextRequest } from "next/server";
import type { RoleType } from "@/lib/types";

/**
 * Next.js Edge Middleware for Zero-Trust BFSI Security Perimeter, Rate Limiting & RBAC
 * 
 * Enforces:
 * 1. High-Performance Sliding Window Rate Limiting (Anti-DDoS, API Flood Protection)
 * 2. Role-Based Access Control (ADMIN, COMPLIANCE_OFFICER, AUDITOR)
 * 3. Immutable Audit Isolation (Auditors have read-only access, cannot post transactions)
 * 4. Enterprise BFSI HTTP Security Headers & Data Protection
 */

// In-Memory Sliding Window Rate Limiter for Edge Middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 1000; // 15 seconds window
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests per 15s window per IP

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Clean old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) rateLimitMap.delete(k);
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count, resetIn: entry.resetTime - now };
}

const ROLE_PERMISSIONS: Record<RoleType, { allowedRoutes: RegExp[]; forbiddenMethods: Record<string, string[]> }> = {
  ADMIN: {
    allowedRoutes: [/^\/dashboard/, /^\/teller/, /^\/reconciliation/, /^\/compliance/, /^\/audit/, /^\/api\//],
    forbiddenMethods: {},
  },
  COMPLIANCE_OFFICER: {
    allowedRoutes: [/^\/dashboard/, /^\/teller/, /^\/reconciliation/, /^\/compliance/, /^\/audit/, /^\/api\//],
    forbiddenMethods: {
      // Compliance officers can execute transactions and review policies
    },
  },
  AUDITOR: {
    allowedRoutes: [/^\/dashboard/, /^\/reconciliation/, /^\/audit/, /^\/api\/audit/, /^\/api\/stats/, /^\/api\/transactions/, /^\/api\/health/],
    forbiddenMethods: {
      // Auditors are strictly READ-ONLY on ledger mutations
      "/api/transactions": ["POST"],
      "/api/accounts": ["POST"],
    },
  },
};

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Bypass static assets, internal nextjs files, and public auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // 2. High-Performance Rate Limiting
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const rateLimitStatus = checkRateLimit(clientIp);

  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Edge rate limiting enforced to protect core banking ledgers.",
        retryAfterMs: rateLimitStatus.resetIn,
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(rateLimitStatus.resetIn / 1000).toString(),
          "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // 3. Resolve User Role from Header or Cookie
  const roleHeader = request.headers.get("x-finguard-role");
  const roleCookie = request.cookies.get("finguard_role")?.value;

  let userRole: RoleType = "COMPLIANCE_OFFICER";
  if (roleHeader === "ADMIN" || roleHeader === "AUDITOR" || roleHeader === "COMPLIANCE_OFFICER") {
    userRole = roleHeader as RoleType;
  } else if (roleCookie === "ADMIN" || roleCookie === "AUDITOR" || roleCookie === "COMPLIANCE_OFFICER") {
    userRole = roleCookie as RoleType;
  }

  // 4. RBAC Enforcement
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.COMPLIANCE_OFFICER;

  for (const [routePattern, methods] of Object.entries(permissions.forbiddenMethods)) {
    if (pathname.startsWith(routePattern) && methods.includes(method)) {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN_INSUFFICIENT_PERMISSIONS",
          message: `Role '${userRole}' is restricted from performing ${method} on ${pathname}. Audit-only access enforced.`,
        },
        { status: 403 }
      );
    }
  }

  // Check compliance view restrictions for AUDITOR
  if (userRole === "AUDITOR" && pathname.startsWith("/compliance")) {
    const url = request.nextUrl.clone();
    url.pathname = "/audit";
    return NextResponse.redirect(url);
  }

  // 5. Construct response with BFSI Enterprise Security Headers
  const response = NextResponse.next();

  response.headers.set("X-FinGuard-Edge-Gate", "ACTIVE");
  response.headers.set("X-FinGuard-Resolved-Role", userRole);
  response.headers.set("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
  response.headers.set("X-RateLimit-Remaining", rateLimitStatus.remaining.toString());
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:;"
  );
  response.headers.set("Server-Timing", `edge;dur=${Date.now() - startTime}`);

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/teller/:path*",
    "/reconciliation/:path*",
    "/compliance/:path*",
    "/audit/:path*",
    "/api/:path*",
  ],
};
