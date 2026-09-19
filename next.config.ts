import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdf-parse",
    "pdfjs-dist",
    "openai",
    "@mistralai/mistralai",
    "@react-pdf/renderer",
    "stripe",
    "bullmq",
    "ioredis",
  ],
};

export default nextConfig;
