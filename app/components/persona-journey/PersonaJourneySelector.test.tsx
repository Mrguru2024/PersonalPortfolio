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
        metadata: expect.objectContaining({ personaId: "marcus-trades" }),
      })
    );
    expect(onSelect).toHaveBeenCalledWith("marcus-trades");
  });
});
