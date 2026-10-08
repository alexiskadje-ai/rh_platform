import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa/pwa-register";

export const metadata: Metadata = {
  manifest: "/employee/manifest.webmanifest",
};

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PwaRegister scope="/employee/" />
      {children}
    </>
  );
}
