import type { Metadata } from "next";
import { RecruiterRegisterForm } from "@/components/auth/recruiter-register-form";

export const metadata: Metadata = {
  title: "Inscription recruteur",
  description:
    "Créez un compte recruteur : entreprise ou chasseur de têtes. Le choix du pack suit l'inscription.",
};

export default function RegisterRecruiterPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center px-4 py-12">
      <RecruiterRegisterForm />
    </main>
  );
}
