# Remove Emojis — Replace with Tabler Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all hardcoded emoji characters from the Karysm mobile app source files, replacing functional ones with Tabler icons and deleting decorative ones.

**Architecture:** Two passes — (1) pure removal of decorative/caption emoji, (2) surgical replacement of functional emoji with Tabler icon components using the project's individual import convention. No new abstractions; changes are localized to each file.

**Tech Stack:** React Native, `@tabler/icons-react-native` (individual imports from `dist/esm/icons/IconName.mjs`), TypeScript.

**Import convention — mandatory for every Tabler icon:**
```ts
import { IconFoo } from '@tabler/icons-react-native/dist/esm/icons/IconFoo.mjs';
```
Never use the barrel import (`from '@tabler/icons-react-native'`) — it adds 5 MB to the bundle.

---

## Files modified

| File | Change |
|------|--------|
| `apps/mobile/app/(tabs)/index.tsx` | Remove 👋 greeting; replace ★ stars with `IconStar` |
| `apps/mobile/app/(tabs)/lookbook.tsx` | Remove ✨ and 🤎 from caption strings |
| `apps/mobile/app/(tabs)/beauty.tsx` | Replace tips icons (💧☀️🌿🧴) with Tabler; replace 📖 with `IconBook`; replace › with `IconChevronRight` |
| `apps/mobile/app/(tabs)/profile.tsx` | Refactor `MenuItem` to accept `icon: React.ReactNode`; replace all emoji props with Tabler icons; replace 📷 camera with `IconCamera` |
| `apps/mobile/app/provider-register.tsx` | Replace 📷 camera placeholder with `IconCamera` |
| `apps/mobile/app/request/browse.tsx` | Remove `CATEGORY_ICONS` emoji map + icon `<Text>` nodes; replace 📋 💰 📍 📅 inline with Tabler |
| `apps/mobile/app/request/create.tsx` | Remove `CATEGORY_ICONS` emoji map + icon `<Text>` nodes; replace ✕ 📸 📷 ✅ with Tabler |
| `apps/mobile/src/components/BeforeAfter.tsx` | Replace → with `IconArrowRight` |
| `apps/mobile/src/components/Header.tsx` | Replace ‹ with `IconChevronLeft` |
| `apps/mobile/src/components/ProviderCard.tsx` | Replace ★ with `IconStar`; replace ♥/♡ with `IconHeart`/`IconHeartOff` |
| `apps/mobile/src/components/Rating.tsx` | Replace ★ with `IconStar` |
| `apps/mobile/src/components/SearchBar.tsx` | Replace × with `IconX` |
| `apps/mobile/src/components/SectionHeader.tsx` | Replace › with `IconChevronRight` |

---

## Task 1 — Remove decorative caption emoji

**Files:**
- Modify: `apps/mobile/app/(tabs)/index.tsx:290`
- Modify: `apps/mobile/app/(tabs)/lookbook.tsx:59,63`

- [ ] **Step 1: Edit index.tsx greeting — remove the 👋 emoji**

In `apps/mobile/app/(tabs)/index.tsx` at line 290, change:
```tsx
{user?.name ? `Salut, ${user.name.split(' ')[0]}` : 'Salut'} {'👋'}
```
to:
```tsx
{user?.name ? `Salut, ${user.name.split(' ')[0]}` : 'Salut'}
```

- [ ] **Step 2: Edit lookbook.tsx — remove ✨ from caption on line 59**

Change:
```ts
caption: 'Tresses collées avec perles dorées ✨',
```
to:
```ts
caption: 'Tresses collées avec perles dorées',
```

- [ ] **Step 3: Edit lookbook.tsx — remove 🤎 from caption on line 63**

Change:
```ts
caption: 'Box braids mi-longueur couleur caramel 🤎',
```
to:
```ts
caption: 'Box braids mi-longueur couleur caramel',
```

- [ ] **Step 4: Verify in browser — open http://localhost:8081, navigate to Home and Lookbook tab. Greeting should show "Salut, [name]" with no emoji. Captions should end cleanly.**

- [ ] **Step 5: Commit**
```bash
git add apps/mobile/app/\(tabs\)/index.tsx apps/mobile/app/\(tabs\)/lookbook.tsx
git commit -m "chore: remove decorative emoji from greeting and lookbook captions"
```

---

## Task 2 — Replace ★ star emoji with IconStar

