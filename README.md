# FCS Load Check — practice version

Load sheets, crews, lorries, job photos and holidays for First Choice Scaffolding.

**Address: https://ianmccart1980-blip.github.io/Fcs-load-check/**

What it does:

- **Jobs.** Gerry fills in a job sheet (address, lorry, charge hand, gang, load, forgotten items) and sends it to the yard. The yard ticks the load sheet and confirms it's loaded. The charge hand checks it in the morning, confirms, and taps when the lorry leaves the yard. On the job he adds finish photos and any extra work, then marks the job finished. Gerry sees each step, the times, anything missing and any extra work to charge.
- **The property.** A picture from above with the house outlined and measured, the type of house and storeys, and a note. It is kept on file for the address. Street View, satellite and directions are one tap away.
- **Calendar.** Booked jobs by day, with who is free and which lorries are free. Staff ask for time off in the app: a week's notice or more goes straight on, less goes to Gerry to approve. Anyone who's off can't be put on a job.
- **Set-up.** The staff list, the lorries list, and the address finder key.

This is the practice version. Everything stays on the phone it's used on, and nothing is shared between phones. Tap the name at the top right to see the app as someone else. **Set-up → Start again from scratch** wipes it.

## Put it on an iPhone home screen

1. Open the address above in **Safari**.
2. Tap the **Share** button. If you can't see it, tap the icon at the left of the address bar first.
3. Tap **Add to Home Screen**, then **Add**.

## How it gets there

The app's files are in the `site` folder of this branch (`fcs-load-check` in `mccart1980/Optimal-8-fuel`), which has nothing to do with the fuel app on `main`. The repo `ianmccart1980-blip/Fcs-load-check` fetches that folder and puts it live, checking for a new version every 20 minutes.
