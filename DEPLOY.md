# Deploy Saheli (free, ~5 minutes, no coding)

You only need a free GitHub account. Everything else is already in this folder.

## Option A: GitHub Pages (recommended)
1. Go to github.com and sign in.
2. Click the **+** (top right) -> **New repository**.
3. Name: **saheli**. Set it to **Public**. Click **Create repository**.
4. On the repo page, click **uploading an existing file**.
5. Select ALL files and folders in this folder (drag them in together) and
   **Commit changes**. (The voice model is NOT here - it streams free from
   Hugging Face when someone first uses voice, then stays cached on their phone.)
6. Go to **Settings** -> **Pages** -> under "Build and deployment" pick
   **Deploy from a branch**, branch **main**, folder **/ (root)**, Save.
7. Wait ~2 minutes. Your app is live at:
   **https://YOUR-USERNAME.github.io/saheli/**
8. Open it on your phone -> browser menu -> **Add to Home screen** = Saheli runs
   like a real installed app.

## Option B: Netlify (also free)
1. Go to app.netlify.com/drop and sign up free.
2. Drag this whole folder onto the page. Done - you get a live URL instantly.
   (The included _headers file sets what the voice engine needs.)

## Notes
- coi-serviceworker.min.js (included, MIT license) adds the security headers the
  voice engine needs on GitHub Pages. The first page load may auto-refresh once -
  that is normal, it only happens the first time.
- Voice model downloads ~380MB ONCE per device from Hugging Face (free CDN) and
  then works offline. On slow connections it takes a few minutes the first time.
  The ?tinyvoice=1 URL flag uses a 100MB smaller/faster model instead.
- No personal data is in this folder. All user data stays on each person's phone.
