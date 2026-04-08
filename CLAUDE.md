# Tokoss — Marketplace Beauté/Bien-être pour l'Afrique

## Vision
**Le Glossier africain qui connecte clientes et prestataires de la beauté.**

Plus qu'un outil de booking — un univers beauté : lookbook inspiration, AI skin/hair analysis, journal capillaire, communauté.

Deux modes de réservation :
1. **Mode Local** (Treatwell) — Client cherche un pro, voit prix/dispo, réserve
2. **Mode Demande** (Upwork) — Client poste une demande avec photos, les pros répondent

App unique avec switch de rôle CLIENT ↔ PROVIDER (comme Uber driver/rider).

### Pitch one-liner par audience
| Audience | Pitch |
|----------|-------|
| Investisseurs | Le Treatwell de l'Afrique, avec une couche d'intelligence beauté pour peaux et cheveux afro |
| Clientes | L'app qui trouve ta prestataire, analyse ta peau, et comprend tes cheveux |
| Prestataires | Ton salon en ligne — clientes, réservations, portfolio, paiements |
| Presse | La première marketplace beauté pensée pour l'Afrique — la beauté à votre image |

## Dossier projet
`C:\Users\glaib\tokoss\`

## Architecture
Monorepo Turborepo + pnpm.

### Packages
| Package | Rôle |
|---------|------|
| `@tokoss/shared` | Types, constantes, utils (phone, slug, haversine, booking state machine) |
| `@tokoss/db` | Prisma 6 schema + client (25 modèles — incl. SavedLook) |
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

### Palette actuelle (warm beige + WCAG-compliant, mars 2026)
| Élément | Valeur | Contraste sur bg |
|---------|--------|-----------------|
| Mode | **Clair (light mode)** | — |
| Primary | `#8B6952` (warm brown) | 5.2:1 ✓ |
| Primary dark | `#6B4D3A` | 7.1:1 ✓ |
| Primary light | `#CA987E` (décoratif) | 1.6:1 ✗ (pas pour texte) |
| Primary ghost | `rgba(139,105,82,0.10)` | — |
| Accent | `#5B21B6` (deep violet — titres, CTA) | 5.8:1 ✓ |
| Terracotta | `#7C4D3E` (étoiles, prix) | 5.2:1 ✓ |
| Background | `#F2E4D9` (warm beige) | — |
| Card | `#FFFFFF` (blanc pur — séparation claire du bg) | — |
| Text | `#1A1A2E` (noir doux) | 4.9:1 ✓ (12.6:1 sur card) |
| Text secondary | `#4A4A4A` | 6.5:1 ✓ |
| Text muted | `#6B6B6B` | 4.5:1 ✓ |
| Border | `rgba(0,0,0,0.10)` | Visible |
| Success | `#00875A` | — |
| Warning | `#E68A00` | — |
| Error | `#DE350B` | — |
| Star | `#7C4D3E` (terracotta) | 5.2:1 ✓ |
| Header dark | `#3A2228` (courbe SVG headers) | 12.8:1 ✓ |
| Header medium | `#5C3D3D` | — |
| Secondary green | `#6B705C` (boutons secondaires) | — |
| Fichier couleurs | `apps/mobile/src/theme/colors.ts` | — |
| Fichier typographie | `apps/mobile/src/theme/typography.ts` | — |
| Fichier shadows | `apps/mobile/src/theme/shadows.ts` | — |
| Fichier spacing | `apps/mobile/src/theme/spacing.ts` | — |

#### ⚠️ Règle contraste WCAG
Toutes les couleurs de texte doivent avoir un ratio **≥ 4.5:1** sur leur fond. Avant le fix (mars 2026), 12 des 14 combinaisons échouaient. `#CA987E` (primaryLight) ne doit JAMAIS être utilisé pour du texte — uniquement en décoratif/fond.

