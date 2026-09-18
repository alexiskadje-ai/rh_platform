"use client";

import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const OTP_LENGTH = 6;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function OtpInput({
  id,
  name = "code",
  label,
  autoFocus = false,
}: {
  id?: string;
  name?: string;
  label: string;
  autoFocus?: boolean;
}) {
  const generatedId = useId();
  const baseId = id ?? generatedId;
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ""));
  const boxes = useRef<Array<HTMLInputElement | null>>([]);
  const hidden = useRef<HTMLInputElement | null>(null);

  function focusBox(index: number) {
    const next = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    const el = boxes.current[next];
    el?.focus();
    el?.select();
  }

  function write(next: string[], focusIndex?: number) {
    setDigits(next);
    if (hidden.current) hidden.current.value = next.join("");
    if (focusIndex !== undefined) {
      queueMicrotask(() => focusBox(focusIndex));
    }
  }

  function onBoxInput(index: number, raw: string) {
    const cleaned = digitsOnly(raw);
    if (cleaned.length > 1) {
      const next = Array.from({ length: OTP_LENGTH }, (_, i) => cleaned[i] ?? "");
      write(next, Math.min(cleaned.length, OTP_LENGTH - 1));
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      if (hidden.current) hidden.current.value = next.join("");
      return next;
    });
    if (cleaned) focusBox(index + 1);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      setDigits((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
          queueMicrotask(() => focusBox(index - 1));
        }
        if (hidden.current) hidden.current.value = next.join("");
        return next;
      });
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = digitsOnly(event.clipboardData.getData("text"));
    if (pasted.length <= 1) return;
    event.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? "");
    write(next, Math.min(pasted.length, OTP_LENGTH - 1));
  }

  const boxClass = cn(
    "h-12 min-w-0 flex-1 rounded-xl border border-border/80 bg-card text-center text-lg font-semibold tabular-nums text-primary outline-none transition-all",
    "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25",
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={`${baseId}-0`}>{label}</Label>
      <input ref={hidden} type="hidden" name={name} required defaultValue="" />
      <div className="flex items-center gap-2 sm:gap-3" role="group" aria-label={label}>
        <div className="flex flex-1 gap-1.5 sm:gap-2">
          {digits.slice(0, 3).map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                boxes.current[index] = node;
              }}
              id={`${baseId}-${index}`}
              value={digit}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              autoFocus={autoFocus && index === 0}
              maxLength={index === 0 ? OTP_LENGTH : 1}
              aria-label={`Chiffre ${index + 1} sur ${OTP_LENGTH}`}
              className={boxClass}
              onChange={(event) => onBoxInput(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              onPaste={onPaste}
              onFocus={(event) => event.currentTarget.select()}
            />
          ))}
        </div>
        <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-border sm:block" aria-hidden />
        <div className="flex flex-1 gap-1.5 sm:gap-2">
          {digits.slice(3).map((digit, offset) => {
            const index = offset + 3;
            return (
              <input
                key={index}
                ref={(node) => {
                  boxes.current[index] = node;
                }}
                id={`${baseId}-${index}`}
                value={digit}
                inputMode="numeric"
                autoComplete="off"
                maxLength={1}
                aria-label={`Chiffre ${index + 1} sur ${OTP_LENGTH}`}
                className={boxClass}
                onChange={(event) => onBoxInput(index, event.target.value)}
                onKeyDown={(event) => onKeyDown(index, event)}
                onPaste={onPaste}
                onFocus={(event) => event.currentTarget.select()}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
