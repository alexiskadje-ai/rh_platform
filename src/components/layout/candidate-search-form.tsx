export function CandidateSearchForm({
  id,
  className,
  defaultValue,
  compact = false,
}: {
  id: string;
  className?: string;
  defaultValue?: string;
  compact?: boolean;
}) {
  return (
    <form action="/company/candidats" className={className}>
      <label htmlFor={id} className="sr-only">
        Rechercher un candidat par métier ou compétence
      </label>
      <input
        id={id}
        name="q"
        maxLength={80}
        defaultValue={defaultValue}
        placeholder="Métier ou compétence"
        className={
          compact
            ? "h-9 w-full rounded-full border border-border bg-background px-3 text-sm text-foreground md:w-52"
            : "h-10 w-full rounded-full border border-border bg-background px-4 text-sm text-foreground"
        }
      />
      <button type="submit" className={compact ? "sr-only" : "mt-3 h-10 rounded-full bg-primary px-4 text-sm text-primary-foreground"}>
        Rechercher
      </button>
    </form>
  );
}
