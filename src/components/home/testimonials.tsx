import { FadeIn, Stagger, StaggerItem } from "@/components/motion/reveal";

const QUOTES = [
  {
    quote:
      "J'ai déposé mon CV, postulé en un clic, et suivi chaque étape jusqu'à l'entretien.",
    name: "Amina",
    role: "Candidate · Douala",
  },
  {
    quote:
      "Les offres, les candidatures et les congés sont enfin au même endroit. On gagne un temps précieux.",
    name: "Jean-Paul",
    role: "DRH · Yaoundé",
  },
  {
    quote:
      "La formation en ligne et le certificat m'ont permis de valoriser mon profil auprès des recruteurs.",
    name: "Sandrine",
    role: "Apprenante · Littoral",
  },
] as const;

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">Confiance</p>
        <h2 className="mt-3 font-display text-3xl font-medium text-primary md:text-4xl">
          Témoignages
        </h2>
      </FadeIn>
      <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
        {QUOTES.map((item) => (
          <StaggerItem key={item.name}>
            <figure className="flex h-full flex-col rounded-3xl border border-border/80 bg-card p-6">
              <blockquote className="font-display text-xl leading-snug text-primary">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-auto pt-6 text-sm">
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">{item.role}</p>
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
