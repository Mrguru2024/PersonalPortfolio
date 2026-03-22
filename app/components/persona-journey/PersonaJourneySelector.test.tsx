/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import { PersonaJourneySelector } from "./PersonaJourneySelector";

const mockTrack = jest.fn();
jest.mock("@/lib/useVisitorTracking", () => ({
  useVisitorTracking: () => ({ track: mockTrack }),
}));

describe("PersonaJourneySelector", () => {
  beforeEach(() => {
    mockTrack.mockClear();
  });

  it("renders six persona options", () => {
    const onSelect = jest.fn();
    render(<PersonaJourneySelector onSelect={onSelect} pageVisited="/test" />);
    expect(screen.getByText("Skilled trades owner")).not.toBeNull();
    expect(screen.getByText("Early SaaS founder")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });

  it("tracks and calls onSelect when a card is clicked", () => {
    const onSelect = jest.fn();
    render(<PersonaJourneySelector onSelect={onSelect} pageVisited="/" />);
    fireEvent.click(screen.getByText("Skilled trades owner"));
    expect(mockTrack).toHaveBeenCalledWith(
      "persona_journey_selected",
      expect.objectContaining({
        pageVisited: "/",
        metadata: expect.objectContaining({ personaId: "marcus-trades", selectorTier: "primary" }),
      })
    );
    expect(onSelect).toHaveBeenCalledWith("marcus-trades");
  });

  it("reveals additional paths when toggled and selects a more-tier persona", () => {
    const onSelect = jest.fn();
    render(<PersonaJourneySelector onSelect={onSelect} pageVisited="/journey" />);
    fireEvent.click(screen.getByRole("button", { name: /additional paths/i }));
    expect(screen.getByText("High-ticket / business owner")).toBeTruthy();
    fireEvent.click(screen.getByText("High-ticket / business owner"));
    expect(mockTrack).toHaveBeenCalledWith(
      "persona_journey_selected",
      expect.objectContaining({
        metadata: expect.objectContaining({ personaId: "high-ticket-owner", selectorTier: "more" }),
      })
    );
    expect(onSelect).toHaveBeenCalledWith("high-ticket-owner");
  });
});
