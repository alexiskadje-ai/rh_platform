import { SERVICE_AUDIENCE_LABELS, SERVICE_AUDIENCES } from "@/lib/nav";
import { SITE_ICON_NAMES } from "@/lib/site-content";
import { fieldClass } from "@/lib/ui";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function SiteServiceForm({
  action,
  service,
}: {
  action: (formData: FormData) => void | Promise<void>;
  service?: {
    id: string;
    title: string;
    description: string;
    icon: string;
    audience: "PUBLIC" | "CANDIDATE" | "RECRUITER" | "ALL";
    isActive: boolean;
    isFeatured: boolean;
  };
}) {
  return (
    <form action={action} className="grid gap-3">
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <label className="text-sm font-medium">
        Titre
        <input name="title" required defaultValue={service?.title} className={`${fieldClass} mt-1`} />
      </label>
      <label className="text-sm font-medium">
        Description
        <Textarea name="description" required defaultValue={service?.description} className="mt-1" />
      </label>
      <label className="text-sm font-medium">
        Icône
        <select name="icon" defaultValue={service?.icon ?? "Briefcase"} className={`${fieldClass} mt-1`}>
          {SITE_ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Audience
        <select name="audience" defaultValue={service?.audience ?? "PUBLIC"} className={`${fieldClass} mt-1`}>
          {SERVICE_AUDIENCES.map((audience) => (
            <option key={audience} value={audience}>
              {SERVICE_AUDIENCE_LABELS[audience]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={service?.isActive ?? true} />
        Visible
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isFeatured" defaultChecked={service?.isFeatured ?? false} />
        Mettre en avant
      </label>
      <SubmitButton>{service ? "Enregistrer" : "Ajouter le service"}</SubmitButton>
    </form>
  );
}
