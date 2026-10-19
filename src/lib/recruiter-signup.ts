export const RECRUITER_SIGNUP_CONFLICT_MESSAGE =
  "Un compte existe déjà avec ces informations. Si votre demande a été refusée ou si vous avez une question, contactez le support.";

/** Trim, majuscules, sans espaces internes. */
export function normalizeRegistryIdentifier(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidRegistryIdentifier(value: string): boolean {
  const normalized = normalizeRegistryIdentifier(value);
  if (normalized.length < 5 || normalized.length > 30) return false;
  return /^[A-Z0-9/-]+$/.test(normalized);
}

type SignupIdentity = {
  email: string;
  phone: string;
  rccm?: string;
  niu?: string;
};

type IdRow = { id: string } | null;

export type RecruiterSignupLookup = {
  user: {
    findFirst: (args: {
      where: { OR: Array<{ email: string } | { phone: string }> };
      select: { id: true };
    }) => Promise<IdRow>;
  };
  company: {
    findFirst: (args: {
      where: { rccm: string } | { niu: string };
      select: { id: true };
    }) => Promise<IdRow>;
  };
};

export async function findRecruiterSignupConflict(
  db: RecruiterSignupLookup,
  data: SignupIdentity,
): Promise<boolean> {
  const email = data.email.toLowerCase();
  const userHit = await db.user.findFirst({
    where: { OR: [{ email }, { phone: data.phone }] },
    select: { id: true },
  });
  if (userHit) return true;

  if (data.rccm) {
    const rccm = normalizeRegistryIdentifier(data.rccm);
    const rccmHit = await db.company.findFirst({ where: { rccm }, select: { id: true } });
    if (rccmHit) return true;
  }
  if (data.niu) {
    const niu = normalizeRegistryIdentifier(data.niu);
    const niuHit = await db.company.findFirst({ where: { niu }, select: { id: true } });
    if (niuHit) return true;
  }
  return false;
}
