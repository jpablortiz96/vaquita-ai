# Architecture Decision Records (ADR)

> Each significant technical or product decision gets an entry. Format: ADR-N: Title.

## ADR-1: Use Foundry instead of Hardhat
**Date:** 2026-05-07
**Status:** Accepted
**Context:** Need a Solidity development framework.
**Decision:** Use Foundry.
**Reasoning:** Faster compilation, faster tests, better fuzzing support, current industry standard for new projects in 2026.
**Consequences:** All scripts use Solidity (not JavaScript). Contributors must install Foundry.

## ADR-2: Use Privy for wallet abstraction
**Date:** 2026-05-07
**Status:** Accepted
**Context:** Target users are non-crypto natives. Asking them to install MetaMask kills onboarding.
**Decision:** Use Privy embedded wallets with email/social login.
**Reasoning:** Frictionless onboarding for LATAM users. Privy supports Arbitrum natively.
**Consequences:** Dependency on a third-party service. Mitigation: users can export private keys.

## ADR-3: WhatsApp as primary interface
**Date:** 2026-05-07
**Status:** Accepted
**Context:** Target users live in WhatsApp. App downloads have very high friction in LATAM.
**Decision:** WhatsApp via Twilio is the primary user interface; web PWA is secondary.
**Reasoning:** Fastest path to product-market fit in LATAM. Removes the biggest friction point.
**Consequences:** Twilio costs at scale. Mitigation: validated business model can absorb Twilio fees per transaction.

## ADR-4: Claude Sonnet 4 as the LLM
**Date:** 2026-05-07
**Status:** Accepted
**Context:** Need an LLM for risk scoring, orchestration, and conversational flows.
**Decision:** Use Claude Sonnet 4 via Anthropic API.
**Reasoning:** Strong reasoning for risk scoring, excellent Spanish, founder has deep experience with the API.
**Consequences:** API costs scale with usage. Mitigation: cache scoring decisions, batch where possible.

## ADR-5: MXNB as the native currency
**Date:** 2026-05-07
**Status:** Accepted
**Context:** Bitso is the lead sponsor and MXNB is their stablecoin. Also fits the LATAM-first thesis.
**Decision:** MXNB is the only currency users see. USDC is not an option.
**Reasoning:** Mexican users think in pesos, not dollars. MXNB removes mental conversion friction. Sponsor alignment.
**Consequences:** Limited to chains where MXNB is deployed (Arbitrum, Ethereum, Avalanche). Mitigation: Arbitrum is our chosen L2 anyway.
