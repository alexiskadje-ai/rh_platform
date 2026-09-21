"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { submitFreeCv, type FreeCvState } from "@/server/actions/free-cv";
import { RecaptchaField } from "@/components/security/recaptcha-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/lib/ui";
import { GENDER_LABELS, MARITAL_STATUS_LABELS } from "@/lib/constants";
import { TRADE_NAMES, skillsForTrade, type TradeName } from "@/lib/trades";
import { localTodayYmd } from "@/lib/validations/free-cv";

const selectClass = cn(fieldClass, "disabled:cursor-not-allowed disabled:opacity-60");

export function FreeCvForm() {
  const [state, action] = useActionState(submitFreeCv, {} as FreeCvState);
  const [trade, setTrade] = useState<TradeName | "">("");
  const [skills, setSkills] = useState<string[]>([]);
  const today = useMemo(() => localTodayYmd(), []);
  const availableSkills = trade ? skillsForTrade(trade).filter((skill) => !skills.includes(skill)) : [];

  function onTradeChange(value: string) {
    setTrade(value === "" ? "" : (value as TradeName));
    setSkills([]);
  }

  function addSkill(value: string) {
    if (!value || skills.includes(value)) return;
    setSkills([...skills, value]);
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Déposer votre CV</CardTitle>
        <CardDescription>
          Sans compte. Le fichier livré ici alimente votre profil si vous créez un espace ensuite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" name="lastName" required autoComplete="family-name" />
            {state.errors?.lastName ? (
              <p className="text-xs text-destructive">{state.errors.lastName[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" name="firstName" required autoComplete="given-name" />
            {state.errors?.firstName ? (
              <p className="text-xs text-destructive">{state.errors.firstName[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
            {state.errors?.email ? (
              <p className="text-xs text-destructive">{state.errors.email[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              name="phone"
              required
              autoComplete="tel"
              placeholder="+237 6XX XX XX XX"
            />
            {state.errors?.phone ? (
              <p className="text-xs text-destructive">{state.errors.phone[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="trade">Métier</Label>
            <select
              id="trade"
              name="trade"
              required
              value={trade}
              onChange={(event) => onTradeChange(event.target.value)}
              className={selectClass}
            >
              <option value="">Choisir un métier</option>
              {TRADE_NAMES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {state.errors?.trade ? (
              <p className="text-xs text-destructive">{state.errors.trade[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="skillPicker">Compétences</Label>
            {skills.map((skill) => (
              <input key={skill} type="hidden" name="skills" value={skill} />
            ))}
            <select
              id="skillPicker"
              disabled={!trade}
              required={skills.length === 0}
              value=""
              onChange={(event) => addSkill(event.target.value)}
              className={selectClass}
            >
              <option value="">
                {trade ? "Ajouter une compétence" : "Choisissez d'abord un métier"}
              </option>
              {availableSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className="rounded-full bg-muted px-3 py-1 text-sm"
                    onClick={() => setSkills(skills.filter((item) => item !== skill))}
                  >
                    {skill} ×
                  </button>
                ))}
              </div>
            ) : null}
            {state.errors?.skills ? (
              <p className="text-xs text-destructive">{state.errors.skills[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Nombre d&apos;années d&apos;expérience</Label>
            <Input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              min={0}
              max={50}
              required
            />
            {state.errors?.yearsOfExperience ? (
              <p className="text-xs text-destructive">{state.errors.yearsOfExperience[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastHiredAt">Dernière date d&apos;embauche</Label>
            <Input id="lastHiredAt" name="lastHiredAt" type="date" max={today} required />
            {state.errors?.lastHiredAt ? (
              <p className="text-xs text-destructive">{state.errors.lastHiredAt[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="city">Ville de résidence</Label>
            <Input id="city" name="city" required autoComplete="address-level2" placeholder="Douala" />
            {state.errors?.city ? (
              <p className="text-xs text-destructive">{state.errors.city[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Statut matrimonial</Label>
            <select id="maritalStatus" name="maritalStatus" required className={selectClass}>
              <option value="">Choisir</option>
              {Object.entries(MARITAL_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {state.errors?.maritalStatus ? (
              <p className="text-xs text-destructive">{state.errors.maritalStatus[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Âge</Label>
            <Input id="age" name="age" type="number" min={16} max={80} required />
            {state.errors?.age ? (
              <p className="text-xs text-destructive">{state.errors.age[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gender">Genre</Label>
            <select id="gender" name="gender" required className={selectClass}>
              <option value="">Choisir</option>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {state.errors?.gender ? (
              <p className="text-xs text-destructive">{state.errors.gender[0]}</p>
            ) : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cv">CV (PDF, 5 Mo max)</Label>
            <Input id="cv" name="cv" type="file" accept="application/pdf" required />
            {state.errors?.cv ? (
              <p className="text-xs text-destructive">{state.errors.cv[0]}</p>
            ) : null}
          </div>
          <div className="hidden" aria-hidden="true">
            <Label htmlFor="website">Site web</Label>
            <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="sm:col-span-2">
            <RecaptchaField />
          </div>
          {state.duplicate ? (
            <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:col-span-2">
              <p>{state.message}</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  Créer un compte
                </Link>
              </div>
            </div>
          ) : state.message ? (
            <p className="text-sm text-destructive sm:col-span-2">{state.message}</p>
          ) : null}
          <div className="sm:col-span-2">
            <SubmitButton>Envoyer mon CV</SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
