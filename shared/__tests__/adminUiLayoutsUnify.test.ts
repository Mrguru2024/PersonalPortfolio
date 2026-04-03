import {
  mergeVisibleReorderIntoFullOrder,
  enforceMainSurfaceNativeWidgetsOnly,
  dedupeWidgetPlacementAcrossSurfaces,
} from "@/lib/adminUiLayoutsUnify";
import { DEFAULT_CRM_DASHBOARD_ORDER } from "@/lib/crmDashboardLayout";

describe("mergeVisibleReorderIntoFullOrder", () => {
  it("merges reordered visible rows while preserving hidden positions", () => {
    const fullOrder = ["a", "b", "h1", "c", "h2"];
    const hidden = ["h1", "h2"];
    const nextVisible = ["c", "a", "b"];
    expect(mergeVisibleReorderIntoFullOrder(fullOrder, hidden, nextVisible)).toEqual([
      "c",
      "a",
      "h1",
      "b",
      "h2",
    ]);
  });
});

describe("enforceMainSurfaceNativeWidgetsOnly", () => {
  it("moves CRM widget ids off main onto their home surface", () => {
    const state = dedupeWidgetPlacementAcrossSurfaces({
      main: {
        order: ["summary", "kpis", "inbox"],
        hidden: [],
      },
      crm: { order: [...DEFAULT_CRM_DASHBOARD_ORDER], hidden: [] },
      analytics: { order: [], hidden: [] },
    });
    const next = enforceMainSurfaceNativeWidgetsOnly(state);
    expect(next.main.order).toEqual(["summary", "inbox"]);
    expect(next.crm.order).toContain("kpis");
  });
});
