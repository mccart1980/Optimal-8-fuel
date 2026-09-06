import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import App from "./App.jsx";

describe("Fuel · Optimal 8", () => {
  it("mounts and gets past LOADING", async () => {
    render(<App />);
    await waitFor(() => expect(screen.queryByText("LOADING…")).toBeNull());
    expect(screen.getByText(/FUEL/)).toBeTruthy();
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
