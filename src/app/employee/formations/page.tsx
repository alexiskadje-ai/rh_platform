import { Role } from "@prisma/client";
import { requireEmployee } from "@/lib/dal";
import { MyCoursesPage } from "@/components/learning/my-courses-page";

export default async function EmployeeCoursesPage() {
  const { user } = await requireEmployee();
  return <MyCoursesPage userId={user.id} role={Role.EMPLOYEE} title="Espace employé" />;
}
