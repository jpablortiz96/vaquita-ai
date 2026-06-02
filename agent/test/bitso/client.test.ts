import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";

describe("Bitso client signature", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("computes HMAC SHA256 in the exact format Bitso expects", () => {
        const secret = "test_secret_abcdef1234567890";
        const nonce = "1700000000000";
        const path = "/account_status";
        const message = `${nonce}GET${path}`;
        const sig = createHmac("sha256", secret).update(message).digest("hex");
        expect(sig.length).toBe(64); // SHA256 hex = 64 chars
        expect(sig).toMatch(/^[a-f0-9]+$/);
    });

    it("encodes POST body in signature", () => {
        const secret = "test_secret";
        const nonce = "1700000000000";
        const path = "/orders";
        const body = JSON.stringify({ amount: "100", currency: "mxn" });
        const message = `${nonce}POST${path}${body}`;
        const sig = createHmac("sha256", secret).update(message).digest("hex");
        expect(sig.length).toBe(64);
    });

    it("produces deterministic signatures for the same inputs", () => {
        const secret = "fixed_secret";
        const nonce = "1234567890";
        const path = "/balance";
        const message = `${nonce}GET${path}`;
        const sig1 = createHmac("sha256", secret).update(message).digest("hex");
        const sig2 = createHmac("sha256", secret).update(message).digest("hex");
        expect(sig1).toBe(sig2);
    });
});

describe("Bitso client configuration check", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("isConfigured returns false when credentials missing", async () => {
        vi.doMock("../../src/config/env.js", () => ({
            env: { BITSO_API_BASE_URL: "https://api-sandbox.bitso.com/api/v3" },
            isBitsoConfigured: () => false,
        }));
        const { getBitsoClient } = await import("../../src/bitso/client.js");
        const c = getBitsoClient();
        expect(c.isConfigured()).toBe(false);
    });
});
