# Fuel · Optimal 8

The fuelling companion to the 16-week Optimal 8 strength and conditioning program.
Every feed, every day, with the times that matter and the reason behind each one.

**The app lives here: https://mccart1980.github.io/optimal-8-fuel/**

---

## Put it on your iPhone home screen

Do this once. After that it opens like any other app — full screen, no address
bar, and it works with no signal at all.

1. Open **https://mccart1980.github.io/optimal-8-fuel/** in **Safari**.
   (It has to be Safari. Chrome on iPhone can't add home-screen apps.)
2. Tap the **Share** button — the square with the arrow coming out of the top,
   at the bottom of the screen.
3. Scroll down the list and tap **Add to Home Screen**.
4. Tap **Add** in the top right.

A "Fuel" icon appears on your home screen. Open it from there, not from Safari.

**The first time you open it, be online.** It quietly downloads itself so it can
run offline afterwards. From then on it opens in the gym, in the van, on the
site — anywhere, signal or not.

### When it updates

When you're online it checks for a new version in the background and installs it
automatically. If you've asked for a change and don't see it yet, close the app
fully (swipe up from the bottom and flick it away) and open it again.

---

## Where your data lives

Ticked feeds, your cooked-batch weights, saved ratios and the shopping list are
stored **on your phone only**. There is no account, no sign-in and no server.
Nobody else can see it — and nobody else can get it back for you.

That means it disappears if you:

- delete the app from your home screen,
- clear Safari's website data,
- or get a new phone.

So back it up now and again.

### Back it up

1. Open the app, tap the **⚙** in the top right.
2. Scroll to **BACKUP**.
3. Either:
   - **COPY BACKUP** — puts everything on your clipboard. Paste it into Notes,
     or into a message to yourself. Simple and reliable.
   - **EXPORT TO FILE** — opens the iPhone share sheet with a `.json` file.
     Save it to Files, iCloud Drive, or mail it to yourself.

Worth doing after you weigh a batch, and before you change phone.

### Restore it

1. Tap **⚙** → scroll to **BACKUP**.
2. Either:
   - paste the backup text into the box and tap **IMPORT PASTED TEXT**, or
   - tap **IMPORT FROM FILE** and pick the `.json` file you saved.

It'll tell you how many sections it restored. Importing replaces what's
currently in the app, so make a fresh backup first if you're unsure.

---

## Asking Claude Code for changes

You don't need to touch any code. Open a Claude Code session on this repository
and describe what you want in plain English. Useful things to say:

> "In the app, move Tuesday's 5pm carb top-up to 5:30pm."

> "Add a new block called OVERNIGHT OATS — 500 kcal, 25g protein, 70g carbs,
> 12g fat — and put it on Friday at 21:00."

> "The Saturday session now finishes at 10:15. Move the post-session shake."

> "Change the shopping list — I need 6 steaks a week now, not 5."

Be specific about the day, the time, and the numbers. If you're changing a
meal's macros, say all four (kcal, protein, carbs, fat) so the day totals stay
honest.

When it's done, ask it to **commit and push to `main`**. GitHub then rebuilds
and redeploys the site automatically — give it two or three minutes, then open
the app and it'll update itself.

---

## For anyone looking at the code

Single-file React app (`src/App.jsx`), built with Vite, shipped as an installable
PWA to GitHub Pages.

```bash
npm install
npm run dev      # local dev server
npm test         # smoke tests (vitest + jsdom)
npm run build    # production build into dist/
npm run icons    # regenerate the app icons in public/
```

- `src/App.jsx` — the whole app. The `B` object is the food blocks, `D` is the
  seven day plans, `SHOP` is the shopping list, `PLANREF` is the PLAN tab.
- `src/storage.js` — the app was born as a claude.ai artifact and talks to
  `window.storage`. This provides the same four calls backed by `localStorage`,
  so the `fu8-…` keys persist on the phone with no server.
- `vite.config.js` — base path `/optimal-8-fuel/` and the PWA/service-worker
  setup (`registerType: 'autoUpdate'`).
- `.github/workflows/deploy.yml` — every push to `main` tests, builds and
  deploys to GitHub Pages.

*Eat for it. The training only writes the cheque.*
