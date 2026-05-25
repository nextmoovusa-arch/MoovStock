# MoovStock

Gestion d'un réseau de revendeurs Vinted : articles, ventes, profit, et (sprints à venir) consommables, objectifs/alertes, trésorerie.

**Stack** : Next.js 14 · TypeScript · Tailwind · Prisma · PostgreSQL (Neon) · Clerk · Vercel

---

## Espaces

- **Admin** (`/dashboard`, `/resellers`, `/finance`, `/supplies`) — vue globale du réseau.
- **Revendeur** (`/my/items`, `/my/sales`, `/my/daily-log`) — gestion de son stock et de ses ventes.

Le **premier compte inscrit** devient automatiquement `ADMIN`. Les suivants sont `RESELLER`. Tu peux ajuster directement en BDD ou via `prisma studio`.

---

## Setup

### 1. Cloner et installer

```bash
cd moovstock
npm install
cp .env.example .env.local
```

### 2. Neon (PostgreSQL)

1. Crée un projet sur [console.neon.tech](https://console.neon.tech).
2. Onglet **Connection string** :
   - **Pooled** (avec `pgbouncer=true`) → `DATABASE_URL`
   - **Direct** → `DIRECT_URL` (utilisée par Prisma pour les migrations)
3. Colle les 2 URLs dans `.env.local`.

### 3. Clerk (Auth)

1. Crée une application sur [dashboard.clerk.com](https://dashboard.clerk.com).
2. Onglet **API Keys** → copie :
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Onglet **Webhooks** → **Add Endpoint** :
   - URL : `https://<ton-domaine>/api/webhooks/clerk` (en local : utilise `ngrok` ou skip — `getOrCreateDbUser` crée le user à la volée au premier login)
   - Events : `user.created`, `user.updated`, `user.deleted`
   - Copie le **Signing Secret** → `CLERK_WEBHOOK_SECRET`

### 4. Initialiser la BDD

```bash
npm run db:push       # Pousse le schéma sur Neon (dev rapide)
# ou
npm run db:migrate    # Crée une vraie migration
```

### 5. Lancer

```bash
npm run dev
```

Ouvre `http://localhost:3000` → tu seras redirigé vers `/sign-in`. Crée ton compte → tu es admin.

---

## Déploiement Vercel

1. Push ce dossier dans un repo (ou utilise le monorepo parent).
2. Sur [vercel.com](https://vercel.com) → **New Project** → sélectionne le repo.
3. **Root Directory** : `moovstock`.
4. **Environment Variables** : recopie tout ce qui est dans `.env.local`.
5. Deploy. Ensuite met à jour l'URL du webhook Clerk vers le domaine Vercel.

---

## Roadmap

- ✅ **Sprint 1** — Auth Clerk, multi-rôles, CRUD articles + ventes, calcul profit.
- ✅ **Sprint 2** — DailyLog, objectifs par revendeur, alertes (inactivité, objectif manqué, incohérence stock), édition revendeur, cron quotidien.
- ⏳ **Sprint 3** — Stock consommables (pochettes, étiquettes) + algo de rachat intelligent.
- ⏳ **Sprint 4** — Trésorerie (cash, dépenses, dettes revendeurs) + dashboard analytics avec graphs.

### Cron Vercel (alertes automatiques)

Le fichier `vercel.json` programme un scan d'alertes chaque jour à 20:00 UTC sur `/api/cron/alerts`.
Ajoute `CRON_SECRET` dans les variables d'environnement Vercel (Vercel l'utilise comme `Authorization: Bearer ...`).

---

## Schéma de calcul du profit

```
grossProfit    = soldPrice - purchasePrice - (vintedFee + pouchCost + labelCost + otherCost)
resellerPayout = max(0, grossProfit) * user.commissionRate
netProfit      = grossProfit - resellerPayout     # part admin
```

`commissionRate` est défini par revendeur (défaut 0.5 = 50/50). Modifiable dans `User`.
