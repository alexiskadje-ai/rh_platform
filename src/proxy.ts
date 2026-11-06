import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isModuleRouteDisabled,
  recruiterPackGateApplies,
  recruiterPackRedirect,
} from "@/lib/config/module-access";
import { FIRST_LOGIN_PATH, RECRUITER_ONBOARDING_PACK_PATH } from "@/lib/config/recruiter-packs";
import { ROLE_HOME } from "@/lib/constants";
import { blockedPublicRedirect } from "@/lib/nav";
import { isPwaInstallAsset } from "@/lib/pwa/assets";
import type { Role } from "@prisma/client";

/** Auth.js session cookies — presence means we may need JWT decode; absence skips auth(). */
function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value,
  );
}

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/verify",
  "/pending-approval",
  "/cgu",
  "/offres",
  "/formations",
  "/boutique",
  "/faq",
  "/contact",
  "/a-propos",
  "/services",
  "/candidat",
  "/inscription",
  "/sitemap.xml",
  "/robots.txt",
];

const ROLE_PREFIX: Record<string, Role> = {
  "/admin": "ADMIN",
  "/company": "RECRUITER",
  "/candidate": "CANDIDATE",
  "/employee": "EMPLOYEE",
};

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

async function recruiterGateState(userId: string) {
  if (!userId) return { companyStatus: null, subscriptionStatus: null };
  const { db } = await import("@/lib/db");
  const row = await db.user.findUnique({
    where: { id: userId },
    select: {
      company: {
        select: {
          status: true,
          recruiterSubscription: { select: { status: true } },
        },
      },
    },
  });
  return {
    companyStatus: row?.company?.status ?? null,
    subscriptionStatus: row?.company?.recruiterSubscription?.status ?? null,
  };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  if (isPwaInstallAsset(pathname)) {
    return NextResponse.next();
  }

  if (isModuleRouteDisabled(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Anonymous public traffic: skip JWT/Prisma cold path entirely.
  if (!hasSessionCookie(request)) {
    if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
      return NextResponse.next();
    }
    if (isPublic(pathname) && pathname !== "/pending-approval" && pathname !== "/verify") {
      return NextResponse.next();
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const user = session?.user;

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (user) {
      const destination = user.mustChangePassword && user.status === "ACTIVE"
        ? FIRST_LOGIN_PATH
        : user.role === "CANDIDATE" && !user.isVerified
          ? "/verify"
          : user.role === "RECRUITER" && user.status === "PENDING"
            ? RECRUITER_ONBOARDING_PACK_PATH
            : ROLE_HOME[user.role];
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  if (user) {
    const blocked = blockedPublicRedirect(user, pathname);
    if (blocked) {
      return NextResponse.redirect(new URL(blocked, request.url));
    }
  }

  if (
    user?.mustChangePassword &&
    user.status === "ACTIVE" &&
    pathname !== FIRST_LOGIN_PATH
  ) {
    return NextResponse.redirect(new URL(FIRST_LOGIN_PATH, request.url));
  }

  if (isPublic(pathname) && pathname !== "/pending-approval" && pathname !== "/verify") {
    return NextResponse.next();
  }

  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/verify")) {
    if (user.isVerified) {
      return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/pending-approval")) {
    if (user.role !== "RECRUITER" || user.status !== "PENDING") {
      return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
    }
    return NextResponse.next();
  }

  if (user.role === "CANDIDATE" && !user.isVerified) {
    return NextResponse.redirect(new URL("/verify", request.url));
  }

  if (user.role === "RECRUITER" && user.status === "PENDING") {
    if (pathname.startsWith("/company/onboarding") || pathname.startsWith("/pending-approval")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(RECRUITER_ONBOARDING_PACK_PATH, request.url));
  }

  if (recruiterPackGateApplies(pathname, user.role)) {
    const gate = await recruiterGateState(user.id);
    const destination = recruiterPackRedirect({
      pathname,
      role: user.role,
      companyStatus: gate.companyStatus,
      subscriptionStatus: gate.subscriptionStatus,
    });
    if (destination) {
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  const matched = Object.entries(ROLE_PREFIX).find(([prefix]) =>
    pathname.startsWith(prefix),
  );
  if (matched && user.role !== matched[1]) {
    return NextResponse.redirect(new URL(ROLE_HOME[user.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf)$).*)",
  ],
};
