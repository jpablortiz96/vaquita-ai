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

## ADR-6: Mock MXNB on testnet, real MXNB on mainnet
**Date:** 2026-05-07
**Status:** Accepted
**Context:** The real MXNB token (`0xF197FFC28c23E0309B5559e7a166f2c6164C80aA`) is deployed on Arbitrum One. On Arbitrum Sepolia, no official MXNB exists.
**Decision:** Deploy a `MockMXNB` (`mMXNB`) on Arbitrum Sepolia with the same 6-decimal precision as the real token. The Vaquita contracts depend only on the IERC20 interface, so swapping between mock and real is one configuration change.
**Reasoning:** Avoids blocking development on testnet. The 6-decimal match means amount calculations behave identically. Adding a public faucet on the mock simplifies demos with judges.
**Consequences:** Documentation must clearly state that `mMXNB` is for testnet only. Mainnet deployment must be hardcoded to use the real MXNB address.

## ADR-7: V1 trusts the creator for payout order
**Date:** 2026-05-07
**Status:** Accepted (V1 only)
**Context:** The AI agent computes risk-adjusted payout order off-chain. Submitting per-cycle scores on-chain via the oracle adds complexity that doesn't change the demo's core narrative for hackathon judging.
**Decision:** In V1, the `creator` calls `setPayoutOrder` once with the AI-computed list. The contract validates length, membership, and uniqueness but trusts the creator's intent.
**Reasoning:** Real-world vaquitas are formed among friends and family — the creator is socially accountable. The trust assumption is documented and the upgrade path to oracle-sourced ordering (V2) is straightforward.
**Consequences:** Acceptable for Mexican families running 5–10 person vaquitas. Not acceptable for fully open / pseudonymous vaquitas — those wait for V2.

## ADR-8: Flat collateral and locked-pool semantics on default
**Date:** 2026-05-07
**Status:** Accepted (V1 only)
**Context:** Designing the collateral model under time pressure. Two competing concerns: position-aware collateral (early recipients should post more) and simple UX for the WhatsApp flow.
**Decision:** V1 uses a flat per-member collateral set by the creator at deploy. If the vaquita defaults mid-cycle (someone has insufficient collateral), the in-flight cycle's pool is locked in the contract. Members may still claim their remaining collateral.
**Reasoning:** Flat collateral keeps the WhatsApp onboarding to a single number. Locked-pool semantics avoid the complex equity logic of partial pool refunds. V2 will add position-scaled collateral and pool redistribution.
**Consequences:** Recommended creator-side guidance: set `collateralAmount = (totalMembers - 1) * contributionAmount` to fully secure. The frontend will hint at this default.

## ADR-9: Use OpenZeppelin Clones (EIP-1167) for vaquita deployment
**Date:** 2026-05-07
**Status:** Accepted
**Context:** Each new vaquita is its own contract instance. A naive deploy costs ~1.5M gas, which on Arbitrum One is ~$0.04 — fine, but it scales linearly with the number of vaquitas and is wasteful when every vaquita shares the same logic.
**Decision:** The Vaquita contract is now Initializable (no parameterized constructor). A single implementation is deployed once, and the VaquitaFactory uses OZ Clones to create EIP-1167 minimal proxies that delegate to it.
**Reasoning:** ~30× cheaper deployment. Standard pattern recognized by every DeFi reviewer. Implementation contract is locked in its own constructor to avoid the "uninitialized implementation" attack.
**Consequences:** Vaquita storage layout is now critical — adding state variables in upgrades would break clones. We accept this for V1; if upgrade needs arise, we'll move to UUPS proxies in V2.

## ADR-10: V1 bot uses single deployer signer; V2 will use per-user wallets
**Date:** 2026-05-12
**Status:** Accepted (V1 only)
**Context:** Building a fully self-custodial WhatsApp bot in 5 weeks would consume the entire engineering budget. We chose to focus on the conversational + AI experience.
**Decision:** In V1, the agent's deployer wallet signs all on-chain actions. Each WhatsApp user is identified by phone number; the bot acts on their behalf using the shared wallet.
**Reasoning:** Reduces hackathon scope to what the judges actually evaluate (UX + AI). Contracts already enforce roles correctly, so custody can be swapped to per-user Privy wallets in V2 without changing Solidity.
**Consequences:** A demo user cannot truly "own" their vaquita yet — they're operating through the shared signer. This must be disclosed honestly in the pitch and README.

## ADR-11: Fastify over Express for the bot HTTP layer
**Date:** 2026-05-12
**Status:** Accepted
**Context:** Need an HTTP framework for the Twilio webhook.
**Decision:** Use Fastify v5.
**Reasoning:** ~2× faster than Express, native TypeScript types, built-in request validation, mature plugin ecosystem (formbody for Twilio's URL-encoded payloads). Express is fine but ages poorly with new TypeScript projects.
**Consequences:** One more dependency to learn, but the API surface is small.

## ADR-12: Phone-based candidate identity in V1
**Date:** 2026-05-24
**Status:** Accepted (V1 only)
**Context:** The risk scorer needs an `address` field for each candidate. In V1 users don't have their own wallets — the deployer signs everything.
**Decision:** Derive a deterministic pseudo-address from the candidate's phone number (hex-encoded, padded to 40 chars). This is used purely as an internal key for the AI service.
**Reasoning:** Lets the existing risk-scorer API stay unchanged. The pseudo-address never touches a real on-chain transaction; it only flows through the Claude prompt.
**Consequences:** Onchain history-based scoring is impossible in V1. The scorer relies entirely on self-reported data. V2 = real wallets give us real onchain history.