**Files:**
- Modify: `apps/mobile/src/components/Rating.tsx`
- Modify: `apps/mobile/src/components/ProviderCard.tsx`
- Modify: `apps/mobile/app/(tabs)/index.tsx:664,771`

- [ ] **Step 1: Update Rating.tsx**

Replace entire file content:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';
import { IconStar } from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';

type RatingSize = 'sm' | 'md';

interface RatingProps {
  rating: number;
  reviewCount?: number;
  size?: RatingSize;
}

export default function Rating({ rating, reviewCount, size = 'md' }: RatingProps) {
  const isSm = size === 'sm';

  return (
    <View style={styles.container}>
      <IconStar size={isSm ? 14 : 16} color={colors.star} fill={colors.star} />
      <Text style={[styles.rating, { fontSize: isSm ? 12 : 14 }]}>
        {rating.toFixed(1)}
      </Text>
      {reviewCount != null ? (
        <Text style={[styles.count, { fontSize: isSm ? 11 : 12 }]}>
          ({reviewCount})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontFamily: fonts.bodyBold,
    color: colors.n900,
  },
  count: {
    fontFamily: fonts.body,
    color: colors.terracotta,
  },
});
```

- [ ] **Step 2: Update ProviderCard.tsx — add import and replace ★ and ♥/♡**

Add import at the top of `apps/mobile/src/components/ProviderCard.tsx` (after existing imports):
```ts
import { IconStar } from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
import { IconHeart } from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
```

Replace the favorite button rendering (around line 70):
```tsx
// OLD
<Text style={styles.favoriteIcon}>
  {isFavorite ? '♥' : '♡'}
</Text>

// NEW
<IconHeart
  size={18}
  color={colors.primary}
  fill={isFavorite ? colors.primary : 'transparent'}
/>
```

Replace the star rendering (around line 96):
```tsx
// OLD
<Text style={styles.star}>{'★'}</Text>

// NEW
<IconStar size={13} color={colors.star} fill={colors.star} />
```

Also remove the `favoriteIcon` and `star` style entries from `StyleSheet.create` if they only existed for the emoji Text nodes (check the styles object — delete `favoriteIcon` and `star` keys).

- [ ] **Step 3: Update index.tsx — replace ★ at lines 664 and 771**

Add import at the top of `apps/mobile/app/(tabs)/index.tsx` (with other Tabler imports if present, otherwise after React import):
```ts
import { IconStar } from '@tabler/icons-react-native/dist/esm/icons/IconStar.mjs';
```

Line 664 — change:
```tsx
<Text style={styles.recentRating}>{'★'} {p.avgRating.toFixed(1)}</Text>
```
to:
```tsx
<View style={styles.recentRatingRow}>
  <IconStar size={12} color={colors.star} fill={colors.star} />
  <Text style={styles.recentRating}>{p.avgRating.toFixed(1)}</Text>
</View>
```

Add `recentRatingRow` to the StyleSheet in index.tsx:
```ts
recentRatingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 2,
},
```

Line 771 — change:
```tsx
<Text style={styles.ratingStar}>{'★'}</Text>
```
to:
```tsx
<IconStar size={13} color={colors.star} fill={colors.star} />
```

Remove the `ratingStar` style entry if it only existed for the emoji Text.

- [ ] **Step 4: Verify — check Explorer tab for star icons on provider cards and recent-view strip. They should appear as vector stars, not ★ characters.**

- [ ] **Step 5: Commit**
```bash
git add apps/mobile/src/components/Rating.tsx apps/mobile/src/components/ProviderCard.tsx apps/mobile/app/\(tabs\)/index.tsx
git commit -m "chore: replace star and heart emoji with Tabler IconStar/IconHeart"
```

---

## Task 3 — Replace navigation/arrow emoji with Tabler icons

**Files:**
- Modify: `apps/mobile/src/components/Header.tsx`
- Modify: `apps/mobile/src/components/SectionHeader.tsx`
- Modify: `apps/mobile/src/components/BeforeAfter.tsx`
- Modify: `apps/mobile/app/(tabs)/beauty.tsx:257`

- [ ] **Step 1: Update Header.tsx — replace ‹ back arrow**

Add import:
```ts
import { IconChevronLeft } from '@tabler/icons-react-native/dist/esm/icons/IconChevronLeft.mjs';
```

Replace line 17:
```tsx
// OLD
<Text style={styles.backArrow}>{'‹'}</Text>

