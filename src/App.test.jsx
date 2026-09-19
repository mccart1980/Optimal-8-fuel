import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App.jsx";
import PLAN_MD from "../fuel-optimal-8-fighter.md?raw";

const mounted = async () => {
  render(<App />);
  await waitFor(() => expect(screen.queryByText("LOADING…")).toBeNull());
};

describe("Fuel · Optimal 8 Fighter", () => {
  it("mounts and gets past LOADING", async () => {
    await mounted();
    expect(screen.getByText(/FUEL/)).toBeTruthy();
  });

  it("opens Wednesday on the 03:10 half bottle", async () => {
    await mounted();
    fireEvent.click(screen.getByText("WED"));
    await screen.findByText(/WEDNESDAY/);

    const first = within(screen.getAllByTestId("feed")[0]);
    expect(first.getByText("03:10")).toBeTruthy();
    expect(first.getByText(/HALF BOTTLE \+ BANANA/)).toBeTruthy();
  });

  it("splits the 04:50 line into the half bottle then the porridge", async () => {
    await mounted();
    for (const day of ["MON", "TUE", "WED", "THU"]) {
      fireEvent.click(screen.getByText(day));
      const feeds = screen.getAllByTestId("feed");
      expect(within(feeds[1]).getByText(/^HALF BOTTLE$/)).toBeTruthy();
      expect(within(feeds[2]).getByText(/PORRIDGE/)).toBeTruthy();
    }
  });

  it("has no session and no bottle on Friday", async () => {
    await mounted();
    fireEvent.click(screen.getByText("FRI"));
    await screen.findByText(/FRIDAY/);

    const first = within(screen.getAllByTestId("feed")[0]);
    expect(first.getByText("WAKE")).toBeTruthy();
    expect(first.getByText(/PORRIDGE/)).toBeTruthy();
    expect(screen.getByText(/SLEEP DAY/)).toBeTruthy();
    expect(screen.queryByText(/BOTTLE/)).toBeNull();
  });

  it("puts casein on Monday, Wednesday, Thursday, Friday and Sunday only", async () => {
    await mounted();
    const withCasein = [];
    for (const day of ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]) {
      fireEvent.click(screen.getByText(day));
      if (screen.queryByText(/CASEIN/)) withCasein.push(day);
    }
    expect(withCasein).toEqual(["MON", "WED", "THU", "FRI", "SUN"]);
  });

  it("no longer carries whey, the old shakes or UFIT snacks", async () => {
    await mounted();
    for (const day of ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]) {
      fireEvent.click(screen.getByText(day));
      for (const gone of [/whey/i, /SHAKE \+ FRUIT/, /NIGHT SHAKE/, /PRE-SESSION SHAKE/, /EGGS \+ BANANA/, /UFIT \+ BANANA/]) {
        expect(screen.queryByText(gone)).toBeNull();
      }
    }
  });

  it("opens Settings with its break times and session lengths", async () => {
    await mounted();
    fireEvent.click(screen.getByLabelText("Settings"));
    expect(await screen.findByText("SETTINGS")).toBeTruthy();
    expect(screen.getByText(/Break times at work/)).toBeTruthy();
    expect(screen.getByText(/Session length in minutes/)).toBeTruthy();
    expect(screen.getByText(/Backup/)).toBeTruthy();
  });

  it("re-times the morning around an entered start and leaves the afternoon alone", async () => {
    await mounted();
    fireEvent.click(screen.getByText("MON"));

    const field = screen.getByLabelText("Session start time");
    const at = (label) => screen.getAllByTestId("feed")
      .find((el) => new RegExp(label).test(el.textContent)).textContent.slice(0, 5);

    expect(field.value).toBe("03:30");                      // opens on the plan's start
    expect(at("HALF BOTTLE \\+ BANANA")).toBe("03:10");     // but nothing entered yet
    expect(at("PORRIDGE")).toBe("04:50");

    fireEvent.change(field, { target: { value: "04:30" } });
    expect(at("HALF BOTTLE \\+ BANANA")).toBe("04:10");     // start − 20
    expect(at("PORRIDGE")).toBe("05:35");                   // start + 65
    expect(at("BATCH")).toBe("09:00");                      // first break
    expect(at("TWO BANANAS")).toBe("15:00");                // 15:00 onward is fixed
    expect(at("STEAK & EGGS")).toBe("18:30");
    expect(at("CASEIN")).toBe("21:00");

    fireEvent.click(screen.getByText("PLAN TIMES"));
    expect(at("HALF BOTTLE \\+ BANANA")).toBe("03:10");
    expect(at("PORRIDGE")).toBe("04:50");
  });

  it("uses a wake field on Friday and an 08:15 start at the weekend", async () => {
    await mounted();

    fireEvent.click(screen.getByText("FRI"));
    const wake = screen.getByLabelText("Wake time");
    expect(wake.value).toBe("05:00");
    expect(screen.queryByLabelText("Session start time")).toBeNull();
    fireEvent.change(wake, { target: { value: "05:30" } });
    expect(screen.getAllByTestId("feed").find((el) => /PORRIDGE/.test(el.textContent))
      .textContent.slice(0, 5)).toBe("05:45");              // wake + 15

    fireEvent.click(screen.getByText("SAT"));
    const start = screen.getByLabelText("Session start time");
    expect(start.value).toBe("08:15");
    fireEvent.change(start, { target: { value: "08:15" } });
    const times = (label) => screen.getAllByTestId("feed")
      .find((el) => new RegExp(label).test(el.textContent)).textContent.slice(0, 5);
    expect(times("PORRIDGE BIG")).toBe("06:30");            // start − 1h45
    expect(times("HALF BOTTLE \\+ BANANA")).toBe("07:45");  // start − 30
    expect(times("HALF BOTTLE \\+ 2 BANANAS")).toBe("10:00"); // start + 90 + 15
  });

  const seedTape = (rows) => window.localStorage.setItem("fu8-tape", JSON.stringify(rows));
  const sundays = (n) => Array.from({ length: n }, (_, i) => {
    const d = new Date(2026, 5, 7); d.setDate(d.getDate() + i * 7);
    return d.toISOString().slice(0, 10);
  });

  it("logs a reading on THE REFEREE and keeps it", async () => {
    await mounted();
    fireEvent.click(screen.getByText("REFEREE"));
    expect(await screen.findByText("The referee")).toBeTruthy();
    expect(screen.getByText(/Nothing logged yet/)).toBeTruthy();

    const byLabel = (t) => screen.getByText(t).parentElement.querySelector("input");
    fireEvent.change(byLabel("bodyweight kg"), { target: { value: "80.4" } });
    fireEvent.change(byLabel("waist cm"), { target: { value: "84" } });
    fireEvent.click(screen.getByText("LOG IT"));

    expect(screen.getByText(/^Logged /)).toBeTruthy();
    const saved = JSON.parse(window.localStorage.getItem("fu8-tape"));
    expect(saved).toHaveLength(1);
    expect(saved[0].kg).toBe(80.4);
    expect(saved[0].waist).toBe(84);
    expect(screen.getByText("UPDATE THIS SUNDAY")).toBeTruthy();
  });

  it("lights the waist rule when the waist outruns the tape", async () => {
    const d = sundays(5);
    seedTape([
      { d: d[0], kg: 80.0, waist: 84.0, arm: 39.5, shoulder: 121.0 },
      { d: d[4], kg: 80.6, waist: 85.5, arm: 39.6, shoulder: 121.2 },
    ]);
    await mounted();
    fireEvent.click(screen.getByText("REFEREE"));
    expect(await screen.findByText(/Waist \+1.5 cm against \+0.2 cm up top/)).toBeTruthy();
    expect(screen.getByText(/one of the 3pm bananas on Monday and Thursday/)).toBeTruthy();
    expect(screen.queryByText(/Arms and shoulders up, waist flat/)).toBeNull();
  });

  it("lights the falling-weight rule below half a kilo a week", async () => {
    const d = sundays(4);
    seedTape(d.map((x, i) => ({ d: x, kg: +(81.0 - 0.7 * i).toFixed(1), waist: 84 })));
    await mounted();
    fireEvent.click(screen.getByText("REFEREE"));
    expect(await screen.findByText(/Trending -0.70 kg a week/)).toBeTruthy();
    expect(screen.getByText(/rice pouch on the light days/)).toBeTruthy();
  });

  it("holds when arms are up and the waist is flat", async () => {
    const d = sundays(5);
    seedTape([
      { d: d[0], kg: 80.0, waist: 84.0, arm: 39.5, shoulder: 121.0 },
      { d: d[1], kg: 80.2, waist: 84.0 }, { d: d[2], kg: 80.3, waist: 84.0 },
      { d: d[3], kg: 80.5, waist: 84.0 },
      { d: d[4], kg: 80.7, waist: 84.0, arm: 40.1, shoulder: 122.0 },
    ]);
    await mounted();
    fireEvent.click(screen.getByText("REFEREE"));
    expect(await screen.findByText(/Arms and shoulders up, waist flat/)).toBeTruthy();
  });

  it("restores the tape numbers from a backup", async () => {
    await mounted();
    fireEvent.click(screen.getByLabelText("Settings"));
    await screen.findByText("SETTINGS");

    const backup = JSON.stringify({
      app: "optimal-8-fuel", version: 1,
      data: { "fu8-tape": [{ d: "2026-06-07", kg: 80.4, waist: 84, arm: 39.5, shoulder: 121 }] },
    });
    fireEvent.change(screen.getByPlaceholderText(/optimal-8-fuel/), { target: { value: backup } });
    fireEvent.click(screen.getByText("IMPORT PASTED TEXT"));

    expect(await screen.findByText(/Restored 1 of 8 sections/)).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem("fu8-tape"))[0].arm).toBe(39.5);

    fireEvent.click(screen.getByText("CLOSE"));
    fireEvent.click(screen.getByText("REFEREE"));
    expect(await screen.findByText("2026-06-07")).toBeTruthy();
    expect(screen.getAllByText("39.5").length).toBeGreaterThan(0);   // headline and the readings list
  });

  const dayKcal = () => Number(screen.getByText(/^MONDAY$|^SATURDAY$/).parentElement.textContent
    .replace(/[^\d]/g, "").slice(0, 4));
  const feedCard = (re) => screen.getAllByTestId("feed").find((el) => re.test(el.textContent));

  it("swaps a feed to Menu B and recomputes the day", async () => {
    await mounted();
    fireEvent.click(screen.getByText("MON"));
    const before = dayKcal();
    expect(before).toBe(3332);

    fireEvent.click(within(feedCard(/09:00[\s\S]*BATCH/)).getByText("BATCH"));
    const card = feedCard(/09:00/);
    fireEvent.click(within(card).getByText("MINCE WRAPS + BANANA"));

    expect(dayKcal()).toBe(3369);                       // 3332 + 37
    expect(screen.getByText("MENU B IN PLAY")).toBeTruthy();
    expect(within(feedCard(/09:00/)).getByText("MENU B")).toBeTruthy();

    fireEvent.click(within(feedCard(/09:00/)).getAllByText("BATCH")[0]);
    expect(dayKcal()).toBe(3332);                       // back to Menu A
  });

  it("offers Menu B only where the document does", async () => {
    await mounted();
    fireEvent.click(screen.getByText("MON"));
    // the A/B chip appears only on the slots the document swaps
    const chip = (re) => within(feedCard(re)).queryByText(/^MENU [AB]$/);
    for (const re of [/03:10/, /04:50[\s\S]*PORRIDGE/, /18:30/, /21:00/]) expect(chip(re)).toBeNull();
    for (const re of [/09:00/, /12:30/, /15:00/]) expect(chip(re)).toBeTruthy();
    // the 17:00 top-up lives on Tuesday and Friday
    fireEvent.click(screen.getByText("TUE"));
    expect(chip(/17:00/)).toBeTruthy();
  });

  it("runs the drink schedule against the day's target", async () => {
    await mounted();
    fireEvent.click(screen.getByText("MON"));
    expect(screen.getByText(/^\/ 4\.50 L$/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Mark On waking"));            // 500
    fireEvent.click(screen.getByLabelText(/Mark Work start/));           // 1000
    expect(screen.getByText("1.50")).toBeTruthy();

    // the sachet the document pins to the 5:15 litre
    expect(screen.getByText(/SACHET 1/)).toBeTruthy();
  });

  it("turns a dark urine check into 500 ml and flags sachet 2", async () => {
    await mounted();
    fireEvent.click(screen.getByText("MON"));
    expect(screen.queryByText(/Urine check · 500 ml/)).toBeNull();

    fireEvent.click(screen.getAllByText("DARK")[0]);
    expect(screen.getByText(/Urine check · 500 ml/)).toBeTruthy();
    fireEvent.click(screen.getAllByLabelText("Mark Urine check")[0]);
    expect(screen.getByText("0.50")).toBeTruthy();
  });

  it("moves the anchored drink rows with the session start", async () => {
    await mounted();
    fireEvent.click(screen.getByText("MON"));
    const row = (label) => screen.getByText(label).closest("div").parentElement.parentElement.textContent;
    expect(row(/In the session · 500 ml/)).toMatch(/03:30/);

    fireEvent.change(screen.getByLabelText("Session start time"), { target: { value: "04:30" } });
    expect(row(/In the session · 500 ml/)).toMatch(/04:30/);
    expect(row(/With the porridge · 300 ml/)).toMatch(/05:35/);          // start + 65
  });

  it("uses the weekend schedule and the sauna toggle", async () => {
    await mounted();
    fireEvent.click(screen.getByText("SAT"));
    expect(screen.getByText(/^\/ 4\.0 L$/)).toBeTruthy();
    expect(screen.queryByText(/Before the sauna/)).toBeNull();

    fireEvent.click(screen.getByText("SAUNA DAY"));
    expect(screen.getByText(/^\/ 4\.50 L$/)).toBeTruthy();
    expect(screen.getByText(/Before the sauna/)).toBeTruthy();
    expect(screen.getByText(/After the sauna/)).toBeTruthy();
  });

  it("carries Menu B onto the shop list and the cook page", async () => {
    await mounted();
    fireEvent.click(screen.getByText("SHOP"));
    expect(screen.getByText(/MENU B — ADDED TO MENU A/)).toBeTruthy();
    expect(screen.getByText("Wholemeal tortilla wraps, standard (about 40 g)")).toBeTruthy();
    expect(screen.getByText("10–12")).toBeTruthy();

    fireEvent.click(screen.getByText("COOK"));
    expect(screen.getByText(/Menu B prep/)).toBeTruthy();
    expect(screen.getByText("Portion the mince separately.")).toBeTruthy();
    expect(screen.getByText("Boil the eggs.")).toBeTruthy();
  });

  it("renders every section of the plan document", async () => {
    await mounted();
    fireEvent.click(screen.getByText("PLAN"));
    const heads = PLAN_MD.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
    expect(heads.length).toBeGreaterThan(15);
    for (const h of heads) expect(screen.getAllByText(h).length).toBeGreaterThan(0);
  });
});
