import { TokenType } from "@prisma/client";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";
import { peekToken } from "@/lib/tokens";
import { FadeIn } from "@/components/motion/reveal";

export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const userId = await peekToken(token, TokenType.PASSWORD_RESET);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16">
      <FadeIn>
        <ResetPasswordForm token={token} invalid={!userId} />
      </FadeIn>
    </main>
  );
}
