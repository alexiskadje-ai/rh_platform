import type { Candidate, Certification, Education, Experience } from "@prisma/client";

type Profile = Candidate & {
  educations: Education[];
  experiences: Experience[];
  certifications?: Certification[];
};

export function profileCompletion(profile: Profile) {
  const checks = [
    Boolean(profile.photoUrl),
    Boolean(profile.headline?.trim()),
    Boolean(profile.bio?.trim()),
    profile.experiences.length > 0,
    profile.educations.length > 0,
    profile.skills.length >= 3,
    Boolean(profile.cvUrl),
    Boolean(profile.availability),
  ];
  const done = checks.filter(Boolean).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    done,
    total: checks.length,
    canApply: profile.skills.length >= 3 && Boolean(profile.cvUrl),
  };
}
