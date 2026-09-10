import Link from "next/link";
import { db } from "@/lib/db";
import { formatCoursePrice } from "@/lib/learning";
import { COURSE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function PublicCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const filters = await searchParams;
  const courses = await db.course.findMany({
    where: {
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.category ? { category: filters.category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-semibold">Formations</h1>
      <form className="mt-6 grid gap-3 md:grid-cols-3" action="/formations">
        <Input name="q" placeholder="Rechercher…" defaultValue={filters.q} />
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className="h-11 rounded-xl border border-input bg-card px-3 text-sm"
        >
          <option value="">Toutes les catégories</option>
          {COURSE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button type="submit">Filtrer</Button>
      </form>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune formation disponible.</p>
        ) : (
          courses.map((course) => (
            <Link key={course.id} href={`/formations/${course.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="line-clamp-3">{course.description}</p>
                  <p className="mt-3">
                    {course.category} · {formatCoursePrice(course.price)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
