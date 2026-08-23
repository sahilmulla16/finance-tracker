# Android native access notes

Pocketflow currently runs as an Expo Go-compatible app. The core product is
offline-first and available now: Quick Add, local persistence, category
management, search, insights, settings, and native CSV/JSON sharing.

Expo Go cannot install Android manifest components such as:

- A Quick Settings `TileService`
- An Android home-screen widget provider
- Launcher shortcut XML and shortcut receivers
- A notification action that launches the app directly from the shade
- `BiometricPrompt` app-lock enforcement

These should be added in an Expo development build with a config plugin and
small native Android modules. They must all open the same Quick Add route and
must never claim to bypass the lock screen. If Android blocks a launch while
locked, the user should be asked to unlock normally.

Suggested native handoff:

1. Generate an Android development build from this Expo project.
2. Add a `TileService` that launches `mobile://quick-add`.
3. Add launcher shortcuts for `quick-add`, `insights`, and `savings`.
4. Add a compact widget with a single `quick-add` deep-link action.
5. Add an opt-in notification channel with an `Add expense` action.
6. Add `BiometricPrompt` around financial screens when app lock is enabled.
7. Verify every entry point on a physical Android device across locked and
   unlocked states.

The app already uses `mobile` as its URL scheme in `app.json`, so the native
entry points have a stable deep-link namespace to target.