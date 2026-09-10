"use client";

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8, label: "8 caractères" },
    { ok: /[A-Z]/.test(password), label: "Majuscule" },
    { ok: /[0-9]/.test(password), label: "Chiffre" },
  ];
  const score = checks.filter((item) => item.ok).length;

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < score
                ? score === 3
                  ? "bg-primary"
                  : "bg-accent"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {checks.map((item) => item.label).join(" · ")}
      </p>
    </div>
  );
}
