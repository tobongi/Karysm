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
| `@tokoss/db` | Prisma 6 schema + client (24 modèles) |
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
| Images | Cloudinary (images, avatars, vidéos, KYC, AI selfies) |
| Notifs | Expo Push + DB-backed notifications |
| AI/ML | HuggingFace Inference (skin type, Monk Scale) |
| Map | Leaflet + OpenStreetMap (gratuit, no token) |

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
- **Notification** — userId, type, title, body, data (JSON), readAt, pushSent
- **KycDocument** — providerId, type (ID_FRONT/ID_BACK/SELFIE_WITH_ID), imageUrl, status, rejectedReason
- **SkinAnalysis** — userId, selfieUrl, monkTone (1-10), undertone, LAB/ITA, 8 métriques skin, recommendations
- **HairAnalysis** — userId, photoUrl, hairType (4A-4C), porosité, densité, shrinkage, recommendations

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

# Reviews & Favorites
POST /api/reviews                 — Poster un avis
GET  /api/reviews/provider/:id    — Avis d'un provider
POST /api/favorites/:providerId   — Toggle favori
GET  /api/favorites               — Mes favoris (providers)
GET  /api/categories              — Liste catégories (avec count services)

# User
GET  /api/user/profile            — Mon profil
PUT  /api/user/profile            — Modifier profil (name)

# Notifications
GET  /api/notifications           — Mes notifications (paginées, unreadCount)
PATCH /api/notifications/:id/read — Marquer lue
PATCH /api/notifications/read-all — Tout marquer lu
POST /api/notifications/push-token — Enregistrer push token Expo

# KYC
POST /api/kyc/upload              — Upload document KYC (base64 → Cloudinary)
GET  /api/kyc/status              — Mon statut KYC + documents par type
GET  /api/kyc/documents           — Mes documents soumis

# Wallet
GET  /api/wallet                  — Solde provider (auto-crée si inexistant)
GET  /api/wallet/transactions     — Historique transactions

# AI Analysis
POST /api/ai/skin-analysis        — Selfie → analyse peau (Monk Scale, LAB/ITA, 8 métriques)
GET  /api/ai/skin-history         — Historique analyses peau
GET  /api/ai/skin-analysis/:id    — Détail analyse peau
POST /api/ai/hair-analysis        — Photo → analyse cheveux (4A-4C, porosité, densité)
GET  /api/ai/hair-history         — Historique analyses cheveux
GET  /api/ai/hair-analysis/:id    — Détail analyse cheveux

# Admin
POST /api/admin/login             — Login admin (email + password → JWT 24h)
GET  /api/admin/stats             — KPIs (providers, bookings, users)
GET  /api/admin/providers         — Liste providers (filtrable par statut)
PATCH /api/admin/providers/:id    — Modifier statut provider
GET  /api/admin/bookings          — Liste bookings
GET  /api/admin/kyc/pending       — Documents KYC en attente
PATCH /api/admin/kyc/:id/approve  — Approuver KYC (auto-vérifie si 3 docs OK)
PATCH /api/admin/kyc/:id/reject   — Rejeter KYC (avec raison + notification)
GET  /api/admin/reviews           — Liste reviews (modération)
PATCH /api/admin/reviews/:id/visibility — Toggle visibilité review
```

## Écrans Mobile (expo-router) — Tous connectés à l'API ✅
```
# Auth & Onboarding
app/index.tsx                    → Redirect (auth check)
app/onboarding.tsx               → 3 slides swipeable
app/auth/login.tsx               → Phone + OTP
app/auth/register.tsx            → Nom + OTP

# Tabs principaux (5 tabs)
app/(tabs)/index.tsx             → Explorer: search, grille catégories 3x2, cards providers, banner demande, toggle liste/carte Mapbox
app/(tabs)/bookings.tsx          → Réservations upcoming/past
app/(tabs)/messages.tsx          → Notifications DB-backed (lu/non-lu, mark all read)
app/(tabs)/beauty.tsx            → Beauté AI: cartes skin + hair, scores, Monk badge, historique
app/(tabs)/profile.tsx           → Profil + avatar upload + menu prestataire (switch rôle)

