"use client";

import { useActionState, useState } from "react";
import {
  confirmParsedCv,
  parseCvFromUpload,
  type ParseCvState,
} from "@/server/actions/ai-cv-parser";
import type { ParsedCv } from "@/lib/validations/cv-parse";
import { AVAILABILITY_OPTIONS, CAMEROON_REGIONS, CONTRACT_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function CvImportReview() {
  const [parseState, parseAction] = useActionState(parseCvFromUpload, {} as ParseCvState);
  const [confirmState, confirmAction] = useActionState(confirmParsedCv, {} as ParseCvState);
  const data = parseState.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analyser un CV (PDF)</CardTitle>
          <CardDescription>
            L&apos;IA pré-remplit le profil. Rien n&apos;est enregistré tant que vous n&apos;avez pas
            validé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={parseAction} className="space-y-3">
            <Input name="cv" type="file" accept="application/pdf" />
            <SubmitButton pendingLabel="Analyse en cours…">Extraire le profil</SubmitButton>
          </form>
          {parseState.message && !parseState.ok ? (
            <p className="mt-3 text-sm text-destructive">{parseState.message}</p>
          ) : null}
        </CardContent>
      </Card>

      {data ? (
        <ReviewForm
          data={data}
          cvUrl={parseState.cvUrl}
          confirmAction={confirmAction}
          confirmState={confirmState}
        />
      ) : null}

      {confirmState.ok ? (
        <p className="text-sm text-primary">{confirmState.message}</p>
      ) : null}
      {confirmState.message && !confirmState.ok ? (
        <p className="text-sm text-destructive">{confirmState.message}</p>
      ) : null}
    </div>
  );
}

function ReviewForm({
  data,
  cvUrl,
  confirmAction,
  confirmState,
}: {
  data: ParsedCv;
  cvUrl?: string;
  confirmAction: (formData: FormData) => void;
  confirmState: ParseCvState;
}) {
  const [headline, setHeadline] = useState(data.headline ?? "");
  const [bio, setBio] = useState(data.bio ?? "");
  const [skills, setSkills] = useState(data.skills.join(", "));
  const [city, setCity] = useState(data.city ?? "");
  const [region, setRegion] = useState(data.region ?? "");
  const [availability, setAvailability] = useState(data.availability ?? "");
  const [availableFrom, setAvailableFrom] = useState(data.availableFrom ?? "");
  const [contracts, setContracts] = useState<string[]>(data.desiredContractTypes);
  const [experiences, setExperiences] = useState(data.experiences);
  const [educations, setEducations] = useState(
    data.educations.map((item) => ({ ...item, year: String(item.year) })),
  );

  const payload: ParsedCv = {
    headline: headline || null,
    bio: bio || null,
    skills: skills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    city: city || null,
    region: region || null,
    availability: availability === "IMMEDIATE" || availability === "NOTICE" || availability === "DATE"
      ? availability
      : null,
    availableFrom: availableFrom || null,
    desiredContractTypes: contracts.filter(
      (item): item is "CDI" | "CDD" | "STAGE" | "PRESTATION" =>
        item === "CDI" || item === "CDD" || item === "STAGE" || item === "PRESTATION",
    ),
    experiences: experiences.map((item) => ({
      ...item,
      endDate: item.endDate || null,
    })),
    educations: educations
      .filter((item) => item.degree && item.institution)
      .map((item) => ({ ...item, year: Number(item.year) })),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relecture avant enregistrement</CardTitle>
        <CardDescription>Modifiez les champs extraits, puis validez.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={confirmAction} className="space-y-4">
          <input type="hidden" name="payload" value={JSON.stringify(payload)} />
          <input type="hidden" name="cvUrl" value={cvUrl ?? ""} />
          <div className="space-y-2">
            <Label>Titre professionnel</Label>
            <Input value={headline} onChange={(event) => setHeadline(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Résumé / à propos</Label>
            <Textarea value={bio} maxLength={500} onChange={(event) => setBio(event.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input value={city} onChange={(event) => setCity(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Région</Label>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="">Non renseignée</option>
                {CAMEROON_REGIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Compétences (séparées par des virgules)</Label>
            <Input value={skills} onChange={(event) => setSkills(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contracts.includes(value)}
                  onChange={(event) => {
                    setContracts(
                      event.target.checked
                        ? [...contracts, value]
                        : contracts.filter((item) => item !== value),
                    );
                  }}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Disponibilité</Label>
            <select
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
            >
              <option value="">Non renseignée</option>
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {availability === "DATE" ? (
              <Input
                type="date"
                value={availableFrom}
                onChange={(event) => setAvailableFrom(event.target.value)}
              />
            ) : null}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Expériences</p>
            {experiences.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">
                <Input
                  value={item.title}
                  placeholder="Poste"
                  onChange={(event) => {
                    const next = [...experiences];
                    next[index] = { ...item, title: event.target.value };
                    setExperiences(next);
                  }}
                />
                <Input
                  value={item.company}
                  placeholder="Entreprise"
                  onChange={(event) => {
                    const next = [...experiences];
                    next[index] = { ...item, company: event.target.value };
                    setExperiences(next);
                  }}
                />
                <Input
                  type="date"
                  value={item.startDate}
                  onChange={(event) => {
                    const next = [...experiences];
                    next[index] = { ...item, startDate: event.target.value };
                    setExperiences(next);
                  }}
                />
                <Input
                  type="date"
                  value={item.endDate ?? ""}
                  onChange={(event) => {
                    const next = [...experiences];
                    next[index] = { ...item, endDate: event.target.value || null };
                    setExperiences(next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setExperiences([
                  ...experiences,
                  { title: "", company: "", startDate: "", endDate: null },
                ])
              }
            >
              Ajouter une expérience
            </Button>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Diplômes</p>
            {educations.map((item, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-3">
                <Input
                  value={item.degree}
                  placeholder="Diplôme"
                  onChange={(event) => {
                    const next = [...educations];
                    next[index] = { ...item, degree: event.target.value };
                    setEducations(next);
                  }}
                />
                <Input
                  value={item.institution}
                  placeholder="Établissement"
                  onChange={(event) => {
                    const next = [...educations];
                    next[index] = { ...item, institution: event.target.value };
                    setEducations(next);
                  }}
                />
                <Input
                  value={item.year}
                  placeholder="Année"
                  onChange={(event) => {
                    const next = [...educations];
                    next[index] = { ...item, year: event.target.value };
                    setEducations(next);
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setEducations([...educations, { degree: "", institution: "", year: "" }])
              }
            >
              Ajouter un diplôme
            </Button>
          </div>
          {confirmState.message && !confirmState.ok ? (
            <p className="text-sm text-destructive">{confirmState.message}</p>
          ) : null}
          <SubmitButton>Valider et enregistrer le profil</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
