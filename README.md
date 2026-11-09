# FCS Load Check — demo

First Choice Scaffolding's load check app, demo version. Gerry sends the load and crew, the yard loads and ticks it off, the charge hand checks it in the morning, takes photos and finishes the job, and Gerry signs it off.

**Address: https://ianmccart1980-blip.github.io/fcs-load-check/**

This version runs the demo only. Everything stays on the phone, nothing is shared or saved, and it only holds made-up jobs. Switch between **Gerry**, **Yard**, **Charge hand** and **Gang** at the top to show each person's screen. **Start again** puts the example jobs back. Closing the app fully also starts it again.

## Put it on your iPhone home screen

1. Open **https://ianmccart1980-blip.github.io/fcs-load-check/** in **Safari**. It has to be Safari.
2. Tap the **Share** button, the square with the arrow pointing up. If you can't see it, tap the three dots (···) at the bottom first.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

You get the FCS logo on your home screen. Open it from there and it runs full screen. Once it has been opened once, it works with no signal.

## How it gets there

- The app's files live here, in the `fcs-load-check` branch of `mccart1980/Optimal-8-fuel`, in the `site` folder. This branch has nothing to do with the fuel app on `main`.
- The repo `ianmccart1980-blip/fcs-load-check` has one small file that fetches the `site` folder from here and puts it live. It checks for a new version every 20 minutes.

## What's in the site folder

- `index.html` — the whole app.
- `manifest.webmanifest` and `icons/` — the name and FCS icon for the home screen.
- `sw.js` — keeps a copy on the phone so it opens with no signal, and picks up new versions next time it's opened with signal.
- `version.txt` — which build this is.
