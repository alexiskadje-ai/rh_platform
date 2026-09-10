"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Candidate, Certification, Education, Experience } from "@prisma/client";
import {
  saveAvailabilitySection,
  saveCertificationsSection,
  saveCvFile,
  saveEducationsSection,
  saveExperiencesSection,
  saveIdentitySection,
  savePhoto,
  savePreferencesSection,
  saveSkillsSection,
  type ActionState,
} from "@/server/actions/recruitment";
import { AVAILABILITY_OPTIONS, CAMEROON_REGIONS, CONTRACT_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

type Profile = Candidate & {
  educations: Education[];
  experiences: Experience[];
  certifications: Certification[];
};

export function CandidateProfileEditor({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-6">
      <PhotoSection photoUrl={profile.photoUrl} />
      <IdentitySection headline={profile.headline} bio={profile.bio} />
      <PreferencesSection
        city={profile.city}
        region={profile.region}
        desiredContractTypes={profile.desiredContractTypes}
      />
      <SkillsSection skills={profile.skills} />
      <ExperiencesSection experiences={profile.experiences} />
      <EducationsSection educations={profile.educations} />
      <CertificationsSection certifications={profile.certifications} />
      <CvSection cvUrl={profile.cvUrl} />
      <AvailabilitySection
        availability={profile.availability}
        availableFrom={profile.availableFrom}
      />
    </div>
  );
}

function SaveHint({ state }: { state: ActionState }) {
  return (
    <p className="text-xs text-muted-foreground">
      {state.message ??
        (state.ok ? "Enregistré." : "Enregistrement automatique à la saisie.")}
    </p>
  );
}

function useDebouncedSubmit() {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function schedule() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => formRef.current?.requestSubmit(), 650);
  }
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);
  return { formRef, schedule };
}

function PhotoSection({ photoUrl }: { photoUrl: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo de profil</CardTitle>
        <CardDescription>Format carré recommandé.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            await savePhoto(formData);
          }}
          className="flex items-center gap-4"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="size-20 rounded-full object-cover" />
          ) : (
            <div className="size-20 rounded-full bg-muted" />
          )}
          <div className="space-y-2">
            <Input name="photo" type="file" accept="image/*" required />
            <SubmitButton>Enregistrer la photo</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function IdentitySection({
  headline,
  bio,
}: {
  headline: string | null;
  bio: string | null;
}) {
  const { formRef, schedule } = useDebouncedSubmit();
  const [state, action] = useActionState(saveIdentitySection, {} as ActionState);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Présentation</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} onInput={schedule} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Titre professionnel</Label>
            <Input
              id="headline"
              name="headline"
              defaultValue={headline ?? ""}
              placeholder="Ex. Développeur full-stack"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Résumé / à propos</Label>
            <Textarea
              id="bio"
              name="bio"
              maxLength={500}
              defaultValue={bio ?? ""}
              placeholder="500 caractères maximum"
            />
          </div>
          <SaveHint state={state} />
        </form>
      </CardContent>
    </Card>
  );
}

function PreferencesSection({
  city,
  region,
  desiredContractTypes,
}: {
  city: string | null;
  region: string | null;
  desiredContractTypes: string[];
}) {
  const { formRef, schedule } = useDebouncedSubmit();
  const [state, action] = useActionState(savePreferencesSection, {} as ActionState);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Localisation et contrat</CardTitle>
        <CardDescription>
          Utilisés pour le score de matching (filtres souples).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} onInput={schedule} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" name="city" defaultValue={city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <select
                id="region"
                name="region"
                defaultValue={region ?? ""}
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
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Types de contrat recherchés</legend>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CONTRACT_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="desiredContractTypes"
                    value={value}
                    defaultChecked={desiredContractTypes.includes(value)}
                    onChange={schedule}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <SaveHint state={state} />
        </form>
      </CardContent>
    </Card>
  );
}

function SkillsSection({ skills }: { skills: string[] }) {
  const { formRef, schedule } = useDebouncedSubmit();
  const [state, action] = useActionState(saveSkillsSection, {} as ActionState);
  const [tags, setTags] = useState(skills);
  const [draft, setDraft] = useState("");

  function addTag() {
    const value = draft.trim();
    if (!value || tags.includes(value)) return;
    const next = [...tags, value];
    setTags(next);
    setDraft("");
    setTimeout(schedule, 0);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compétences</CardTitle>
        <CardDescription>Au moins 3 recommandées avant de postuler.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-3">
          <input type="hidden" name="skills" value={tags.join(",")} />
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-full bg-muted px-3 py-1 text-sm"
                onClick={() => {
                  setTags(tags.filter((item) => item !== tag));
                  setTimeout(schedule, 0);
                }}
              >
                {tag} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="Ajouter une compétence"
            />
            <Button type="button" variant="secondary" onClick={addTag}>
              Ajouter
            </Button>
          </div>
          <SaveHint state={state} />
        </form>
      </CardContent>
    </Card>
  );
}

