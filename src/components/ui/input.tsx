import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/lib/ui";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        fieldClass,
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary",
        className,
      )}
      {...props}
    />
  );
}
