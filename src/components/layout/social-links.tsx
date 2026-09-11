import { COMPANY_SOCIALS } from "@/lib/company";
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

const ICONS = {
  Facebook: FacebookIcon,
  LinkedIn: LinkedInIcon,
  Instagram: InstagramIcon,
} as const;

export function SocialLinks({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  if (COMPANY_SOCIALS.length === 0) return null;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {COMPANY_SOCIALS.map((item) => {
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
                ? "border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                : "border-border text-primary hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
          </a>
        );
      })}
    </div>
  );
}
