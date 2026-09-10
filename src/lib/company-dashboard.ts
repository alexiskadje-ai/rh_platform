import { db } from "@/lib/db";
import { addCalendarDays, doualaYmd, toDateOnly } from "@/lib/leave";

export async function getCompanyDashboard(companyId: string) {
  const today = doualaYmd();
  const fromYmd = addCalendarDays(today, -29);
  const fromDate = toDateOnly(fromYmd);
  const now = new Date();

  const [
    activeOffers,
    pendingApps,
    upcomingInterviewsCount,
    activeEmployees,
    pendingLeaves,
    upcomingInterviews,
    dailyRows,
  ] = await Promise.all([
    db.jobOffer.count({ where: { companyId, status: "OPEN" } }),
    db.application.count({
      where: { jobOffer: { companyId }, status: "RECEIVED" },
    }),
    db.interview.count({
      where: {
        scheduledAt: { gte: now },
        application: { jobOffer: { companyId } },
      },
    }),
    db.employee.count({
      where: { companyId, user: { status: "ACTIVE" } },
    }),
    db.leaveRequest.findMany({
      where: { status: "PENDING", employee: { companyId } },
      include: { employee: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    db.interview.findMany({
      where: {
        scheduledAt: { gte: now },
        application: { jobOffer: { companyId } },
      },
      include: {
        application: {
          include: {
            candidate: { include: { user: true } },
            jobOffer: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    db.$queryRaw<{ day: string; count: number }[]>`
      SELECT to_char((timezone('Africa/Douala', a."createdAt"))::date, 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "Application" a
      INNER JOIN "JobOffer" j ON j.id = a."jobOfferId"
      WHERE j."companyId" = ${companyId}
        AND a."createdAt" >= ${fromDate}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const byDay = new Map(
    dailyRows.map((row) => [String(row.day).slice(0, 10), Number(row.count)]),
  );
  const applications30d: { day: string; count: number }[] = [];
  let cursor = fromYmd;
  while (cursor <= today) {
    applications30d.push({ day: cursor, count: byDay.get(cursor) ?? 0 });
    cursor = addCalendarDays(cursor, 1);
  }

  return {
    activeOffers,
    pendingApps,
    upcomingInterviewsCount,
    activeEmployees,
    pendingLeaves,
    upcomingInterviews,
    applications30d,
  };
}
