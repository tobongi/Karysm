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

## API Routes (toutes fonctionnelles ✅)
```
# Auth
POST /api/auth/otp/send          — Envoi OTP (in-memory, DEMO_OTP=1234 en dev)
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
CRUD /api/provider/services       — Gestion services
PUT  /api/provider/availability   — Gestion disponibilités

# Autres
POST /api/reviews                 — Poster un avis
POST /api/favorites/:providerId   — Toggle favori
GET  /api/categories              — Liste catégories (avec count services)
GET  /api/admin/stats, /providers, /bookings — Admin
```

## Écrans Mobile (expo-router) — État mars 2026

### Connectés à l'API ✅
```
app/index.tsx                    → Redirect (auth check)
app/onboarding.tsx               → 3 slides swipeable
app/auth/login.tsx               → Phone + OTP (API connecté)
app/auth/register.tsx            → Nom + OTP (API connecté)
app/(tabs)/index.tsx             → Explorer: search, grille catégories, cards providers (API /search)
app/(tabs)/bookings.tsx          → Réservations upcoming/past (API /bookings/mine)
app/(tabs)/profile.tsx           → Profil + menu prestataire (switch rôle)
app/provider/[slug].tsx          → Profil public complet (API /search/providers/:slug)
app/booking/[providerId].tsx     → Flow 5 étapes + modal succès (API /bookings POST)
app/booking/detail/[id].tsx      → Détail + actions statut + timeline (API /bookings/:id)
```

### Scaffoldés (UI seulement, pas connectés)
```
app/(tabs)/messages.tsx          → Placeholder notifications
app/provider-dashboard/services.tsx    → Mock data
app/provider-dashboard/availability.tsx → Mock data
app/provider-dashboard/earnings.tsx    → Mock data
```

### À créer
```
app/request/create.tsx           → Créer demande beauté (mode Upwork)
app/request/[id].tsx             → Détail demande + propositions
app/conversation/[id].tsx        → Chat client ↔ provider
app/wallet/index.tsx             → Portefeuille + solde
app/settings/edit-profile.tsx    → Modifier profil
```

## Fichiers clés
```
apps/mobile/src/theme/colors.ts       — Design tokens (violet, terracotta, accent)
apps/mobile/src/lib/api.ts            — Client API (auto-refresh token, redirect login sur 401)
apps/mobile/src/lib/auth-context.tsx   — Auth context (login/logout, AsyncStorage)
apps/mobile/src/lib/alert.ts          — showAlert/showConfirm cross-platform (web + native)
apps/api/src/app.ts                   — Express app (routes, middleware, CORS)
apps/api/src/middleware/auth.ts       — JWT auth + generateToken + generateRefreshToken
apps/api/src/middleware/error.ts      — Error handler + asyncHandler wrapper
apps/api/src/lib/errors.ts            — AppError, NotFoundError, ValidationError, etc.
apps/api/src/schemas/index.ts         — Zod schemas pour toutes les routes
packages/shared/src/utils.ts          — normalizePhone, slugify, formatCurrency, haversine, canTransitionBooking
packages/shared/src/constants.ts      — BOOKING_STATUS_TRANSITIONS, CITIES, CURRENCIES, COLORS
```

## Dev
| Commande | Action |
|----------|--------|
| `pnpm install` | Installer les deps |
| `cd apps/api && pnpm exec prisma generate --schema=../../packages/db/prisma/schema.prisma` | Générer Prisma client (utiliser Prisma 6 depuis apps/api, PAS le global qui est v7) |
| `cd apps/api && pnpm exec prisma db push --schema=../../packages/db/prisma/schema.prisma` | Push schema |
| `cd apps/api && pnpm exec prisma db seed --schema=../../packages/db/prisma/schema.prisma` | Seed |
| `cd apps/api && pnpm dev` | API sur port 3001 |
| `cd apps/mobile && pnpm web` | Webapp sur port 8081 |
| `cd apps/mobile && npx expo start --web --clear` | Webapp avec cache vidé |
| `cd apps/admin && pnpm dev` | Admin sur port 3002 |

### Dev ports
- API: 3001
- Webapp/Mobile: 8081
- Admin: 3002

### Test user
- Phone: `+243812340000` / OTP: `1234`
- 7 providers seed dans Kinshasa (5), Douala (1), Libreville (1)

### ⚠️ Notes techniques importantes
- **Prisma version** : v7 installé globalement MAIS le projet utilise v6. Toujours lancer prisma depuis `apps/api` avec `pnpm exec prisma`
- **Alert.alert** ne marche PAS sur web → utiliser `showAlert()` / `showConfirm()` de `src/lib/alert.ts`
- **priceMax peut être null** — toujours vérifier avant `.toLocaleString()`
- Auth: OTP in-memory store (pas Redis encore), DEMO_OTP=1234 en dev
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

## Phasage MVP (mis à jour)
1. **Phase 1** ✅ — Core booking loop (webapp fonctionnelle, auth, search, booking, detail)
2. **Phase 1B** 🔄 — Register prestataire + upload images (Cloudinary) + provider dashboard connecté
3. **Phase 2** — Beauty Requests (mode Upwork) + Messaging + Paiements MBiyo + Escrow
4. **Phase 3** — Notifications (WhatsApp + Push) + Admin dashboard + KYC + Reviews UI
5. **Phase 4** — AI features (style matching, try-on) + Import Instagram/TikTok + Subscriptions

## Documents de référence
- `TOKOSS_MARKET_STUDY.md` — Étude de marché complète ($17B+ TAM, 8 pays analysés)
- `TOKOSS_TECH_SPEC.md` — Spécifications techniques complètes (modèles, API, écrans, paiements, AI)
