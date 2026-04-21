# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (scan QR with Expo Go)
npm start

# Platform-specific
npm run ios
npm run android
npm run web
```

There is no lint or test script configured. The project has TypeScript — run `npx tsc --noEmit` to type-check. One test file exists at `components/__tests__/StyledText-test.js`.

## Environment Variables

Copy `.env` and set:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GROQ_API_KEY=
```

## Architecture

**Actevix** is an athlete health tracking app built with Expo Router + NativeWind + Supabase.

### Routing (Expo Router file-based)
- `app/_layout.tsx` — root layout, loads fonts (Syne + DM Sans), sets navigation theme
- `app/(tabs)/_layout.tsx` — tab shell with `SessionLogsProvider` + `TeamProvider` wrapping all tabs; also contains the Settings bottom-sheet modal
- `app/login.tsx` / `app/onboarding.tsx` — auth flow (Supabase email auth)
- Three tabs: **Dashboard** (`index.tsx`), **Log** (`log.tsx`), **Team** (`team.tsx`)

### Data Flow

**Session logs** are stored *locally only* via AsyncStorage (key: `actevix_logs`), capped at 30 entries. `SessionLogsContext` is the single source of truth. Logs are NOT synced to Supabase.

**Fatigue/risk scoring** (`lib/wearTear.ts`): `computeScores(log)` takes only the *latest* `SessionLog` and computes per-muscle stress scores (0–10) based on intensity, duration, muscles worked, and reported pain. `overallFatigue()` averages across all muscle groups.

**AI insights** (`lib/aiService.ts`): calls Groq API (`llama-3.3-70b-versatile`, 200 token limit). Rate-limited to 12 queries/day per user, tracked in the `ai_requests` Supabase table. The athlete context passed to the model is built from `computeScores` output + last 10 session logs.

**Supabase** (`lib/supabase.ts`) is used for:
- `auth` — user sessions (persisted via AsyncStorage on native, cookie on web)
- `profiles` table — name, sport, height, weight, gender
- `ai_requests` table — rate limit tracking (user_id + created_at)
- `session_logs` table — referenced in account deletion but sessions are primarily local

### Styling

NativeWind (Tailwind v3) with custom design tokens defined in `tailwind.config.js`. Always use these custom color classes instead of raw hex:

| Class | Color |
|---|---|
| `bg-actevix-bg` | `#0D1117` (page background) |
| `bg-actevix-surface` | `#131920` (card background) |
| `border-actevix-border` | `#1E2A36` |
| `text-actevix-teal` / `bg-actevix-teal` | `#1D9E75` (primary action) |

Font utility classes: `font-heading` (Syne 400), `font-heading-semibold` (Syne 600), `font-body` (DM Sans 400), `font-body-medium` (DM Sans 500).

The `theme` object in `constants/theme.ts` mirrors these tokens for use in JS style props where className isn't applicable.

### UI Conventions

- **React Native primitives only** — use `View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, etc. Never use HTML elements (`div`, `span`, `button`).
- **NativeWind `className` for all styling** — no `StyleSheet.create`, no inline `style` objects except when a value must be dynamic/computed (e.g. `style={{ width: \`${pct}%\` }}`).
- **Brand colors via token classes** — never hardcode hex values in className; use `actevix-bg`, `actevix-surface`, `actevix-border`, `actevix-teal`. For JS style props where className isn't available, import from `constants/theme.ts`.
- **Font classes** — `font-heading` / `font-heading-semibold` for display text, `font-body` / `font-body-medium` for everything else. No other font families.

### Path Alias

`@/` maps to the project root (configured in `tsconfig.json`). Use `@/lib/...`, `@/context/...`, etc. throughout.

### Key Types

`SessionLog` (`types/sessionLog.ts`): `{ sport, position, workoutType, duration, intensity, muscles: string[], painAreas: string[], painLevel, date, ts }`. `date` is a human-readable string; `ts` is a Unix ms timestamp used for filtering today's sessions.
