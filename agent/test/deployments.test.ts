import { describe, it, expect } from "vitest";
import { deployments } from "../src/config/deployments.js";

describe("deployments", () => {
    it("loads the Arbitrum Sepolia deployment manifest", () => {
        expect(deployments.network).toBe("arbitrum-sepolia");
        expect(deployments.chainId).toBe(421614);
    });

    it("contains all three core contracts with valid addresses", () => {
        const addrPattern = /^0x[a-fA-F0-9]{40}$/;
        expect(deployments.contracts.MockMXNB.address).toMatch(addrPattern);
        expect(deployments.contracts.VaquitaImplementation.address).toMatch(addrPattern);
        expect(deployments.contracts.VaquitaFactory.address).toMatch(addrPattern);
    });

    it("MockMXNB is configured with 6 decimals", () => {
        expect(deployments.contracts.MockMXNB.decimals).toBe(6);
    });
});
