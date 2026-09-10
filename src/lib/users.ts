import { Role } from "@prisma/client";

export function splitContactName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Contact", lastName: "RH" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

export function normalizeIdentifier(identifier: string) {
  const value = identifier.trim();
  if (value.includes("@")) {
    return { email: value.toLowerCase() };
  }
  const digits = value.replace(/[\s.-]/g, "");
  const phone = digits.startsWith("+237")
    ? digits
    : digits.startsWith("237")
      ? `+${digits}`
      : `+237${digits}`;
  return { phone };
}

export function fieldErrorsFromZod(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}) {
  return error.flatten().fieldErrors;
}

export function isCandidateReady(user: {
  role: Role;
  isVerified: boolean;
  status: string;
}) {
  return user.role === Role.CANDIDATE && user.isVerified && user.status === "ACTIVE";
}

export function isRecruiterReady(user: { role: Role; status: string }) {
  return user.role === Role.RECRUITER && user.status === "ACTIVE";
}