### Règles design
- Palette **warm beige `#F2E4D9` + cards blanches `#FFFFFF`** — séparation claire
- Accent deep violet (`#5B21B6`) pour titres, CTA, badges TOP PRO
- Terracotta foncé (`#7C4D3E`) pour étoiles et prix — JAMAIS `#CA987E` pour du texte
- Boutons primary `#8B6952` avec texte blanc, CTA accent `#5B21B6` avec texte blanc
- Catégories en grille 3x2 avec icônes Tabler dans des carrés arrondis
- Cards provider avec image + badge TOP PRO (rating >= 4.5)
- Cards avec `borderWidth: 1, borderColor: rgba(0,0,0,0.10)` pour séparation visible
- Inputs toujours avec bordure visible (même idle)
- Vue web contrainte à max 430px centré (simule un mobile)
- `Alert.alert` ne marche PAS sur web → utiliser `src/lib/alert.ts` (showAlert/showConfirm)
- **Icônes** : imports individuels `@tabler/icons-react-native/dist/esm/icons/IconName.mjs` (PAS le barrel import — ça ajoute 5MB au bundle)
- **Skeleton loaders** au lieu de ActivityIndicator
- **Badges SVG** (`IconRosetteDiscountCheck`) au lieu de ✅ emoji
- **Courbe SVG** (`CurveHeader` composant) — header dark avec courbe élégante S-curve en SVG Path sur tous les tabs et écrans auth. Utilise `onLayout` + `preserveAspectRatio="none"` pour couvrir 100% de la largeur
- **Animations Reanimated** — PressableScale (press feedback), FadeInStagger (entrée en cascade), TabCrossfade (transition tabs), BounceScale (save bounce), Shimmer (skeleton loader)
- **Tab bar custom** — indicateur violet animé qui slide entre les tabs (spring animation via Reanimated, `onLayout` pour mesurer la largeur réelle)
- **Vocabulaire** : dire "prestataires" ou "communauté", JAMAIS "prestataires"
- Écran edit-profile avec **2 onglets** (Cliente / Prestataire) séparés par TabCrossfade
- Fonts : Playfair Display (display/titres) + Poppins (body/UI) — non-bloquants sur web
- **Contraste minimum** : tout texte ≥ 4.5:1 WCAG AA sur son fond

## Modèles Prisma clés
- **User** — phone (unique), role (CLIENT/PROVIDER/ADMIN)
- **Provider** — 1:1 User, displayName, slug, city, lat/lng, isMobile, avgRating, status
- **ServiceCategory** — 6 parents (Coiffure, Ongles, Maquillage, Soins, Barber, Spa) + 25 sous-catégories (parentId tree). Ex: Ongles→Manucure/Gel/Extension/Nail art/Pédicure, Soins→Visage/Corps/Massage relaxant/drainant/Pieds
- **Service** — providerId, categoryId, durationMin, priceMin/priceMax (Int, pas Decimal)
- **Availability** — providerId, dayOfWeek, startTime/endTime
- **AvailabilityException** — blocage ponctuel
- **Booking** — state machine: REQUESTED→CONFIRMED→DEPOSIT_PAID→IN_PROGRESS→COMPLETED
- **PaymentIntent** — bookingId, amount, method (MOMO/CASH), status
- **ProviderWallet** — availableBalance, pendingBalance
- **WalletTransaction** — historique wallet
- **Payout** — retrait vers mobile money
- **Review** — bookingId, rating 1-5, photos[], tags[]
- **PortfolioItem** — imageUrl, caption, serviceTag, savedBy[]
- **SavedLook** — userId ↔ portfolioItemId (bookmarked looks)
- **Favorite** — userId ↔ providerId
- **TransportRequest** — WhatsApp/InDrive/Yango
- **Notification** — userId, type, title, body, data (JSON), readAt, pushSent (+ BOOKING_REMINDER type)
- **KycDocument** — providerId, type (ID_FRONT/ID_BACK/SELFIE_WITH_ID), imageUrl, status, rejectedReason
- **SkinAnalysis** — userId, selfieUrl, monkTone (1-10), undertone, LAB/ITA, 8 métriques skin, recommendations
- **HairAnalysis** — userId, photoUrl, hairType (4A-4C), porosité, densité, shrinkage, recommendations

