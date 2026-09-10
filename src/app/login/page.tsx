import { LoginForm } from "@/components/auth/auth-forms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12">
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
