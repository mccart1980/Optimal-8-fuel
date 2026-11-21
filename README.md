# FCS Load Check — practice version

Load sheets, crews, lorries, job photos and holidays for First Choice Scaffolding.

**Address: https://ianmccart1980-blip.github.io/Fcs-load-check/**

What it does:

- **Jobs.** Gerry fills in a job sheet (Erect, Alter or Strike; address, lorry, charge hand, gang, load list) and sends it to the yard. The yard ticks the load and confirms it. The charge hand checks it in the morning, taps when the lorry leaves, adds finish photos and any extra work, and marks the job finished. Gerry sees each step, the times, anything missing and any extra work to charge.
- **Who sees what.** Gerry sees everything and has control of it, and so does anyone he makes a supervisor in Set-up. The yard only sees one load list for each lorry: the lorry, what goes on it and any note from Gerry, with no address, no names and not how many jobs. Inspections are for Gerry and a supervisor only. The charge hand and the gang only see the jobs they have been put on. The yard, the charge hand and the gang see today and the next working day, and no further: a job further ahead stays with Gerry until the working day before, and they are told at 4 o'clock that day. In this practice version, tap the name at the top right to see each one.
- **What the job is.** Each job says what it entails in a line, such as "Front and back, 2 lifts, for the roof". Gerry taps words to build it or types it. It shows on the job, on the job cards, in the calendar's day list and in the alerts to the gang.
- **One load list per lorry per day.** It covers every job the lorry does that day: the yard loads it once and the charge hand checks it once. It starts with the size of the load: Full, ¾, Half, ¼ or Empty. The yard knows what tube, boards, fittings, base plates and sole boards each size takes, so nobody ticks those one by one. Then beams (3, 4, 5, 6 and 8m) and a changed number of boards, with a number; then what goes on every lorry; then anything else: tie gear, Excalibur bolts, cable ties and short boards are tapped on; butts (1ft, 18in, 2ft, 3ft, 4ft), beam joiners and pins, stair treads, brackets and jacks, and lifting gear take a number. There is no separate Miscellaneous list. The yard and the charge hand tick every line before the lorry goes. The charge hand has a Load list card at the top of his jobs screen and on each job.
- **On every lorry.** Caps, netting, foam, 2 long ladders, 2 short ladders, ladder safes, gates, treaders and board clips are on every lorry's load list to start with. Gerry can take one off or change a ladder number when a day is different.
- **Several jobs a day for one gang.** After sending a job, Gerry can add the next one for the same gang. They are numbered in order under the lorry, and the charge hand is pointed at the next job when one is finished.
- **Weekend work.** Gerry asks who wants a Saturday or Sunday. Staff put their names down. Gerry picks, and only the people he picks can be put on a job that day.
- **Inspections.** A finished Erect job puts the scaffold on the record. The app shows when each inspection is due, keeps the inspection record, and flags anything overdue or not safe.
- **The property.** A picture from above with the house outlined and measured, the type of house and storeys, and a note. It is kept on file for the address. With the firm's Ordnance Survey key (Set-up, under Address finder), the outline, the number of floors and the height to the eaves come from Ordnance Survey's record of the building. Without a key, the outline comes from OpenStreetMap. Street View, satellite and directions are one tap away.
- **Calendar.** For Gerry and a supervisor, one calendar with a colour key: jobs, inspections, time off and weekend work. Tap a day to see what is on, who is free and which lorries are free. For everyone else the calendar only shows their own time off, with the button to ask for more: no jobs, and nobody else's time off. A week's notice or more goes straight on, less goes to Gerry to approve. Anyone who's off can't be put on a job.
- **Alerts.** Each person is told what they need to know, under the Alerts button. Staff are told when they are put on a job or made charge hand, and when a job moves, changes or is cancelled, for today and the next working day. The yard is told about every new load by lorry, without the address. Gerry is told when a lorry is loaded, when anything is missing, when a gang leaves the yard, about extra work, finished jobs, time off, weekend names and scaffolds found not safe. After 4 o'clock each man gets the next day's jobs (on a Friday that covers Monday), and on the day an inspection is due the inspector and Gerry are told.
- **Week planner (laptop).** For Gerry and a supervisor. Calendar → Week planner shows the staff down the side and the days across the top. Drag a job onto another man to make him charge hand, or along to another day. The + in a square puts a new job on. The bottom row shows which lorries are free.
- **Demo.** **Show example jobs** (under the jobs on the Jobs screen, at the top of the Guide and at the top of Set-up) opens a made-up week of jobs on the firm's own staff and lorries, so every screen has something on it. Four buttons at the top switch between the boss, the yard, a charge hand and one of the gang. It can also follow one new job step by step, seen as each person in turn. Nothing in it is saved and the real jobs are not touched.
- **Guide.** The last button along the bottom has short steps for each thing a person does. Each person sees their own part.
- **Phone and laptop.** On a phone it is one column with buttons along the bottom. On a laptop the menu sits down the left side and the screens use two columns.
- **Set-up.** The staff list (with who is the yard and who is a supervisor), the lorries list, the address finder key and the Ordnance Survey key.

This is the practice version. Everything stays on the phone it's used on, and nothing is shared between phones. That includes the alerts: they are all kept on the one phone, and can pop up on it if you turn that on at the top of the Alerts screen. Alerts that reach each man's own phone need the phones to share storage first. Tap the name at the top right to see the app as someone else. **Set-up → Start again from scratch** wipes it.

## Put it on an iPhone home screen

1. Open the address above in **Safari**.
2. Tap the **Share** button. If you can't see it, tap the icon at the left of the address bar first.
3. Tap **Add to Home Screen**, then **Add**.

## How it gets there

The app's files are in the `site` folder of this branch (`fcs-load-check` in `mccart1980/Optimal-8-fuel`), which has nothing to do with the fuel app on `main`. The repo `ianmccart1980-blip/Fcs-load-check` fetches that folder and puts it live, checking for a new version every 20 minutes.
