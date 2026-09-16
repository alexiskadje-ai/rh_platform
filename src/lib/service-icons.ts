import { Briefcase, ClipboardList, GraduationCap, Handshake, Search, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CompanyService } from "@/lib/company";

export const SERVICE_ICONS: Record<CompanyService["slug"], LucideIcon> = {
  "gestion-administrative-du-personnel": ClipboardList,
  "audit-et-accompagnement-rh": Handshake,
  "mise-a-disposition-du-personnel": Users,
  "accompagnement-des-chercheurs-d-emploi": Search,
  "externalisation-du-recrutement-rpo": Briefcase,
  "formation-professionnelle-en-ligne": GraduationCap,
};
