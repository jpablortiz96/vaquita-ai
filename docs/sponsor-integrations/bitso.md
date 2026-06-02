# Bitso Business Integration

VaquitaAI integrates Bitso Business as the financial backbone for the MXN ↔ MXNB on/off-ramp and live market data. Bitso is the lead sponsor of the Ethereum México x Bitso Hackathon 2026, and our integration goes beyond surface-level: we use the actual signed Trading API on the sandbox environment.

## Why Bitso

VaquitaAI is built for Mexican families running savings groups. The unit of account is the Mexican peso, not USD. Two options exist:
- Use a USD stablecoin and force users to think in dollars — bad UX
- Use **MXNB** (Bitso's MXN-pegged stablecoin on Arbitrum) and keep everything in pesos

We chose MXNB. This means every member contributes in pesos, sees their pool in pesos, and receives in pesos. Bitso Business provides:
1. **MXNB minting** via SPEI deposits — users deposit MXN, receive MXNB on Arbitrum
2. **MXNB redemption** — receive MXN to a Mexican bank account
3. **Trading API** — live quotes, account management, and treasury controls

## What's Implemented (Sandbox)

### Signed HTTP Client
Located in `agent/src/bitso/client.ts`. Implements HMAC SHA256 request signing per [Bitso's General Concepts](https://docs.bitso.com/bitso-api/docs/general-concepts):

- **Signature format**: `nonce + http_method + request_path + json_body`
- **Authorization header**: `Bitso <api_key>:<nonce>:<signature>`
- **Sandbox base URL**: `https://api-sandbox.bitso.com/api/v3`

### Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/ticker` | GET (public) | Live MXNB/MXN price quote |
| `/order_book` | GET (public) | Order book depth |
| `/available_books` | GET (public) | List trading pairs in sandbox |
| `/account_status` | GET (private) | Verify account is operational |
| `/balance` | GET (private) | Query MXN/MXNB balances |
| `/funding_destinations` | GET (private) | Discover SPEI deposit details |

### WhatsApp Bot Commands

Users can interact with the Bitso integration directly via WhatsApp:

| Command | What it does |
|---|---|
| `saldo bitso` | Calls `/balance`, shows MXN and MXNB available |
| `cotizar` | Calls `/ticker` for MXNB/MXN, shows live price |
| `bitso info` | Explains the integration to the user |

### Health Endpoint

`GET /bitso/health` returns the live status of the Bitso integration. Used during the demo to prove the API is working live.

```json
{
  "configured": true,
  "status": "ok",
  "account": {
    "client_id": "abc123",
    "daily_limit": "100000.00",
    "daily_remaining": "99847.50"
  }
}
```

## Roadmap to Production

V1 (hackathon): Sandbox integration with MockMXNB on Arbitrum Sepolia.

V2 (post-hackathon):
1. Migrate to real MXNB on Arbitrum One (`0xF197FFC28c23E0309B5559e7a166f2c6164C80aA`)
2. Implement SPEI on-ramp: user deposits MXN → backend mints MXNB into the vaquita contract
3. Implement SPEI off-ramp: receive MXN to a Mexican bank account when a member gets their turn
4. Enable `/funding_destinations` flow for institutional vaquitas

## Security Considerations

- **API keys live in `.env` only**, never committed
- **Signing happens server-side**, the API secret never reaches the user
- **All withdrawals require multi-step confirmation** in V2 — the agent never auto-pays out of the Bitso account without a signed user intent

## Resources Referenced

- [Bitso Developers Portal](https://bitso.com/business/developers)
- [Trading API Documentation](https://docs.bitso.com/bitso-api/docs/api-overview)
- [General Concepts](https://docs.bitso.com/bitso-api/docs/general-concepts)
- [MXNB on Arbitrum](https://docs.bitso.com/juno/docs/mxnb-on-arbitrum)
- [MXNB Product Page](https://bitso.com/business/products/mxnb-stablecoin)

## Demo Talking Points (for the pitch)

1. *"We chose Bitso because MXNB lets users think in pesos, not dollars — critical for our target market"*
2. *"The signed Trading API gives us institutional-grade access to MXN rails — what SPEI is to traditional banking, Bitso Business is to programmable money"*
3. *"In production, every vaquita lifecycle event (mint, transfer, payout, redeem) routes through Bitso — making it the foundational settlement layer"*
4. *"Live demo: `/bitso/health` shows the API responding in real time"*
