import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HostAvailabilitySettings } from "./index";

describe("HostAvailabilitySettings", () => {
  it("renders working hours section from initial data", () => {
    render(
      <HostAvailabilitySettings
        initialData={{
          timezone: "America/Chicago",
          weeklyRules: [{ dayOfWeek: 1, startTimeLocal: "09:00", endTimeLocal: "12:00" }],
          blockedDates: ["2026-04-01"],
        }}
      />,
    );
    expect(screen.getByText("Your working hours")).toBeInTheDocument();
    expect(screen.getByText("America/Chicago")).toBeInTheDocument();
    expect(screen.getByText("2026-04-01")).toBeInTheDocument();
  });

  it("save sends PUT with rules and blocked dates", async () => {
    const user = userEvent.setup();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(
      <HostAvailabilitySettings
        initialData={{
          timezone: "UTC",
          weeklyRules: [],
          blockedDates: [],
        }}
        apiBasePath="/api/test/host-availability"
      />,
    );

    await user.click(screen.getByRole("button", { name: /add weekly window/i }));
    await user.click(screen.getByRole("button", { name: /save my availability/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/test/host-availability",
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });
    const putCall = fetchMock.mock.calls.find((c) => c[1]?.method === "PUT");
    expect(putCall).toBeDefined();
    const body = JSON.parse((putCall![1] as RequestInit).body as string);
    expect(body.weeklyRules).toHaveLength(1);
    expect(body.weeklyRules[0].dayOfWeek).toBe(1);
  });
});
