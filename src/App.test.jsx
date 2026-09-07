import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App.jsx";

describe("Fuel · Optimal 8", () => {
  it("mounts and gets past LOADING", async () => {
    render(<App />);
    await waitFor(() => expect(screen.queryByText("LOADING…")).toBeNull());
    // The brand mark is split across elements ("FUEL", "·", "O8"), and a bare
    // /FUEL/ also catches the "…SHAKE FUELS THE BENCH" tagline — so match the
    // one element whose whole text is the brand.
    expect(screen.getByText((_, el) => el && el.textContent === "FUEL·O8")).toBeTruthy();
  });

  it("shows the 03:10 shake as Wednesday's first feed", async () => {
    render(<App />);
    await waitFor(() => expect(screen.queryByText("LOADING…")).toBeNull());

    fireEvent.click(screen.getByText("WED"));
    await screen.findByText(/WEDNESDAY/);

    const feeds = screen.getAllByTestId("feed");
    const first = within(feeds[0]);
    expect(first.getByText("03:10")).toBeTruthy();
    expect(first.getByText(/PRE-SESSION SHAKE/)).toBeTruthy();
  });
});
