import { describe, it, expect } from "vitest";
import { orchestrateSetup } from "../src/core/orchestrator.js";
import type { Address } from "viem";

const skip = process.env.SKIP_AI_TESTS === "true";

describe.skipIf(skip)("orchestrator (live AI calls)", () => {
    it("produces scores and a valid order for 4 candidates", async () => {
        const candidates = [
            {
                address: "0x1111111111111111111111111111111111111111" as Address,
                selfReported: { name: "Maria", occupation: "maestra", timeInCommunityMonths: 24 },
                onchain: { firstTxAgeDays: 540, totalTxCount: 87 },
            },
            {
                address: "0x2222222222222222222222222222222222222222" as Address,
                selfReported: { name: "Juan", occupation: "comerciante", timeInCommunityMonths: 12 },
                onchain: { firstTxAgeDays: 200, totalTxCount: 30 },
            },
            {
                address: "0x3333333333333333333333333333333333333333" as Address,
                selfReported: { name: "Sofia", timeInCommunityMonths: 6 },
                onchain: { firstTxAgeDays: 60, totalTxCount: 8 },
            },
            {
                address: "0x4444444444444444444444444444444444444444" as Address,
                selfReported: {},
                onchain: { firstTxAgeDays: 1, totalTxCount: 1 },
            },
        ];

        const plan = await orchestrateSetup(candidates);
        expect(plan.scores.length).toBe(4);
        expect(plan.order.order.length).toBe(4);
        const set = new Set(plan.order.order.map((a) => a.toLowerCase()));
        expect(set.size).toBe(4);
        for (const c of candidates) {
            expect(set.has(c.address.toLowerCase())).toBe(true);
        }
    }, 60_000);
});
