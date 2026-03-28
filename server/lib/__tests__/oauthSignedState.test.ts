import { createHmac } from "crypto";
import {
  createSignedOAuthState,
  tryCreateSignedOAuthState,
  verifySignedOAuthState,
} from "../oauthSignedState";

const ORIGINAL_ENV = { ...process.env };

describe("oauthSignedState", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("signs and verifies state with OAUTH_STATE_SECRET", () => {
    process.env.OAUTH_STATE_SECRET = "test-secret-for-oauth-state-only";
    delete process.env.SESSION_SECRET;
    delete process.env.FACEBOOK_APP_SECRET;
    const state = createSignedOAuthState();
    expect(verifySignedOAuthState(state)).toBe(true);
    expect(verifySignedOAuthState("tampered")).toBe(false);
    expect(verifySignedOAuthState(null)).toBe(false);
  });

  it("tryCreateSignedOAuthState returns null when no secret", () => {
    delete process.env.OAUTH_STATE_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.FACEBOOK_APP_SECRET;
    delete process.env.THREADS_APP_SECRET;
    expect(tryCreateSignedOAuthState()).toBeNull();
  });

  it("rejects expired state", () => {
    process.env.OAUTH_STATE_SECRET = "x";
    const secret = "x";
    const r = "a".repeat(48);
    const exp = String(Date.now() - 60_000);
    const payload = `${r}.${exp}`;
    const sig = createHmac("sha256", secret).update(payload).digest("base64url");
    const state = `${payload}.${sig}`;
    expect(verifySignedOAuthState(state)).toBe(false);
  });

  it("meta profile signs with FACEBOOK_APP_SECRET before SESSION_SECRET", () => {
    delete process.env.OAUTH_STATE_SECRET;
    delete process.env.THREADS_APP_SECRET;
    process.env.FACEBOOK_APP_SECRET = "fb-only-meta";
    process.env.SESSION_SECRET = "session-only-default";
    const state = createSignedOAuthState("meta");
    expect(verifySignedOAuthState(state, "meta")).toBe(true);
    expect(verifySignedOAuthState(state, "default")).toBe(false);
  });

  it("threads profile prefers THREADS_APP_SECRET over FACEBOOK_APP_SECRET", () => {
    delete process.env.OAUTH_STATE_SECRET;
    process.env.THREADS_APP_SECRET = "threads-app-secret";
    process.env.FACEBOOK_APP_SECRET = "facebook-app-secret";
    const state = createSignedOAuthState("threads");
    expect(verifySignedOAuthState(state, "threads")).toBe(true);
    expect(verifySignedOAuthState(state, "meta")).toBe(false);
  });

  it("verifies once-encoded state from URL query parsing", () => {
    process.env.OAUTH_STATE_SECRET = "url-decode-test";
    const state = createSignedOAuthState();
    const encoded = encodeURIComponent(state);
    expect(verifySignedOAuthState(encoded)).toBe(true);
  });
});
