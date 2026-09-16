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

  it("renders every section of the plan document", async () => {
    await mounted();
    fireEvent.click(screen.getByText("PLAN"));
    const heads = PLAN_MD.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
    expect(heads.length).toBeGreaterThan(15);
    for (const h of heads) expect(screen.getAllByText(h).length).toBeGreaterThan(0);
  });
});
