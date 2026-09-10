import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import type { Role } from "@prisma/client";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
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

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;
  const user = session?.user;

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (user) {
      const destination =
        user.role === "CANDIDATE" && !user.isVerified
          ? "/verify"
          : user.role === "RECRUITER" && user.status === "PENDING"
            ? "/pending-approval"
            : ROLE_HOME[user.role];
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
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
    return NextResponse.redirect(new URL("/pending-approval", request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
