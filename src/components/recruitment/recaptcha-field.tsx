"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    grecaptcha?: { reset: (widgetId?: number) => void };
  }
}

export function RecaptchaField() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

  useEffect(() => {
    if (document.getElementById("recaptcha-v2-script")) return;
    const script = document.createElement("script");
    script.id = "recaptcha-v2-script";
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  if (!siteKey) {
    return (
      <p className="text-sm text-destructive">
        CAPTCHA non configuré (NEXT_PUBLIC_RECAPTCHA_SITE_KEY).
      </p>
    );
  }

  return <div className="g-recaptcha" data-sitekey={siteKey} />;
}