// NEW
<IconChevronLeft size={24} color={colors.accent} />
```

Remove `backArrow` from the StyleSheet (the Text node is gone).

- [ ] **Step 2: Update SectionHeader.tsx — replace › see-all arrow**

Add import:
```ts
import { IconChevronRight } from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
```

Replace line 35:
```tsx
// OLD
{seeAllText} {'›'}

// NEW
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
  <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: colors.primary }}>
    {seeAllText}
  </Text>
  <IconChevronRight size={14} color={colors.primary} />
</View>
```

Remove the outer `<Text>` wrapper for the see-all link (replace it entirely with the View above inside the `<Pressable>`).

- [ ] **Step 3: Update BeforeAfter.tsx — replace → between before/after images**

Add import:
```ts
import { IconArrowRight } from '@tabler/icons-react-native/dist/esm/icons/IconArrowRight.mjs';
```

Replace line 30:
```tsx
// OLD
<Text style={styles.arrowText}>{'→'}</Text>

// NEW
<IconArrowRight size={20} color={colors.textSecondary} />
```

Remove `arrowText` from StyleSheet if it only styled the emoji.

- [ ] **Step 4: Update beauty.tsx journal card arrow — replace › at line 257**

Add import at top of `apps/mobile/app/(tabs)/beauty.tsx`:
```ts
import { IconChevronRight } from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
```

Replace line 257:
```tsx
// OLD
<Text style={styles.journalArrow}>{'›'}</Text>

// NEW
<IconChevronRight size={20} color={colors.textSecondary} />
```

Remove `journalArrow` from StyleSheet.

- [ ] **Step 5: Verify — check back buttons on any sub-screen, "Voir tout" on home, before/after on provider profile, journal card on Beauty tab.**

- [ ] **Step 6: Commit**
```bash
git add apps/mobile/src/components/Header.tsx apps/mobile/src/components/SectionHeader.tsx apps/mobile/src/components/BeforeAfter.tsx apps/mobile/app/\(tabs\)/beauty.tsx
git commit -m "chore: replace arrow/chevron emoji with Tabler navigation icons"
```

---

## Task 4 — Replace SearchBar clear button × with IconX

**Files:**
- Modify: `apps/mobile/src/components/SearchBar.tsx`

- [ ] **Step 1: Add import and replace × at line 41**

Add import to `apps/mobile/src/components/SearchBar.tsx`:
```ts
import { IconX } from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
```

Replace line 41:
```tsx
// OLD
<Text style={styles.clearButton}>{'×'}</Text>

// NEW
<IconX size={16} color={colors.textMuted} />
```

Remove `clearButton` from StyleSheet if it only styled the emoji Text.

- [ ] **Step 2: Verify — type in search bar, confirm the clear × button appears as a vector X icon.**

- [ ] **Step 3: Commit**
```bash
git add apps/mobile/src/components/SearchBar.tsx
git commit -m "chore: replace × clear button emoji with Tabler IconX"
```

---

## Task 5 — Replace camera/photo emoji with Tabler icons

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx:71`
- Modify: `apps/mobile/app/provider-register.tsx:158`
- Modify: `apps/mobile/app/request/create.tsx:216,227,249`

- [ ] **Step 1: Update profile.tsx camera overlay**

Add import to `apps/mobile/app/(tabs)/profile.tsx`:
```ts
import { IconCamera } from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
```

Replace lines 70-72:
```tsx
// OLD
<View style={styles.cameraOverlay}>
  <Text style={styles.cameraIcon}>{'📷'}</Text>
</View>

// NEW
<View style={styles.cameraOverlay}>
  <IconCamera size={20} color={colors.white} />
</View>
```

Remove `cameraIcon` from StyleSheet.

- [ ] **Step 2: Update provider-register.tsx camera placeholder**

Add import to `apps/mobile/app/provider-register.tsx`:
```ts
import { IconCamera } from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
```

Replace line 158:
```tsx
// OLD
<Text style={styles.avatarPlaceholder}>{'📷'}</Text>

// NEW
<IconCamera size={32} color={colors.textMuted} />
```

Remove `avatarPlaceholder` from StyleSheet (or update it — the Text node is gone).

- [ ] **Step 3: Update create.tsx — photo remove ✕, photo button 📸, selfie button 📷**

