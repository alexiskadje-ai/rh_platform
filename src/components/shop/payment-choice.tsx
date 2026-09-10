"use client";

import { useState } from "react";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { paymentMethodLabel } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as (keyof typeof PAYMENT_METHOD_LABELS)[];

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
            className={`rounded-2xl border p-4 text-left transition-colors ${
              method === item
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-muted"
            }`}
          >
            <p className="font-medium">{paymentMethodLabel(item)}</p>
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3">
          {method ? (
            <p className="text-sm text-muted-foreground">
              {paymentMethodLabel(method)} sera branché en Phase 7 (MoMo, Orange Money,
              carte ou virement). Votre commande reste en attente jusqu&apos;à la
              confirmation du paiement.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choisissez un moyen de paiement. L&apos;encaissement n&apos;est pas encore
              actif.
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
