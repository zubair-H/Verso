# LOOKR — MVP Frontend Specification

## Overview

**App Name:** Lookr (working title)

**One-liner:** See any look on yourself before you commit.

**Platform:** React Native + Expo Go (iOS-first)

**Backend:** None. All data stored locally via AsyncStorage.

**AI Integration:** Placeholder for now. Mock the AI responses with static images.

---

## Design Philosophy

### Theme: iOS Glass Morphism + Dopamine Design

The app should feel like a premium, luxury experience. Every interaction should feel **rewarding**.

**Core Aesthetic Principles:**

| Principle | Implementation |
|-----------|----------------|
| Glass morphism | Frosted glass cards, blur effects, translucent layers |
| Depth | Subtle shadows, layered UI elements, parallax hints |
| Reward feedback | Haptics, micro-animations, celebratory moments |
| Dark mode first | Deep blacks (#000, #0A0A0A), vibrant accents |
| Accent color | Electric violet (#8B5CF6) to soft pink (#EC4899) gradient |
| Typography | SF Pro Display (system) for headers, SF Pro Text for body |

**Dopamine Triggers:**

- Satisfying haptic feedback on every tap
- Smooth spring animations on transitions
- Celebratory animation when result generates
- Progress indicators that feel alive
- Subtle sound effects (optional, toggleable)
- "Glow" effect on primary actions

---

## Tech Stack

```
- React Native 0.73+
- Expo SDK 50+
- Expo Router (file-based routing)
- Expo Image Picker
- Expo Haptics
- Expo Linear Gradient
- Expo Blur
- React Native Reanimated
- AsyncStorage
- React Native Gesture Handler
```

---

## Color System

```javascript
const colors = {
  // Backgrounds
  bgPrimary: '#000000',
  bgSecondary: '#0A0A0A',
  bgTertiary: '#141414',
  bgCard: 'rgba(255, 255, 255, 0.05)',
  bgCardHover: 'rgba(255, 255, 255, 0.08)',
  
  // Glass effect
  glassBg: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  
  // Accents
  accentPrimary: '#8B5CF6',    // Violet
  accentSecondary: '#EC4899',  // Pink
  accentSuccess: '#10B981',    // Green
  accentWarning: '#F59E0B',    // Amber
  
  // Gradients
  gradientPrimary: ['#8B5CF6', '#EC4899'],
  gradientSubtle: ['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.2)'],
}
```

---

## Typography

```javascript
const typography = {
  // Display - Big headlines
  displayLarge: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 48,
  },
  displayMedium: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  
  // Headlines
  headlineLarge: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  headlineMedium: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  
  // Body
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 18,
  },
  
  // Labels
  labelLarge: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
}
```

---

## App Structure

```
app/
├── (onboarding)/
│   ├── index.tsx          # Welcome screen
│   ├── features.tsx       # Feature showcase
│   └── permissions.tsx    # Camera/photo permissions
├── (tabs)/
│   ├── _layout.tsx        # Tab bar layout
│   ├── index.tsx          # Try a Look (home)
│   ├── presets.tsx        # Browse preset looks
│   └── saved.tsx          # Saved looks gallery
├── create/
│   ├── select-elements.tsx  # Choose hair/outfit/glasses/etc
│   └── result.tsx           # Show generated result
└── _layout.tsx            # Root layout
```

---

## Screen Specifications

### 1. Onboarding — Welcome Screen

**Route:** `/(onboarding)/index.tsx`

**Purpose:** First impression. Make the user feel excited.

**Layout:**

```
┌─────────────────────────────┐
│                             │
│      [Animated Logo]        │
│                             │
│    ✦ LOOKR ✦               │
│                             │
│   See any look on yourself  │
│     before you commit       │
│                             │
│                             │
│                             │
│   ┌─────────────────────┐   │
│   │   Get Started  →    │   │
│   └─────────────────────┘   │
│                             │
│      Already have an        │
│      account? Sign in       │
│                             │
└─────────────────────────────┘
```

**Animations:**

- Logo fades in with scale (0.8 → 1.0) over 600ms
- Tagline fades in 200ms after logo
- Button slides up from bottom with spring animation
- Background: Subtle animated gradient mesh (slow movement)

**Interactions:**

- "Get Started" button has gradient background
- On press: Scale down to 0.97, haptic feedback (light)
- Navigate to features screen

---

### 2. Onboarding — Features Showcase

**Route:** `/(onboarding)/features.tsx`

**Purpose:** Show what the app does. Build anticipation.

**Layout:** Horizontal swipeable cards (3 cards)

**Card 1: Try Any Look**
```
┌─────────────────────────────┐
│                             │
│      [Illustration]         │
│    Person + Celebrity       │
│         = Magic             │
│                             │
│    Try Any Look             │
│                             │
│   Upload a celebrity or     │
│   influencer photo. See     │
│   their style on you.       │
│                             │
│         ● ○ ○               │
│                             │
│   ┌─────────────────────┐   │
│   │       Next →        │   │
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Card 2: Mix & Match**
```
Hair from one look.
Outfit from another.
Glasses from a third.
You control everything.
```

**Card 3: Save & Compare**
```
Save your favorite looks.
Compare side by side.
Never regret a haircut again.
```

**Animations:**

- Cards swipe horizontally with spring physics
- Active dot pulses subtly
- Illustrations have floating/bobbing animation
- Progress dots have fill animation on swipe

**Interactions:**

- Swipe or tap "Next" to advance
- Last card shows "Let's Go" button
- Haptic feedback on each swipe

---

### 3. Onboarding — Permissions

**Route:** `/(onboarding)/permissions.tsx`

**Purpose:** Request camera/photo access with context.

**Layout:**

```
┌─────────────────────────────┐
│                             │
│                             │
│     [Camera Icon]           │
│     Animated, glowing       │
│                             │
│   One quick thing...        │
│                             │
│   We need access to your    │
│   photos to work our magic. │
│                             │
│   Your photos stay on your  │
│   device. Always.           │
│                             │
│   🔒 Private by design      │
│                             │
│   ┌─────────────────────┐   │
│   │  Allow Photo Access │   │
│   └─────────────────────┘   │
│                             │
│       Maybe later           │
│                             │
└─────────────────────────────┘
```

**Privacy Emphasis:**

- Lock icon with subtle glow
- "Private by design" as a trust badge
- No cloud, no storage = peace of mind

**Interactions:**

- Primary button triggers system permission dialog
- "Maybe later" skips but limits functionality
- Haptic success (medium) when granted

---

### 4. Home — Try a Look

**Route:** `/(tabs)/index.tsx`

**Purpose:** Core action. Upload selfie + reference.

**Layout:**

```
┌─────────────────────────────┐
│ ≡                    PRO ✦  │
├─────────────────────────────┤
│                             │
│   Try a Look                │
│   See it on you first       │
│                             │
│   ┌───────────┬───────────┐ │
│   │           │           │ │
│   │   YOUR    │   THE     │ │
│   │  PHOTO    │   LOOK    │ │
│   │           │           │ │
│   │   [tap]   │   [tap]   │ │
│   │           │           │ │
│   └───────────┴───────────┘ │
│                             │
│   ┌─────────────────────┐   │
│   │    Generate Look    │   │
│   └─────────────────────┘   │
│        ↑ disabled until     │
│          both uploaded      │
│                             │
│   ─── or try a preset ───   │
│                             │
│   [preset] [preset] [preset]│
│                             │
├─────────────────────────────┤
│  [home]   [presets]  [saved]│
└─────────────────────────────┘
```

**Upload Cards:**

- Glass morphism style (blur, border, translucent)
- Dashed border when empty
- Icon + "Tap to upload" text
- When image selected: Show thumbnail with subtle zoom animation
- "X" button to remove (top right corner)

**Generate Button:**

- Disabled state: Gray, no gradient
- Enabled state: Full gradient, subtle pulse animation
- On press: Scale + haptic + navigate to element selection

**Preset Strip:**

- Horizontal scroll of 6-8 preset looks
- Circular thumbnails with gradient border
- Tap to auto-fill "The Look" slot

---

### 5. Select Elements

**Route:** `/create/select-elements.tsx`

**Purpose:** Choose what to transfer from reference image.

**Layout:**

```
┌─────────────────────────────┐
│ ←  Select Elements          │
├─────────────────────────────┤
│                             │
│   What do you want to try?  │
│                             │
│   ┌─────────────────────┐   │
│   │  [Reference Image]  │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
│   ┌──────┐ ┌──────┐         │
│   │ HAIR │ │OUTFIT│         │
│   │  💇  │ │  👔  │         │
│   └──────┘ └──────┘         │
│                             │
│   ┌──────┐ ┌──────┐         │
│   │GLASS │ │MAKEUP│         │
│   │  👓  │ │  💄  │         │
│   └──────┘ └──────┘         │
│                             │
│   ┌─────────────────────┐   │
│   │   ✦ ENTIRE LOOK ✦   │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │   Generate  (2)     │   │
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Element Chips:**

- Glass card style
- Unselected: Subtle border, muted icon
- Selected: Gradient border, glowing icon, checkmark
- Multi-select allowed
- Haptic feedback on each selection

**"Entire Look" Option:**

- Special treatment: Full gradient background
- Selects all elements at once
- Deselects individual chips

**Generate Button:**

- Shows count of selected elements
- Disabled if nothing selected
- Gradient + glow when ready

---

### 6. Result Screen

**Route:** `/create/result.tsx`

**Purpose:** The payoff. Show the generated look. Dopamine central.

**Layout:**

```
┌─────────────────────────────┐
│ ←                     ···   │
├─────────────────────────────┤
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │                     │   │
│   │   [GENERATED        │   │
│   │    RESULT IMAGE]    │   │
│   │                     │   │
│   │                     │   │
│   └─────────────────────┘   │
│                             │
│   Your new look ✦           │
│   Hair + Glasses            │
│                             │
│   ┌────────┬────────┐       │
│   │  Save  │ Re-gen │       │
│   │   ♡    │   ↻    │       │
│   └────────┴────────┘       │
│                             │
│   ── Get the products ──    │
│                             │
│   ┌─────────────────────┐   │
│   │ [product] $XX  →    │   │
│   ├─────────────────────┤   │
│   │ [product] $XX  →    │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │   Try Another Look  │   │
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Result Reveal Animation (THE DOPAMINE MOMENT):**

1. Screen loads with placeholder blur
2. Shimmer effect sweeps across (like skeleton loading but premium)
3. Image fades in with scale (0.95 → 1.0)
4. Confetti/sparkle particles burst briefly
5. "Your new look" text types in
6. Haptic success (heavy)
7. Subtle glow pulses around image

**This is the most important animation in the app.**

**Action Buttons:**

- Save: Heart icon, fills with animation when tapped
- Regenerate: Rotate icon, spins on tap
- Both have glass card style

**Product Section:**

- Placeholder for affiliate (show mock products for now)
- Each product is a tappable card
- Arrow indicates external link

---

### 7. Presets Tab

**Route:** `/(tabs)/presets.tsx`

**Purpose:** Browse AI-generated preset looks when user has no reference.

**Layout:**

```
┌─────────────────────────────┐
│   Discover Looks            │
├─────────────────────────────┤
│                             │
│   [Search bar]              │
│                             │
│   Categories:               │
│   [Hair] [Makeup] [Outfit]  │
│   [Glasses] [Full Looks]    │
│                             │
│   Trending Now 🔥           │
│                             │
│   ┌─────┬─────┬─────┐       │
│   │     │     │     │       │
│   │     │     │     │       │
│   ├─────┼─────┼─────┤       │
│   │     │     │     │       │
│   │     │     │     │       │
│   ├─────┼─────┼─────┤       │
│   │     │     │     │       │
│   │     │     │     │       │
│   └─────┴─────┴─────┘       │
│                             │
├─────────────────────────────┤
│  [home]   [presets]  [saved]│
└─────────────────────────────┘
```

**Grid:**

- 3 columns
- Masonry-style optional (varying heights)
- Each card shows the preset look
- Tap to select and go back to home with it filled

**Categories:**

- Horizontal scrollable chips
- Selected = gradient fill
- Filter grid in real-time

**Search:**

- Glass morphism input
- Search icon left
- Clear button when text present

---

### 8. Saved Tab

**Route:** `/(tabs)/saved.tsx`

**Purpose:** View saved looks, favorites, compare side by side.

**Layout:**

```
┌─────────────────────────────┐
│   Saved Looks        Edit   │
├─────────────────────────────┤
│                             │
│   ┌─────────┬─────────┐     │
│   │ All (12)│Favorites│     │
│   └─────────┴─────────┘     │
│                             │
│   ┌─────┬─────┬─────┐       │
│   │  ♡  │     │     │       │
│   │     │     │     │       │
│   ├─────┼─────┼─────┤       │
│   │     │  ♡  │     │       │
│   │     │     │     │       │
│   ├─────┼─────┼─────┤       │
│   │     │     │  ♡  │       │
│   │     │     │     │       │
│   └─────┴─────┴─────┘       │
│                             │
│   ┌─────────────────────┐   │
│   │   Compare (0)       │   │
│   └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│  [home]   [presets]  [saved]│
└─────────────────────────────┘
```

**Selection Mode:**

- Long press to enter selection mode
- Tap to toggle selection
- Selected items have gradient border + checkmark
- "Compare" button shows count

**Compare View:**

- Side by side (2 images max)
- Swipe to swap out one image
- Slider to blend/transition between them (fancy)

**Empty State:**

- Illustration
- "No saved looks yet"
- "Try a look" button

---

### 9. Tab Bar

**Custom tab bar with glass effect:**

```
┌─────────────────────────────────────┐
│                                     │
│   ◉ Home      ◎ Presets    ◎ Saved  │
│                                     │
└─────────────────────────────────────┘
```

**Specs:**

- Frosted glass background (blur 20)
- Subtle top border (rgba white)
- Icons: SF Symbols or Lucide
- Active: Gradient fill + label
- Inactive: Muted icon only
- Haptic on tab switch

---

## Component Library

### GlassCard

```typescript
interface GlassCardProps {
  children: React.ReactNode;
  blur?: number;         // default 20
  opacity?: number;      // default 0.1
  borderRadius?: number; // default 16
  padding?: number;      // default 16
  hasBorder?: boolean;   // default true
}
```

### GradientButton

```typescript
interface GradientButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  haptic?: 'light' | 'medium' | 'heavy';
}
```

### ImageUploadCard

```typescript
interface ImageUploadCardProps {
  label: string;           // "Your Photo" or "The Look"
  image: string | null;
  onSelect: () => void;
  onRemove: () => void;
}
```

### SelectableChip

```typescript
interface SelectableChipProps {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}
```

### TabBar

Custom bottom tab bar with glass effect and gradient active states.

---

## Animations Reference

| Animation | Library | Timing |
|-----------|---------|--------|
| Page transitions | React Navigation | 300ms spring |
| Button press | Reanimated | 100ms scale to 0.97 |
| Card appear | Reanimated | 400ms fade + scale |
| Result reveal | Reanimated + Skia | 800ms sequence |
| Tab switch | Reanimated | 200ms spring |
| Selection toggle | Reanimated | 150ms scale + border |
| Loading shimmer | Reanimated | 1500ms loop |

---

## Haptic Feedback Guide

| Action | Haptic Type |
|--------|-------------|
| Button tap | Light |
| Tab switch | Light |
| Image selected | Medium |
| Element selected | Light |
| Generate started | Medium |
| Result revealed | Heavy (success) |
| Save/favorite | Medium |
| Error | Error pattern |

---

## Mock Data

Since there's no backend, use these local assets:

**Preset Looks (8-10 images):**
- AI-generated faces with distinct styles
- Store in `/assets/presets/`
- Include metadata: `{ id, name, category, image }`

**Mock Products:**
```javascript
const mockProducts = [
  { id: 1, name: 'Similar Hairstyle Pomade', price: '$24', image: '...' },
  { id: 2, name: 'Matching Sunglasses', price: '$89', image: '...' },
];
```

**Mock Generated Result:**
- For now, just show the reference image as "result"
- Add a 2-second fake loading delay for realism

---

## Local Storage Schema

```javascript
// AsyncStorage keys

// Saved looks
'@lookr/saved_looks' -> [
  {
    id: string,
    selfie: string (base64 or local uri),
    reference: string,
    result: string,
    elements: string[],  // ['hair', 'glasses']
    createdAt: timestamp,
    isFavorite: boolean,
  }
]

// Onboarding completed
'@lookr/onboarding_complete' -> boolean

// Free tries remaining
'@lookr/free_tries' -> number (default 5)

// Settings
'@lookr/settings' -> {
  hapticsEnabled: boolean,
  soundEnabled: boolean,
}
```

---

## Paywall (Stub)

**Trigger:** When `free_tries` reaches 0

**Screen:** Modal overlay with:
- "You've used all free tries"
- Feature comparison (Free vs Pro)
- Price options (mock for now)
- "Restore Purchase" link
- "X" to dismiss (can't generate but can browse)

---

## Success Metrics (for future)

Track these events (stub the tracking calls):

- `onboarding_completed`
- `photo_uploaded` (selfie vs reference)
- `elements_selected` (which ones)
- `look_generated`
- `look_saved`
- `look_favorited`
- `paywall_shown`
- `paywall_converted`

---

## Development Phases

**Phase 1 (Week 1):**
- Project setup (Expo, navigation, theming)
- Onboarding flow (3 screens)
- Basic tab structure

**Phase 2 (Week 2):**
- Home screen with upload cards
- Image picker integration
- Preset looks grid

**Phase 3 (Week 3):**
- Element selection screen
- Result screen with animations
- Mock AI delay

**Phase 4 (Week 4):**
- Saved looks gallery
- Favorites + compare
- Paywall stub
- Polish animations

---

## Final Notes for Claude Code

1. **Prioritize feel over features.** A beautiful, smooth 3-screen app beats a janky 10-screen app.

2. **The result reveal animation is everything.** Spend extra time here. This is the dopamine moment.

3. **Glass morphism must be subtle.** Too much blur looks cheap. Keep opacity low (0.05-0.15).

4. **Test on real device via Expo Go.** Animations feel different on device vs simulator.

5. **Keep components small and reusable.** GlassCard, GradientButton, etc. should be in `/components/ui/`.

6. **Use Reanimated's `withSpring` liberally.** Spring physics feel better than linear timing.

7. **Dark mode only for MVP.** Don't waste time on light mode.

8. **No actual AI calls yet.** Mock everything. The UX is what we're validating.

---

**Now go build something that makes people feel something.**
