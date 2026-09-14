import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "openai",
    "@react-pdf/renderer",
    "stripe",
  ],
};

export default nextConfig;
