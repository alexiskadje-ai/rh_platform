import {
  BookMarked,
  BookOpen,
  FileUser,
  GraduationCap,
  Mail,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { ProductType } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<ProductType, LucideIcon> = {
  livre: BookOpen,
  guide: BookMarked,
  modele_cv: FileUser,
  modele_lettre: Mail,
  formation_premium: GraduationCap,
};

export function ProductTypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = ICONS[type as ProductType] ?? Package;
  return <Icon className={cn("size-5", className)} aria-hidden />;
}
