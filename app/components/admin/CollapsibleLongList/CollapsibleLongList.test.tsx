import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollapsibleLongList } from "./index";

describe("CollapsibleLongList", () => {
  it("renders all items when at or below preview count", () => {
    const items = [1, 2, 3];
    render(
      <CollapsibleLongList
        items={items}
        previewCount={8}
        getKey={(n) => n}
        nounPlural="rows"
        renderItem={(n) => <div data-testid={`row-${n}`}>{n}</div>}
      />,
    );
    expect(screen.getByTestId("row-1")).toBeInTheDocument();
    expect(screen.getByTestId("row-3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /more rows/i })).not.toBeInTheDocument();
  });

  it("shows expand control and reveals hidden items", async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 12 }, (_, i) => i + 1);
    render(
      <CollapsibleLongList
        items={items}
        previewCount={8}
        getKey={(n) => n}
        nounPlural="items"
        renderItem={(n) => <div data-testid={`row-${n}`}>{n}</div>}
      />,
    );
    expect(screen.getByTestId("row-8")).toBeInTheDocument();
    expect(screen.queryByTestId("row-9")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show 4 more items/i }));
    expect(screen.getByTestId("row-12")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide 4 items/i }));
    expect(screen.queryByTestId("row-12")).not.toBeInTheDocument();
  });
});
