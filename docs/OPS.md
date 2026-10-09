# Exploitation (SSL, sauvegardes, déploiement)

Hors du dépôt Git : certificats TLS et backups sont gérés sur l'hébergeur. Ce fichier décrit le minimum attendu.

## SSL / TLS

- Terminer TLS sur le reverse proxy (Caddy, Nginx, Traefik) ou la plateforme (Vercel / load balancer).
- Forcer HTTPS ; l'app envoie déjà `Strict-Transport-Security` via les en-têtes Next.
- Renouvellement Let's Encrypt automatique recommandé.

## Sauvegardes PostgreSQL

Exemple quotidien (cron sur le VPS) :

```bash
pg_dump "$DATABASE_URL" -Fc -f "/backups/rh_platform-$(date +%F).dump"
find /backups -name 'rh_platform-*.dump' -mtime +14 -delete
```

- Conserver au moins 14 jours, hors machine de prod si possible.
- Tester une restauration chaque trimestre.

## Déploiement Docker

```bash
# Infra locale (Postgres + Redis)
docker compose up -d

# App + infra (staging)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Variables obligatoires : `AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, clés paiement / e-mail selon l'environnement.

## Worker notifications

```bash
npm run jobs:notifications
```

Doit tourner en continu (systemd / second conteneur) dès que Redis est utilisé en prod.
