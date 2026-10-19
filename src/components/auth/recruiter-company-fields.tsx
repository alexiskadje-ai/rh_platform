"use client";

import { AnimatePresence, motion } from "framer-motion";
import { collapseMotion } from "@/lib/animations";
import {
  RECRUITER_ANNUAL_REVENUE_RANGES,
  RECRUITER_EMPLOYEE_COUNT_RANGES,
  RECRUITER_LEGAL_FORMS,
} from "@/lib/config/recruiter-signup";
import { SignupChoice, SignupTextField } from "@/components/auth/recruiter-signup-controls";

type CompanyValues = {
  companyName: string;
  rccm: string;
  legalForm: string;
  employeeCountRange: string;
  annualRevenueRange: string;
  niu: string;
  taxpayerNumber: string;
};

export function RecruiterCompanyFields({
  visible,
  values,
  errors,
  onChange,
}: {
  visible: boolean;
  values: CompanyValues;
  errors?: Record<string, string[] | undefined>;
  onChange: (key: keyof CompanyValues, value: string) => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.fieldset
          key="company"
          initial={collapseMotion.initial}
          animate={collapseMotion.animate}
          exit={collapseMotion.exit}
          transition={collapseMotion.transition}
          className="min-w-0 space-y-4 overflow-hidden rounded-2xl border border-border p-4"
        >
          <legend className="px-1 text-sm font-medium">Informations sur l&apos;entreprise</legend>
          <p className="text-sm text-muted-foreground">
            Ces informations servent uniquement à vérifier votre compte.
          </p>
          <SignupTextField
            label="Nom de l'entreprise"
            name="companyName"
            value={values.companyName}
            error={errors?.companyName?.[0]}
            onChange={(value) => onChange("companyName", value)}
          />
          <SignupTextField
            label="Numéro de registre de commerce (RCCM)"
            name="rccm"
            value={values.rccm}
            error={errors?.rccm?.[0]}
            onChange={(value) => onChange("rccm", value)}
          />
          <SignupChoice
            label="Forme juridique"
            name="legalForm"
            value={values.legalForm}
            options={RECRUITER_LEGAL_FORMS}
            error={errors?.legalForm?.[0]}
            onChange={(value) => onChange("legalForm", value)}
          />
          <SignupChoice
            label="Nombre d'employés"
            name="employeeCountRange"
            value={values.employeeCountRange}
            options={RECRUITER_EMPLOYEE_COUNT_RANGES}
            error={errors?.employeeCountRange?.[0]}
            onChange={(value) => onChange("employeeCountRange", value)}
          />
          <SignupChoice
            label="Chiffre d'affaires annuel (FCFA)"
            name="annualRevenueRange"
            value={values.annualRevenueRange}
            options={RECRUITER_ANNUAL_REVENUE_RANGES}
            error={errors?.annualRevenueRange?.[0]}
            onChange={(value) => onChange("annualRevenueRange", value)}
          />
          <SignupTextField
            label="NIU"
            name="niu"
            value={values.niu}
            error={errors?.niu?.[0]}
            onChange={(value) => onChange("niu", value)}
          />
          <SignupTextField
            label="Numéro de contribuable"
            name="taxpayerNumber"
            value={values.taxpayerNumber}
            error={errors?.taxpayerNumber?.[0]}
            onChange={(value) => onChange("taxpayerNumber", value)}
          />
        </motion.fieldset>
      ) : null}
    </AnimatePresence>
  );
}