Schema: `packages/db/prisma/schema.prisma`
Seed: `packages/db/prisma/seed.ts` (7 providers, 6 catégories, 14 services, 1 admin, 1 test client)

## URLs Production
| Service | URL |
|---------|-----|
| **Webapp (PWA)** | https://tokoss.app |
| **Webapp (alias)** | https://tokoss-kappa.vercel.app |
| **API** | https://tokoss-production.up.railway.app |
| **API Health** | https://tokoss-production.up.railway.app/api/health |
| **GitHub** | https://github.com/tobongi/tokoss |
| **Domaine** | tokoss.app (Namecheap → Vercel NS) |

## API Routes (toutes fonctionnelles ✅)
```
# Feed (Lookbook — portfolio items cross-provider)
GET  /api/feed                    — Feed portfolio items (category, pagination)
POST /api/feed/:id/save           — Toggle sauvegarder un look (auth)
GET  /api/feed/saved              — Mes looks sauvegardés (auth)

# Auth
POST /api/auth/otp/send          — Envoi OTP (DEMO_OTP env var, 1234 en dev/staging)
POST /api/auth/otp/verify         — Vérification OTP → JWT + refresh token
POST /api/auth/register           — Inscription (name + phone + OTP)
POST /api/auth/refresh            — Refresh token
POST /api/auth/logout             — Révocation refresh token

# Search
GET  /api/search                  — Providers (q, category + subcategory auto-expand, lat/lng, radius, rating, price, sort, pagination)
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
app/onboarding.tsx               → 3 slides avec images (braids, terrasse, AI face scan) + gradient fade
app/welcome.tsx                  → Écran bienvenue post-inscription
app/auth/login.tsx               → Phone + OTP
app/auth/register.tsx            → Nom + OTP

# Tabs principaux (5 tabs) — tab bar custom avec indicateur violet sliding (Reanimated spring)
app/(tabs)/index.tsx             → Explorer: hero banner, search (debounce 500ms), catégories 3x2 + sous-catégories pills, inspiration banner, occasion banner, vu récemment, cards providers (TOP PRO badge), toggle liste/carte. Animations: FadeInStagger catégories + PressableScale cards
app/(tabs)/bookings.tsx          → Réservations upcoming/past (skeleton loaders, CurveHeader "Rendez-vous"). Animations: FadeInStagger rows + PressableScale
app/(tabs)/lookbook.tsx          → Inspiration: feed lookbook masonry (8 images Higgsfield AI), onglets Découvrir/Sauvegardés, filtres catégorie, "Je veux ça", save bounce. CurveHeader "Inspiration". Animations: FadeInStagger cards + PressableScale + BounceScale save + TabCrossfade filtres
app/(tabs)/beauty.tsx            → Beauté AI: skin + hair cards, scores, Monk badge, historique, journal capillaire link, section "Apprendre" (4 tips éducatifs). CurveHeader
app/(tabs)/profile.tsx           → Profil + avatar (SVG curve header) + menu prestataire + "Inviter des amies". Animations: PressableScale menu items + FadeInStagger

# Notifications (déplacé hors des tabs)
app/notifications.tsx            → Notifications DB-backed (lu/non-lu, mark all read), CurveHeader "Activité". Accessible via cloche 🔔 sur Home

# Provider
app/provider/[slug].tsx          → Profil public (services, dispo, stats, WhatsApp, badge vérifié SVG, section avis, transformations avant/après, bouton partager profil)

# Booking
app/booking/[providerId].tsx     → Flow 5 étapes + célébration animée (confetti, recap, prochaines étapes, prompt parrainage)
app/booking/detail/[id].tsx      → Détail + actions statut + timeline + WhatsApp + prompt review amélioré
app/booking/review/[bookingId].tsx → Créer avis (étoiles, tags, photos Cloudinary, commentaire)
app/booking/occasion.tsx         → Booking multi-service par occasion (mariage, fête...) + groupe (1-8 personnes) + timeline J-7/J-3/Jour J

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
app/ai/skin-results/[id].tsx     → Résultats + recommandations providers + conseils personnalisés + partage WhatsApp
app/ai/hair-capture.tsx          → Capture photo cheveux
app/ai/hair-results/[id].tsx     → Résultats + recommandations providers + conseils personnalisés + partage WhatsApp

# Engagement & Discovery
app/lookbook.tsx                 → Feed inspiration standalone (backup, le principal est dans tabs/lookbook.tsx)
app/hair-journal.tsx             → Journal capillaire (timeline mensuelle, style protecteur, produits)
app/referral.tsx                 → Parrainage (code, partage, stats invitations)
app/favorites.tsx                → Liste providers favoris + toggle unfavorite

# Autres
app/settings/edit-profile.tsx    → Modifier profil — SVG curve header avec avatar, 2 onglets Cliente/Prestataire (TabCrossfade), champs underline style, TikTok ajouté
app/settings/index.tsx           → Paramètres
app/kyc/index.tsx                → Upload 3 docs KYC + statut + re-soumission (badges SVG)
app/wallet/index.tsx             → Solde, en attente, historique transactions
app/permissions/location.tsx     → Permission géolocalisation
app/permissions/notification.tsx → Permission notifications push
app/store/[providerId].tsx       → Boutique produits (mock)
app/store/product/[id].tsx       → Détail produit (mock)
```

