import { z } from "zod";
import type { Address } from "viem";
import { callClaudeJSON } from "./claude.js";
import type { RiskInput, RiskScore, PayoutOrderSuggestion } from "../types/index.js";

const SYSTEM_PROMPT = `You are the risk-scoring agent for VaquitaAI, an onchain rotating savings protocol for Latin America (vaquitas / tandas / cundinas).

Your job is to assess the trustworthiness of a candidate member who wants to join a vaquita. You consider:
1. Onchain history of their wallet (age, activity, balance trends)
2. Self-reported data (occupation, income, time in community)
3. Social references (other vouchers from existing trusted members)

Output a JSON object with this exact shape (no markdown, no commentary):
{
  "score": <integer 0-100, where 100 = lowest risk / most trustworthy>,
  "rationale": "<two-sentence Spanish explanation suitable to display to the group>",
  "redFlags": ["<short Spanish phrase>", "..."],
  "suggestedPayoutPosition": "early" | "middle" | "late"
}

Scoring philosophy:
- Trust grows with verifiable signals: account age, completed prior vaquitas, social references from members who already finished a vaquita.
- Lack of data is itself a risk: a brand-new wallet with no references defaults to a score around 35-45.
- Self-reported income alone is weak — only use it when corroborated by onchain balance trends.
- "early" position = high trust, member is paid first (most incentive to disappear). "late" = low trust, member is paid last (most incentive to stay).
- Be honest, calibrated, and concise. Output is read by non-crypto Mexicans.`;

const riskScoreSchema = z.object({
    score: z.number().int().min(0).max(100),
    rationale: z.string().min(10),
    redFlags: z.array(z.string()),
    suggestedPayoutPosition: z.enum(["early", "middle", "late"]),
});

export async function scoreMember(input: RiskInput): Promise<RiskScore> {
    const userPrompt = `Score this candidate member:

Address: ${input.address}

Self-reported:
${JSON.stringify(input.selfReported ?? {}, null, 2)}

Onchain summary:
${JSON.stringify(input.onchain ?? {}, null, 2)}

References (existing trusted members vouching for this candidate):
${(input.references ?? []).join(", ") || "(none)"}

Return only the JSON object as specified.`;

    const result = await callClaudeJSON({
        system: SYSTEM_PROMPT,
        user: userPrompt,
        validate: (data) => riskScoreSchema.parse(data),
    });

    return {
        address: input.address,
        ...result,
    };
}

const ORDER_SYSTEM_PROMPT = `You are the payout-orchestrator agent for VaquitaAI.

Given a list of members with their risk scores, propose the optimal payout order. Higher-trust members go EARLIER (positions 1, 2, ...), lower-trust members go LATER. This minimizes the protocol's exposure: a low-trust member paid last has nothing to gain by disappearing.

Output JSON only:
{
  "order": ["<address1>", "<address2>", ...],
  "reasoning": "<two-sentence Spanish explanation>"
}

The order array must contain every input address exactly once.`;

const orderSchema = z.object({
    order: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)),
    reasoning: z.string().min(10),
});

export async function suggestPayoutOrder(scores: RiskScore[]): Promise<PayoutOrderSuggestion> {
    if (scores.length < 2) {
        throw new Error("Need at least 2 members to compute an order");
    }

    const userPrompt = `Members with their risk scores:

${scores
    .map(
        (s, i) =>
            `${i + 1}. ${s.address}\n   score: ${s.score}\n   rationale: ${s.rationale}\n   suggested: ${s.suggestedPayoutPosition}`,
    )
    .join("\n\n")}

Return only the JSON object with the optimal order.`;

    const result = await callClaudeJSON({
        system: ORDER_SYSTEM_PROMPT,
        user: userPrompt,
        validate: (data) => {
            const parsed = orderSchema.parse(data);
            if (parsed.order.length !== scores.length) {
                throw new Error("Order length mismatch");
            }
            const set = new Set(parsed.order.map((a) => a.toLowerCase()));
            if (set.size !== scores.length) {
                throw new Error("Order contains duplicates");
            }
            for (const s of scores) {
                if (!set.has(s.address.toLowerCase())) {
                    throw new Error(`Score address ${s.address} not in proposed order`);
                }
            }
            return parsed;
        },
    });

    return {
        order: result.order as Address[],
        reasoning: result.reasoning,
    };
}
