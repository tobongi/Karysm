# Tokoss — Marketplace Beauté/Bien-être pour l'Afrique

## Vision
Tokoss = **Upwork + Instagram + Treatwell + Mobile Money + AI Beauty**
Marketplace du travail beauté en Afrique — PAS une simple app de booking.

Deux modes de réservation :
1. **Mode Local** (Treatwell) — Client cherche un pro, voit prix/dispo, réserve
2. **Mode Demande** (Upwork) — Client poste une demande avec photos, les pros répondent

App unique avec switch de rôle CLIENT ↔ PROVIDER (comme Uber driver/rider).

## Dossier projet
`C:\Users\glaib\tokoss\`

## Architecture
Monorepo Turborepo + pnpm.

### Packages
| Package | Rôle |
|---------|------|
| `@tokoss/shared` | Types, constantes, utils (phone, slug, haversine, booking state machine) |
| `@tokoss/db` | Prisma 6 schema + client (20 modèles) |
| `@tokoss/api` | Express REST API (auth, search, bookings, payments, admin) |
| `@tokoss/mobile` | Expo 52 + expo-router 4 — webapp d'abord, app native ensuite |
| `@tokoss/admin` | Next.js 14 + Tailwind dashboard admin (static export) |

### Stack
| Composant | Tech |
|-----------|------|
| Backend | Express + TypeScript |
| ORM | Prisma 6 (Railway PostgreSQL) |
| Frontend | Expo 52 + expo-router 4 + React Native Web |
| Admin | Next.js 14 + Tailwind (static export Netlify) |
| Auth | JWT + OTP SMS (DEMO_OTP=1234 en dev) |
| Paiement | MBiyo Pay — Phase 2 |
| Images | Cloudinary — Phase 2 |
| Notifs | WhatsApp (primary) + Push + SMS |

### Stratégie de lancement
**Webapp d'abord** (Expo Web) → testable via URL, itération rapide.
App native (Play Store / App Store) seulement après validation du product-market fit.
Android = 95% du marché en Afrique, priorité sur iOS.

## Design System

### Palette violet (mars 2026)
| Élément | Valeur |
|---------|--------|
| Mode | **Clair (light mode)** |
| Primary | `#7C3AED` (violet vif) |
| Primary dark | `#6D28D9` (violet profond) |
| Primary light | `#A78BFA` (lavande) |
| Primary ghost | `rgba(124,58,237,0.08)` |
| Accent | `#2D1B69` (deep purple — titres, headers) |
| Terracotta | `#E07A5F` (étoiles et prix UNIQUEMENT) |
| Mauve | `#C9668E` (badges/highlights subtils) |
| Background | `#FAF5FF` (off-white lavande léger) |
| Card | `#FFFFFF` |
| Text | `#1A1A1A` |
| Text secondary | `#6B7280` |
| Text muted | `#9CA3AF` |
| Border | `rgba(0,0,0,0.06)` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Star | `#E07A5F` (terracotta) |
| Fichier couleurs | `apps/mobile/src/theme/colors.ts` |