### À créer
```
app/conversation/[id].tsx        → Chat client ↔ provider (WhatsApp redirect pour l'instant)
```

## Fichiers clés
```
# Mobile
apps/mobile/src/theme/colors.ts       — Design tokens (warm beige + violet accent)
apps/mobile/src/theme/typography.ts    — Playfair Display + Poppins type scale
apps/mobile/src/theme/shadows.ts      — Color-aware shadows (terracotta-tinted)
apps/mobile/src/theme/spacing.ts      — 4px base unit spacing system
apps/mobile/src/lib/api.ts            — Client API (auto-refresh, dev=localhost:3001, prod=Railway, __DEV__ switch)
apps/mobile/src/lib/auth-context.tsx   — Auth context (login/logout/updateUser, AsyncStorage)
apps/mobile/src/lib/alert.ts          — showAlert/showConfirm cross-platform (web + native)
apps/mobile/src/lib/upload.ts         — pickImage, pickMedia, pickAndUploadImage/Avatar/Media (Cloudinary)
apps/mobile/src/lib/notifications.ts  — Push notification setup (Expo), token registration, tap handler
apps/mobile/src/lib/recently-viewed.ts — AsyncStorage-backed recently viewed providers (max 10)
apps/mobile/src/components/MapView.tsx — Leaflet + OpenStreetMap (web, gratuit, no token) + fallback natif
apps/mobile/src/components/Skeleton.tsx — Animated pulse skeleton loader + ProviderCardSkeleton
apps/mobile/src/components/BeforeAfter.tsx — Before/After transformation gallery card
apps/mobile/src/components/CurveHeader.tsx — Header SVG courbe élégante réutilisable (onLayout + preserveAspectRatio)
apps/mobile/src/components/animations.tsx — PressableScale, FadeInStagger, TabCrossfade, BounceScale, Shimmer (Reanimated)
apps/mobile/src/components/SectionHeader.tsx — Section header avec "Voir tout"
apps/mobile/assets/images/lookbook/    — 8 images Higgsfield AI (tresses, ongles, mariée, fade, braids, soins, stiletto, cornrows)
apps/mobile/public/manifest.json      — PWA manifest (installable sur mobile)

# API
apps/api/src/app.ts                   — Express app (routes, CORS via CORS_ORIGINS env var)
apps/api/src/middleware/auth.ts       — JWT auth + generateToken + generateRefreshToken
apps/api/src/middleware/error.ts      — Error handler + asyncHandler wrapper
apps/api/src/lib/errors.ts            — AppError, NotFoundError, ValidationError, etc.
apps/api/src/lib/cloudinary.ts        — Upload image/avatar/video vers Cloudinary (lazy-loaded)
apps/api/src/lib/notifications.ts     — createNotification() + notifyBookingEvent() + sendBookingReminders() (24h) + Expo Push sender
apps/api/src/routes/feed.routes.ts    — Feed portfolio items (lookbook) + save/unsave looks
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
| Webapp deploy | Voir script ci-dessous |

#### Script de déploiement webapp (PWA)
```bash
cd apps/mobile

