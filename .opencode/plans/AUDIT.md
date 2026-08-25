# Pocketflow Finance — Local Environment & Android Build Audit

**Date:** 2026-08-24
**Repository:** https://github.com/sahilmulla16/finance-tracker
**Workspace:** pnpm monorepo with `artifacts/mobile` as the Expo app

---

## Project Versions

| Item | Version |
|------|---------|
| Expo SDK | `~54.0.27` |
| React Native | `0.81.5` |
| React | `19.1.0` (catalog) |
| Node.js | `24` (per replit.md) |
| Package Manager | `pnpm` (workspace) |
| Lockfile | `pnpm-lock.yaml` ✅ |
| TypeScript | `~5.9.2` (mobile), `~5.9.3` (root) |

---

## Expo Configuration (`artifacts/mobile/`)

| File | Status | Notes |
|------|--------|-------|
| `app.json` | ✅ Exists | Minimal config; **Replit-specific** `origin: "https://replit.com/"` in expo-router plugin |
| `app.config.js/ts` | ❌ Missing | Not needed if using app.json |
| `eas.json` | ❌ Missing | **Required for EAS Build** |
| `babel.config.js` | ✅ Exists | Standard `babel-preset-expo` |
| `metro.config.js` | ✅ Exists | Standard `getDefaultConfig` |
| `tsconfig.json` | ✅ Exists | Extends `expo/tsconfig.base` |
| Expo Router | ✅ Enabled | Via app.json plugin with typed routes |
| React Compiler | ✅ Enabled | Experimental in app.json |

---

## Native Android Status

| Item | Status | Notes |
|------|--------|-------|
| `android/` directory | ❌ Missing | Managed workflow - needs `expo prebuild` |
| `ios/` directory | ❌ Missing | Managed workflow - needs `expo prebuild` |
| `expo-dev-client` | ❌ Not installed | **Required for development builds** |
| Native modules | ❌ None | Only Expo managed modules |
| Config plugins | ⚠️ Standard only | `expo-router`, `expo-font`, `expo-web-browser` |
| Custom Expo modules | ❌ None | |
| Native Android config | ❌ Missing | Empty `android: {}` in app.json |

---

## Key Issues for Local Windows + Android Build

1. **No `eas.json`** — Required for EAS Build configuration
2. **`expo-dev-client` not installed** — Required for development builds (`expo start --dev-client`)
3. **No native directories** — Must run `expo prebuild` or use EAS to generate
4. **Replit-specific `origin` in app.json** — `origin: "https://replit.com/"` breaks local deep linking
5. **Build script is Replit-only** — `scripts/build.js` targets Replit deployment, not local/EAS
6. **Empty Android config** — Needs `package`, `versionCode`, `permissions`, `adaptiveIcon`, etc.
7. **Windows-specific dependencies** — pnpm overrides exclude `win32-x64` binaries for esbuild/lightningcss/rollup; may need adjustment

---

## Recommended Plan

### Phase 2: Local Development Setup
1. Add `expo-dev-client` to mobile package.json
2. Create `eas.json` with development/production build profiles
3. Fix `app.json`:
   - Change expo-router `origin` to `http://localhost:8081` (or remove for local)
   - Add Android config: `package`, `versionCode`, `adaptiveIcon`, `permissions`
4. Run `expo prebuild --platform android` to generate `android/` directory
5. Verify local dev: `pnpm --filter @workspace/mobile run dev` (with `--dev-client` flag)

### Phase 3: Android Development Build
1. Configure EAS with `eas build:configure` (creates eas.json if missing)
2. Build development client: `eas build --platform android --profile development`
3. Install on device/emulator and test

### Phase 4: Production Build (later)
1. Create production profile in eas.json
2. Build production APK/AAB: `eas build --platform android --profile production`

---

## Clarifying Questions (Before Implementation)

1. **Do you have an EAS account/project set up?** (Needed for `eas build`)
2. **Do you want to use `expo prebuild` locally** (generates `android/` in repo) **or rely entirely on EAS cloud builds** (keeps repo clean)?
3. **What Android package name** should be used? (e.g., `com.sahilmulla.pocketflow`)
4. **Do you need the Replit-specific build script** (`scripts/build.js`) preserved, or can it be removed/replaced?
5. **Any specific Android permissions** needed beyond what Expo modules auto-add? (Camera, location, etc. are already in deps)