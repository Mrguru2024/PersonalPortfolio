import { htmlToPlainText, publishViaAdapter } from "../publishAdapters";

describe("htmlToPlainText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(htmlToPlainText("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("handles br (whitespace normalized to spaces)", () => {
    expect(htmlToPlainText("Line1<br/>Line2")).toBe("Line1 Line2");
  });
});

describe("publishViaAdapter", () => {
  const prevFetch = globalThis.fetch;

  afterEach(() => {
    delete process.env.CONTENT_STUDIO_PUBLISH_WEBHOOK_URL;
    delete process.env.CONTENT_STUDIO_PUBLISH_WEBHOOK_SECRET;
    if (typeof prevFetch === "function") {
      globalThis.fetch = prevFetch;
    } else {
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    }
  });

  it("webhook_hub POSTs JSON and optional signature", async () => {
    process.env.CONTENT_STUDIO_PUBLISH_WEBHOOK_URL = "https://hooks.example.com/cs";
    process.env.CONTENT_STUDIO_PUBLISH_WEBHOOK_SECRET = "testsecret";
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ received: true }),
    } as Response);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const out = await publishViaAdapter("webhook_hub", {
      title: "Hello",
      bodyText: "World",
      link: "https://example.com/p",
    });

    expect(out.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers as HeadersInit);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-Content-Studio-Signature")).toMatch(/^sha256=[a-f0-9]{64}$/);
    const body = JSON.parse((init?.body as string) ?? "{}");
    expect(body.event).toBe("content_studio.publish");
    expect(body.adapterKey).toBe("webhook_hub");
    expect(body.title).toBe("Hello");
    expect(body.link).toBe("https://example.com/p");
  });

  it("linkedin returns config error when env missing", async () => {
    jest.resetModules();
    jest.doMock("@server/services/contentStudioLinkedInConnectService", () => {
      const actual = jest.requireActual(
        "@server/services/contentStudioLinkedInConnectService",
      ) as typeof import("@server/services/contentStudioLinkedInConnectService");
      return {
        ...actual,
        getLinkedInCredentialsResolved: jest.fn().mockResolvedValue(null),
      };
    });
    const { publishViaAdapter: publish } = await import("../publishAdapters");
    delete process.env.LINKEDIN_ACCESS_TOKEN;
    delete process.env.LINKEDIN_AUTHOR_URN;
    const out = await publish("linkedin", { title: "T", bodyText: "B", link: null });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/LINKEDIN_ACCESS_TOKEN/i);
  });

  it("x returns config error when token missing", async () => {
    jest.resetModules();
    jest.doMock("@server/services/contentStudioXConnectService", () => {
      const actual = jest.requireActual(
        "@server/services/contentStudioXConnectService",
      ) as typeof import("@server/services/contentStudioXConnectService");
      return {
        ...actual,
        getXAccessTokenResolved: jest.fn().mockResolvedValue(null),
      };
    });
    const { publishViaAdapter: publish } = await import("../publishAdapters");
    delete process.env.X_OAUTH2_ACCESS_TOKEN;
    delete process.env.TWITTER_OAUTH2_ACCESS_TOKEN;
    const out = await publish("x", { title: "T", bodyText: "B", link: null });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/X_OAUTH2_ACCESS_TOKEN/i);
  });
});
