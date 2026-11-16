# Dex Budget — Guided Quest v1.6

This is a **separate, testable beta** built on the working Ambient Studio v1.5. It adds an interactive, hands-on tutorial for young adults learning to manage their first household budget. No server or bank connection is required.

## What is new

- Six interactive, sequential missions using a pretend starting balance, rent bill, earned income, grocery purchase, and rent-protection decision.
- Action-based validation and specific, calm hints. Users must complete an action before advancing; they may go back, exit, or replay the practice.
- An isolated practice ledger: **tutorial actions never write to the real budget state**. Only a small local flag records that the tutorial was visited/completed.
- First-time tutorial appears for users without an existing budget. Existing users can replay from the top bar or **More → Help & tour**.
- On completion, **Set up my real budget** opens the actual Plan screen.
- All v1.5 Ambient Studio wallpaper options, recurring Bills tab, appearance settings, backups, and financial calculations remain present.

## Publishing to GitHub Pages

1. Create a new **public** repository (e.g., `dex-budget-guided-quest`).
2. Upload **the individual files** from this ZIP directly to repository root. GitHub Pages requires `index.html` in the root.
3. In **Settings → Pages**, select **Deploy from a branch**, `main`, `/ (root)`, and Save.
4. Open `https://YOUR-USERNAME.github.io/dex-budget-guided-quest/` once GitHub Pages says the site is live.
5. On iPhone: open Safari → Share → Add to Home Screen.

Keep `.nojekyll` in the repository. The `sw.js` file pre-caches the tutorial and essential assets for offline support. Refresh/reopen the home-screen app to receive updates; **do not clear site data** if you have budget records.

## Beta safeguards and limitations

- **Practice only:** example amounts are made up and do not represent the user's account. No practice input enters the real transaction list or bill list.
- Budget balances are planning estimates, **not verified bank balances**. Pay modes are stored, but automatic paycheck forecasts are not implemented.
- Bill payments must be explicitly marked paid. Other expense entries are not automatically reconciled against bills.
- Tax reserves are user-chosen estimates, not tax advice.
- User financial data stays in local browser storage and is not synced between devices. Export backups before switching browsers or devices.
- The interface respects Reduced Motion; animated backgrounds may affect battery life on older phones.

## Files

`index.html` — app shell and practice modal; `app.js` — original v1.5 budget logic; `tutorial.js` — new **practice-only** missions; `motion.js` — ambient wallpaper renderer; `sw.js` — offline cache; `manifest.webmanifest` — installable web app; icons and decorative wallpaper PNGs.

## Validation completed

- Syntax checks for the JavaScript files.
- Automated Chromium walkthrough from first launch through all six missions, including wrong-answer guidance and practice-only final balances.
- Verified the practice sequence does not write the main financial ledger.
- Checked that the setup transition, tutorial replay, and phone-sized layout work.

### Known beta limitation

This tutorial uses a consistent sample scenario, not custom case studies for every kind of household. Later testing can identify which additional examples are worth adding.
