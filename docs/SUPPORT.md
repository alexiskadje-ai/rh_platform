# Plan de support et maintenance — PES-RH

## Niveaux

| Niveau | Délai indicatif | Exemples |
|--------|-----------------|----------|
| P1 — Bloquant prod | ≤ 4 h ouvrés | Site down, paiements cassés, fuite de données |
| P2 — Majeur | ≤ 1 jour ouvré | Inscription / login en panne pour un segment |
| P3 — Mineur | ≤ 3 jours ouvrés | Bug UI, contenu CMS, FAQ |
| P4 — Évolution | Sprint suivant | Nouvelles features (hors incident) |

## Canaux

- E-mail support : variable `SUPPORT_EMAIL` (ex. `support@pes-rh.net`).
- Widget chat public sur le site (base de connaissances + escalation).
- Fil **Conseiller RH** (pack Gold) : `/company/conseiller` ↔ `/admin/conseiller`.

## Maintenance

- Sauvegardes Postgres : voir `docs/OPS.md`.
- Mises à jour dépendances : CI (`tsc`, lint, Vitest) sur chaque PR.
- Secrets : jamais commités ; rotation `AUTH_SECRET`, clés MoMo/Stripe/Twilio.

## Escalade

1. Consulter `/admin/journal` et logs conteneur / hébergeur.
2. Vérifier Redis (notifications) et Postgres.
3. Contacter l'équipe technique avec référence d'incident + horodatage (Africa/Douala).
