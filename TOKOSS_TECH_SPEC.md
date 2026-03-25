# TOKOSS — Spécifications Techniques Complètes
## Beauty Freelance Marketplace for Africa
### Version 1.0 | Mars 2026

---

# Table des matières

1. [Vision Produit](#1-vision-produit)
2. [Architecture Technique](#2-architecture-technique)
3. [Modèles de Données (Prisma)](#3-modèles-de-données)
4. [API REST — Routes Complètes](#4-api-rest)
5. [App Mobile — Écrans & Navigation](#5-app-mobile)
6. [Admin Dashboard](#6-admin-dashboard)
7. [Système de Paiement & Escrow](#7-système-de-paiement--escrow)
8. [Messaging en Temps Réel](#8-messaging-en-temps-réel)
9. [Notifications (WhatsApp + Push + SMS)](#9-notifications)
10. [Système de Beauty Requests (Mode Upwork)](#10-beauty-requests-mode-upwork)
11. [AI & Camera Features](#11-ai--camera-features)
12. [Maps & Géolocalisation](#12-maps--géolocalisation)
13. [Upload & Médias (Cloudinary)](#13-upload--médias)
14. [Sécurité & KYC](#14-sécurité--kyc)
15. [Infrastructure & Déploiement](#15-infrastructure--déploiement)
16. [État Actuel vs. Cible](#16-état-actuel-vs-cible)
17. [Plan d'Exécution par Phases](#17-plan-dexécution-par-phases)

---

# 1. Vision Produit

## Positionnement

Tokoss n'est PAS une app de salon, ni une app de booking classique.

**Tokoss = Marketplace du travail beauté en Afrique**

```
Tokoss = Upwork + Instagram + Treatwell + Mobile Money + AI Beauty
```

## Deux modes de réservation

| Mode | Analogie | Description |
|------|----------|-------------|
| **Mode Local** | Treatwell / Planity | Client cherche un pro près de lui, voit les prix/dispo, réserve instantanément |
| **Mode Demande** | Upwork / Fiverr | Client poste une demande avec photos d'inspiration, les pros envoient des propositions |

## Utilisateurs

| Rôle | Description |
|------|-------------|
| **Client** | Cherche et réserve des services beauté |
| **Provider** (Prestataire) | Freelance ou salon qui offre des services |
| **Admin** | Gestion plateforme, vérification, disputes |

---

# 2. Architecture Technique

## Monorepo Structure

```
tokoss/
├── apps/
│   ├── api/              # Express 5 + TypeScript — REST API
│   ├── mobile/           # Expo 52 + expo-router 4 — App unique (client + provider)
│   ├── admin/            # Next.js 14 + Tailwind — Dashboard admin
│   └── ws/               # WebSocket server — Messaging temps réel [À CRÉER]
├── packages/
│   ├── shared/           # Types, constantes, utils, state machines
│   └── db/               # Prisma 6 + PostgreSQL
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Stack Technique

| Composant | Technologie | Justification |
|-----------|------------|---------------|
| **Runtime** | Node.js 20+ | Standard, écosystème riche |
| **API** | Express 5 + TypeScript | Léger, flexible, connu |
| **ORM** | Prisma 6 | Type-safe, migrations, studio |
| **Base de données** | PostgreSQL (Railway) | Fiable, PostGIS possible plus tard |
| **Mobile** | Expo 52 + expo-router 4 + React Native | Cross-platform, OTA updates, expo-camera |
| **Admin** | Next.js 14 + Tailwind CSS | SSG/SSR, static export pour Netlify |
| **WebSocket** | Socket.io ou ws | Messaging temps réel |
| **Auth** | JWT + OTP SMS | Phone-first pour l'Afrique |
| **SMS** | Africa's Talking | Couverture RDC, Cameroun, Gabon, Côte d'Ivoire, Sénégal |
| **Paiement** | MBiyo Pay (Orange Money, MTN MoMo, Airtel Money, M-Pesa) | Agrégateur mobile money multi-pays |
| **Images** | Cloudinary | Upload, resize, CDN, transformations |
| **Notifications push** | Expo Notifications (FCM/APNs) | Intégré à Expo |
| **WhatsApp** | WhatsApp Business API (via 360dialog ou Meta) | Canal de notification primaire en Afrique |
| **Maps** | react-native-maps + Google Maps API | Carte, geocoding, directions |
| **AI (Phase 3+)** | TensorFlow.js / MediaPipe / API externe | Virtual try-on, matching |
| **Cache** | Redis (Upstash) | OTP store, rate limiting, sessions, pub/sub |
| **File queue** | BullMQ (Redis-backed) | Jobs async: paiements, notifications, AI |
| **Monitoring** | Sentry | Error tracking mobile + API |

## Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Mobile App │     │ Admin Panel │     │  WhatsApp    │
│  (Expo)     │     │ (Next.js)   │     │  Business    │
└──────┬──────┘     └──────┬──────┘     └──────┬───────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                    API Gateway                        │
│              Express 5 + TypeScript                   │
│   REST Routes │ Auth Middleware │ Rate Limiting        │
└──────┬────────────┬───────────────┬──────────────────┘
       │            │               │
       ▼            ▼               ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│ PostgreSQL│  │  Redis   │  │  WebSocket   │
│ (Prisma)  │  │ (Upstash)│  │  (Socket.io) │
└──────────┘  └──────────┘  └──────────────┘
       │            │
       ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│Cloudinary│  │ BullMQ   │  │ MBiyo Pay    │
│ (Images) │  │ (Jobs)   │  │ (Paiements)  │
└──────────┘  └──────────┘  └──────────────┘
```

---

# 3. Modèles de Données

## Modèles EXISTANTS (déjà dans `schema.prisma`)

| Modèle | Statut | Description |
|--------|--------|-------------|
| `User` | ✅ Fait | phone, name, avatar, role, locale, lat/lng, pushToken |
| `RefreshToken` | ✅ Fait | JWT refresh tokens |
| `Provider` | ✅ Fait | displayName, slug, city, commune, lat/lng, isMobile, whatsapp, instagram, ratings |
| `ServiceCategory` | ✅ Fait | Coiffure, Ongles, Maquillage, Massage, Barber, Spa |
| `Service` | ✅ Fait | providerId, categoryId, name, durationMin, priceMin/priceMax |
| `Availability` | ✅ Fait | providerId, dayOfWeek, startTime/endTime |
| `AvailabilityException` | ✅ Fait | Blocage ponctuel (congés, etc.) |
| `Booking` | ✅ Fait | State machine complète, conflict detection, location, transport |
| `PaymentIntent` | ✅ Fait | bookingId, amount, method (MOMO/CASH), status |
| `ProviderWallet` | ✅ Fait | availableBalance, pendingBalance |
| `WalletTransaction` | ✅ Fait | Historique wallet |
| `Payout` | ✅ Fait | Retrait vers mobile money |
| `Review` | ✅ Fait | rating, comment, photos, tags |
| `PortfolioItem` | ✅ Fait | imageUrl, caption, serviceTag |
| `Favorite` | ✅ Fait | userId ↔ providerId |
| `TransportRequest` | ✅ Fait | WhatsApp/InDrive/Yango |
| `Admin` | ✅ Fait | email/password admin |

## Modèles À CRÉER

### BeautyRequest (Mode Upwork)

```prisma
model BeautyRequest {
  id              String              @id @default(cuid())
  clientId        String
  client          User                @relation("ClientRequests", fields: [clientId], references: [id])

  title           String              // "Tresses pour mariage"
  description     String              // Description détaillée
  categoryId      String
  category        ServiceCategory     @relation(fields: [categoryId], references: [id])

  // Photos d'inspiration
  photos          String[]            // URLs Cloudinary
  selfieUrl       String?             // Photo du client (visage/cheveux/mains)

  // Contraintes
  budgetMin       Int                 // Budget minimum en monnaie locale
  budgetMax       Int                 // Budget maximum
  currency        String              @default("CDF")
  preferredDate   DateTime?           @db.Date
  flexibleDate    Boolean             @default(false)
  locationType    String              @default("CLIENT") // CLIENT | PROVIDER | FLEXIBLE
  locationAddress String?
  locationLat     Float?
  locationLng     Float?
  city            String

  // Statut
  status          BeautyRequestStatus @default(OPEN)
  selectedProposalId String?          @unique

  proposals       Proposal[]
  booking         Booking?            @relation("RequestBooking")

  expiresAt       DateTime            // Auto-expire après 48-72h
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([clientId])
  @@index([categoryId])
  @@index([city])
  @@index([status])
  @@map("beauty_requests")
}

enum BeautyRequestStatus {
  OPEN           // Visible aux pros
  IN_REVIEW      // Client examine les propositions
  ACCEPTED       // Proposition acceptée, booking créé
  EXPIRED        // Pas de proposition retenue
  CANCELLED      // Annulée par le client
  COMPLETED      // Service effectué
}
```

### Proposal (Réponse d'un pro à une demande)

```prisma
model Proposal {
  id              String          @id @default(cuid())
  requestId       String
  request         BeautyRequest   @relation(fields: [requestId], references: [id], onDelete: Cascade)
  providerId      String
  provider        Provider        @relation(fields: [providerId], references: [id])

  price           Int             // Prix proposé
  currency        String          @default("CDF")
  message         String          // Message du pro au client
  estimatedDuration Int           // Durée estimée en minutes
  portfolioSamples String[]       // URLs de travaux similaires du pro

  status          ProposalStatus  @default(PENDING)

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([requestId, providerId]) // Un pro = une proposition par demande
  @@index([requestId])
  @@index([providerId])
  @@map("proposals")
}

enum ProposalStatus {
  PENDING         // En attente
  SHORTLISTED     // Présélectionnée par le client
  ACCEPTED        // Acceptée → booking créé
  REJECTED        // Refusée
  WITHDRAWN       // Retirée par le pro
}
```

### Conversation & Message (Messaging)

```prisma
model Conversation {
  id             String    @id @default(cuid())
  participantIds String[]  // [userId1, userId2]

  // Contexte optionnel
  bookingId      String?   @unique
  requestId      String?   @unique

  lastMessageAt  DateTime  @default(now())
  lastMessageText String?

  messages       Message[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([participantIds])
  @@map("conversations")
}

model Message {
  id              String    @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId        String
  type            MessageType @default(TEXT)

  text            String?
  imageUrl        String?     // Photo envoyée dans le chat
  metadata        Json?       // Données structurées (booking ref, location, etc.)

  readAt          DateTime?
  createdAt       DateTime    @default(now())

  @@index([conversationId])
  @@index([senderId])
  @@map("messages")
}

enum MessageType {
  TEXT
  IMAGE
  BOOKING_CARD    // Carte de réservation cliquable
  PROPOSAL_CARD   // Carte de proposition
  LOCATION        // Partage de position
  SYSTEM          // Message système (booking confirmé, etc.)
}
```

### ClientWallet (Portefeuille client)

```prisma
model ClientWallet {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  balance        Int      @default(0)
  currency       String   @default("CDF")

  transactions   ClientWalletTransaction[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("client_wallets")
}

model ClientWalletTransaction {
  id          String       @id @default(cuid())
  walletId    String
  wallet      ClientWallet @relation(fields: [walletId], references: [id])
  type        String       // TOPUP | PAYMENT | REFUND | ESCROW_HOLD | ESCROW_RELEASE
  amount      Int
  balanceAfter Int
  bookingId   String?
  requestId   String?
  description String?
  createdAt   DateTime     @default(now())

  @@index([walletId])
  @@map("client_wallet_transactions")
}
```

### EscrowHold (Système de séquestre)

```prisma
model EscrowHold {
  id          String       @id @default(cuid())
  bookingId   String       @unique
  booking     Booking      @relation(fields: [bookingId], references: [id])
  clientId    String
  providerId  String
  amount      Int
  currency    String       @default("CDF")
  status      EscrowStatus @default(HELD)

  heldAt      DateTime     @default(now())
  releasedAt  DateTime?
  refundedAt  DateTime?
  disputedAt  DateTime?

  @@index([bookingId])
  @@index([status])
  @@map("escrow_holds")
}

enum EscrowStatus {
  HELD            // Argent bloqué
  RELEASED        // Libéré au pro (service complété)
  REFUNDED        // Remboursé au client
  PARTIALLY_RELEASED // Dispute résolue avec partage
  DISPUTED        // En litige
}
```

### Notification

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  type      String   // BOOKING_NEW | BOOKING_CONFIRMED | PROPOSAL_NEW | MESSAGE | PAYMENT | REVIEW | SYSTEM
  title     String
  body      String
  data      Json?    // { bookingId, requestId, providerId, etc. }

  channel   String   @default("PUSH") // PUSH | WHATSAPP | SMS | IN_APP
  sentAt    DateTime?
  readAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([type])
  @@map("notifications")
}
```

### Dispute

```prisma
model Dispute {
  id          String        @id @default(cuid())
  bookingId   String        @unique
  booking     Booking       @relation(fields: [bookingId], references: [id])
  openedBy    String        // userId qui ouvre le litige
  reason      String
  description String
  photos      String[]      // Preuves photos

  status      DisputeStatus @default(OPEN)
  resolution  String?       // Description de la résolution
  resolvedBy  String?       // adminId

  refundAmount Int?         // Montant remboursé si applicable

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("disputes")
}

enum DisputeStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED_CLIENT    // En faveur du client
  RESOLVED_PROVIDER  // En faveur du pro
  RESOLVED_SPLIT     // Compromis
  CLOSED
}
```

### FeaturedProfile & Subscription (Monétisation pro)

```prisma
model FeaturedProfile {
  id          String   @id @default(cuid())
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id])
  type        String   @default("BOOST") // BOOST | HOMEPAGE | CATEGORY_TOP
  city        String?
  startsAt    DateTime
  endsAt      DateTime
  amount      Int
  currency    String   @default("CDF")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@index([providerId])
  @@index([isActive, endsAt])
  @@map("featured_profiles")
}

model ProviderSubscription {
  id          String   @id @default(cuid())
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id])
  plan        String   // FREE | PRO | PREMIUM
  price       Int
  currency    String   @default("CDF")
  features    String[] // Liste des features incluses
  startsAt    DateTime
  endsAt      DateTime
  autoRenew   Boolean  @default(true)
  status      String   @default("ACTIVE") // ACTIVE | CANCELLED | EXPIRED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([providerId])
  @@map("provider_subscriptions")
}
```

### Commission & Platform Config

```prisma
model PlatformConfig {
  id    String @id @default(cuid())
  key   String @unique
  value String
  type  String @default("STRING") // STRING | INT | FLOAT | BOOLEAN | JSON

  @@map("platform_config")
}
// Exemples de clés :
// commission_rate = "0.12" (12%)
// min_payout_amount_CDF = "5000"
// min_payout_amount_XAF = "500"
// escrow_hold_hours = "48"
// request_expiry_hours = "72"
// featured_boost_price_CDF = "2000"
```

---

# 4. API REST — Routes Complètes

## Routes EXISTANTES (✅ déjà codées)

```
# Auth
POST   /api/auth/otp/send          ✅ Envoi OTP (in-memory, DEMO_OTP=1234 en dev)
POST   /api/auth/otp/verify         ✅ Vérification OTP → JWT
POST   /api/auth/register           ✅ Inscription (name + phone + OTP)
POST   /api/auth/refresh            ✅ Refresh token
POST   /api/auth/logout             ✅ Révocation refresh token

# Search
GET    /api/search                  ✅ Recherche providers (q, category, lat/lng, radius, rating, price, sort)
GET    /api/search/providers/:slug  ✅ Profil public provider complet

# Bookings
POST   /api/bookings               ✅ Créer réservation (conflict detection, deposit calc)
GET    /api/bookings/mine           ✅ Mes réservations (client ou provider, upcoming/past)
GET    /api/bookings/:id            ✅ Détail réservation
PATCH  /api/bookings/:id/status     ✅ Transition statut (state machine validée)

# Provider
POST   /api/provider/register       ✅ Devenir prestataire
GET    /api/provider/profile         ✅ Mon profil pro
PUT    /api/provider/profile         ✅ Modifier profil
CRUD   /api/provider/services        ✅ Gestion services
PUT    /api/provider/availability    ✅ Gestion disponibilités

# Reviews
POST   /api/reviews                 ✅ Poster un avis
GET    /api/reviews (par provider)   ✅ Lire les avis

# Favorites
POST   /api/favorites/:providerId   ✅ Toggle favori

# Categories
GET    /api/categories              ✅ Liste catégories

# Admin
GET    /api/admin/stats             ✅ Statistiques
GET    /api/admin/providers         ✅ Liste providers
GET    /api/admin/bookings          ✅ Liste bookings
```

## Routes À CRÉER

### Beauty Requests (Mode Upwork)

```
POST   /api/requests                    Créer une demande beauté
GET    /api/requests                    Liste demandes ouvertes (pour les pros)
GET    /api/requests/mine               Mes demandes (client)
GET    /api/requests/:id                Détail demande
PATCH  /api/requests/:id                Modifier demande (si OPEN)
DELETE /api/requests/:id                Annuler demande
PATCH  /api/requests/:id/accept         Accepter une proposition → crée un booking
```

### Proposals

```
POST   /api/requests/:id/proposals      Pro envoie une proposition
GET    /api/requests/:id/proposals      Liste propositions (pour le client)
GET    /api/proposals/mine              Mes propositions envoyées (pro)
PATCH  /api/proposals/:id               Modifier proposition
PATCH  /api/proposals/:id/withdraw      Retirer proposition
PATCH  /api/proposals/:id/shortlist     Client présélectionne
```

### Messaging

```
GET    /api/conversations               Mes conversations
POST   /api/conversations               Créer/trouver conversation (avec userId)
GET    /api/conversations/:id           Messages d'une conversation
POST   /api/conversations/:id/messages  Envoyer message
PATCH  /api/conversations/:id/read      Marquer comme lu
```

### Payments & Wallet

```
POST   /api/payments/initiate           Initier paiement MBiyo (deposit ou full)
POST   /api/payments/webhook            Callback MBiyo Pay (status update)
GET    /api/wallet                      Mon solde wallet
POST   /api/wallet/topup                Recharger wallet via mobile money
GET    /api/wallet/transactions          Historique transactions

# Provider payouts
POST   /api/provider/payout             Demander retrait
GET    /api/provider/payouts            Historique retraits
GET    /api/provider/earnings           Dashboard revenus
```

### Escrow

```
POST   /api/escrow/hold                 Bloquer fonds (auto à la réservation)
POST   /api/escrow/release              Libérer fonds au pro (auto à COMPLETED)
POST   /api/escrow/refund               Rembourser client (admin ou auto-cancel)
```

### Disputes

```
POST   /api/disputes                    Ouvrir un litige
GET    /api/disputes/:id                Détail litige
POST   /api/disputes/:id/messages       Ajouter pièces/messages
PATCH  /api/disputes/:id/resolve        Résoudre (admin)
```

### Notifications

```
GET    /api/notifications               Mes notifications
PATCH  /api/notifications/:id/read      Marquer comme lue
PATCH  /api/notifications/read-all      Tout marquer comme lu
POST   /api/notifications/register-push Enregistrer push token
```

### Upload

```
POST   /api/upload/image                Upload image → Cloudinary (retourne URL)
POST   /api/upload/images               Upload multiple images
DELETE /api/upload/image                 Supprimer image
```

### Admin (extensions)

```
# Verification KYC
GET    /api/admin/kyc/pending           Pros en attente de vérification
PATCH  /api/admin/kyc/:providerId       Approuver/rejeter KYC

# Disputes
GET    /api/admin/disputes              Liste litiges
PATCH  /api/admin/disputes/:id/resolve  Résoudre litige

# Commission & Config
GET    /api/admin/config                Lire config plateforme
PUT    /api/admin/config/:key           Modifier config

# Featured
POST   /api/admin/featured              Créer featured profile
GET    /api/admin/featured              Liste featured

# Analytics
GET    /api/admin/analytics/revenue     Revenus par période
GET    /api/admin/analytics/users       Croissance utilisateurs
GET    /api/admin/analytics/bookings    Volume réservations
GET    /api/admin/analytics/requests    Volume demandes
GET    /api/admin/analytics/geography   Répartition par ville
```

### WebSocket Events (Messaging temps réel)

```
# Client → Server
ws:join_conversation     { conversationId }
ws:send_message          { conversationId, text, type, imageUrl }
ws:typing                { conversationId }
ws:read_messages         { conversationId }

# Server → Client
ws:new_message           { message }
ws:typing_indicator      { conversationId, userId }
ws:messages_read         { conversationId, userId }
ws:notification          { notification }
ws:booking_update        { bookingId, status }
ws:new_proposal          { requestId, proposal }
```

---

# 5. App Mobile — Écrans & Navigation

## Structure expo-router

```
app/
├── _layout.tsx                       Root layout (Stack navigator)
├── index.tsx                         Redirect → /onboarding ou /(tabs)
├── onboarding.tsx                    ✅ FAIT — 3 slides swipeable
│
├── auth/
│   ├── login.tsx                     ✅ FAIT — Phone + OTP
│   └── register.tsx                  ✅ FAIT — Name + OTP confirmation
│
├── (tabs)/
│   ├── _layout.tsx                   ✅ FAIT — 4 tabs
│   ├── index.tsx                     ✅ FAIT — Explorer (search + categories + cards)
│   ├── bookings.tsx                  ✅ FAIT — Mes réservations
│   ├── messages.tsx                  À REFAIRE — Liste conversations
│   └── profile.tsx                   ✅ FAIT — Profil + menu
│
├── explore/
│   └── map.tsx                       À CRÉER — Vue carte avec providers
│
├── provider/
│   └── [slug].tsx                    ✅ FAIT — Profil public pro
│
├── booking/
│   ├── [providerId].tsx              ✅ FAIT — Flow réservation
│   └── detail/
│       └── [id].tsx                  ✅ FAIT — Détail réservation
│
├── request/                          *** À CRÉER — Mode Upwork ***
│   ├── create.tsx                    Créer une demande (photos, description, budget)
│   ├── [id].tsx                      Détail demande + propositions reçues
│   └── my-requests.tsx               Mes demandes
│
├── conversation/                     *** À CRÉER — Messaging ***
│   └── [id].tsx                      Chat avec un pro/client
│
├── camera/                           *** À CRÉER — AI Features (Phase 3) ***
│   ├── try-on.tsx                    AR try-on (maquillage, coiffure)
│   └── capture.tsx                   Capture selfie pour demande
│
├── wallet/                           *** À CRÉER — Paiement ***
│   ├── index.tsx                     Mon portefeuille + solde
│   ├── topup.tsx                     Recharger via mobile money
│   └── transactions.tsx              Historique
│
├── provider-dashboard/
│   ├── services.tsx                  ✅ FAIT — Gestion services
│   ├── availability.tsx              ✅ FAIT — Gestion dispo
│   ├── earnings.tsx                  ✅ FAIT — Dashboard revenus
│   ├── requests.tsx                  À CRÉER — Demandes ouvertes à répondre
│   ├── proposals.tsx                 À CRÉER — Mes propositions envoyées
│   ├── clients.tsx                   À CRÉER — Liste clients
│   └── payout.tsx                    À CRÉER — Retrait argent
│
├── settings/
│   ├── index.tsx                     À CRÉER — Paramètres
│   ├── edit-profile.tsx              À CRÉER — Modifier profil
│   └── notifications.tsx             À CRÉER — Préférences notifs
│
└── dispute/
    └── [bookingId].tsx               À CRÉER — Ouvrir/suivre litige
```

## Design System Mobile

```typescript
// src/theme/colors.ts (✅ EXISTANT)
export const colors = {
  primary: '#E07A5F',      // Terracotta
  primaryDark: '#C96B52',
  primaryLight: '#F0A78D',
  accent: '#3D405B',       // Navy
  bg: '#FAFAF8',           // Warm off-white
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: 'rgba(0,0,0,0.08)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  star: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
};
```

| Élément | Valeur |
|---------|--------|
| Mode | **Light only** |
| Font | System (San Francisco / Roboto) |
| Border radius | 12-16px cartes, 100px chips/badges |
| Padding écrans | 20px horizontal |
| Spacing | 8px grid |
| Shadows | Subtiles, 0 2px 8px rgba(0,0,0,0.06) |
| Icônes | Emoji (existant) → migrer vers `@expo/vector-icons` (Ionicons) |

---

# 6. Admin Dashboard

## Pages Next.js (`apps/admin/src/app/`)

```
/                           Dashboard principal (stats, graphiques)
/providers                  Liste providers + filtres (status, city, verified)
/providers/[id]             Détail provider + actions (approuver, suspendre)
/providers/kyc              File d'attente vérification KYC
/bookings                   Liste bookings + filtres (status, date, city)
/bookings/[id]              Détail booking
/requests                   Beauty requests actives
/disputes                   Litiges ouverts + historique
/disputes/[id]              Détail litige + résolution
/payments                   Transactions, revenus plateforme
/payouts                    Demandes de retrait en attente
/users                      Liste clients
/config                     Configuration plateforme (commissions, limites)
/featured                   Gestion profils mis en avant
/analytics                  Graphiques détaillés (revenus, growth, géo)
/notifications              Envoi de notifications broadcast
```

## Dashboard Principal — KPIs

| KPI | Description |
|-----|-------------|
| **GMV** | Volume total des transactions |
| **Revenue** | Commissions perçues |
| **Active Providers** | Pros actifs (≥1 booking/30j) |
| **Active Clients** | Clients actifs (≥1 booking/30j) |
| **Bookings/day** | Volume quotidien |
| **Requests/day** | Demandes Upwork |
| **Avg Rating** | Note moyenne plateforme |
| **Dispute Rate** | % bookings en litige |
| **Conversion Rate** | Recherches → bookings |
| **Take Rate** | Commission effective |

---

# 7. Système de Paiement & Escrow

## Flow de paiement (Mode Local — Booking direct)

```
1. Client réserve → Booking REQUESTED
2. Pro confirme → Booking CONFIRMED
3. Client paie le dépôt (30%) via MBiyo Pay
   → PaymentIntent CREATED → PENDING → PAID
   → EscrowHold HELD (montant total)
   → Booking DEPOSIT_PAID
4. Service effectué → Pro marque IN_PROGRESS
5. Service terminé → Pro marque COMPLETED
   → EscrowHold RELEASED
   → Commission déduite (12%)
   → ProviderWallet crédité (88%)
6. Si litige → EscrowHold DISPUTED
   → Admin résout → RELEASED ou REFUNDED
```

## Flow de paiement (Mode Demande — Upwork style)

```
1. Client poste demande → BeautyRequest OPEN
2. Pros envoient propositions → Proposal PENDING
3. Client accepte une proposition
   → BeautyRequest ACCEPTED
   → Booking créé automatiquement
   → Client paie le montant total en escrow
   → EscrowHold HELD
4. Service effectué → Pro marque COMPLETED
   → EscrowHold RELEASED (même flow que Mode Local)
```

## Intégration MBiyo Pay

```typescript
// apps/api/src/lib/mbiyopay.ts (À CRÉER — même pattern que bongi-os)

interface MBiyoPayConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;        // https://api.mbiyopay.com
  callbackUrl: string;    // https://api.tokoss.com/api/payments/webhook
}

interface InitiatePaymentParams {
  amount: number;
  currency: 'CDF' | 'XAF';
  phone: string;          // Numéro mobile money du payeur
  provider: 'ORANGE' | 'MTN' | 'AIRTEL' | 'MPESA' | 'WAVE';
  reference: string;      // Booking ref
  description: string;
}

// Détection automatique du réseau par préfixe téléphonique
// +243 (RDC): 81/82/83 = Vodacom/M-Pesa, 84/85 = Airtel, 89/99 = Orange
// +237 (Cameroun): 65/66/67 = MTN, 69 = Orange
// +241 (Gabon): 06/07 = Airtel
// +225 (Côte d'Ivoire): 05/07 = Orange, 04/06 = MTN, Wave
// +221 (Sénégal): 77/78 = Orange, 76 = Free, Wave
```

## Commission Structure

| Élément | Valeur | Configurable |
|---------|--------|--------------|
| Commission par booking | **12%** | Oui (PlatformConfig) |
| Frais de paiement MBiyo | **~2%** (facturé au client) | Non |
| Minimum retrait (CDF) | 5 000 FC | Oui |
| Minimum retrait (XAF) | 500 FCFA | Oui |
| Délai escrow (auto-release) | 48h après COMPLETED | Oui |
| Dépôt obligatoire | 30% du prix | Oui |

---

# 8. Messaging en Temps Réel

## Architecture

```
Mobile App ←→ WebSocket Server (Socket.io) ←→ Redis Pub/Sub ←→ API Server
                     │
                     ├── Persiste messages en DB (PostgreSQL)
                     ├── Envoie push notification si offline
                     └── Envoie WhatsApp si hors-app depuis >30min
```

## Règles métier

| Règle | Détail |
|-------|--------|
| Qui peut chatter | Client ↔ Pro uniquement (pas entre clients) |
| Quand créer une conversation | Au premier message, ou automatiquement à la création d'un booking/proposition |
| Photos dans le chat | Oui (upload Cloudinary, URL dans message) |
| Booking cards | Message système avec résumé booking cliquable |
| Indicateur de frappe | Via WebSocket `typing` event |
| Notifications | Push immédiat si app fermée, WhatsApp si offline >30min |
| Historique | Persisté indéfiniment |
| Modération | Admin peut lire les conversations en cas de dispute |

## App WebSocket (`apps/ws/`) — À CRÉER

```typescript
// Serveur Socket.io séparé (ou intégré à l'API Express)
// Authentification par JWT (même token que l'API REST)
// Redis adapter pour scaling horizontal

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

// Events :
// connection → auth JWT → join rooms (user:userId, conversation:convId)
// send_message → persist to DB → broadcast to room → push notification
// typing → broadcast to room (debounced)
// read → update readAt → broadcast
```

---

# 9. Notifications

## Canaux par priorité

| Priorité | Canal | Usage | Outil |
|----------|-------|-------|-------|
| **1** | **WhatsApp** | Confirmations booking, rappels, propositions | WhatsApp Business API |
| **2** | **Push** | Messages chat, updates en temps réel | Expo Notifications (FCM/APNs) |
| **3** | **SMS** | OTP, fallback si pas WhatsApp | Africa's Talking |
| **4** | **In-App** | Toutes notifications + badge | Stockées en DB |

## Types de notifications

| Event | WhatsApp | Push | SMS | In-App |
|-------|----------|------|-----|--------|
| OTP envoyé | - | - | ✅ | - |
| Nouvelle réservation (pro) | ✅ | ✅ | - | ✅ |
| Réservation confirmée (client) | ✅ | ✅ | - | ✅ |
| Rappel RDV (J-1) | ✅ | ✅ | - | ✅ |
| Rappel RDV (H-2) | - | ✅ | - | ✅ |
| Nouvelle demande matching (pro) | ✅ | ✅ | - | ✅ |
| Nouvelle proposition (client) | - | ✅ | - | ✅ |
| Proposition acceptée (pro) | ✅ | ✅ | - | ✅ |
| Nouveau message | - | ✅ | - | ✅ |
| Paiement reçu | ✅ | ✅ | - | ✅ |
| Retrait effectué | ✅ | - | ✅ | ✅ |
| Nouvel avis (pro) | - | ✅ | - | ✅ |
| Litige ouvert | ✅ | ✅ | - | ✅ |
| Litige résolu | ✅ | ✅ | - | ✅ |

## Templates WhatsApp

```
# Booking confirmé
🎉 Votre RDV Tokoss est confirmé !
📍 {service_name} avec {provider_name}
📅 {date} à {time}
📍 {location}
💰 {price} {currency}

Voir détails : {deep_link}

# Rappel J-1
⏰ Rappel : RDV demain !
💇 {service_name} avec {provider_name}
📅 {date} à {time}
📍 {location}

# Nouvelle demande (pour les pros)
📣 Nouvelle demande beauté près de vous !
💇 {category} — {title}
💰 Budget : {budget_min}-{budget_max} {currency}
📍 {city}

Répondre : {deep_link}
```

---

# 10. Beauty Requests (Mode Upwork)

## Flow complet

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client   │     │   Platform   │     │    Pros      │
└──────┬───┘     └──────┬───────┘     └──────┬───────┘
       │                │                     │
       │ 1. Crée demande│                     │
       │ (photos, desc, │                     │
       │  budget, date) │                     │
       ├───────────────►│                     │
       │                │ 2. Notifie pros     │
       │                │ matchés (ville,     │
       │                │ catégorie, dispo)   │
       │                ├────────────────────►│
       │                │                     │
       │                │ 3. Pro envoie       │
       │                │ proposition         │
       │                │◄────────────────────┤
       │                │                     │
       │ 4. Client voit │                     │
       │ propositions   │                     │
       │◄───────────────┤                     │
       │                │                     │
       │ 5. Client      │                     │
       │ accepte        │                     │
       ├───────────────►│                     │
       │                │ 6. Booking créé     │
       │                │ automatiquement     │
       │                ├────────────────────►│
       │                │                     │
       │ 7. Paiement    │                     │
       │ escrow         │                     │
       ├───────────────►│                     │
       │                │                     │
       │        [Service effectué]            │
       │                │                     │
       │                │ 8. Escrow libéré    │
       │                ├────────────────────►│
       │                │                     │
```

## Matching Algorithm (Pros notifiés)

Quand un client poste une demande, le système notifie les pros qui matchent :

```typescript
function findMatchingProviders(request: BeautyRequest): Provider[] {
  return providers.filter(p =>
    p.status === 'ACTIVE' &&
    p.city === request.city &&
    p.services.some(s => s.categoryId === request.categoryId) &&
    (request.locationType === 'FLEXIBLE' ||
      (request.locationType === 'CLIENT' && p.isMobile) ||
      (request.locationType === 'PROVIDER'))
  ).sort((a, b) => {
    // Score de matching :
    // 1. Distance (si lat/lng disponibles)
    // 2. Rating moyen
    // 3. Taux de réponse
    // 4. Nombre de bookings
    const scoreA = computeMatchScore(a, request);
    const scoreB = computeMatchScore(b, request);
    return scoreB - scoreA;
  });
}

function computeMatchScore(provider: Provider, request: BeautyRequest): number {
  let score = 0;
  score += provider.avgRating * 20;           // Max 100
  score += provider.responseRate * 50;         // Max 50
  score += Math.min(provider.totalBookings, 50); // Max 50
  if (request.locationLat && provider.lat) {
    const dist = haversineDistance(request.locationLat, request.locationLng!, provider.lat, provider.lng!);
    score += Math.max(0, 50 - dist * 5);       // Bonus proximité
  }
  return score;
}
```

## UI — Écran création demande

```
┌─────────────────────────────────┐
│ ← Nouvelle demande              │
├─────────────────────────────────┤
│                                 │
│  Catégorie : [Coiffure ▼]      │
│                                 │
│  Titre :                        │
│  [Tresses pour mon mariage    ] │
│                                 │
│  Description :                  │
│  [Je veux des tresses collées  ]│
│  [mi-longues avec des rajouts  ]│
│  [châtain. C'est pour un       ]│
│  [mariage le 15 avril.        ]│
│                                 │
│  📸 Photos d'inspiration        │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ +  │ │img1│ │img2│ │img3│  │
│  └────┘ └────┘ └────┘ └────┘  │
│                                 │
│  📸 Mon selfie (optionnel)      │
│  ┌────────────┐                 │
│  │  📷 Prendre │                │
│  └────────────┘                 │
│                                 │
│  💰 Budget                      │
│  [5 000] FC — [15 000] FC      │
│                                 │
│  📅 Date souhaitée              │
│  [15 avril 2026]  ☐ Flexible   │
│                                 │
│  📍 Lieu                        │
│  ○ Chez moi  ● Chez le pro     │
│  ○ Peu importe                  │
│  [Gombe, Kinshasa            ] │
│                                 │
│  ┌─────────────────────────────┐│
│  │     Publier ma demande      ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

# 11. AI & Camera Features

## Phase 3+ — Roadmap AI

| Feature | Technologie | Complexité | Priorité |
|---------|-------------|-----------|----------|
| **Capture selfie pour demande** | `expo-camera` | Faible | Phase 2 |
| **Upload photo d'inspiration** | `expo-image-picker` + Cloudinary | Faible | Phase 2 |
| **Matching style par image** | Image tagging (Cloudinary AI Tags ou Google Vision) | Moyenne | Phase 2 |
| **Prix estimé par photo** | ML model sur données internes | Moyenne | Phase 3 |
| **Virtual try-on maquillage** | MediaPipe Face Mesh + WebGL overlay | Élevée | Phase 3 |
| **Virtual try-on coiffure/tresses** | Generative AI (Stable Diffusion / custom model) | Très élevée | Phase 4 |
| **Virtual try-on ongles** | Hand detection + overlay | Élevée | Phase 4 |
| **Recommandation auto de pros** | Collaborative filtering sur bookings | Moyenne | Phase 3 |

## Architecture AI (Phase 3)

```
Mobile (expo-camera)
  → Capture selfie / photo
  → Upload Cloudinary
  → API call /api/ai/try-on

API /api/ai/try-on
  → Envoie image à service ML
  → Service ML : MediaPipe face mesh + style overlay
  → Retourne image modifiée
  → Client voit le résultat

API /api/ai/match-style
  → Image d'inspiration envoyée
  → Cloudinary AI Tags (ou Google Vision API)
  → Tags : ["tresses", "collées", "mi-longues", "châtain"]
  → Recherche providers avec portfolio tagué similairement
  → Retourne providers matchés
```

## Stack AI recommandée

| Composant | Outil | Coût |
|-----------|-------|------|
| Face detection | MediaPipe (gratuit, on-device) | Gratuit |
| Image tagging | Cloudinary AI Tags | Inclus dans plan |
| Style transfer | Replicate API (Stable Diffusion) | ~$0.01/image |
| Hair try-on | Custom model (fine-tuned sur cheveux afro) | Développement custom |
| Nail detection | MediaPipe Hands | Gratuit |

---

# 12. Maps & Géolocalisation

## Intégration mobile

```typescript
// Packages nécessaires :
// expo-location — Permission + GPS device
// react-native-maps — Carte MapView + Markers
// @react-native-community/geolocation — Fallback

// Écran explore/map.tsx
// - MapView plein écran
// - Markers pour chaque provider (clustered)
// - Bottom sheet avec liste scrollable
// - Filtre par catégorie sur la carte
// - "Recentrer sur moi" button
// - Search bar overlay
```

## Fonctionnalités GPS

| Feature | Usage | Implémentation |
|---------|-------|----------------|
| **Position client** | Recherche "près de moi" | `expo-location` → lat/lng → API search |
| **Carte providers** | Visualisation géographique | `react-native-maps` MapView + Markers |
| **Location picker** | Choisir adresse pour RDV | Map tap → reverse geocoding → adresse |
| **Distance calcul** | Affichage "2.3 km" | Haversine (déjà dans `@tokoss/shared`) |
| **Zones de service** | Rayon de déplacement du pro | Cercle sur la carte (mobileRadius) |
| **Directions** | Itinéraire vers salon/client | Deep link Google Maps / Yango / InDrive |
| **Geocoding** | Adresse → lat/lng | Google Geocoding API |
| **Reverse geocoding** | lat/lng → adresse | Google Geocoding API |

---

# 13. Upload & Médias (Cloudinary)

## Configuration

```typescript
// apps/api/src/lib/cloudinary.ts (À CRÉER)
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload avec transformations automatiques
async function uploadImage(file: Buffer, folder: string): Promise<string> {
  const result = await cloudinary.uploader.upload(
    `data:image/jpeg;base64,${file.toString('base64')}`,
    {
      folder: `tokoss/${folder}`,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'webp' },
      ],
    }
  );
  return result.secure_url;
}
```

## Dossiers Cloudinary

| Dossier | Usage | Taille max | Transformations |
|---------|-------|-----------|-----------------|
| `tokoss/avatars/` | Photos profil | 500x500 | Crop circle, quality auto |
| `tokoss/portfolios/` | Portfolio pro | 1200x1200 | Quality auto, webp |
| `tokoss/requests/` | Photos demandes | 1200x1200 | Quality auto, webp |
| `tokoss/messages/` | Photos chat | 1200x1200 | Quality auto, webp |
| `tokoss/reviews/` | Photos avis | 1200x1200 | Quality auto, webp |
| `tokoss/kyc/` | Documents vérification | Originale | Pas de compression |

---

# 14. Sécurité & KYC

## Authentification

| Couche | Mécanisme |
|--------|-----------|
| **Login** | Phone + OTP (4 digits, expire 5min) |
| **Token** | JWT (15min lifetime) + Refresh Token (30j) |
| **API** | `Authorization: Bearer <jwt>` sur toutes les routes protégées |
| **Admin** | Email + password (bcrypt) + JWT séparé |
| **Rate limiting** | 100 req/min global, 5 OTP/phone/heure |

## KYC Providers

| Étape | Données | Vérification |
|-------|---------|-------------|
| **1. Inscription** | Phone + Name | OTP automatique |
| **2. Profil pro** | DisplayName, city, services, photo | Manuel (admin review) |
| **3. Identité** | Photo pièce d'identité (recto/verso) | Manuel (admin compare photo + selfie) |
| **4. Badge vérifié** | ✅ Badge affiché sur le profil | `idVerified = true` |

## Sécurité données

| Mesure | Détail |
|--------|--------|
| **HTTPS** | Obligatoire partout |
| **Helmet.js** | Headers sécurité (déjà en place) |
| **CORS** | Origins whitelist (déjà en place) |
| **Input validation** | Zod schemas sur toutes les routes (déjà en place) |
| **SQL injection** | Prisma (parameterized queries par défaut) |
| **Rate limiting** | express-rate-limit (déjà en place) |
| **Secrets** | Variables d'environnement, jamais dans le code |
| **Passwords admin** | bcrypt hash |
| **Refresh tokens** | Révocables, expiration 30j |
| **File uploads** | Validation MIME type, taille max 10MB |
| **Chat modération** | Admin accès en cas de dispute |

## Sécurité home services

| Mesure | Détail |
|--------|--------|
| **ID vérifié** | Badge pour les pros vérifiés |
| **Partage de position** | Client/pro peuvent partager position live |
| **Contact d'urgence** | Bouton "urgence" dans le booking actif |
| **Historique** | Toutes les interactions tracées |
| **Avis obligatoire** | Encouragé après chaque service |

---

# 15. Infrastructure & Déploiement

## Environnements

| Env | API | DB | Mobile | Admin |
|-----|-----|----|--------|-------|
| **Dev** | localhost:3001 | Railway (dev) | Expo Go (localhost) | localhost:3002 |
| **Staging** | api-staging.tokoss.com | Railway (staging) | Expo Preview Build | staging.tokoss.com |
| **Production** | api.tokoss.com | Railway (prod) | App Store / Play Store | admin.tokoss.com |

## Services Cloud

| Service | Provider | Usage | Coût estimé (MVP) |
|---------|----------|-------|-------------------|
| **PostgreSQL** | Railway | Base de données principale | $5-20/mois |
| **API hosting** | Railway | Express server | $5-20/mois |
| **Redis** | Upstash | OTP, cache, pub/sub, BullMQ | $0-10/mois |
| **Images** | Cloudinary | Upload, CDN, transformations | $0-89/mois (free tier 25K) |
| **Admin hosting** | Netlify | Static export Next.js | Gratuit |
| **SMS** | Africa's Talking | OTP, notifications | ~$0.02/SMS |
| **WhatsApp** | 360dialog / Meta | Notifications | ~$0.05/message |
| **Push** | Expo (FCM/APNs) | Push notifications | Gratuit |
| **Domain** | Namecheap | tokoss.com | $10/an |
| **SSL** | Let's Encrypt / Railway | HTTPS | Gratuit |
| **Monitoring** | Sentry | Error tracking | Free tier |
| **Total MVP** | — | — | **~$50-150/mois** |

## CI/CD

```
GitHub → GitHub Actions
  ├── On push to main:
  │   ├── Lint + Type check
  │   ├── Run tests
  │   └── Deploy API to Railway
  │   └── Deploy Admin to Netlify
  │
  └── On tag (v*):
      └── EAS Build (Expo) → App Store / Play Store
```

## Scaling Strategy

| Phase | Users | Architecture |
|-------|-------|-------------|
| MVP (0-1K) | < 1 000 | Single Railway instance, single DB |
| Growth (1K-10K) | 1 000-10 000 | Railway auto-scale, Redis cache, CDN |
| Scale (10K-100K) | 10 000-100 000 | Multiple regions, read replicas, dedicated Redis, BullMQ workers |
| Mass (100K+) | 100 000+ | Kubernetes, PostGIS, dedicated ML services, multi-region DB |

---

# 16. État Actuel vs. Cible

## Légende
- ✅ = Fait et fonctionnel
- 🟡 = Partiellement fait (UI ou API, pas les deux)
- ❌ = Pas commencé

## Résumé

| Module | État | Priorité | Effort estimé |
|--------|------|----------|--------------|
| **Auth (OTP + JWT)** | ✅ API, 🟡 Mobile (UI faite, pas connectée) | P0 | 2j pour connecter |
| **Search + Explorer** | ✅ API, 🟡 Mobile (mock data) | P0 | 2j pour connecter |
| **Provider profil public** | ✅ API, 🟡 Mobile (scaffold) | P0 | 2j pour connecter |
| **Booking flow** | ✅ API (conflict detection, state machine), 🟡 Mobile | P0 | 3j pour connecter |
| **Booking history** | ✅ API, 🟡 Mobile | P0 | 1j pour connecter |
| **Reviews** | ✅ API + Schema | P1 | 2j (UI + connect) |
| **Favorites** | ✅ API + Schema | P1 | 1j (UI + connect) |
| **Categories** | ✅ API + Seed | ✅ Fait | — |
| **Provider dashboard** | ✅ API, 🟡 Mobile (3 screens scaffold) | P1 | 3j pour connecter |
| **Provider registration** | ✅ API | P1 | 2j (UI + connect) |
| **Image upload (Cloudinary)** | ❌ | P1 | 3j |
| **Map view** | ❌ | P1 | 3j |
| **GPS location picker** | ❌ | P1 | 2j |
| **Beauty Requests (Upwork)** | ❌ | P1 | 7-10j (schema + API + UI) |
| **Proposals** | ❌ | P1 | 5j (schema + API + UI) |
| **Messaging** | ❌ | P2 | 7j (schema + API + WebSocket + UI) |
| **MBiyo Pay integration** | ❌ | P2 | 5j |
| **Escrow system** | ❌ | P2 | 3j |
| **Client wallet** | ❌ | P2 | 3j |
| **WhatsApp notifications** | ❌ | P2 | 3j |
| **Push notifications** | ❌ | P2 | 2j |
| **SMS OTP (Africa's Talking)** | ❌ | P2 | 2j |
| **Dispute system** | ❌ | P2 | 3j |
| **Admin dashboard (full)** | ❌ (shell only) | P2 | 7j |
| **KYC verification** | ❌ | P2 | 3j |
| **Featured profiles** | ❌ | P3 | 2j |
| **Provider subscriptions** | ❌ | P3 | 3j |
| **Commission management** | ❌ | P3 | 2j |
| **AI camera try-on** | ❌ | P4 | 15-30j |
| **AI style matching** | ❌ | P4 | 10j |
| **AI price estimation** | ❌ | P4 | 10j |

---

# 17. Plan d'Exécution par Phases

## Phase 1 — Core Loop (Semaines 1-4)
> **Objectif :** App fonctionnelle avec booking direct (Mode Treatwell)

### Semaine 1-2 : Connecter Mobile ↔ API
- [ ] Auth context réel (OTP send → verify → JWT → auto-refresh)
- [ ] API client avec interceptors (token, error handling, retry)
- [ ] Explorer : remplacer mock par appels API `/search`
- [ ] Provider profil public : appel API `/search/providers/:slug`
- [ ] Booking flow : appel API `/bookings` (créer, lister, détail)
- [ ] Booking status transitions (confirmer, compléter, annuler)
- [ ] Reviews : post + affichage
- [ ] Favorites : toggle + liste

### Semaine 3 : Maps & Location
- [ ] Installer `react-native-maps` + `expo-location`
- [ ] Écran carte avec providers (markers)
- [ ] Location picker pour bookings (tap sur carte ou recherche adresse)
- [ ] "Près de moi" avec GPS device
- [ ] Distance affichée sur les cards providers

### Semaine 4 : Images & Portfolio
- [ ] Backend Cloudinary (upload route)
- [ ] Upload avatar profil (client + provider)
- [ ] Upload portfolio provider (multiple images)
- [ ] Affichage portfolio sur profil public
- [ ] Upload photo review

## Phase 2A — Mode Upwork (Semaines 5-7)
> **Objectif :** Beauty Requests + Proposals fonctionnels

### Semaine 5 : Backend Requests & Proposals
- [ ] Nouveaux modèles Prisma (BeautyRequest, Proposal)
- [ ] Migration DB
- [ ] Routes API requests (CRUD, accept, expire)
- [ ] Routes API proposals (create, withdraw, shortlist)
- [ ] Auto-create booking quand proposition acceptée
- [ ] Matching algorithm (notifier pros pertinents)

### Semaine 6-7 : Mobile Requests & Proposals
- [ ] Écran création demande (photos, description, budget, date, lieu)
- [ ] Capture selfie (`expo-camera`)
- [ ] Liste "Mes demandes" (client)
- [ ] Détail demande + propositions reçues
- [ ] Accept/reject propositions
- [ ] Côté pro : liste demandes ouvertes dans sa zone
- [ ] Côté pro : envoyer proposition (prix, message, portfolio samples)
- [ ] Côté pro : "Mes propositions" historique

## Phase 2B — Messaging (Semaine 8)
> **Objectif :** Chat temps réel client ↔ provider

- [ ] Modèles Prisma (Conversation, Message)
- [ ] API REST conversations + messages
- [ ] WebSocket server (Socket.io) ou polling court-terme
- [ ] UI chat (bulles, images, typing indicator)
- [ ] Création auto de conversation à booking/proposal
- [ ] Push notification sur nouveau message

## Phase 2C — Paiements (Semaines 9-10)
> **Objectif :** Mobile Money + Escrow fonctionnels

### Semaine 9 : MBiyo Pay + Wallet
- [ ] Intégration MBiyo Pay (initiate, webhook, status check)
- [ ] Client wallet (topup, balance, transactions)
- [ ] Payment flow dans le booking (deposit 30%)
- [ ] Détection auto réseau par préfixe téléphonique

### Semaine 10 : Escrow + Payouts
- [ ] Escrow system (hold à booking, release à completion)
- [ ] Commission déduite automatiquement (12%)
- [ ] Provider wallet crédité
- [ ] Demande de retrait (payout vers mobile money)
- [ ] Admin : vue des paiements + payouts

## Phase 2D — Notifications (Semaine 11)
- [ ] Push notifications (Expo Notifications + FCM/APNs)
- [ ] Enregistrement push token
- [ ] WhatsApp Business API (booking confirmé, rappel, paiement)
- [ ] SMS OTP via Africa's Talking (remplacer in-memory store)
- [ ] In-app notifications (liste + badges)
- [ ] Redis pour OTP store (remplacer Map en mémoire)

## Phase 3 — Admin + Polish (Semaines 12-14)
> **Objectif :** Admin dashboard complet + production-ready

### Semaine 12-13 : Admin Dashboard
- [ ] Dashboard KPIs (GMV, revenue, users, bookings, graph)
- [ ] Gestion providers (liste, détail, approve/suspend)
- [ ] KYC pipeline (documents, approve/reject)
- [ ] Gestion bookings + requests
- [ ] Dispute management (voir, résoudre, rembourser)
- [ ] Config plateforme (commissions, limites)
- [ ] Analytics (revenus par ville, croissance, conversion)

### Semaine 14 : Polish
- [ ] Migrer icônes emoji → Ionicons
- [ ] Loading states + skeletons partout
- [ ] Error handling UX (retry, offline)
- [ ] Onboarding amélioré (permissions location, notifications)
- [ ] Deep links (WhatsApp → app)
- [ ] App Store / Play Store assets (screenshots, description)
- [ ] Sentry error tracking

## Phase 4 — AI & Growth (Semaines 15+)
> **Objectif :** Fonctionnalités différenciantes

- [ ] AI style tagging (Cloudinary AI ou Google Vision)
- [ ] Matching photo → providers avec portfolio similaire
- [ ] Prix estimé par photo de référence
- [ ] Camera AR try-on maquillage (MediaPipe Face Mesh)
- [ ] Camera AR try-on coiffure (modèle custom)
- [ ] Featured profiles + boost payant
- [ ] Provider subscriptions (Pro, Premium)
- [ ] Promotions et codes promo
- [ ] Programme de parrainage
- [ ] Multi-langue (FR, Lingala, Pidgin)
- [ ] Expansion villes (Abidjan, Dakar, Nairobi, Lagos)

---

# Annexes

## Variables d'environnement requises

```env
# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=15m
DEMO_OTP=1234

# MBiyo Pay
MBIYOPAY_API_KEY=...
MBIYOPAY_SECRET_KEY=...
MBIYOPAY_BASE_URL=https://api.mbiyopay.com
MBIYOPAY_CALLBACK_URL=https://api.tokoss.com/api/payments/webhook

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Africa's Talking (SMS)
AT_API_KEY=...
AT_USERNAME=...
AT_SENDER_ID=Tokoss

# WhatsApp Business
WHATSAPP_API_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...

# Redis
REDIS_URL=redis://...

# Expo Push
EXPO_ACCESS_TOKEN=...

# Sentry
SENTRY_DSN=...

# Google Maps
GOOGLE_MAPS_API_KEY=...
```

## Commandes de développement

```bash
# Installation
pnpm install

# Base de données
pnpm db:generate          # Générer Prisma client
pnpm db:push              # Push schema vers DB
pnpm db:seed              # Seed données de test
pnpm db:studio            # Ouvrir Prisma Studio

# Développement
cd apps/api && pnpm dev    # API sur port 3001
cd apps/mobile && npx expo start  # Mobile sur port 8081
cd apps/admin && pnpm dev  # Admin sur port 3002

# Build
cd apps/mobile && eas build --platform all  # Build mobile
cd apps/admin && pnpm build   # Build admin (static export)
```

---

*Spécification technique Tokoss v1.0 — Mars 2026*
*Ce document est la source de vérité pour tout le développement de la plateforme.*
