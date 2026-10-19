import { RECRUITER_TYPE_LABELS } from "@/lib/config/recruiter-signup";

type Contact = {
  civility: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
};

type PendingCompany = {
  name: string;
  type: "COMPANY" | "HEADHUNTER";
  sector: string | null;
  rccm: string | null;
  niu: string | null;
  taxpayerNumber: string | null;
  legalForm: string | null;
  employeeCountRange: string | null;
  annualRevenueRange: string | null;
};

export function RecruiterPendingDetails({
  company,
  contact,
}: {
  company: PendingCompany;
  contact?: Contact;
}) {
  const person = contact
    ? [contact.civility, contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{company.name}</p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {RECRUITER_TYPE_LABELS[company.type]}
        </span>
      </div>
      {company.type === "HEADHUNTER" ? (
        <p className="text-sm text-muted-foreground">
          {[person, contact?.email, contact?.phone].filter(Boolean).join(" · ")}
        </p>
      ) : (
        <dl className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <Fact label="RCCM" value={company.rccm} />
          <Fact label="NIU" value={company.niu} />
          <Fact label="N° contribuable" value={company.taxpayerNumber} />
          <Fact label="Forme juridique" value={company.legalForm} />
          <Fact label="Effectif" value={company.employeeCountRange} />
          <Fact label="Chiffre d'affaires" value={company.annualRevenueRange} />
          {company.sector ? <Fact label="Secteur" value={company.sector} /> : null}
          {contact ? <Fact label="Contact" value={[person, contact.email].filter(Boolean).join(" · ")} /> : null}
        </dl>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="inline font-medium text-foreground">{label} : </dt>
      <dd className="inline">{value || "—"}</dd>
    </div>
  );
}
