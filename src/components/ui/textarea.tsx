import type { TextareaHTMLAttributes } from "react";
import { fieldClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        fieldClass,
        "h-auto min-h-28 py-2.5 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
