import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa/pwa-register";

export const metadata: Metadata = {
  manifest: "/company/manifest.webmanifest",
};

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaRegister scope="/company/" />
      {children}
    </>
  );
}
