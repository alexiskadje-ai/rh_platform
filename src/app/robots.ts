import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/candidat/depot-libre"],
      disallow: [
        "/candidat/",
        "/entreprise/",
        "/admin/",
        "/api/",
        "/candidate/",
        "/company/",
        "/employee/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
