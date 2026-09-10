import Link from "next/link";
import type { ContractType, JobStatus } from "@prisma/client";
import { CONTRACT_LABELS } from "@/lib/constants";
import { formatSalary } from "@/lib/matching";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type JobCardOffer = {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  city: string;
  region: string;
  location: string;
  contractType: ContractType;
  deadline: Date | string;
  salaryNegotiable: boolean;
  hideSalary: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  status?: JobStatus;
  company?: { name: string };
  matchScore?: number | null;
};

export function JobOfferCard({
  offer,
  href,
  compact = false,
}: {
  offer: JobCardOffer;
  href?: string;
  compact?: boolean;
}) {
  const deadline = new Date(offer.deadline);
  const content = (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{CONTRACT_LABELS[offer.contractType]}</Badge>
          {offer.status === "CLOSED" ? <Badge>Clôturée</Badge> : null}
          {typeof offer.matchScore === "number" ? (
            <Badge className="bg-primary/15 text-primary">
              Affinité {offer.matchScore}%
            </Badge>
          ) : null}
        </div>
        <CardTitle className="text-lg">{offer.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {offer.company?.name ? `${offer.company.name} · ` : ""}
          {offer.location}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!compact ? (
          <p className="line-clamp-4 whitespace-pre-wrap text-muted-foreground">
            {offer.description}
          </p>
        ) : null}
        <p>
          {formatSalary(offer)} · limite{" "}
          {deadline.toLocaleDateString("fr-FR")}
        </p>
        {href ? (
          <span className={cn(buttonVariants({ size: "sm" }), "mt-2 inline-flex")}>
            Voir l&apos;offre
          </span>
        ) : null}
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