### Règles design
- Pas de rose, très peu de mauve — palette **violet + off-white lavande**
- Terracotta (#E07A5F) UNIQUEMENT pour étoiles et prix, jamais pour boutons/backgrounds
- Boutons CTA toujours violet (#7C3AED)
- Titres en accent deep purple (#2D1B69)
- Catégories en grille 3x2 (pas en scroll horizontal) avec icônes dans des carrés arrondis
- Cards provider avec mini galerie photo (2/3 de l'image + 2 petits slots)
- Vue web contrainte à max 430px centré (simule un mobile)
- `Alert.alert` ne marche PAS sur web → utiliser `src/lib/alert.ts` (showAlert/showConfirm)

## Modèles Prisma clés
- **User** — phone (unique), role (CLIENT/PROVIDER/ADMIN)
- **Provider** — 1:1 User, displayName, slug, city, lat/lng, isMobile, avgRating, status
- **ServiceCategory** — Coiffure, Ongles, Maquillage, Massage, Barber, Spa
- **Service** — providerId, categoryId, durationMin, priceMin/priceMax (Int, pas Decimal)
- **Availability** — providerId, dayOfWeek, startTime/endTime
- **AvailabilityException** — blocage ponctuel
- **Booking** — state machine: REQUESTED→CONFIRMED→DEPOSIT_PAID→IN_PROGRESS→COMPLETED
- **PaymentIntent** — bookingId, amount, method (MOMO/CASH), status
- **ProviderWallet** — availableBalance, pendingBalance
- **WalletTransaction** — historique wallet
- **Payout** — retrait vers mobile money
- **Review** — bookingId, rating 1-5, photos[], tags[]
- **PortfolioItem** — imageUrl, caption, serviceTag
- **Favorite** — userId ↔ providerId
- **TransportRequest** — WhatsApp/InDrive/Yango

Schema: `packages/db/prisma/schema.prisma`
Seed: `packages/db/prisma/seed.ts` (7 providers, 6 catégories, 14 services, 1 admin, 1 test client)

## URLs Production
| Service | URL |
|---------|-----|
| **Webapp** | https://tokoss-kappa.vercel.app |
| **API** | https://tokoss-production.up.railway.app |
| **API Health** | https://tokoss-production.up.railway.app/api/health |
| **GitHub** | https://github.com/tobongi/tokoss |
| **Domaine (à configurer)** | tokoss.app (Cloudflare) |

## API Routes (toutes fonctionnelles ✅)
```
# Auth
POST /api/auth/otp/send          — Envoi OTP (DEMO_OTP env var, 1234 en dev/staging)
POST /api/auth/otp/verify         — Vérification OTP → JWT + refresh token
POST /api/auth/register           — Inscription (name + phone + OTP)
POST /api/auth/refresh            — Refresh token
POST /api/auth/logout             — Révocation refresh token

# Search
GET  /api/search                  — Providers (q, category, lat/lng, radius, rating, price, sort, pagination)
GET  /api/search/providers/:slug  — Profil complet provider (services, availability, portfolio)

# Bookings
POST /api/bookings                — Créer réservation (conflict detection, deposit 30%)
GET  /api/bookings/mine           — Mes réservations (role=client|provider, status=upcoming|past)
GET  /api/bookings/:id            — Détail réservation
PATCH /api/bookings/:id/status    — Transition statut (state machine validée via canTransitionBooking)

# Provider
POST /api/provider/register       — Devenir prestataire
GET  /api/provider/profile        — Mon profil pro
PUT  /api/provider/profile        — Modifier profil
CRUD /api/provider/services       — Gestion services (+ socialLinks[] pour portfolio)
PUT  /api/provider/availability   — Gestion disponibilités

# Beauty Requests (mode Upwork)
POST /api/requests                — Créer une demande beauté
GET  /api/requests                — Browse demandes ouvertes (filtré ville/catégorie)
GET  /api/requests/mine           — Mes demandes (client)
GET  /api/requests/:id            — Détail demande + propositions
PATCH /api/requests/:id           — Modifier demande
DELETE /api/requests/:id          — Annuler demande
POST /api/requests/:id/proposals  — Pro envoie proposition
GET  /api/requests/:id/proposals  — Liste propositions
PATCH /api/requests/:id/accept/:proposalId — Accepter → crée booking auto

# Upload (Cloudinary)
POST /api/upload/image            — Upload image (base64, max 10MB)
POST /api/upload/avatar           — Upload avatar (crop face, 400x400)
POST /api/upload/video            — Upload vidéo (max 50MB, compression auto)

# Autres
POST /api/reviews                 — Poster un avis
POST /api/favorites/:providerId   — Toggle favori
GET  /api/categories              — Liste catégories (avec count services)
GET  /api/admin/stats, /providers, /bookings — Admin
```

## Écrans Mobile (expo-router) — Tous connectés à l'API ✅
```
# Auth & Onboarding
app/index.tsx                    → Redirect (auth check)
app/onboarding.tsx               → 3 slides swipeable
app/auth/login.tsx               → Phone + OTP
app/auth/register.tsx            → Nom + OTP

# Tabs principaux
app/(tabs)/index.tsx             → Explorer: search, grille catégories 3x2, cards providers, banner demande
app/(tabs)/bookings.tsx          → Réservations upcoming/past
app/(tabs)/messages.tsx          → Notifications / feed d'activité smart
app/(tabs)/profile.tsx           → Profil + avatar upload + menu prestataire (switch rôle)

# Provider
app/provider/[slug].tsx          → Profil public (services, dispo, stats, WhatsApp, badge vérifié)

# Booking
app/booking/[providerId].tsx     → Flow 5 étapes + modal succès 🎉
app/booking/detail/[id].tsx      → Détail + actions statut + timeline + WhatsApp

# Register prestataire
app/provider-register.tsx        → 3 étapes (identité + avatar, localisation, contact + Instagram + TikTok)

# Dashboard prestataire
app/provider-dashboard/services.tsx    → CRUD modal + photos/vidéos portfolio + liens Instagram/TikTok
app/provider-dashboard/availability.tsx → Toggle jours + horaires par 30min
app/provider-dashboard/earnings.tsx    → Solde, stats, historique bookings

# Beauty Requests (mode Upwork)
app/request/create.tsx           → Créer demande (titre, catégorie, photos + selfie, budget, date, lieu)
app/request/[id].tsx             → Détail + propositions reçues/envoyées
app/request/browse.tsx           → Marketplace demandes ouvertes (côté provider)
```

### À créer
```
app/conversation/[id].tsx        → Chat client ↔ provider
app/wallet/index.tsx             → Portefeuille + solde
app/settings/edit-profile.tsx    → Modifier profil
```

## Fichiers clés
```
# Mobile
apps/mobile/src/theme/colors.ts       — Design tokens (violet, terracotta, accent)
apps/mobile/src/lib/api.ts            — Client API (auto-refresh, redirect login, prod URL Railway)
apps/mobile/src/lib/auth-context.tsx   — Auth context (login/logout/updateUser, AsyncStorage)
apps/mobile/src/lib/alert.ts          — showAlert/showConfirm cross-platform (web + native)
apps/mobile/src/lib/upload.ts         — pickImage, pickMedia, pickAndUploadImage/Avatar/Media (Cloudinary)

# API
apps/api/src/app.ts                   — Express app (routes, CORS via CORS_ORIGINS env var)
apps/api/src/middleware/auth.ts       — JWT auth + generateToken + generateRefreshToken
apps/api/src/middleware/error.ts      — Error handler + asyncHandler wrapper
apps/api/src/lib/errors.ts            — AppError, NotFoundError, ValidationError, etc.
apps/api/src/lib/cloudinary.ts        — Upload image/avatar/video vers Cloudinary (lazy-loaded)
apps/api/src/schemas/index.ts         — Zod schemas pour toutes les routes
apps/api/src/routes/request.routes.ts — Beauty Requests + Proposals API

# Shared
packages/shared/src/utils.ts          — normalizePhone, slugify, formatCurrency, haversine, canTransitionBooking
packages/shared/src/constants.ts      — BOOKING_STATUS_TRANSITIONS, CITIES, CURRENCIES, COLORS

# Deploy
railway.toml                          — Config déploiement Railway (nixpacks + tsx)
.railwayignore                        — Exclut mobile/admin du build Railway
```

## Dev
| Commande | Action |
|----------|--------|
| `pnpm install` | Installer les deps |
| `cd apps/api && pnpm exec prisma generate --schema=../../packages/db/prisma/schema.prisma` | Générer Prisma client (Prisma 6 depuis apps/api, PAS le global v7) |
| `cd apps/api && pnpm exec prisma db push --schema=../../packages/db/prisma/schema.prisma` | Push schema |
| `cd apps/api && pnpm exec prisma db seed --schema=../../packages/db/prisma/schema.prisma` | Seed |
| `cd apps/api && pnpm dev` | API locale port 3001 |
| `cd apps/mobile && pnpm web` | Webapp locale port 8081 |
| `cd apps/mobile && npx expo start --web --clear` | Webapp avec cache vidé |
| `cd apps/admin && pnpm dev` | Admin port 3002 |

### Déploiement
| Commande | Action |
|----------|--------|
| `git push` | Auto-deploy API sur Railway |
| `cd apps/mobile && npx expo export --platform web && echo '{"rewrites":[{"source":"/(.*)", "destination":"/index.html"}]}' > dist/vercel.json && cd dist && npx vercel --prod --yes` | Deploy webapp sur Vercel |

### Dev ports
- API locale: 3001
- Webapp locale: 8081
- Admin: 3002

### Test user
- Phone: `+243812340000` / OTP: `1234`
- 7 providers seed dans Kinshasa (5), Douala (1), Libreville (1)

### Variables d'environnement (Railway)
```
DATABASE_URL=postgresql://...
JWT_SECRET=tokoss-prod-jwt-secret-2026
NODE_ENV=production
DEMO_OTP=1234
CORS_ORIGINS=https://tokoss-kappa.vercel.app,https://tokoss.app,https://www.tokoss.app
CLOUDINARY_CLOUD_NAME=dppop1fid
CLOUDINARY_API_KEY=282719287638618
CLOUDINARY_API_SECRET=kxt7-bJyNVZMvGSvkPOkfrQV2IA
```

### ⚠️ Notes techniques importantes
- **Prisma version** : v7 global MAIS projet utilise v6. Toujours `pnpm exec prisma` depuis apps/api
- **Alert.alert** ne marche PAS sur web → utiliser `showAlert()` / `showConfirm()` de `src/lib/alert.ts`
- **priceMax peut être null** — toujours vérifier avant `.toLocaleString()`
- **CORS** : configurable via `CORS_ORIGINS` env var (séparé par virgules)
- **OTP** : utilise `DEMO_OTP` env var si définie, sinon génère aléatoire (nécessite SMS)
- **Cloudinary** : lazy-loaded pour éviter crash lodash en dev. Upload images/vidéos avec compression auto
- **Upload vidéo** : max 50MB, Cloudinary compresse et génère thumbnail auto
- Search: Haversine distance en JS (pas PostGIS au MVP)
- Booking state machine: transitions validées via `canTransitionBooking()`
- App unique avec role switch (CLIENT ↔ PROVIDER), pas deux apps

## Monnaies
- RDC: CDF (Franc Congolais), symbole FC
- Cameroun/Gabon: XAF (Franc CFA), symbole FCFA
- Prix stockés en Int (pas de décimales)

## Villes cibles
- **Phase 1** : Abidjan (Côte d'Ivoire) — premier marché, zéro compétition en Francophone
- **Phase 2** : Dakar (Sénégal) — Wave à 90%, même zone FCFA
- **Phase 3** : Lagos (Nigeria), Nairobi (Kenya) — mega-markets
- Kinshasa (RDC), Douala (Cameroun), Libreville (Gabon) — dans le seed actuel

## Phasage MVP (mis à jour mars 2026)
1. **Phase 1** ✅ — Core booking loop + Beauty Requests + Provider dashboard + Upload
2. **Phase 1C** ✅ — Déploiement production (Railway API + Vercel webapp)
3. **Phase 2** — SMS OTP réel (Africa's Talking) + Messaging + Paiements MBiyo + Escrow
4. **Phase 3** — Notifications (WhatsApp + Push) + Admin dashboard + KYC + Reviews UI + Map
5. **Phase 4** — AI skin analysis (Monk Scale, peau noire) + AI hair analysis (4A-4C afro) + Import Instagram/TikTok

## Le vrai différenciateur (Phase 4)
PAS le mode Upwork. C'est l'**AI beauty analysis pour peau noire et cheveux afro** :
- **Skin analysis** via selfie : hydratation, sébum, hyperpigmentation, sous-ton (Monk Skin Tone Scale)
- **Hair analysis** via photo : type 4A-4C, porosité, densité, sécheresse (Andre Walker + custom)
- Datasets gratuits : Fitzpatrick17k, DDI (Stanford), SCIN (Google), Monk Scale
- Stratégie : construire un dataset propriétaire à partir des selfies utilisatrices
- Aucune IA complète pour cheveux afro n'existe encore → opportunité massive

## Documents de référence
- `TOKOSS_MARKET_STUDY.md` — Étude de marché complète ($17B+ TAM, 8 pays analysés)
- `TOKOSS_TECH_SPEC.md` — Spécifications techniques complètes (modèles, API, écrans, paiements, AI)
