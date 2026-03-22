import {
  PublicHttpsOriginError,
  assertPublicHttpsOriginForAudit,
} from "../publicHttpsOrigin";

describe("assertPublicHttpsOriginForAudit", () => {
  it("normalizes host-only input to https origin", () => {
    expect(assertPublicHttpsOriginForAudit("Example.com")).toBe("https://example.com");
  });

  it("accepts https URLs and strips to origin", () => {
    expect(assertPublicHttpsOriginForAudit("https://CLIENT.io/foo/bar")).toBe("https://client.io");
  });

  it("rejects http", () => {
    expect(() => assertPublicHttpsOriginForAudit("http://example.com")).toThrow(PublicHttpsOriginError);
  });

  it("rejects localhost", () => {
    expect(() => assertPublicHttpsOriginForAudit("https://localhost")).toThrow(PublicHttpsOriginError);
  });

  it("rejects private IPv4", () => {
    expect(() => assertPublicHttpsOriginForAudit("https://192.168.1.1")).toThrow(PublicHttpsOriginError);
    expect(() => assertPublicHttpsOriginForAudit("https://10.0.0.1")).toThrow(PublicHttpsOriginError);
  });

  it("rejects URLs with credentials", () => {
    expect(() => assertPublicHttpsOriginForAudit("https://user:pass@example.com")).toThrow(PublicHttpsOriginError);
  });
});
