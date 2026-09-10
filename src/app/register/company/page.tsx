import { CompanyRegisterForm } from "@/components/auth/auth-forms";
import { COMPANY_SECTORS } from "@/lib/constants";

export default function RegisterCompanyPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center px-4 py-12">
      <CompanyRegisterForm sectors={COMPANY_SECTORS} />
    </main>
  );
}
