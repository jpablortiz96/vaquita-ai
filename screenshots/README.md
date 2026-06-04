# Screenshots

This folder collects all the visual evidence for the submission. Used in:
- README badges and inline images
- SUBMISSION.md track-specific texts
- Pitch deck slides
- Demo video frames

## Files

### Banner & Demo
| File | Used in | Status |
|---|---|---|
| `banner.svg` | README hero | ✅ Created |
| `demo-placeholder.svg` | README demo section | ✅ Created |
| `demo.gif` | README demo section | ⏳ Record from working bot |
| `demo.mp4` | YouTube upload | ⏳ Record full 3-min walkthrough |

### Required Screenshots

#### Bot conversation
- [ ] `01-bot-create-vaquita.png` — full WhatsApp create flow
- [ ] `02-bot-invite-code.png` — invite code generation
- [ ] `03-bot-join-interview.png` — 4-question interview
- [ ] `04-bot-ai-score-prompt.png` — creator receives AI score notification
- [ ] `05-bot-approved-voice.png` — candidate receives text + voice approval

#### Frontend
- [ ] `10-landing-hero.png` — landing page hero
- [ ] `11-landing-before-after.png` — "¿Te suena familiar?" section
- [ ] `12-landing-ai-trust.png` — animated risk score
- [ ] `13-landing-testimonials.png` — testimonials section
- [ ] `14-vaquitas-list.png` — user's vaquitas list
- [ ] `15-vaquita-detail.png` — vaquita detail with member gauges
- [ ] `16-qr-code-onboarding.png` — /qr page

#### Onchain proof
- [ ] `20-arbiscan-factory.png` — VaquitaFactory verified on Arbiscan
- [ ] `21-arbiscan-vaquita.png` — a deployed vaquita on Arbiscan
- [ ] `22-arbiscan-join-tx.png` — a real join() transaction

#### Sponsors
- [ ] `30-bitso-health.png` — /bitso/health endpoint response
- [ ] `31-bot-bitso-balance.png` — bot answering "saldo bitso"
- [ ] `32-bot-bitso-quote.png` — bot answering "cotizar"

#### Bonus
- [ ] `40-elevenlabs-audio.png` — audio playing in WhatsApp
- [ ] `41-risk-score-gauge.png` — close-up of the SVG gauge

## How to Capture

For consistency:
- Use 16:9 aspect ratio when possible
- Frontend: use Chrome DevTools mobile preview at 390×844 (iPhone 14 Pro)
- WhatsApp: capture from WhatsApp Web for clean screenshots
- Arbiscan: full transaction details visible

## How to Record the Demo GIF

For `demo.gif`:
1. Use **ScreenToGif** (free, Windows) or **GIPHY Capture** (free, Mac)
2. Resolution: 800×450 (fits inside README)
3. Length: 30-60 seconds (loop)
4. Show: bot create vaquita → invite → join → AI approval → success
5. Keep file size under 5MB for fast GitHub render
6. Save to `screenshots/demo.gif`

For `demo.mp4`:
1. Use **OBS Studio** (free) or **Loom**
2. Resolution: 1920×1080
3. Length: 3:00 max
4. Upload to YouTube as **unlisted**
5. Replace the placeholder link in README
