# ElevenLabs Integration

## Why Voice Matters for LATAM

In Latin America, many users:
- Have low literacy in formal Spanish
- Have visual impairments
- Prefer audio (driving, cooking, multitasking)
- Have older relatives participating in the vaquita who can't read fast on a screen

A 30-second voice message in calm Spanish is more accessible, memorable, and emotionally resonant than a text message — particularly for life events like "you just received your vaquita payout."

## Implementation

Location: `agent/src/ai/voice.ts`

### Voice Generation Pipeline

```
User approves a candidate
       │
       ▼
Generate Spanish text via voice-scripts.ts
       │
       ▼
Call ElevenLabs API (multilingual_v2 model)
       │
       ▼
Stream MP3 → save to agent/audio/ with sha1 hash filename
       │
       ▼
Serve via Fastify static at PUBLIC_URL/audio/{filename}
       │
       ▼
Twilio downloads MP3 via mediaUrl param
       │
       ▼
Recipient hears voice message inline in WhatsApp
```

### Voice Configuration

- **Voice ID:** `nTkjq09AuYgsNR8E4sDe` (Spanish female, warm tone)
- **Model:** `eleven_multilingual_v2` (best Spanish accent)
- **Output format:** `mp3_44100_128` (good quality, small file size)

### Script Templates

We use 4 distinct script templates:

```typescript
// On approval
welcomeApprovedScript({ candidateName, contributionAmount, totalMembers, cycleDays })

// On your turn to receive
yourTurnScript({ recipientName, amountReceived })

// On creator's view of approval
creatorApprovedScript({ candidateName })

// On vaquita completion
vaquitaCompletedScript(memberName)
```

### Cache Strategy

Files are content-addressed: filename = `audio_${sha1(voiceId + text).slice(0, 16)}.mp3`

This means:
- Same (text, voice) pair always produces same filename
- No redundant ElevenLabs calls
- No disk space waste from duplicates
- Free cache reuse across users

### Fallback Behavior

If ElevenLabs isn't configured or fails:
- The text message still gets sent
- The voice is silently skipped
- A warning logs to console
- User experience is degraded but functional

## Example: Welcome Message

When a candidate is approved, they receive a voice message like:

> *"Hola María, bienvenida a la vaquita. Acabamos de aprobarte. Cada 7 días vas a aportar 100 pesos digitales, y cuando te toque tu turno vas a recibir el bote completo. Somos 4 en total. ¡Bienvenida a la familia!"*

In calm, warm Spanish. ~10 seconds. Personalized with their name and the vaquita's specific parameters.

## Cost & Free Tier

- **Free tier:** 10,000 characters/month
- **Average message:** ~250 chars
- **Approvals per month before refill:** ~40
- **Production plan ($5/mo):** 30,000 chars → ~120 approvals

For hackathon demo, free tier is more than enough.

---
