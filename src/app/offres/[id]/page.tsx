import Link from "next/link";
import { notFound } from "next/navigation";
import { JobStatus, JobVisibility, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/dal";
import { closeExpiredOffers } from "@/lib/jobs";
import { CONTRACT_LABELS } from "@/lib/constants";
import { formatSalary } from "@/lib/matching";
import { profileCompletion } from "@/lib/profile";
import { ApplyForm } from "@/components/recruitment/apply-form";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await closeExpiredOffers();
  const offer = await db.jobOffer.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!offer) notFound();

  const user = await getSessionUser();
  const isOwner =
    user?.role === Role.RECRUITER
      ? Boolean(
          await db.user.findFirst({
            where: { id: user.id, companyId: offer.companyId },
          }),
        )
      : false;

  if (offer.visibility === JobVisibility.INVITE && !user && !isOwner) {
    notFound();
  }

  const candidate =
    user?.role === Role.CANDIDATE
      ? await db.candidate.findUnique({
          where: { userId: user.id },
          include: { educations: true, experiences: true, certifications: true, applications: true },
        })
      : null;
  const existing = candidate?.applications.find((item) => item.jobOfferId === offer.id);
  const completion = candidate ? profileCompletion(candidate) : null;
  const defaultAvailability =
    candidate?.availability === "DATE" && candidate.availableFrom
      ? candidate.availableFrom.toISOString().slice(0, 10)
      : candidate?.availability === "IMMEDIATE"
        ? new Date().toISOString().slice(0, 10)
        : "";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <div className="flex flex-wrap gap-2">
        <Badge>{CONTRACT_LABELS[offer.contractType]}</Badge>
        {offer.status === JobStatus.CLOSED ? <Badge>Clôturée</Badge> : null}
      </div>
      <h1 className="mt-4 text-3xl font-semibold">{offer.title}</h1>
      <p className="mt-2 text-muted-foreground">
        {offer.company.name} · {offer.location}
      </p>
      <p className="mt-2 text-sm">
        {formatSalary(offer)} · {offer.positionsCount} poste(s) · limite{" "}
        {offer.deadline.toLocaleDateString("fr-FR")}
      </p>
      <section className="mt-8 space-y-4 whitespace-pre-wrap">
        <h2 className="text-lg font-semibold">Description</h2>
        <p>{offer.description}</p>
        <h2 className="text-lg font-semibold">Exigences</h2>
        <p>{offer.requirements}</p>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Postuler</h2>
        {offer.status !== JobStatus.OPEN ? (
          <p className="mt-2 text-sm text-muted-foreground">Cette offre est clôturée.</p>
        ) : !user ? (
          <Link
            href={`/login?callbackUrl=/offres/${offer.id}`}
            className={cn(buttonVariants(), "mt-4")}
          >
            Se connecter pour postuler
          </Link>
        ) : user.role !== Role.CANDIDATE ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous avec un compte candidat pour postuler.
          </p>
        ) : existing ? (
          <p className="mt-2 text-sm">
            Vous avez déjà postulé.{" "}
            <Link href={`/candidate/candidatures/${existing.id}`} className="text-primary underline">
              Suivre la candidature
            </Link>
          </p>
        ) : completion && !completion.canApply ? (
          <p className="mt-2 text-sm">
            Complétez votre profil (CV + 3 compétences) avant de postuler.{" "}
            <Link href="/candidate/profil" className="text-primary underline">
              Aller au profil
            </Link>
          </p>
        ) : (
          <div className="mt-4">
            <ApplyForm
              jobOfferId={offer.id}
              coverLetterRequired={offer.coverLetterRequired}
              defaultAvailability={defaultAvailability}
              hasCv={Boolean(candidate?.cvUrl)}
            />
          </div>
        )}
      </section>
    </main>
  );
}
