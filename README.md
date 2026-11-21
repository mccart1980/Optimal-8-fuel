# FCS Load Check — practice version

Load sheets, crews, lorries, job photos and holidays for First Choice Scaffolding.

**Address: https://ianmccart1980-blip.github.io/Fcs-load-check/**

What it does:

- **Jobs.** Gerry fills in a job sheet (Erect, Alter or Strike; address, lorry, charge hand, gang, load list, miscellaneous) and sends it to the yard. The yard ticks the load and confirms it. The charge hand checks it in the morning, taps when the lorry leaves, adds finish photos and any extra work, and marks the job finished. Gerry sees each step, the times, anything missing and any extra work to charge.
- **Four screens.** Gerry sees everything and has control of it. The yard sees the load list and miscellaneous for each lorry. The charge hand sees his jobs and checks the load. The gang just see the job. In this practice version, tap the name at the top right to see each one.
- **Load list and Miscellaneous.** The load list is tube (5, 6, 8, 10, 13, 16ft and long), boards (8, 10 and 13ft), fittings (doubles, singles, swivels, sleeves, base plates, sole boards) and beams (3, 4, 5, 6 and 8m, each with a number). Everything else is under Miscellaneous. Ladder safes, treads, tie gear, Excalibur bolts, netting, foam, caps, cable ties, board clips and short boards are tapped on when the job needs them. Beam joiners and pins, butts, ladders, brackets and lifting gear take a number.
- **Several jobs a day for one gang.** After sending a job, Gerry can add the next one for the same gang. They are numbered in order under the lorry, and the charge hand is pointed at the next job when one is finished.
- **Weekend work.** Gerry asks who wants a Saturday or Sunday. Staff put their names down. Gerry picks, and only the people he picks can be put on a job that day.
- **Inspections.** A finished Erect job puts the scaffold on the record. The app shows when each inspection is due, keeps the inspection record, and flags anything overdue or not safe.
- **The property.** A picture from above with the house outlined and measured, the type of house and storeys, and a note. It is kept on file for the address. With the firm's Ordnance Survey key (Set-up, under Address finder), the outline, the number of floors and the height to the eaves come from Ordnance Survey's record of the building. Without a key, the outline comes from OpenStreetMap. Street View, satellite and directions are one tap away.
- **Calendar.** One calendar with a colour key: jobs, inspections, time off and weekend work. Tap a day to see what is on, who is free and which lorries are free. Staff ask for time off in the app: a week's notice or more goes straight on, less goes to Gerry to approve. Anyone who's off can't be put on a job.
- **Alerts.** Each person is told what they need to know, under the Alerts button. Staff are told when they are put on a job or made charge hand, and when a job moves, changes or is cancelled. The yard is told about every new load. Gerry is told when a lorry is loaded, when anything is missing, when a gang leaves the yard, about extra work, finished jobs, time off, weekend names and scaffolds found not safe. After 4 o'clock each man gets tomorrow's jobs, and on the day an inspection is due the inspector and Gerry are told.
- **Week planner (laptop).** Calendar → Week planner shows the staff down the side and the days across the top. Drag a job onto another man to make him charge hand, or along to another day. The + in a square puts a new job on. The bottom row shows which lorries are free.
- **Demo.** Set-up → Demo runs one job all the way through, seen as each person in turn. Nothing in it is saved.
- **Guide.** The last button along the bottom has short steps for each thing a person does. Each person sees their own part.
- **Phone and laptop.** On a phone it is one column with buttons along the bottom. On a laptop the menu sits down the left side and the screens use two columns.
- **Set-up.** The staff list, the lorries list, the address finder key and the Ordnance Survey key.

This is the practice version. Everything stays on the phone it's used on, and nothing is shared between phones. That includes the alerts: they are all kept on the one phone, and can pop up on it if you turn that on at the top of the Alerts screen. Alerts that reach each man's own phone need the phones to share storage first. Tap the name at the top right to see the app as someone else. **Set-up → Start again from scratch** wipes it.

## Put it on an iPhone home screen

1. Open the address above in **Safari**.
2. Tap the **Share** button. If you can't see it, tap the icon at the left of the address bar first.
3. Tap **Add to Home Screen**, then **Add**.

## How it gets there

The app's files are in the `site` folder of this branch (`fcs-load-check` in `mccart1980/Optimal-8-fuel`), which has nothing to do with the fuel app on `main`. The repo `ianmccart1980-blip/Fcs-load-check` fetches that folder and puts it live, checking for a new version every 20 minutes.
