import { COMPANY_SOCIALS } from "@/lib/company";
import type { SocialLinks as SocialLinkMap } from "@/lib/site-content";
import { cn } from "@/lib/utils";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M14.5 8.5V6.8c0-.6.4-1 1.1-1h1.4V3h-2.3C12.3 3 11 4.5 11 6.7v1.8H9v2.8h2V21h3.2v-9.7h2.2l.6-2.8h-2.8z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M6.5 9.2H3.8V20h2.7V9.2zM5.15 4C4.2 4 3.5 4.7 3.5 5.6c0 .9.7 1.6 1.65 1.6s1.65-.7 1.65-1.6C6.8 4.7 6.1 4 5.15 4zM20.2 13.3c0-3.2-1.7-4.7-4-4.7-1.8 0-2.6 1-3.1 1.7V9.2H10.4c0 1.3 0 10.8 0 10.8h2.7v-6c0-.3 0-.6.1-.8.3-.6.9-1.3 1.9-1.3 1.3 0 1.8 1 1.8 2.5V20h2.7v-6.7z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zm8 1.8H8A3.2 3.2 0 0 0 4.8 8v8A3.2 3.2 0 0 0 8 19.2h8A3.2 3.2 0 0 0 19.2 16V8A3.2 3.2 0 0 0 16 4.8zM12 8.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zm4.55-2.85a.95.95 0 1 1-.95.95.95.95 0 0 1 .95-.95z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M14.7 10.3 21.4 3h-1.6l-5.8 6.4L9.3 3H3.2l7 9.7L3.2 21h1.6l6.2-6.8L14.7 21h6.1l-6.1-10.7zm-2.2 2.4-.7-1-5.6-7.6h2.4l4.5 6.2.7 1 5.9 8h-2.4l-4.8-6.6z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12.04 3C7.3 3 3.46 6.84 3.46 11.58c0 1.5.39 2.96 1.14 4.25L3 21l5.31-1.55a8.55 8.55 0 0 0 3.73.86h.01c4.74 0 8.58-3.84 8.58-8.58C20.63 6.84 16.78 3 12.04 3zm0 15.7h-.01a7.1 7.1 0 0 1-3.62-.99l-.26-.15-3.15.92.94-3.07-.17-.27a7.08 7.08 0 0 1-1.08-3.56c0-3.92 3.19-7.11 7.12-7.11 1.9 0 3.68.74 5.02 2.08a7.06 7.06 0 0 1 2.08 5.03c0 3.92-3.19 7.12-7.12 7.12zm3.9-5.32c-.21-.11-1.26-.62-1.45-.69-.2-.07-.34-.11-.48.11-.14.21-.55.69-.67.83-.12.14-.25.16-.46.05-.21-.11-.89-.33-1.7-1.05-.63-.56-1.05-1.25-1.17-1.46-.12-.21-.01-.32.1-.43.1-.1.21-.25.32-.37.11-.12.14-.21.21-.35.07-.14.04-.26-.02-.37-.05-.11-.48-1.16-.66-1.59-.17-.42-.35-.36-.48-.37h-.41c-.14 0-.37.05-.56.26-.2.21-.74.72-.74 1.76s.76 2.04.86 2.18c.11.14 1.49 2.28 3.61 3.2.5.22.9.35 1.2.45.51.16.97.14 1.33.08.41-.06 1.26-.51 1.44-.99.18-.48.18-.89.12-.99-.05-.1-.19-.16-.4-.27z" />
    </svg>
  );
}

const ICONS = {
  Facebook: FacebookIcon,
  LinkedIn: LinkedInIcon,
  Instagram: InstagramIcon,
  Twitter: TwitterIcon,
  WhatsApp: WhatsAppIcon,
} as const;

const NETWORKS = [
  ["facebook", "Facebook"],
  ["linkedin", "LinkedIn"],
  ["instagram", "Instagram"],
  ["twitter", "Twitter"],
  ["whatsapp", "WhatsApp"],
] as const;

export function SocialLinks({
  className,
  inverted = false,
  links,
}: {
  className?: string;
  inverted?: boolean;
  links?: SocialLinkMap;
}) {
  const items = links
    ? NETWORKS.flatMap(([key, label]) =>
        links[key] ? [{ label, href: links[key] as string }] : [],
      )
    : COMPANY_SOCIALS;
  if (items.length === 0) return null;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {items.map((item) => {
        const Icon = ICONS[item.label];
        return (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full border transition-colors",
              inverted
                ? "border-primary-foreground/20 text-primary-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground"
                : "border-border text-primary hover:border-accent hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
          </a>
        );
      })}
    </div>
  );
}
