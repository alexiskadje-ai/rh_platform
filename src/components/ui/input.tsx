import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/lib/ui";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}
