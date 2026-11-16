## New in v1.8: Savings Goals
- Open **Plan → 3 · Goals** or use the **Your savings goals** shortcut on Home.
- Name a goal, enter its target, and choose an optional weekly contribution.
- A progress bar shows money already assigned inside Dex. Projections show hypothetical growth if that weekly contribution continues (no bank transfer or automatic saving).
- Contributions can come from existing general savings or from unassigned cash left after near-term bills and essentials; cash is allocated only once.
- Release money back to unassigned before spending it through Add. Goal history records allocations and releases.
- Your budget and cloud snapshot schema remain version 1; goals are optional and backward-compatible. This beta continues to use local-device storage until Supabase is actually configured.

# Dex Budget — Savings Goals Beta v1.8

## What works immediately
- Existing v1.6 adaptive budgeting, Bills, and six-step interactive tutorial.
- New welcome screen for first-time users: continue locally or review account options.
- New **More → Sound**: optional synthesized rain, ocean and night air. No licensing, streaming, external media files, ads or autoplay. Sound pauses when the browser is hidden.
- New **More → Account** UI and complete Supabase Auth / private-backup code; disabled until backend provisioning is completed. It does **not** display a fake login or claim cloud backup when unconfigured.
- Local-device mode remains fully functional. Existing local finance entries keep the `dex_budget_guided_beta_v17_preview` storage key (preview only; does not touch the original app).

## Important: cloud accounts REQUIRE project setup
The Supabase app connection in ChatGPT does not itself supply an operational database or expose project credentials to this site. Cloud sign-in in this release will say **not configured** until the following have happened:

1. Create/select a Supabase project (https://supabase.com/dashboard).
2. In its SQL editor run `supabase-setup.sql` to create `public.dex_budget_snapshots` with row-level security (RLS). Review the SQL before running it.
3. Enable Email Auth. In **Authentication → URL Configuration**, set site URL and redirect allowlist to the **exact HTTPS GitHub Pages URL** of this app, e.g. `https://alexanderjframe-dev.github.io/dex-budget-ambient-studio/`.
4. Open `cloud-config.js` and set the **project URL** and **publishable (or legacy anon) key**. These are public frontend values; **never insert a service_role key, database password, or `sb_secret_...` credential**.
5. Commit the updated public `cloud-config.js` and test in two separate private browsers with different accounts. Verify each account can see **only its own** backup. Also test losing connectivity, stale revisions, and restoring a backup before trusting cross-device use.

Sign in uses Supabase Email Magic Link; a six-digit OTP can be entered if your email template sends one. Default Supabase templates often send a link, not a code.

## Data protection behavior
- Local guest budgets are **not automatically uploaded**. No bank connection and no bank credentials are requested.
- On first verified sign-in, the user chooses whether to open a cloud copy or copy the device's budget into the account.
- Account-local data lives under a per-account storage key, separate from guest data. **Signing out clears the account-local copy from that browser**; the user should only sign out after confirming cloud backup status or exporting a backup.
- Uploads are version-checked (`revision`) to avoid silently overwriting a backup from another device. On collision, syncing pauses rather than rewriting remote data.
- Cloud snapshots contain financial entries including notes; the hosting database can access them. Row-level security is **not** end-to-end encryption. A lost/shared device or account email can still expose data. Users should secure their email account and device.
- Cloud sync is available only after actual Supabase project configuration. Offline local data can still be lost if site storage is cleared: export backups regularly.

## Files
`index.html`, `app.js`, `tutorial.js`, `motion.js`, `audio.js`, `accounts.js`, `cloud-config.js`, `sw.js`, `manifest.webmanifest`, original icons and graffiti PNGs, `supabase-setup.sql`, `.nojekyll`, this README.

## Deployment
This is a static Progressive Web App for GitHub Pages. Upload the site files to the repository root, select `main` and `/ (root)` under Settings → Pages. This release uses `dex-guided-v1-7-account-audio` as its service worker cache so older devices can refresh.

## Caveat
Dex's safe-to-spend value remains a budgeting **estimate**, not a verified bank balance. The adaptive calculations are not changed in this release.

## Preview data isolation
- v1.8 stores guest records under a **new** local key. On first open, it copies (never deletes) valid v1.7 guest data from the same browser origin when v1.8 has no existing copy.
- It also uses a separate local account cache key. Cloud authentication remains unconfigured in this preview; connecting it later requires testing cloud-revision behavior against v1.7.
- Export a backup before changing devices or clearing website data.
