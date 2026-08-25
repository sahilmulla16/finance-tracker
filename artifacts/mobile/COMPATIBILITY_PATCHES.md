# Compatibility Patches

This document records automated compatibility patches applied during `pnpm install`
to resolve version mismatches in the Expo/React Native dependency tree.

---

## Patch: expo-dev-launcher-gradle-plugin Kotlin Version

### Root Cause

Expo SDK 54 uses React Native 0.81.5 and `expo-modules-autolinking@3.0.27`,
which both standardize on **Kotlin 2.1.20** for their Gradle plugins.

However, `expo-dev-client@5.0.20` (the version compatible with Expo SDK 54)
transitively depends on `expo-dev-launcher@5.0.35`, whose Gradle plugin
(`expo-dev-launcher-gradle-plugin`) **hardcodes Kotlin 1.9.25** in its
`build.gradle.kts`:

```kotlin
plugins {
  kotlin("jvm") version "1.9.25"  // <-- causes metadata mismatch
  ...
}
```

When Gradle compiles the composite build (which includes
`expo-dev-launcher-gradle-plugin`, `expo-gradle-plugin`, and
`@react-native/gradle-plugin`), the Kotlin 1.9.25 compiler encounters
Kotlin 2.1 metadata from `kotlin-stdlib@2.1.20` and
`@react-native/gradle-plugin@0.81.5`, producing:

```
e: Incompatible classes were found in dependencies. Remove them from the
classpath or use '-Xskip-metadata-version-check' to suppress errors

e: ... kotlin-stdlib-2.1.20.jar!/META-INF/kotlin-stdlib.kotlin_module
Module was compiled with an incompatible version of Kotlin. The binary
version of its metadata is 2.1.0, expected version is 1.9.0.
```

---

### The Patch

**Package**: `expo-dev-launcher@5.0.35`
**File**: `expo-dev-launcher-gradle-plugin/build.gradle.kts`
**Change**: Line 7 — Kotlin version declaration

| Before | After |
|--------|-------|
| `kotlin("jvm") version "1.9.25"` | `kotlin("jvm") version "2.1.20"` |

This aligns the plugin's Kotlin version with the rest of the Expo SDK 54 stack.

---

### Application

The patch is applied **automatically** via a `postinstall` script in
`package.json`:

```json
"scripts": {
  "postinstall": "node scripts/patch-dev-launcher-kotlin.js"
}
```

The script (`scripts/patch-dev-launcher-kotlin.js`):

1. Dynamically resolves the installed `expo-dev-launcher` package path
2. Verifies the installed version is exactly **5.0.35** (fails otherwise)
3. Reads `expo-dev-launcher-gradle-plugin/build.gradle.kts`
3. Verifies the exact line `kotlin("jvm") version "1.9.25"` exists
4. Replaces it with `kotlin("jvm") version "2.1.20"`
5. Is idempotent: exits successfully if already patched
6. Fails loudly if the expected line is missing or version differs

---

### Reassessment

**This patch should be reassessed when:**
- `expo-dev-client` is upgraded (e.g., to 5.1.x or 6.x)
- `expo-dev-launcher` version changes in `package.json`
- Expo SDK is upgraded (e.g., to SDK 55+)

Expo SDK 55+ is expected to include `expo-dev-launcher@5.1+` which
may already use Kotlin 2.1.x, potentially making this patch unnecessary.
Do not assume Expo SDK 55 automatically fixes this; verify at upgrade time.

---

### Safety

- **No manual node_modules edits**: Applied only via automated `postinstall`
- **No pnpm store modifications**: Works on the linked workspace package
- **No local forks**: Uses the upstream package as-is
- **Fail-fast**: Errors if version mismatch or unexpected content
- **Idempotent**: Safe to run multiple times
- **No compiler flag workarounds**: Fixes root cause, not symptoms