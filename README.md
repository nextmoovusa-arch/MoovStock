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
- ✅ **Sprint 3** — Supplies (pochettes/étiquettes/encre) + mouvements, décrémentation auto depuis DailyLog, alertes RESTOCK_NOW/LOW_STOCK, vue admin agrégée.
- ✅ **Sprint 4** — Trésorerie complète (Transaction multi-comptes, cash réel, paiements groupés revendeurs) + Analytics (CA & profit 12 mois, top catégories, par revendeur).

### Algo rachat

```
avgDaily       = sum(pouchesUsed | labelsUsed sur 7 j) / 7
threshold      = avgDaily × (restockLeadDays + safetyMarginDays)   # ou override manuel
needsRestock   = quantity ≤ threshold
critical       = quantity / avgDaily < 1   # moins d'1 jour de stock
```

La consommation est décrémentée automatiquement quand un revendeur enregistre sa saisie quotidienne : le delta entre l&apos;ancienne et la nouvelle valeur crée un `SupplyMovement` sur le premier supply actif du type correspondant.

### Trésorerie

```
cashByAccount[a] = sum(signedAmount(tx) where tx.account = a)
signedAmount(tx) = +tx.amount si INCOME, -tx.amount sinon
totalCash        = sum(cashByAccount)
cashRéel         = totalCash - sum(Sale.resellerPayout where paymentStatus = PENDING)
```

Quand tu cliques « Payer » sur la page `/finance/debts` :
- Toutes les `Sale` PENDING du revendeur passent à `PAID_TO_RESELLER`
- 1 `Transaction` `RESELLER_PAYOUT` par vente est créée, liée à la `Sale` (traçabilité)
- Supprimer la transaction repasse la vente en PENDING

### Extraction vers un repo séparé

```bash
# Crée d'abord le repo vide sur GitHub (ex: nextmoovusa-arch/moovstock)
git subtree split --prefix=moovstock -b moovstock-export
git push git@github.com:nextmoovusa-arch/moovstock.git moovstock-export:main
```

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
