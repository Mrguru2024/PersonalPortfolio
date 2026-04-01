import "@server/openai/nodeClient";
import { normalizeOfferDeliverableIcon } from "./offerAiFillService";

describe("normalizeOfferDeliverableIcon", () => {
  it("keeps allowed Lucide names", () => {
    expect(normalizeOfferDeliverableIcon("Zap")).toBe("Zap");
    expect(normalizeOfferDeliverableIcon(" FileText ")).toBe("FileText");
  });

  it("falls back to FileText for unknown icons", () => {
    expect(normalizeOfferDeliverableIcon("Banana")).toBe("FileText");
    expect(normalizeOfferDeliverableIcon("")).toBe("FileText");
  });
});
