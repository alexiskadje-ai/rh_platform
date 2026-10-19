"use client";

const OPTIONS = [
  ["COMPANY", "Je suis une entreprise", "Je recrute pour ma propre organisation."] as const,
  [
    "HEADHUNTER",
    "Je suis un chasseur de têtes",
    "Cabinet ou indépendant, je recrute pour le compte d'entreprises.",
  ] as const,
];

export function RecruiterTypeChoice({
  value,
  onChange,
}: {
  value: "COMPANY" | "HEADHUNTER";
  onChange: (value: "COMPANY" | "HEADHUNTER") => void;
}) {
  return (
    <div role="radiogroup" aria-label="Type de recruteur" className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map(([type, title, help]) => (
        <label
          key={type}
          className="cursor-pointer rounded-2xl border border-border p-4 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:checked]:border-primary has-[:checked]:bg-primary/5"
        >
          <input
            type="radio"
            name="recruiterType"
            value={type}
            className="sr-only"
            checked={value === type}
            onChange={() => onChange(type)}
            required
          />
          <span className="block font-medium">{title}</span>
          <span className="mt-1 block text-muted-foreground">{help}</span>
        </label>
      ))}
    </div>
  );
}
