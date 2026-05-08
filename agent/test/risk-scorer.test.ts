import { describe, it, expect } from "vitest";
import { scoreMember, suggestPayoutOrder } from "../src/ai/risk-scorer.js";
import type { Address } from "viem";

const skip = process.env.SKIP_AI_TESTS === "true";

describe.skipIf(skip)("risk-scorer (live AI calls)", () => {
    const trusted: Address = "0x1111111111111111111111111111111111111111";
    const newWallet: Address = "0x2222222222222222222222222222222222222222";
    const someoneElse: Address = "0x3333333333333333333333333333333333333333";

    it("scores a high-trust candidate above 60", async () => {
        const score = await scoreMember({
            address: trusted,
            selfReported: {
                name: "María González",
                occupation: "maestra",
                monthlyIncomeMXN: 18_000,
                timeInCommunityMonths: 24,
            },
            references: [
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address,
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address,
            ],
            onchain: {
                firstTxAgeDays: 540,
                totalTxCount: 87,
                currentBalanceMXNB: 3_500_000_000n,
            },
        });
        expect(score.score).toBeGreaterThan(60);
        expect(score.rationale.length).toBeGreaterThan(15);
    }, 30_000);

    it("scores a brand-new no-reference wallet below 50", async () => {
        const score = await scoreMember({
            address: newWallet,
            selfReported: { name: "anónimo" },
            onchain: {
                firstTxAgeDays: 1,
                totalTxCount: 1,
                currentBalanceMXNB: 0n,
            },
        });
        expect(score.score).toBeLessThanOrEqual(50);
    }, 30_000);

    it("suggests a payout order placing high-trust members earlier", async () => {
        const scores = [
            { address: trusted, score: 85, rationale: "long history", redFlags: [], suggestedPayoutPosition: "early" as const },
            { address: someoneElse, score: 55, rationale: "moderate history", redFlags: [], suggestedPayoutPosition: "middle" as const },
            { address: newWallet, score: 25, rationale: "no history", redFlags: ["nuevo"], suggestedPayoutPosition: "late" as const },
        ];
        const suggestion = await suggestPayoutOrder(scores);
        expect(suggestion.order.length).toBe(3);
        const trustedIdx = suggestion.order.findIndex((a) => a.toLowerCase() === trusted.toLowerCase());
        const newIdx = suggestion.order.findIndex((a) => a.toLowerCase() === newWallet.toLowerCase());
        expect(trustedIdx).toBeLessThan(newIdx);
    }, 30_000);
});
