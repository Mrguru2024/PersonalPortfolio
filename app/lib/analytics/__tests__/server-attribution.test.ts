/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { extractRequestAttribution } from "@/lib/analytics/server-attribution";

describe("extractRequestAttribution", () => {
  it("prefers request payload attribution over query params", () => {
    const req = new NextRequest(
      "http://localhost/contact?utm_source=google&utm_medium=cpc&utm_campaign=fall",
      {
        headers: {
          referer: "https://example.com/ref",
          cookie:
            "asc_attr_first=%7B%22utm_source%22%3A%22linkedin%22%2C%22utm_campaign%22%3A%22brand%22%7D",
        },
      }
    );
    const { attribution, firstTouch } = extractRequestAttribution(req, {
      utm_source: "newsletter",
      utm_campaign: "launch",
      visitorId: "visitor_x",
      landing_page: "/contact",
    });
    expect(attribution.utm_source).toBe("newsletter");
    expect(attribution.utm_campaign).toBe("launch");
    expect(attribution.landing_page).toBe("/contact");
    expect(attribution.visitorId).toBe("visitor_x");
    expect(firstTouch?.utm_source).toBe("linkedin");
  });

  it("falls back to cookie and query when body is missing", () => {
    const req = new NextRequest("http://localhost/free-growth-tools?utm_medium=organic", {
      headers: {
        cookie:
          "asc_attr_last=%7B%22utm_source%22%3A%22google%22%2C%22utm_campaign%22%3A%22spring%22%7D",
      },
    });
    const { attribution } = extractRequestAttribution(req, {});
    expect(attribution.utm_source).toBe("google");
    expect(attribution.utm_medium).toBe("organic");
    expect(attribution.utm_campaign).toBe("spring");
  });
});