Add imports to `apps/mobile/app/request/create.tsx`:
```ts
import { IconX } from '@tabler/icons-react-native/dist/esm/icons/IconX.mjs';
import { IconPhoto } from '@tabler/icons-react-native/dist/esm/icons/IconPhoto.mjs';
import { IconCamera } from '@tabler/icons-react-native/dist/esm/icons/IconCamera.mjs';
```

Replace line 216:
```tsx
// OLD
<Text style={styles.photoRemoveText}>{'✕'}</Text>

// NEW
<IconX size={14} color={colors.white} />
```

Replace line 227:
```tsx
// OLD
<Text style={styles.photoButtonIcon}>{'📸'}</Text>

// NEW
<IconPhoto size={20} color={colors.primary} />
```

Replace line 249:
```tsx
// OLD
<Text style={styles.photoButtonIcon}>{'📷'}</Text>

// NEW
<IconCamera size={20} color={colors.primary} />
```

Remove `photoRemoveText` and `photoButtonIcon` from StyleSheet.

- [ ] **Step 4: Verify — check profile avatar overlay, provider-register avatar picker, and create-request photo/selfie buttons.**

- [ ] **Step 5: Commit**
```bash
git add apps/mobile/app/\(tabs\)/profile.tsx apps/mobile/app/provider-register.tsx apps/mobile/app/request/create.tsx
git commit -m "chore: replace camera/photo emoji with Tabler IconCamera/IconPhoto"
```

---

## Task 6 — Refactor MenuItem in profile.tsx to use Tabler icons

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

The `MenuItem` component currently takes `emoji: string` and renders it in a `<Text>`. Change it to accept `icon: React.ReactNode` and render the node directly.

- [ ] **Step 1: Add all required Tabler icon imports to profile.tsx**

Add after existing imports:
```ts
import { IconUser } from '@tabler/icons-react-native/dist/esm/icons/IconUser.mjs';
import { IconHeart } from '@tabler/icons-react-native/dist/esm/icons/IconHeart.mjs';
import { IconBriefcase } from '@tabler/icons-react-native/dist/esm/icons/IconBriefcase.mjs';
import { IconScissors } from '@tabler/icons-react-native/dist/esm/icons/IconScissors.mjs';
import { IconCalendar } from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import { IconCash } from '@tabler/icons-react-native/dist/esm/icons/IconCash.mjs';
import { IconClipboardList } from '@tabler/icons-react-native/dist/esm/icons/IconClipboardList.mjs';
import { IconCreditCard } from '@tabler/icons-react-native/dist/esm/icons/IconCreditCard.mjs';
import { IconId } from '@tabler/icons-react-native/dist/esm/icons/IconId.mjs';
import { IconSettings } from '@tabler/icons-react-native/dist/esm/icons/IconSettings.mjs';
import { IconGift } from '@tabler/icons-react-native/dist/esm/icons/IconGift.mjs';
import { IconLogout } from '@tabler/icons-react-native/dist/esm/icons/IconLogout.mjs';
import { IconChevronRight } from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight.mjs';
```

- [ ] **Step 2: Update the MenuItem component definition (around line 127)**

Replace:
```tsx
function MenuItem({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <PressableScale style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconCircle}>
        <Text style={styles.menuEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.menuArrow}>{'›'}</Text>
    </PressableScale>
  );
}
```
with:
```tsx
function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <PressableScale style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconCircle}>
        {icon}
      </View>
      <Text style={styles.menuText}>{label}</Text>
      <IconChevronRight size={16} color={colors.textMuted} />
    </PressableScale>
  );
}
```

- [ ] **Step 3: Update all MenuItem call sites (lines 89–111) to pass icon prop**