# Provider
app/provider/[slug].tsx          → Profil public (services, dispo, stats, WhatsApp, badge vérifié, section avis avec distribution)

# Booking
app/booking/[providerId].tsx     → Flow 5 étapes + modal succès 🎉
app/booking/detail/[id].tsx      → Détail + actions statut + timeline + WhatsApp + avis existant
app/booking/review/[bookingId].tsx → Créer avis (étoiles, tags, photos Cloudinary, commentaire)

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

# AI Beauty Analysis
app/ai/skin-capture.tsx          → Capture selfie peau (tips, preview, opt-in dataset)
app/ai/skin-results/[id].tsx     → Résultats: Monk tone, undertone, score /100, 8 métriques, LAB/ITA, recommandations
app/ai/hair-capture.tsx          → Capture photo cheveux
app/ai/hair-results/[id].tsx     → Résultats: type 4A-4C, porosité, densité, shrinkage, recommandations

# Autres
app/favorites.tsx                → Liste providers favoris + toggle unfavorite
app/settings/edit-profile.tsx    → Modifier profil (nom, bio, WhatsApp, Instagram)
app/kyc/index.tsx                → Upload 3 docs KYC + statut + re-soumission
app/wallet/index.tsx             → Solde, en attente, historique transactions
```

### À créer
```
app/conversation/[id].tsx        → Chat client ↔ provider (WhatsApp redirect pour l'instant)
```

## Fichiers clés
```
# Mobile
apps/mobile/src/theme/colors.ts       — Design tokens (violet, terracotta, accent)
apps/mobile/src/lib/api.ts            — Client API (auto-refresh, redirect login, prod URL Railway)
apps/mobile/src/lib/auth-context.tsx   — Auth context (login/logout/updateUser, AsyncStorage)
apps/mobile/src/lib/alert.ts          — showAlert/showConfirm cross-platform (web + native)
apps/mobile/src/lib/upload.ts         — pickImage, pickMedia, pickAndUploadImage/Avatar/Media (Cloudinary)
apps/mobile/src/lib/notifications.ts  — Push notification setup (Expo), token registration, tap handler
apps/mobile/src/components/MapView.tsx — Leaflet + OpenStreetMap (web, gratuit, no token) + fallback natif

# API
apps/api/src/app.ts                   — Express app (routes, CORS via CORS_ORIGINS env var)
apps/api/src/middleware/auth.ts       — JWT auth + generateToken + generateRefreshToken
apps/api/src/middleware/error.ts      — Error handler + asyncHandler wrapper
apps/api/src/lib/errors.ts            — AppError, NotFoundError, ValidationError, etc.
apps/api/src/lib/cloudinary.ts        — Upload image/avatar/video vers Cloudinary (lazy-loaded)
apps/api/src/lib/notifications.ts     — createNotification() + notifyBookingEvent() + Expo Push sender
apps/api/src/lib/huggingface.ts       — RGB→LAB, ITA, Monk Scale, analyzeSkin(), analyzeHair(), recommendations FR
apps/api/src/schemas/index.ts         — Zod schemas pour toutes les routes
apps/api/src/routes/ai.routes.ts      — AI skin + hair analysis routes
apps/api/src/routes/notification.routes.ts — Notifications CRUD + push token
apps/api/src/routes/kyc.routes.ts     — KYC upload + status
apps/api/src/routes/wallet.routes.ts  — Wallet balance + transactions
apps/api/src/routes/user.routes.ts    — User profile GET/PUT
apps/api/src/routes/request.routes.ts — Beauty Requests + Proposals API

# Admin
apps/admin/src/app/page.tsx           — Dashboard complet (5 onglets: overview, providers, bookings, KYC, reviews)
apps/admin/src/app/login/page.tsx     — Login admin
apps/admin/src/lib/api.ts             — Client API admin (JWT + auto-redirect)

# Shared
packages/shared/src/utils.ts          — normalizePhone, slugify, formatCurrency, haversine, canTransitionBooking
packages/shared/src/constants.ts      — BOOKING_STATUS_TRANSITIONS, CITIES, CURRENCIES, COLORS, REVIEW_TAGS

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
JWT_SECRET=tokoss-prod-jwt-secret-2026          # ⚠️ OBLIGATOIRE en production (crash si absent)
NODE_ENV=production
DEMO_OTP=1234
CORS_ORIGINS=https://tokoss-kappa.vercel.app,https://tokoss-kappa-ecru.vercel.app,https://tokoss.app,https://www.tokoss.app
CLOUDINARY_CLOUD_NAME=dppop1fid
CLOUDINARY_API_KEY=282719287638618
CLOUDINARY_API_SECRET=kxt7-bJyNVZMvGSvkPOkfrQV2IA
HUGGINGFACE_API_TOKEN=hf_xxxxx
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
3. **Phase 3** ✅ — Reviews UI + Favoris + Settings + Notifications Push + KYC + Admin Dashboard + Map Leaflet + Wallet
4. **Phase 4** ✅ — AI Skin Analysis (Monk Scale, HuggingFace) + AI Hair Analysis (4A-4C) + 5ème tab Beauté AI
5. **Phase 2** ❌ — SMS OTP réel (Africa's Talking) + Paiements MBiyo + Escrow

### Avancement : ~80% fait
Les 20% restants (Phase 2) = briques business critiques pour le launch :
- SMS OTP réel → sans ça, pas de vrais utilisateurs
- Paiements Mobile Money → sans ça, pas de monétisation
- Landing page tokoss.app → sans ça, pas d'acquisition

## Le vrai différenciateur
PAS le mode Upwork. C'est l'**AI beauty analysis pour les peaux qui vous ressemblent** :
- **Skin analysis** via selfie : Monk Scale (1-10), undertone, LAB/ITA, hydratation, sébum, pores, rides, taches, acné, hyperpigmentation, uniformité
- **Hair analysis** via photo : type 4A-4C, porosité, densité, épaisseur, sécheresse, élasticité, shrinkage, cuir chevelu, style détecté
- **ML** : HuggingFace Inference API (skin type classification) + conversion RGB→LAB + ITA côté serveur
- Datasets : SCIN (Google) + DDI (Stanford) — PAS Fitzpatrick17k (licence NC, biais peau claire)
- Stratégie : construire un dataset propriétaire via opt-in selfies utilisatrices (le vrai moat)
- Référence code : KREESS/SmartSkin (CNN skin detection)
- Aucune IA complète pour cheveux afro n'existe encore → opportunité massive

## Documents de référence
- `TOKOSS_MARKET_STUDY.md` — Étude de marché complète ($17B+ TAM, 8 pays analysés)
- `TOKOSS_TECH_SPEC.md` — Spécifications techniques complètes (modèles, API, écrans, paiements, AI)
- `TOKOSS_STITCH_PROMPTS.md` — Prompts Stitch (Google) pour visuels marketing (logo, App Store, landing page, social media, pitch deck)

## Positionnement marketing
- **PAS** "beauté pour peau noire" (regard extérieur)
- **OUI** "pour les peaux qui vous ressemblent" (regard intérieur)
- Message : "Révélez la beauté qui est déjà en vous" / "L'app qui évolue avec vous"
- Prestataires : "Vous sublimez vos clientes. On s'occupe du reste."
- Logo : Playfair Display Bold Italic, T majuscule élégant, typographie fashion house
- Esthétique : Vogue Afrique × Aesop × Glossier — mature, élégant, confiant
