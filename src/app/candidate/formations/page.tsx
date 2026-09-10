import { Role } from "@prisma/client";
import { requireCandidate } from "@/lib/dal";
import { MyCoursesPage } from "@/components/learning/my-courses-page";

export default async function CandidateCoursesPage() {
  const { user } = await requireCandidate();
  return <MyCoursesPage userId={user.id} role={Role.CANDIDATE} title="Espace candidat" />;
}
