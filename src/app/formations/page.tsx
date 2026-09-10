import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { formatCoursePrice } from "@/lib/learning";
import { COURSE_CATEGORIES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/layout/page-hero";
import { fieldClass } from "@/lib/ui";

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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16">
      <PageHero
        eyebrow="Académie"
        title="Formations"
        description="Parcours linéaires, quiz et certificat. Filtrez par catégorie puis inscrivez-vous depuis votre espace."
      />
      <form
        className="mt-10 grid gap-3 rounded-3xl border border-border/80 bg-card p-4 md:grid-cols-3 md:p-5"
        action="/formations"
      >
        <Input name="q" placeholder="Rechercher…" defaultValue={filters.q} />
        <select
          name="category"
          defaultValue={filters.category ?? ""}
          className={fieldClass}
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
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune formation disponible.</p>
        ) : (
          courses.map((course) => (
            <Link key={course.id} href={`/formations/${course.id}`} className="block">
              <Card className="h-full">
                <CardHeader>
                  <GraduationCap className="size-5 text-accent" />
                  <CardTitle className="mt-2 font-display text-2xl">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="line-clamp-3 leading-relaxed">{course.description}</p>
                  <p className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge>{course.category}</Badge>
                    <span>{formatCoursePrice(course.price)}</span>
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
