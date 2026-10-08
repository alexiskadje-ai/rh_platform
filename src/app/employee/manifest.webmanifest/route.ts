import { NextResponse } from "next/server";
import { employeeManifest } from "@/lib/pwa/manifest";

export function GET() {
  return NextResponse.json(employeeManifest(), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
