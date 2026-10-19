"use client";

import { RECRUITER_SIGNUP_CIVILITIES } from "@/lib/config/recruiter-signup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecruiterPersonalFields({
  civility,
  fullName,
  phone,
  email,
  errors,
  onCivility,
  onFullName,
  onPhone,
  onEmail,
}: {
  civility: string;
  fullName: string;
  phone: string;
  email: string;
  errors?: Record<string, string[] | undefined>;
  onCivility: (value: string) => void;
  onFullName: (value: string) => void;
  onPhone: (value: string) => void;
  onEmail: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-border p-4">
      <legend className="px-1 text-sm font-medium">Informations personnelles</legend>
      <div className="space-y-2">
        <p className="text-sm font-medium" id="civility-label">
          Civilité
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="civility-label">
          {RECRUITER_SIGNUP_CIVILITIES.map((item) => (
            <label
              key={item}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="civility"
                value={item}
                checked={civility === item}
                onChange={() => onCivility(item)}
                required
              />
              {item}
            </label>
          ))}
        </div>
        {errors?.civility?.[0] ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.civility[0]}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => onFullName(event.target.value)}
        />
        {errors?.fullName?.[0] ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.fullName[0]}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="+237 6XX XX XX XX"
          value={phone}
          onChange={(event) => onPhone(event.target.value)}
        />
        {errors?.phone?.[0] ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.phone[0]}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => onEmail(event.target.value)}
        />
        {errors?.email?.[0] ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.email[0]}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
