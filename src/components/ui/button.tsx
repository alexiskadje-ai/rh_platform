import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:-translate-y-px active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-[0_10px_24px_rgba(242,98,0,0.28)]",
        secondary:
          "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground",
        outline:
          "border border-border bg-transparent hover:border-accent hover:bg-accent hover:text-accent-foreground",
        accent:
          "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-[0_10px_24px_rgba(4,41,99,0.28)]",
        ghost: "hover:bg-accent/15 hover:text-accent",
        destructive: "bg-destructive text-white hover:bg-primary",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

export { buttonVariants };
