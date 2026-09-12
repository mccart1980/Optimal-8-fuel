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

  it("shows the 03:10 shake as Wednesday's first feed", async () => {
    await mounted();
    fireEvent.click(screen.getByText("WED"));
    await screen.findByText(/WEDNESDAY/);

    const first = within(screen.getAllByTestId("feed")[0]);
    expect(first.getByText("03:10")).toBeTruthy();
    expect(first.getByText(/PRE-SESSION SHAKE/)).toBeTruthy();
  });

  it("has no session on Friday and opens on the porridge", async () => {
    await mounted();
    fireEvent.click(screen.getByText("FRI"));
    await screen.findByText(/FRIDAY/);

    const first = within(screen.getAllByTestId("feed")[0]);
    expect(first.getByText("WAKE")).toBeTruthy();
    expect(first.getByText(/PORRIDGE/)).toBeTruthy();
    expect(screen.getByText(/SLEEP DAY/)).toBeTruthy();
  });

  it("ends every day with the night shake and feeds the work mornings at 07:00", async () => {
    await mounted();
    for (const day of ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]) {
      fireEvent.click(screen.getByText(day));
      const feeds = screen.getAllByTestId("feed");
      const last = within(feeds[feeds.length - 1]);
      expect(last.getByText("21:30")).toBeTruthy();
      expect(last.getByText(/NIGHT SHAKE/)).toBeTruthy();
    }
    for (const day of ["MON", "TUE", "WED", "THU", "FRI"]) {
      fireEvent.click(screen.getByText(day));
      expect(screen.getByText("07:00")).toBeTruthy();
      expect(screen.getAllByText(/EGGS \+ BANANA/).length).toBeGreaterThan(0);
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