Replace:
```tsx
<MenuItem emoji="👤" label="Mon profil" onPress={() => router.push('/settings/edit-profile' as any)} />
<MenuItem emoji="❤️" label="Favoris" onPress={() => router.push('/favorites' as any)} />
<MenuItem emoji="💼" label="Devenir prestataire" onPress={() => router.push('/provider-register')} />
<MenuItem emoji="💇🏿" label="Mes services" onPress={() => router.push('/provider-dashboard/services')} />
<MenuItem emoji="📅" label="Disponibilites" onPress={() => router.push('/provider-dashboard/availability')} />
<MenuItem emoji={'💰'} label="Mes revenus" onPress={() => router.push('/provider-dashboard/earnings')} />
<MenuItem emoji={'📋'} label="Demandes ouvertes" onPress={() => router.push('/request/browse' as any)} />
<MenuItem emoji="💳" label="Portefeuille" onPress={() => router.push('/wallet' as any)} />
<MenuItem emoji="🪪" label="Verification identite" onPress={() => router.push('/kyc' as any)} />
<MenuItem emoji="⚙️" label="Parametres" onPress={() => router.push('/settings' as any)} />
<MenuItem emoji="🎁" label="Inviter des amies" onPress={() => router.push('/referral' as any)} />
```
with:
```tsx
<MenuItem icon={<IconUser size={20} color={colors.primary} />} label="Mon profil" onPress={() => router.push('/settings/edit-profile' as any)} />
<MenuItem icon={<IconHeart size={20} color={colors.primary} />} label="Favoris" onPress={() => router.push('/favorites' as any)} />
<MenuItem icon={<IconBriefcase size={20} color={colors.primary} />} label="Devenir prestataire" onPress={() => router.push('/provider-register')} />
<MenuItem icon={<IconScissors size={20} color={colors.primary} />} label="Mes services" onPress={() => router.push('/provider-dashboard/services')} />
<MenuItem icon={<IconCalendar size={20} color={colors.primary} />} label="Disponibilites" onPress={() => router.push('/provider-dashboard/availability')} />
<MenuItem icon={<IconCash size={20} color={colors.primary} />} label="Mes revenus" onPress={() => router.push('/provider-dashboard/earnings')} />
<MenuItem icon={<IconClipboardList size={20} color={colors.primary} />} label="Demandes ouvertes" onPress={() => router.push('/request/browse' as any)} />
<MenuItem icon={<IconCreditCard size={20} color={colors.primary} />} label="Portefeuille" onPress={() => router.push('/wallet' as any)} />
<MenuItem icon={<IconId size={20} color={colors.primary} />} label="Verification identite" onPress={() => router.push('/kyc' as any)} />
<MenuItem icon={<IconSettings size={20} color={colors.primary} />} label="Parametres" onPress={() => router.push('/settings' as any)} />
<MenuItem icon={<IconGift size={20} color={colors.primary} />} label="Inviter des amies" onPress={() => router.push('/referral' as any)} />
```

- [ ] **Step 4: Replace the logout row emoji (line 118)**

Replace:
```tsx
<View style={styles.iconCircle}>
  <Text style={styles.menuEmoji}>🚪</Text>
</View>
```
with:
```tsx
<View style={styles.iconCircle}>
  <IconLogout size={20} color={colors.error} />
</View>
```