# 1. Build
npx expo export --platform web --output-dir distX

# 2. Patch expo-modules-core (registerWebModule crash sur mobile web)
cd distX
BUNDLE=$(ls _expo/static/js/web/entry-*.js)
node -e "
const fs = require('fs');
let code = fs.readFileSync('$BUNDLE', 'utf8');
// Fix 1: Remove throw when l.name is undefined (non-class modules)
code = code.replace(
  \"const s=l.name;if(!s)throw new Error('Module implementation must be a class')\",
  \"const s=l.name||('ExpoModule_'+Math.random().toString(36).slice(2));if(false)throw new Error('noop')\"
);
// Fix 2: try/catch around 'new l' for non-constructor modules
code = code.replace(
  'return globalThis.expo.modules[s]=new l,globalThis.expo.modules[s]',
  'try{return globalThis.expo.modules[s]=new l,globalThis.expo.modules[s]}catch(e){return globalThis.expo.modules[s]=typeof l===\"function\"?l():l,globalThis.expo.modules[s]}'
);
fs.writeFileSync('$BUNDLE', code);
console.log('Patched registerWebModule');
"

# 3. PWA meta
node -e "
const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
h = h.replace('</head>', '<link rel=\"manifest\" href=\"/manifest.json\" /><meta name=\"theme-color\" content=\"#F2E4D9\" /><meta name=\"apple-mobile-web-app-capable\" content=\"yes\" /><meta name=\"apple-mobile-web-app-title\" content=\"Tokoss\" /></head>');
fs.writeFileSync('index.html', h);
"
cp ../public/manifest.json .
echo '{"rewrites":[{"source":"/((?!_expo|assets|favicon|manifest).*)", "destination":"/index.html"}]}' > vercel.json

