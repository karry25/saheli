# Reminders + APK research (Saheli)

## The honest problem with reminders
Saheli is fully on-device: no account, no server. Real push notifications on the
web (Web Push) need a server holding a push subscription and a push service
(Google FCM etc.) to deliver messages when the app is closed. That conflicts
with the privacy promise ("nothing leaves this phone") and adds infra/cost.

### Options compared (all free)
1. **In-app proactive check-ins (SHIPPED in v1)** - when she opens Saheli, a
   "Saheli asks" card appears at phase-relevant moments (period due, mid-period
   flow check, luteal cramps check-in). Anti-nagging: max 1 per 20h, quiet hours
   21:00-08:00. Zero infra, fully private. Limit: only fires when she opens the app.
2. **PWA + Web Push** - real background push, but requires a push server +
   FCM. Breaks the no-cloud rule; rejected for v1.
3. **Capacitor-wrapped APK with LocalNotifications plugin** - notifications are
   scheduled ON the phone (no server, no FCM, stays private). Build via GitHub
   Actions (free): `npx cap add android`, plugin
   `@capacitor/local-notifications`, workflow builds a debug APK artifact.
   Sideload only (no Play Store, no $25 fee). This is the recommended v2 path.
4. **Bubblewrap (TWA)** - wraps the hosted PWA; but TWA notifications still go
   through Web Push (server needed). Not suitable for local-only reminders.

### APK build notes (v2, free, sideload)
- Prereq: PWA must be hosted with COOP/COEP headers (voice wasm needs it) -
  Netlify/Vercel free tier works; GitHub Pages cannot set those headers.
- GitHub Actions workflow: checkout -> npm i -> npx cap sync -> ./gradlew
  assembleDebug -> upload artifact. Debug APK installs with "install unknown
  apps" permission. For sharing, sign with a local keystore (jarsigner) or keep
  debug builds for demo.
- LocalNotifications schedules: period-due (from last logged start + avg),
  daily 20:00 gentle "log today" (skippable), PMS-window cramps check.
  All scheduled on-device from localStorage data.

### v1 decision
Ship in-app check-ins now; document the Capacitor path for v2. Do not claim
push notifications exist - the UI copy says "appears when you open Saheli".
