"use client";

import { useEffect, useId } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, options: { sitekey: string }) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
    __recaptchaReadyQueue?: Array<() => void>;
  }
}

function whenRecaptchaReady(callback: () => void) {
  if (window.grecaptcha?.render) {
    callback();
    return;
  }
  window.__recaptchaReadyQueue = window.__recaptchaReadyQueue ?? [];
  window.__recaptchaReadyQueue.push(callback);
  if (document.getElementById("recaptcha-v2-script")) return;

  window.onRecaptchaLoad = () => {
    window.__recaptchaReadyQueue?.forEach((fn) => fn());
    window.__recaptchaReadyQueue = [];
  };
  document.getElementById("recaptcha-v3-script")?.remove();
  const script = document.createElement("script");
  script.id = "recaptcha-v2-script";
  script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function RecaptchaField() {
  const rawId = useId();
  const boxId = `recaptcha-${rawId.replace(/:/g, "")}`;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

  useEffect(() => {
    if (!siteKey) return;
    whenRecaptchaReady(() => {
      const box = document.getElementById(boxId);
      if (!box || !window.grecaptcha?.render || box.dataset.rendered === "1") return;
      window.grecaptcha.render(box, { sitekey: siteKey });
      box.dataset.rendered = "1";
    });
  }, [boxId, siteKey]);

  if (!siteKey) {
    return (
      <p className="text-sm text-destructive">
        CAPTCHA non configuré (NEXT_PUBLIC_RECAPTCHA_SITE_KEY).
      </p>
    );
  }

  return <div id={boxId} className="g-recaptcha" />;
}
