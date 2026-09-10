This is a [Next.js](https://nextjs.org) project for **Pôle RH** — plateforme de recrutement, formation et gestion RH.

## Prérequis

- Node.js 20.9+
- Docker Desktop (PostgreSQL 15 on port **5434**, Redis 7)

## Démarrage local

```bash
docker compose up -d
copy .env.example .env
```

Renseignez `AUTH_SECRET` et `NEXTAUTH_SECRET` (même valeur) et `ADMIN_PASSWORD` dans `.env`, puis :

```bash
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). Compte admin : `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

En développement, le lien e-mail et le code SMS s'affichent sur `/verify` (ils sont aussi loggés dans le terminal).