# 4. Deploy
npx vercel link --yes --project tokoss-kappa && npx vercel --prod --yes
```

⚠️ **Post-build patch obligatoire** : `expo-modules-core` crashe sur mobile web avec "Module implementation must be a class" et "ExpoFontLoader.isLoaded undefined". Le patch (1) donne un nom fallback aux modules sans `.name` et (2) wrappe `new l` dans try/catch pour les non-constructeurs.

⚠️ **Icônes Tabler** : utiliser imports individuels `@tabler/icons-react-native/dist/esm/icons/IconName.mjs` sinon le barrel import ajoute 5MB au bundle (5000+ icônes). Bundle cible : ~2MB (Reanimated inclus).

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
- **Icônes Tabler** : TOUJOURS importer individuellement `from '@tabler/icons-react-native/dist/esm/icons/IconName.mjs'` — le barrel import ajoute 5.5MB au bundle
- **expo-modules-core** : crashe sur mobile web ("Module implementation must be a class"). Post-build patch obligatoire sur `registerWebModule` dans le bundle JS
- **Fonts web** : non-bloquantes (`Platform.OS === 'web' ? true : fontsLoaded`) — sinon écran blanc indéfini sur mobile
- **API sur web** : forcée vers production (`Platform.OS === 'web' ? PROD_API`) même en dev
- **Images onboarding** : compressées via sharp-cli (9MB → 80-160KB) en JPG quality 80, resize 1200px
- **Bundle cible** : ~1.4MB (gzipped ~350KB). Au-delà de 2MB, les téléphones mobiles africains timeout

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

### Phase 5 ✅ — Premium UX + Engagement + Expérience culturelle (mars 2026)
- Onboarding avec images aspirationnelles (femmes noires, AI face scan)
- Hero banner animé sur home
- Badges premium SVG (TOP PRO, Vérifié)
- Skeleton loaders
- Partage WhatsApp (résultats AI, profils providers, parrainage)
- Lookbook inspiration (feed portfolio providers, sauvegarde de looks)
- AI → recommandations providers + conseils personnalisés
- Before/After transformations sur profils providers
- Journal capillaire (timeline mensuelle)
- Contenu éducatif beauté (LOC method, SPF, karité, braids)
- Booking occasion multi-service (mariage, fête) + groupe
- Célébration post-booking (confetti, recap, prompt parrainage)
- Vu récemment sur home
- Review prompt amélioré
- Push notifications 24h avant RDV (API cron)
- PWA installable sur tokoss.app

### Phase 5B ✅ — Retours testeuse (avril 2026)
- Search debounce 500ms (fix bug refresh à chaque lettre)
- Sous-catégories : 25 sous-catégories dans 6 parents (Prisma parentId tree + seed + API filter + UI pills mobile)
- ❌ Articles de blog cliquables (tips Beauté AI restent statiques) — TODO
- ❌ Vente de produits depuis articles/résultats AI — TODO (stores mock existants)

### Phase 6 ✅ — Design premium Beauty Master + Animations (avril 2026)
- **Palette WCAG** : couleurs darkened (primary #8B6952, accent #5B21B6, terracotta #7C4D3E) — toutes ≥ 4.5:1
- **Courbes SVG** : CurveHeader sur tous les tabs + auth screens (Beauty Master style S-curve)
- **Tab bar animé** : indicateur violet sliding (Reanimated spring, onLayout)
- **6 animations** : PressableScale, FadeInStagger, TabCrossfade, BounceScale, Shimmer, scroll header
- **Tab Inspiration** : lookbook promu en tab (remplace Activité), 8 images Higgsfield AI générées
- **Edit profil redesigné** : curved header + avatar overlap + onglets Cliente/Prestataire
- **Import social "Prochainement"** : section dashed dans dashboard prestataire (Instagram/TikTok/Facebook)
- **Notifications déplacées** : `app/notifications.tsx` (hors tabs), accessible via cloche Home
- **Bouton retour** ajouté sur profil provider
- **BeforeAfter** : "Après" corrigé (unicode fix)
- **Vocabulaire** : "prestataires" → "prestataires" / "communauté" partout (16 fichiers)
- **Nouveaux composants** : CurveHeader, SectionHeader, animations.tsx
- **Images Higgsfield AI** : 8 lookbook (tresses dorées, gel UV marbre, mariée Monk 7, fade barbe, box braids caramel, soin visage, stiletto strass, cornrows Fulani)
- **Bundle** : 1.98 MB (Reanimated ajouté, toujours sous 2MB)

### Avancement : ~88% fait
Les 12% restants = briques business critiques pour le launch :
- SMS OTP réel → sans ça, pas de vrais utilisateurs
- Paiements Mobile Money → sans ça, pas de monétisation
- Import social oEmbed (Niveau 1) → prestataires collent un lien Instagram/TikTok

## Le vrai différenciateur
PAS le mode Upwork. C'est l'**AI beauty analysis — la beauté à votre image** :
- **Skin analysis** via selfie : Monk Scale (1-10), undertone, LAB/ITA, hydratation, sébum, pores, rides, taches, acné, hyperpigmentation, uniformité
- **Hair analysis** via photo : type 4A-4C, porosité, densité, épaisseur, sécheresse, élasticité, shrinkage, cuir chevelu, style détecté
- **ML** : HuggingFace Inference API (skin type classification) + conversion RGB→LAB + ITA côté serveur
- Datasets : SCIN (Google) + DDI (Stanford) — PAS Fitzpatrick17k (licence NC, biais peau claire)
- Stratégie : construire un dataset propriétaire via opt-in selfies utilisatrices (le vrai moat)
- Référence code : KREESS/SmartSkin (CNN skin detection)
- Aucune IA complète pour cheveux afro n'existe encore → opportunité massive

## Import contenu réseaux sociaux (prestataires)

### Stratégie 3 niveaux
| Niveau | Quoi | Quand |
|--------|------|-------|
| **1 — Coller un lien** | Prestataire colle URL Instagram/TikTok → oEmbed extrait thumbnail + caption → stocké dans PortfolioItem | MVP — faisable maintenant |
| **2 — Import en masse** | OAuth Instagram → récupère 20 derniers posts → prestataire choisit lesquels importer | Moyen terme (app review Meta ~3 semaines) |
| **3 — Sync auto** | Webhooks Instagram/TikTok → auto-import chaque nouveau post | Long terme |

### APIs oEmbed (gratuites, sans auth côté utilisateur)
```
# Instagram oEmbed (nécessite un Facebook App ID + Client Token)
GET https://graph.facebook.com/v18.0/instagram_oembed?url={POST_URL}&access_token={APP_ID}|{CLIENT_TOKEN}
→ { thumbnail_url, author_name, title, html }

