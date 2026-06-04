# Anthropic / Claude Integration

## Why Claude Sonnet 4.5

VaquitaAI uses Claude Sonnet 4.5 (via the Anthropic SDK) for two critical functions:
1. **Intent classification** — understanding free-form Spanish messages from users
2. **Risk scoring** — evaluating new vaquita member trustworthiness

We chose Claude over GPT-4 because:
- **Better Spanish-language understanding** — particularly Mexican Spanish idioms
- **Better at structured JSON output** — critical for our intent classifier
- **Better at following nuanced instructions** — the risk scorer has complex calibration rules
- **Faster + cheaper** in our workload (mostly small messages, not long-form generation)

## Implementation

### Intent Classifier
Location: `agent/src/bot/intent-classifier.ts`

```typescript
const intent = await classifyIntent("hacer una vaquita de 500 al mes con 4 amigos");
// Returns: { kind: "create_vaquita", partial: { contributionMXN: 500, totalMembers: 4, cycleDays: 30 } }
```

The classifier handles 13 distinct intents in Spanish, with complex disambiguation rules (e.g. "al mes" → 30 days; "por 6 meses" → ambiguous, don't set cycleDays).

### Risk Scorer
Location: `agent/src/ai/risk-scorer.ts`

```typescript
const score = await scoreMember({
    address: pseudoAddress,
    selfReported: {
        name: "María González",
        occupation: "maestra",
        monthlyIncomeMXN: 18000,
        timeInCommunityMonths: 24,
    },
});
// Returns: { score: 78, rationale: "...", redFlags: [], suggestedPayoutPosition: "middle" }
```

The scorer is calibrated to:
- Return scores in 0-100 range
- Provide reasoning in plain Spanish
- Flag concerning patterns (extreme income claims, very short community history, etc.)
- Suggest payout positions ("early" / "middle" / "late")

### Payout Order Suggestion
The same Claude model also orders members for the payout sequence:

```typescript
const order = await suggestPayoutOrder(memberScores);
// Returns ordered array of addresses with reasoning
```

## Calibration Quality

We tested the risk scorer across diverse synthetic profiles and confirmed:
- Stable middle-class profiles (teacher, government employee, long community ties) → scores 70-85
- Edge cases (unemployed, very short history) → scores 25-45
- Suspicious profiles (extreme income claims, inconsistent stories) → scores 15-35
- The model never returns extreme 0s or 100s (good calibration)

## Cost Optimization

- We use `claude-sonnet-4-5` for risk scoring (high-stakes)
- We use the same model for intent classification (handles edge cases better than smaller models)
- Average cost per vaquita lifecycle: ~$0.10 (50+ Claude calls across joining + scoring + payout)
- This is acceptable for a fintech use case; users save hundreds of dollars per vaquita

## V2 Improvements

- Add Claude vision for KYC document review (optional, only for institutional vaquitas)
- Use Claude to generate human-readable monthly vaquita reports in Spanish
- Add Claude-powered dispute resolution chat for vaquita conflicts

---
