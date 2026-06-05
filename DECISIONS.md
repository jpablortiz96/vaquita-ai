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

## ADR-13: Local file storage + Fastify static for voice files
**Date:** 2026-06-01
**Status:** Accepted
**Context:** Twilio needs a public URL to deliver MP3 attachments via WhatsApp. We need somewhere to put them.
**Decision:** Generate locally to `agent/audio/`, serve via Fastify static at `/audio/*`, public access via ngrok URL.
**Reasoning:** Zero infra overhead. Files are deterministically named (sha1 of voice+text), so cache is automatic. When we deploy to Railway, the same setup works with the Railway public URL replacing ngrok.
**Consequences:** Audio files are gitignored. On a fresh clone, files regenerate on first use. For production scale, we'd swap to S3/Cloudflare R2; not needed for hackathon.

## ADR-14: AI proposes payout order; creator confirms before onchain execution
**Date:** 2026-06-01
**Status:** Accepted (V1)
**Context:** The Risk Scorer computes scores when members join, but those scores need to translate into an actual onchain `setPayoutOrder` call. Two approaches: (A) auto-execute when the vaquita fills, (B) propose to the creator and require confirmation.
**Decision:** Approach B. The bot computes the order with Claude Sonnet 4.5, shows it to the creator with rationale, requires "sí" to execute setPayoutOrder + start onchain.
**Reasoning:** Human-in-the-loop is the right trust model for the hackathon: the AI suggests, the human decides. Pitch-friendly. Zero risk of auto-execution bugs.
**Consequences:** One extra confirmation step. Acceptable — the creator is already engaged enough to type "arrancar".

## ADR-15: Bitso integration as a separate module
**Date:** 2026-06-02
**Status:** Accepted
**Context:** Bitso is the lead sponsor and the financial backbone of VaquitaAI. Integration could be tightly coupled into the bot engine, but that creates risk if Bitso changes their API or we want to swap providers.
**Decision:** Isolate Bitso in `agent/src/bitso/` with its own client, types, and submodules (market, account, funding). Bot engine imports the high-level functions only.
**Reasoning:** Adapter pattern. The bot calls `getBalances()`, not `bitsoClient.privateGet("/balance")`. Switching providers (or mocking for tests) is a one-file change.
**Consequences:** Slight indirection. Worth it for separation of concerns and testability.

## ADR-16: Privy embedded wallets, no MetaMask, no Web3Modal
**Date:** 2026-06-03
**Status:** Accepted
**Context:** Target users are Mexican families running savings groups. Requiring them to install MetaMask is a non-starter — most don't know what a seed phrase is.
**Decision:** Use Privy with embedded wallets. Users log in with Email/Google/X. Wallet is created invisibly. They never see a seed phrase.
**Reasoning:** UX must match WhatsApp simplicity. Privy abstracts crypto entirely while keeping users in control via social recovery.
**Consequences:** Dependency on Privy as a service. Acceptable — they're a YC company with strong funding and good developer DX. Note: @privy-io/wagmi pins viem to an exact version (2.51.2), so the web workspace must match.

## ADR-17: Code-level read-only guard for Bitso production
**Date:** 2026-06-05
**Status:** Accepted

**Context:** For the hackathon demo we point to Bitso production (api.bitso.com) to show real market data and account balances (the personal account's Business sandbox is unavailable). The API key is configured as read-only in the Bitso dashboard, but we want defense-in-depth at the code level.

**Decision:** Add `assertReadOnlyOnProduction()` in agent/src/bitso/client.ts that throws on any non-GET request when the base URL contains "api.bitso.com" without "-sandbox". This is checked on every Bitso request (publicGet, privateGet, privatePost).

**Reasoning:**
- Even if a future code change accidentally adds POST/PUT/DELETE, the request fails before reaching Bitso
- Defense-in-depth: read-only API key + code-level block + startup warning banner
- No measurable performance overhead (single string check per request)

**Consequences:**
- When pointing to production, only GET endpoints work (sufficient for demo: ticker, balance, account_status)
- Switch BITSO_API_BASE_URL to sandbox if write operations are needed in development
