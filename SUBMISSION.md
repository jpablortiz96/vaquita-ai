# VaquitaAI — Hackathon Submission Texts

This file contains pre-written submission texts for each track. Copy-paste the relevant section when submitting to lablab.ai / DevPost / Devfolio.

---

## 🇲🇽 Track 1 — Ethereum México (General Hybrid)

### Short Description (140 chars)
> Onchain vaquitas with AI risk scoring and Spanish voice via WhatsApp. The traditional savings circle, now uncheatable.

### Long Description

**The Problem:**
80% of Latin American households save through informal rotating savings groups (vaquitas, tandas, cundinas). Trillions of pesos move through these circles every year — but they're plagued by problems: notebooks get lost, members disappear with the pot, disputes about "who paid this month" tear families apart.

**Our Solution:**
VaquitaAI is the same vaquita your grandmother ran, but powered by smart contracts, AI, and WhatsApp. Members never download an app — they chat with a bot in Spanish. The AI evaluates trust between participants and proposes a fair payout order. Smart contracts on Arbitrum hold the collateral, so no one can disappear with the money. When it's your turn, you receive a personalized voice message in natural Spanish announcing your win.

**What Makes It Different:**
- 100% WhatsApp-native onboarding — works on Doña Carmen's flip phone
- Claude Sonnet 4.5 evaluates each member with 4 friendly questions, no bank statements needed
- ElevenLabs voice notifications in calm Spanish — accessible to all literacy levels
- MXNB integration — users think in pesos, not dollars
- Open-source, verifiable smart contracts on Arbitrum

**Latin American Focus:**
Every design decision optimizes for LATAM. Spanish-first UX. Mexican Spanish dialect ("vaquita", "tanda", "cundina"). Pesos as the unit of account. WhatsApp as the primary interface (used by 95% of Mexicans daily). No required ID, no credit history — the AI evaluates trust the way a neighbor would.

**Tech Stack:**
Solidity (Foundry) · Arbitrum · Claude Sonnet 4.5 · ElevenLabs · Twilio WhatsApp · Next.js 15 · Privy embedded wallets · MXNB (Bitso)

---

## 💰 Track 2 — Bitso Track (MXNB Integration)

### Short Description
> First WhatsApp-native rotating savings protocol using MXNB on Arbitrum. Bitso Business API integrated for live treasury operations.

### Long Description

**Why MXNB:**
VaquitaAI is built for Mexican families. The unit of account must be the peso, not the dollar. Two options existed: use a USD stablecoin and force users to think in foreign currency (bad UX), or use **MXNB** and keep everything peso-native (correct choice). We chose MXNB.

**What We Built with Bitso Business API:**
- **Signed HTTP Client** — Full HMAC SHA256 implementation per `docs.bitso.com/bitso-api/docs/general-concepts`, located at `agent/src/bitso/client.ts`
- **Market Data** — Live `/ticker` and `/order_book` for MXNB/MXN
- **Account Operations** — `/account_status`, `/balance`, `/funding_destinations` with proper auth
- **Bot Commands** — Users can query Bitso directly from WhatsApp: `saldo bitso`, `cotizar`, `bitso info`
- **Health Endpoint** — `GET /bitso/health` exposes live API status for monitoring

**Bot Conversation Example:**
```
User: cotizar
Bot:  📊 Cotización MXNB / MXN (Bitso Sandbox)
      • Último: $1.0001 MXN
      • Ask: $1.0003
      • Bid: $0.9999
      • Volumen 24h: 12,447.32
      📍 Fuente: Bitso Business API
```

**V2 Roadmap:**
1. Migrate contracts to Arbitrum One with real MXNB (`0xF197FFC28c23E0309B5559e7a166f2c6164C80aA`)
2. SPEI on-ramp: user deposits MXN → backend mints MXNB into the vaquita contract
3. SPEI off-ramp: when a member receives their payout, automatic redemption to their Mexican bank account
4. Institutional vaquitas with `/funding_destinations` for businesses

**Code You Can Audit:**
- `agent/src/bitso/` — fully isolated adapter pattern
- `agent/test/bitso/client.test.ts` — signature verification tests
- `docs/sponsor-integrations/bitso.md` — complete integration guide

---

## ⛓️ Track 3 — Arbitrum Track (L2 Native)

### Short Description
> Gas-efficient rotating savings on Arbitrum, using EIP-1167 minimal proxies for $0.10 vaquita creation. Built L2-native from day 1.

### Long Description

**Why Arbitrum:**
Vaquitas are high-frequency: every cycle, every member transacts. On Ethereum mainnet this would be prohibitively expensive ($50+ per transaction). On Arbitrum, a full join() costs less than $0.05. This makes the product viable for the actual target users: working-class Mexican families saving $500 MXN/month.

**EIP-1167 Clone Pattern:**
Instead of deploying a full Vaquita contract every time (~1.5M gas), we deploy a single implementation and use OpenZeppelin's `Clones` library to create minimal proxies (~306K gas per vaquita). That's **4.9× cheaper**, or about $0.10 USD per vaquita created on Arbitrum.

```solidity
// VaquitaFactory.sol
function createVaquita(VaquitaConfig calldata cfg) external returns (address) {
    address clone = Clones.clone(implementation);
    Vaquita(clone).initialize(cfg);
    creatorToVaquitas[msg.sender].push(clone);
    return clone;
}
```

**Architecture That Scales:**
- 44 Foundry tests covering every state transition
- Permissionless `executeCycle` — anyone can advance the vaquita when a deadline passes
- ReentrancyGuard + SafeERC20 on all token operations
- Status state machine: Created → Active → Completed / Defaulted

**Live on Arbitrum Sepolia:**
- **Factory:** [0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E](https://sepolia.arbiscan.io/address/0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E)
- **Implementation:** [0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717](https://sepolia.arbiscan.io/address/0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717)
- All contracts verified with source code visible.

**Why This Matters for Arbitrum:**
- Real LATAM use case driving transaction volume to the L2
- MXNB-denominated economy (Arbitrum is MXNB's home chain)
- Composable: any other DeFi protocol can read vaquita state for credit scoring, lending, etc.

---

## 🎨 Track 4 — Rare Protocol (Bonus, V2)

### Short Description (Placeholder for V2)
> Reputation NFTs per vaquita lifecycle. Each member earns a verifiable, transferable trust badge after every successful cycle.

*This track will be addressed post-hackathon as a V2 feature.*

---

## 📝 Submission Checklist

Before submitting, verify:

- [ ] All contracts verified on Arbiscan
- [ ] README.md is up to date
- [ ] Demo video is ≤3 minutes and uploaded to YouTube (unlisted)
- [ ] Screenshots are in `/screenshots`
- [ ] Each sponsor doc references the corresponding code paths
- [ ] No `.env` files committed
- [ ] Repository is public and accessible
- [ ] WhatsApp bot is online (Twilio sandbox refreshed)

---
