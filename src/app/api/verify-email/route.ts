import { NextResponse } from "next/server";
import { confirmEmail } from "@/server/actions/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(new URL("/verify", request.url));
  }

  const result = await confirmEmail(token);
  if (!result.ok) {
    const next = new URL("/verify", request.url);
    next.searchParams.set("erreur", "lien");
    return NextResponse.redirect(next);
  }

  // createSession inside confirmEmail already redirects active candidates.
  return NextResponse.redirect(new URL("/verify", request.url));
}