# TikTok oEmbed (totalement gratuit, pas d'auth)
GET https://www.tiktok.com/oembed?url={VIDEO_URL}
→ { thumbnail_url, author_name, title, html }
```

### Flow prestataire (Niveau 1)
1. Dashboard services → bouton "Importer depuis Instagram/TikTok"
2. Prestataire colle l'URL du post
3. API backend appelle oEmbed → extrait thumbnail_url + caption
4. Télécharge le thumbnail → upload sur Cloudinary
5. Crée un PortfolioItem (imageUrl = Cloudinary, caption, sourceUrl = lien original, sourceType = INSTAGRAM/TIKTOK)
6. Affiché dans le profil provider + dans le feed Lookbook

### Modèle PortfolioItem (existant, à enrichir)
```prisma
model PortfolioItem {
  // existant
  imageUrl    String
  caption     String?
  serviceTag  String?
  // à ajouter
  sourceUrl   String?     // URL originale Instagram/TikTok
  sourceType  String?     // INSTAGRAM, TIKTOK, FACEBOOK, UPLOAD
  videoUrl    String?     // Pour les vidéos TikTok
}
```

## Documents de référence
- `TOKOSS_MARKET_STUDY.md` — Étude de marché complète ($17B+ TAM, 8 pays analysés)
- `TOKOSS_TECH_SPEC.md` — Spécifications techniques complètes (modèles, API, écrans, paiements, AI)
- `TOKOSS_STITCH_PROMPTS.md` — Prompts Stitch (Google) pour visuels marketing (logo, App Store, landing page, social media, pitch deck)

## Positionnement marketing
- **PAS** "beauté pour peau noire" (regard extérieur)
- **OUI** "la beauté à votre image" (regard intérieur, personnel)
- Message : "Révélez la beauté qui est déjà en vous" / "L'app qui évolue avec vous"
- Prestataires : "Vous sublimez vos clientes. On s'occupe du reste."
- Logo : Playfair Display Bold Italic, T majuscule élégant, typographie fashion house
- Esthétique : Vogue Afrique × Aesop × Glossier — mature, élégant, confiant
- **Site vitrine** : `C:\Users\glaib\tokoss-website\` — 3 pages (accueil, clientes, prestataires), HTML/CSS/JS + GSAP, pas encore déployé
