import { scoreMember, suggestPayoutOrder } from "../ai/risk-scorer.js";
import type { RiskInput, RiskScore, PayoutOrderSuggestion } from "../types/index.js";

/**
 * The Orchestrator coordinates the full setup flow:
 *   1. Score each candidate member.
 *   2. Compute the optimal payout order.
 *   3. Return a structured plan that the WhatsApp bot or frontend can present
 *      to the creator for confirmation, then submit on-chain.
 *
 * It does NOT submit any transaction itself — keeping IO and decision logic
 * separate makes everything testable and lets the user confirm before any signing.
 */
export interface OrchestrationPlan {
    scores: RiskScore[];
    order: PayoutOrderSuggestion;
}

export async function orchestrateSetup(candidates: RiskInput[]): Promise<OrchestrationPlan> {
    if (candidates.length < 2) {
        throw new Error("Need at least 2 candidates to orchestrate a vaquita");
    }

    // Score in parallel — Claude calls are independent.
    const scores = await Promise.all(candidates.map((c) => scoreMember(c)));
    const order = await suggestPayoutOrder(scores);

    return { scores, order };
}
