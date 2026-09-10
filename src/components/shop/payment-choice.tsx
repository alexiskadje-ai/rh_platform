"use client";

import { useState } from "react";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { paymentMethodLabel } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as (keyof typeof PAYMENT_METHOD_LABELS)[];

function MethodIcon({ method }: { method: keyof typeof PAYMENT_METHOD_LABELS }) {
  if (method === "CARD") return <CreditCard className="size-5 text-accent" />;
  if (method === "BANK_TRANSFER") return <Banknote className="size-5 text-accent" />;
  return <Smartphone className="size-5 text-accent" />;
}

export function PaymentChoice() {
  const [method, setMethod] = useState<(keyof typeof PAYMENT_METHOD_LABELS) | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {METHODS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMethod(item)}
            className={`rounded-3xl border p-5 text-left transition-all duration-300 ${
              method === item
                ? "border-primary bg-primary text-primary-foreground shadow-lg"
                : "border-border/80 bg-card hover:-translate-y-0.5 hover:shadow-md"
            }`}
          >
            <MethodIcon method={item} />
            <p className="mt-3 font-display text-lg">{paymentMethodLabel(item)}</p>
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3">
          {method ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {paymentMethodLabel(method)} sera branché en Phase 7. Votre commande reste en
              attente jusqu&apos;à la confirmation du paiement.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              Choisissez un moyen de paiement. L&apos;encaissement n&apos;est pas encore actif.
            </p>
          )}
          <Button type="button" disabled>
            Payer maintenant — Phase 7
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
