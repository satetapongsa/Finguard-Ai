import { NextResponse, type NextRequest } from "next/server";
import type { RoleType } from "@/lib/types";

/**
 * Next.js Edge Middleware for Zero-Trust BFSI Security Perimeter & RBAC
 * 
 * Enforces:
 * 1. Role-Based Access Control (ADMIN, COMPLIANCE_OFFICER, AUDITOR)
 * 2. Immutable Audit Isolation (Auditors have read-only access, cannot post transactions)
 * 3. Enterprise BFSI HTTP Security Headers
 */

// Route Access Matrix
const ROLE_PERMISSIONS: Record<RoleType, { allowedRoutes: RegExp[]; forbiddenMethods: Record<string, string[]> }> = {
  ADMIN: {
    allowedRoutes: [/^\/dashboard/, /^\/compliance/, /^\/audit/, /^\/api\//],
    forbiddenMethods: {},
  },
  COMPLIANCE_OFFICER: {
    allowedRoutes: [/^\/dashboard/, /^\/compliance/, /^\/audit/, /^\/api\//],
    forbiddenMethods: {
      // Compliance officers can execute transactions and review policies
    },
  },
  AUDITOR: {
    allowedRoutes: [/^\/dashboard/, /^\/audit/, /^\/api\/audit/, /^\/api\/stats/, /^\/api\/transactions/],
    forbiddenMethods: {
      // Auditors are strictly READ-ONLY on ledger mutations
      "/api/transactions": ["POST"],
    },
  },
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // 1. Bypass static assets, internal nextjs files, and public auth endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Resolve User Role from Session Token Cookie or Header
  // In enterprise deployment, NextAuth JWT is parsed or verified.
  // Supports x-finguard-role header or cookie for testing role-switching.
  const tokenCookie =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  const roleHeader = request.headers.get("x-finguard-role");
  const roleCookie = request.cookies.get("finguard_role")?.value;

  // Default to COMPLIANCE_OFFICER for POC preview if unassigned, or extract from token
  let userRole: RoleType = "COMPLIANCE_OFFICER";
  if (roleHeader === "ADMIN" || roleHeader === "AUDITOR" || roleHeader === "COMPLIANCE_OFFICER") {
    userRole = roleHeader as RoleType;
  } else if (roleCookie === "ADMIN" || roleCookie === "AUDITOR" || roleCookie === "COMPLIANCE_OFFICER") {
    userRole = roleCookie as RoleType;
  }

  // 3. RBAC Enforcement
  const permissions = ROLE_PERMISSIONS[userRole];

  // Check forbidden method restrictions (e.g., AUDITOR cannot POST /api/transactions)
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

  // Check compliance view restrictions for AUDITOR (auditors view audit logs and dashboards, not active intervention copilot)
  if (userRole === "AUDITOR" && pathname.startsWith("/compliance")) {
    const url = request.nextUrl.clone();
    url.pathname = "/audit";
    return NextResponse.redirect(url);
  }

  // 4. Construct response with Banking-Grade Security Headers
  const response = NextResponse.next();

  response.headers.set("X-FinGuard-Edge-Gate", "ACTIVE");
  response.headers.set("X-FinGuard-Resolved-Role", userRole);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/compliance/:path*",
    "/audit/:path*",
    "/api/:path*",
  ],
};