- [ ] **Step 5: Clean up — remove `menuEmoji` and `menuArrow` from StyleSheet (they're unused now).**

- [ ] **Step 6: Verify — open Profile tab, confirm all menu items show vector icons instead of emoji, logout row shows vector icon.**

- [ ] **Step 7: Commit**
```bash
git add apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "chore: refactor MenuItem to use Tabler icons, remove all profile emoji"
```

---

## Task 7 — Replace browse.tsx inline emoji with Tabler icons

**Files:**
- Modify: `apps/mobile/app/request/browse.tsx`

Remove the `CATEGORY_ICONS` emoji map entirely. The category chip already shows the name text — the icon is decorative. Replace the inline card-meta emoji (💰 📍 📅) with Tabler icons.

- [ ] **Step 1: Add imports to browse.tsx**

```ts
import { IconCurrencyDollar } from '@tabler/icons-react-native/dist/esm/icons/IconCurrencyDollar.mjs';
import { IconMapPin } from '@tabler/icons-react-native/dist/esm/icons/IconMapPin.mjs';
import { IconCalendar } from '@tabler/icons-react-native/dist/esm/icons/IconCalendar.mjs';
import { IconClipboardList } from '@tabler/icons-react-native/dist/esm/icons/IconClipboardList.mjs';
```

- [ ] **Step 2: Delete the CATEGORY_ICONS object (lines 14–21)**

Remove:
```ts
const CATEGORY_ICONS: Record<string, string> = {
  'Coiffure': '💇‍♀️',
  'Ongles': '💅',
  'Maquillage': '💄',
  'Soins': '💆‍♀️',
  'Barber': '✂️',
  'Spa': '🧖‍♀️',
};
```

- [ ] **Step 3: Remove icon Text from filter chip (line 175) and category badge (line 205)**

Find and remove:
```tsx
<Text style={styles.filterIcon}>{CATEGORY_ICONS[cat.name] || '✨'}</Text>
```
(just delete that line — the chip still shows `{cat.name}` text)

Find and remove:
```tsx
<Text style={styles.categoryBadgeIcon}>{getCategoryIcon(item.categoryId)}</Text>
```
(just delete that line)

Also remove `getCategoryIcon` helper function if it only served to look up from `CATEGORY_ICONS`.

- [ ] **Step 4: Replace empty state clipboard emoji (line 193)**

Replace:
```tsx
<Text style={styles.emptyEmoji}>{'📋'}</Text>
```
with:
```tsx
<IconClipboardList size={48} color={colors.textMuted} />
```

- [ ] **Step 5: Replace card-meta inline emoji (lines 216, 222, 229)**

Replace:
```tsx
<Text style={styles.cardMetaIcon}>{'💰'}</Text>  {/* budget */}
```
with:
```tsx
<IconCurrencyDollar size={14} color={colors.textSecondary} />
```

Replace:
```tsx
<Text style={styles.cardMetaIcon}>{'📍'}</Text>  {/* city */}
```
with:
```tsx
<IconMapPin size={14} color={colors.textSecondary} />
```

Replace:
```tsx
<Text style={styles.cardMetaIcon}>{'📅'}</Text>  {/* date */}
```
with:
```tsx
<IconCalendar size={14} color={colors.textSecondary} />
```

Remove `cardMetaIcon`, `filterIcon`, `categoryBadgeIcon`, `emptyEmoji` from StyleSheet if they only styled emoji Text nodes (or repurpose them as `StyleSheet` entries for sizing/color of the View wrappers if needed).

- [ ] **Step 6: Verify — open Browse Requests screen. Category filter chips should show name only (no emoji). Cards should show vector icons for budget, city, date. Empty state shows clipboard icon.**

- [ ] **Step 7: Commit**
```bash
git add apps/mobile/app/request/browse.tsx
git commit -m "chore: remove CATEGORY_ICONS emoji map, replace card-meta emoji with Tabler icons in browse.tsx"
```

---

## Task 8 — Replace emoji in create.tsx success modal

**Files:**
- Modify: `apps/mobile/app/request/create.tsx`

(Camera/photo icons were handled in Task 5. This task covers the remaining emoji: CATEGORY_ICONS map and ✅ success modal.)

- [ ] **Step 1: Add IconCircleCheck import**

```ts
import { IconCircleCheck } from '@tabler/icons-react-native/dist/esm/icons/IconCircleCheck.mjs';
```

- [ ] **Step 2: Delete CATEGORY_ICONS object (lines 29–36) — same pattern as browse.tsx**

Remove:
```ts
const CATEGORY_ICONS: Record<string, string> = {
  'Coiffure': '💇‍♀️',
  'Ongles': '💅',
  'Maquillage': '💄',
  'Soins': '💆‍♀️',
  'Barber': '✂️',
  'Spa': '🧖‍♀️',
};
```

- [ ] **Step 3: Remove icon Text from category chip (line 186)**

Delete:
```tsx
<Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat.name] || '✨'}</Text>
```

- [ ] **Step 4: Replace success modal ✅ (line 353)**

Replace:
```tsx
<Text style={styles.modalEmoji}>{'✅'}</Text>
```
with:
```tsx
<IconCircleCheck size={48} color={colors.success} />
```

Remove `modalEmoji` from StyleSheet.

- [ ] **Step 5: Verify — open Create Request screen, fill in required fields, submit. Success modal should show a vector checkmark, no ✅.**

- [ ] **Step 6: Commit**
```bash
git add apps/mobile/app/request/create.tsx
git commit -m "chore: remove CATEGORY_ICONS emoji map and replace success modal emoji in create.tsx"
```

---

## Task 9 — Replace beauty.tsx tips icons and journal book icon

**Files:**
- Modify: `apps/mobile/app/(tabs)/beauty.tsx`

The `BEAUTY_TIPS` array stores emoji strings in an `icon` field (lines 20–23), rendered as `<Text style={{ fontSize: 24 }}>{tip.icon}</Text>` (line 251). Change the type to accept a React component.

- [ ] **Step 1: Add Tabler imports to beauty.tsx**

```ts
import { IconDroplet } from '@tabler/icons-react-native/dist/esm/icons/IconDroplet.mjs';
import { IconSun } from '@tabler/icons-react-native/dist/esm/icons/IconSun.mjs';
import { IconLeaf } from '@tabler/icons-react-native/dist/esm/icons/IconLeaf.mjs';
import { IconBottle } from '@tabler/icons-react-native/dist/esm/icons/IconBottle.mjs';
import { IconBook } from '@tabler/icons-react-native/dist/esm/icons/IconBook.mjs';
```

- [ ] **Step 2: Replace BEAUTY_TIPS icon strings with icon components**

Replace the array definition (lines 19–24):
```ts
const BEAUTY_TIPS = [
  { id: '1', icon: '\u{1F4A7}', title: 'Méthode LOC pour cheveux 4C', content: "Liquid, Oil, Cream — l'ordre d'application qui change tout pour l'hydratation des cheveux crépus." },
  { id: '2', icon: '☀️', title: 'SPF et peau foncée : le mythe', content: "Les peaux riches en mélanine ont aussi besoin de protection solaire. L'hyperpigmentation est plus visible sans SPF." },
  { id: '3', icon: '\u{1F33F}', title: 'Beurre de karité : guide complet', content: 'Comment choisir, préparer et appliquer le karité pour cheveux et peau. Du brut au raffiné, tout savoir.' },
  { id: '4', icon: '\u{1F9F4}', title: 'Routine night-time pour braids', content: 'Protège tes tresses la nuit avec un bonnet en satin et un spray hydratant léger pour éviter la sécheresse.' },
];
```
with:
```ts
const BEAUTY_TIPS: { id: string; Icon: React.ComponentType<{ size: number; color: string }>; title: string; content: string }[] = [
  { id: '1', Icon: IconDroplet, title: 'Méthode LOC pour cheveux 4C', content: "Liquid, Oil, Cream — l'ordre d'application qui change tout pour l'hydratation des cheveux crépus." },
  { id: '2', Icon: IconSun, title: 'SPF et peau foncée : le mythe', content: "Les peaux riches en mélanine ont aussi besoin de protection solaire. L'hyperpigmentation est plus visible sans SPF." },
  { id: '3', Icon: IconLeaf, title: 'Beurre de karité : guide complet', content: 'Comment choisir, préparer et appliquer le karité pour cheveux et peau. Du brut au raffiné, tout savoir.' },
  { id: '4', Icon: IconBottle, title: 'Routine night-time pour braids', content: 'Protège tes tresses la nuit avec un bonnet en satin et un spray hydratant léger pour éviter la sécheresse.' },
];
```

- [ ] **Step 3: Update the render site for tip.icon**

Find the render site that uses `tip.icon` (it looks like `<Text style={{ fontSize: 24 }}>{tip.icon}</Text>`). Replace with:
```tsx
<tip.Icon size={24} color={colors.primary} />
```

- [ ] **Step 4: Replace journal card book icon (line 251)**

Replace:
```tsx
<View style={styles.journalIcon}>
  <Text style={{ fontSize: 24 }}>{'\u{1F4D6}'}</Text>
</View>
```
with:
```tsx
<View style={styles.journalIcon}>
  <IconBook size={24} color={colors.primary} />
</View>
```

- [ ] **Step 5: Verify — open Beauty tab. Tips section should show vector drop/sun/leaf/bottle icons. Journal card should show vector book icon.**

- [ ] **Step 6: Commit**
```bash
git add apps/mobile/app/\(tabs\)/beauty.tsx
git commit -m "chore: replace tips and journal emoji with Tabler icons in beauty.tsx"
```

---

## Verification checklist

After all tasks are complete, run this check:

- [ ] **Grep for remaining emoji in source** — the following command should return zero results in `apps/mobile/app` and `apps/mobile/src`:

  Search for: `[\uD83C-􏰀-\uDFFF]|✅|✨|✂|☀|\u{1F` in all `.tsx`/`.ts` files under `apps/mobile/app` and `apps/mobile/src`.

  In practice: run `grep -rn --include="*.tsx" --include="*.ts" $'\xf0\x9f\|\\\\u[Dd][89AaBb][0-9A-Fa-f][0-9A-Fa-f]\\\\u[Dd][cC-fF]' apps/mobile/app apps/mobile/src` and confirm no matches outside of string content you deliberately kept (none).

- [ ] **Visual smoke test** — navigate these screens and confirm no broken layout:
  - Home (Explorer tab)
  - Profile tab
  - Beauty tab
  - Lookbook tab
  - Any provider profile
  - Browse requests
  - Create request

- [ ] **Final commit (if any stray changes)**
```bash
git add -p
git commit -m "chore: cleanup stray emoji removal artifacts"
```
