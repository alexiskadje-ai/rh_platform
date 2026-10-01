import { RECRUITER_PACK_REVIEW_NOTICE } from "@/lib/config/recruiter-packs";

export function PackReceived() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-border/80 bg-card p-8">
      <p className="text-xs uppercase tracking-[0.22em] text-accent">Demande enregistrée</p>
      <h1 className="mt-3 font-display text-4xl text-primary">Demande prise en compte</h1>
      <p className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-relaxed">
        {RECRUITER_PACK_REVIEW_NOTICE}
      </p>
    </section>
  );
}
