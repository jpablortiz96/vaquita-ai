import { describe, it, expect } from "vitest";

describe("env", () => {
    it("loads required variables", async () => {
        const { env } = await import("../src/config/env.js");
        expect(env.ANTHROPIC_API_KEY).toBeTruthy();
        expect(env.ARBITRUM_SEPOLIA_RPC).toContain("http");
        expect(env.DEPLOYER_PRIVATE_KEY.startsWith("0x")).toBe(true);
        expect(env.DEPLOYER_PRIVATE_KEY.length).toBe(66);
    });
});
