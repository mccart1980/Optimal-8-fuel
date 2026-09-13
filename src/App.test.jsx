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

  it("renders every section of the plan document", async () => {
    await mounted();
    fireEvent.click(screen.getByText("PLAN"));
    const heads = PLAN_MD.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
    expect(heads.length).toBeGreaterThan(15);
    for (const h of heads) expect(screen.getAllByText(h).length).toBeGreaterThan(0);
  });
});