function ExperiencesSection({ experiences }: { experiences: Experience[] }) {
  const { formRef, schedule } = useDebouncedSubmit();
  const [state, action] = useActionState(saveExperiencesSection, {} as ActionState);
  const [items, setItems] = useState(
    experiences.map((item) => ({
      title: item.title,
      company: item.company,
      startDate: item.startDate.toISOString().slice(0, 10),
      endDate: item.endDate ? item.endDate.toISOString().slice(0, 10) : "",
    })),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expériences professionnelles</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-4">
          <input type="hidden" name="payload" value={JSON.stringify(items)} />
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
              <Input
                placeholder="Poste"
                value={item.title}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, title: event.target.value };
                  setItems(next);
                  schedule();
                }}
              />
              <Input
                placeholder="Entreprise"
                value={item.company}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, company: event.target.value };
                  setItems(next);
                  schedule();
                }}
              />
              <Input
                type="date"
                value={item.startDate}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, startDate: event.target.value };
                  setItems(next);
                  schedule();
                }}
              />
              <Input
                type="date"
                value={item.endDate}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, endDate: event.target.value };
                  setItems(next);
                  schedule();
                }}
              />
              <button
                type="button"
                className="text-left text-sm text-destructive"
                onClick={() => {
                  setItems(items.filter((_, i) => i !== index));
                  schedule();
                }}
              >
                Retirer
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setItems([
                ...items,
                { title: "", company: "", startDate: "", endDate: "" },
              ])
            }
          >
            Ajouter une expérience
          </Button>
          <SaveHint state={state} />
        </form>
      </CardContent>
    </Card>
  );
}

function EducationsSection({ educations }: { educations: Education[] }) {
  const { formRef, schedule } = useDebouncedSubmit();
  const [state, action] = useActionState(saveEducationsSection, {} as ActionState);
  const [items, setItems] = useState(
    educations.map((item) => ({
      degree: item.degree,
      institution: item.institution,
      year: String(item.year),
    })),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diplômes</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-4">
          <input type="hidden" name="payload" value={JSON.stringify(items)} />
          {items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-3">
              <Input
                placeholder="Diplôme"
                value={item.degree}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, degree: event.target.value };
                  setItems(next);
                  schedule();
                }}
              />
              <Input
                placeholder="Établissement"
                value={item.institution}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, institution: event.target.value };
                  setItems(next);
                  schedule();
                }}
              />
              <Input
                placeholder="Année"
                value={item.year}
                onChange={(event) => {
                  const next = [...items];
                  next[index] = { ...item, year: event.target.value };
                  setItems(next);
                  schedule();
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setItems([...items, { degree: "", institution: "", year: "" }])
            }
          >
            Ajouter un diplôme
          </Button>
          <SaveHint state={state} />
        </form>
      </CardContent>
    </Card>
  );
}

function CertificationsSection({
  certifications,
}: {
  certifications: Certification[];
}) {
  const [state, action] = useActionState(saveCertificationsSection, {} as ActionState);
  const [count, setCount] = useState(Math.max(certifications.length, 1));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certifications</CardTitle>
        <CardDescription>Optionnel, fichier possible.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {Array.from({ length: count }).map((_, index) => {
            const current = certifications[index];
            return (
              <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-2">
                <Input name="name" placeholder="Nom" defaultValue={current?.name ?? ""} />
                <Input name="issuer" placeholder="Organisme" defaultValue={current?.issuer ?? ""} />
                <Input name="year" placeholder="Année" defaultValue={current?.year ?? ""} />
                <input type="hidden" name="existingFileUrl" defaultValue={current?.fileUrl ?? ""} />
                <div className="space-y-1">
                  <Input name="file" type="file" />
                  {current?.fileUrl ? (
                    <a href={current.fileUrl} className="text-xs text-primary underline" target="_blank">
                      Fichier actuel
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setCount(count + 1)}>
              Ajouter
            </Button>
            <SubmitButton>Enregistrer les certifications</SubmitButton>
          </div>
          <SaveHint state={state} />
        </form>
      </CardContent>
    </Card>
  );
}

function CvSection({ cvUrl }: { cvUrl: string | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CV (PDF)</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={async (formData) => {
            await saveCvFile(formData);
          }}
          className="space-y-3"
        >
          {cvUrl ? (
            <a href={cvUrl} className="text-sm text-primary underline" target="_blank">
              CV actuel
            </a>
          ) : null}
          <Input name="cv" type="file" accept="application/pdf" required />
          <SubmitButton>Enregistrer le CV</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

function AvailabilitySection({
  availability,
  availableFrom,
}: {
  availability: string | null;
  availableFrom: Date | null;
}) {
  const { formRef, schedule } = useDebouncedSubmit();
  const [state, action] = useActionState(saveAvailabilitySection, {} as ActionState);
  const [value, setValue] = useState(availability ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilité</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-3">
          <select
            name="availability"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              schedule();
            }}
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
          >
            <option value="">Sélectionner</option>
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {value === "DATE" ? (
            <Input
              type="date"
              name="availableFrom"
              defaultValue={availableFrom ? availableFrom.toISOString().slice(0, 10) : ""}
              onChange={schedule}
            />
          ) : null}
          <SaveHint state={state} />
        </form>
      </CardContent>
    </Card>
  );
}
