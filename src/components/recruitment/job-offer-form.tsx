"use client";

import { useActionState, useMemo, useState } from "react";
import type { ContractType, JobOffer, JobVisibility } from "@prisma/client";
import { createJobOffer, updateJobOffer, type ActionState } from "@/server/actions/recruitment";
import { CAMEROON_REGIONS, CONTRACT_LABELS } from "@/lib/constants";
import { JobOfferCard } from "@/components/recruitment/job-offer-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JobOfferForm({
  offer,
  companyName,
}: {
  offer?: JobOffer;
  companyName: string;
}) {
  const action = offer ? updateJobOffer : createJobOffer;
  const [state, formAction] = useActionState(action, {} as ActionState);
  const [title, setTitle] = useState(offer?.title ?? "");
  const [description, setDescription] = useState(offer?.description ?? "");
  const [requirements, setRequirements] = useState(offer?.requirements ?? "");
  const [city, setCity] = useState(offer?.city ?? "");
  const [region, setRegion] = useState(offer?.region ?? "Littoral");
  const [contractType, setContractType] = useState<ContractType>(offer?.contractType ?? "CDI");
  const [salaryMin, setSalaryMin] = useState(offer?.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(offer?.salaryMax?.toString() ?? "");
  const [salaryNegotiable, setSalaryNegotiable] = useState(offer?.salaryNegotiable ?? false);
  const [hideSalary, setHideSalary] = useState(offer?.hideSalary ?? false);
  const [deadline, setDeadline] = useState(
    offer ? offer.deadline.toISOString().slice(0, 10) : "",
  );
  const [positionsCount, setPositionsCount] = useState(String(offer?.positionsCount ?? 1));
  const [visibility, setVisibility] = useState<JobVisibility>(offer?.visibility ?? "PUBLIC");

  const preview = useMemo(
    () => ({
      id: offer?.id ?? "preview",
      title: title || "Intitulé du poste",
      description: description || "La description apparaîtra ici.",
      requirements,
      city,
      region,
      location: [city, region].filter(Boolean).join(", ") || "Ville, région",
      contractType,
      deadline: deadline ? new Date(deadline) : new Date("2099-12-31"),
      salaryNegotiable,
      hideSalary,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      company: { name: companyName },
    }),
    [
      offer?.id,
      title,
      description,
      requirements,
      city,
      region,
      contractType,
      deadline,
      salaryNegotiable,
      hideSalary,
      salaryMin,
      salaryMax,
      companyName,
    ],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{offer ? "Modifier l'offre" : "Publier une offre"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {offer ? <input type="hidden" name="id" value={offer.id} /> : null}
            <Field label="Intitulé du poste" error={state.errors?.title?.[0]}>
              <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Description" error={state.errors?.description?.[0]}>
              <Textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Field>
            <Field label="Exigences" error={state.errors?.requirements?.[0]}>
              <Textarea
                name="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ville" error={state.errors?.city?.[0]}>
                <Input name="city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </Field>
              <Field label="Région" error={state.errors?.region?.[0]}>
                <select
                  name="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
                >
                  {CAMEROON_REGIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Type de contrat">
              <select
                name="contractType"
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="salaryNegotiable"
                checked={salaryNegotiable}
                onChange={(e) => setSalaryNegotiable(e.target.checked)}
              />
              Salaire à négocier
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Salaire min (FCFA)">
                <Input
                  name="salaryMin"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  disabled={salaryNegotiable}
                />
              </Field>
              <Field label="Salaire max (FCFA)">
                <Input
                  name="salaryMax"
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  disabled={salaryNegotiable}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="hideSalary"
                checked={hideSalary}
                onChange={(e) => setHideSalary(e.target.checked)}
              />
              Masquer le salaire sur la fiche publique
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="coverLetterRequired" defaultChecked={offer?.coverLetterRequired} />
              Lettre de motivation obligatoire
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date limite" error={state.errors?.deadline?.[0]}>
                <Input
                  name="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </Field>
              <Field label="Nombre de postes">
                <Input
                  name="positionsCount"
                  type="number"
                  min={1}
                  value={positionsCount}
                  onChange={(e) => setPositionsCount(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Visibilité">
              <select
                name="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as JobVisibility)}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="PUBLIC">Publique</option>
                <option value="INVITE">Sur invitation</option>
              </select>
            </Field>
            {state.message && !state.ok ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}
            {state.ok ? <p className="text-sm text-primary">{state.message}</p> : null}
            <SubmitButton>{offer ? "Enregistrer" : "Publier l'offre"}</SubmitButton>
          </form>
        </CardContent>
      </Card>
      <div>
        <p className="mb-3 text-sm font-medium">Aperçu en temps réel</p>
        <JobOfferCard offer={preview} compact={false} />
        {requirements ? (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <p className="font-medium">Exigences</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{requirements}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
