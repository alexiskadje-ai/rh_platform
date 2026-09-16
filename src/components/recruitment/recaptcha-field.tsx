"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, options: { sitekey: string }) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

export function RecaptchaField() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

  useEffect(() => {
    if (!siteKey) return;
    document.getElementById("recaptcha-v3-script")?.remove();

    function renderWidget() {
      const box = document.getElementById("recaptcha-box");
      if (!box || !window.grecaptcha?.render || box.dataset.rendered === "1") return;
      window.grecaptcha.render(box, { sitekey: siteKey });
      box.dataset.rendered = "1";
    }

    window.onRecaptchaLoad = renderWidget;
    if (!document.getElementById("recaptcha-v2-script")) {
      const script = document.createElement("script");
      script.id = "recaptcha-v2-script";
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }
  }, [siteKey]);

  if (!siteKey) {
    return (
      <p className="text-sm text-destructive">
        CAPTCHA non configuré (NEXT_PUBLIC_RECAPTCHA_SITE_KEY).
      </p>
    );
  }

  return <div id="recaptcha-box" className="g-recaptcha" />;
}
