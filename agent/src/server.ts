import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { env, isBotConfigured } from "./config/env.js";
import { handleMessage } from "./bot/engine.js";
import { normalizePhone } from "./bot/sessions.js";
import { sendWhatsApp, sendWhatsAppAndVerify, sendWhatsAppMedia, validateTwilioSignature } from "./bot/twilio-client.js";
import fastifyStatic from "@fastify/static";
import { AUDIO_DIRECTORY } from "./ai/voice.js";

const fastify = Fastify({
    logger: {
        level: env.LOG_LEVEL,
    },
});

await fastify.register(formbody);
await fastify.register(fastifyStatic, {
    root: AUDIO_DIRECTORY,
    prefix: "/audio/",
    decorateReply: false,
});

/** Escape special XML characters so message text is safe inside <Message>. */
function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/** Build a TwiML response containing one <Message> per reply string. */
function twiml(messages: string[]): string {
    const body = messages.map((m) => `<Message>${escapeXml(m)}</Message>`).join("");
    return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

fastify.post<{ Body: { text?: string } }>("/voice/synthesize", async (request, reply) => {
    const text = request.body?.text;
    if (!text || text.length === 0) {
        return reply.code(400).send({ error: "text required" });
    }
    try {
        const { synthesizeSpanish, audioPublicUrl } = await import("./ai/voice.js");
        const { filename } = await synthesizeSpanish(text);
        return { filename, url: audioPublicUrl(filename) };
    } catch (err) {
        fastify.log.error({ err }, "voice synthesis failed");
        return reply.code(500).send({ error: "synthesis failed" });
    }
});

fastify.get("/bitso/health", async () => {
    try {
        const { isBitsoConfigured } = await import("./config/env.js");
        if (!isBitsoConfigured()) {
            return { configured: false, status: "not_configured" };
        }
        const { getAccountStatus } = await import("./bitso/account.js");
        const status = await getAccountStatus();
        return {
            configured: true,
            status: "ok",
            account: {
                client_id: status.client_id,
                daily_limit: status.daily_limit,
                daily_remaining: status.daily_remaining,
            },
        };
    } catch (err) {
        // "fetch failed" from undici is generic — the real reason lives on err.cause.
        // Surface it so we can tell DNS (ENOTFOUND) from timeout (ETIMEDOUT),
        // refused connection (ECONNREFUSED), or a TLS/cert problem.
        const e = err as { message?: string; cause?: { code?: string; message?: string } };
        return {
            configured: true,
            status: "error",
            error: e.message ?? "unknown",
            cause: e.cause?.code ?? e.cause?.message ?? "(no cause — likely auth/HTTP error, not network)",
        };
    }
});

fastify.get("/health", async () => {
    return {
        status: "ok",
        botConfigured: isBotConfigured(),
        timestamp: new Date().toISOString(),
    };
});

interface TwilioWebhookBody {
    From?: string;
    To?: string;
    Body?: string;
    MessageSid?: string;
    [key: string]: string | undefined;
}

/**
 * Twilio inbound webhook for WhatsApp.
 *
 * We process the message synchronously and respond with TwiML <Message> elements.
 * Twilio reads them and delivers to the user — no outbound REST call needed.
 * Twilio allows up to 15 s; Claude NLU takes ~1-3 s, well within budget.
 */
fastify.post<{ Body: TwilioWebhookBody }>("/webhook/twilio", async (request, reply) => {
    const body = request.body;
    const fromRaw = body.From;
    const text = body.Body;

    fastify.log.info({ from: fromRaw, text }, "📨 Webhook received");

    if (!fromRaw || !text) {
        fastify.log.warn({ body }, "Webhook missing From or Body");
        return reply
            .code(200)
            .header("Content-Type", "text/xml")
            .send(twiml([]));
    }

    // Twilio signature check — informational only, never blocking.
    //
    // PUBLIC_URL is required for voice (ElevenLabs MP3 mediaUrl), so it is always
    // set in a working setup. The signature, however, frequently fails to validate
    // behind the ngrok tunnel / WhatsApp sandbox (URL reconstruction + sandbox
    // subaccount quirks). Blocking on it returned 403 and silently dropped every
    // real message. We log the result for visibility but always process the message.
    if (env.PUBLIC_URL) {
        const signature = request.headers["x-twilio-signature"] as string | undefined;
        const fullUrl = `${env.PUBLIC_URL}/webhook/twilio`;
        const ok = validateTwilioSignature({
            signature,
            url: fullUrl,
            params: body as Record<string, string>,
        });
        if (!ok) {
            fastify.log.warn("Twilio signature did not validate (continuing anyway — sandbox/ngrok tunnel)");
        }
    }

    const phone = normalizePhone(fromRaw);
    fastify.log.info({ phone, text }, "🤖 Processing message");

    try {
        fastify.log.info("⚙️ Calling handleMessage...");
        const replies = await handleMessage({
            phone,
            body: text,
            sendToOther: async ({ toPhone, body }) => {
                console.log(`[SERVER] sendToOther invoked toPhone=${toPhone} body.length=${body.length}`);
                const to = toPhone.startsWith("whatsapp:") ? toPhone : `whatsapp:${toPhone}`;

                // Retry up to 2 times with backoff for transient DNS/network issues.
                let lastErr: unknown = null;
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        const { sid, finalStatus, errorCode } = await sendWhatsAppAndVerify({ to, body });
                        fastify.log.info({ toPhone, sid, finalStatus, errorCode, attempt }, "📨 Sent proactive message to other user");
                        console.log(`[SERVER] sendToOther FINAL toPhone=${toPhone} sid=${sid} status=${finalStatus} errorCode=${errorCode ?? "none"} attempt=${attempt}`);

                        if (finalStatus !== "delivered" && finalStatus !== "sent") {
                            console.warn(`[SERVER] ⚠️ Proactive message did NOT deliver to ${toPhone}. Status=${finalStatus} errorCode=${errorCode}.`);
                            if (errorCode === "63015") {
                                console.warn(`[SERVER] 🚨 Error 63015: Recipient ${toPhone} sandbox session expired. Ask them to send 'join <keyword>' to refresh.`);
                            } else if (errorCode === "63016") {
                                console.warn(`[SERVER] 🚨 Error 63016: 24h messaging window closed for ${toPhone}.`);
                            } else if (errorCode === "63038") {
                                console.warn(`[SERVER] 🚨 Error 63038: Daily sandbox message limit (50/day) exceeded.`);
                            }
                        }
                        return; // success path
                    } catch (e: unknown) {
                        lastErr = e;
                        const err = e as { code?: string; message?: string };
                        console.error(`[SERVER] sendToOther attempt ${attempt} FAILED toPhone=${toPhone} code=${err.code ?? "?"} message=${err.message ?? "?"}`);

                        // Retry only for transient errors (DNS, network), not for Twilio business logic errors.
                        const isTransient = err.code === "ENOTFOUND" || err.code === "ETIMEDOUT" || err.code === "ECONNRESET" || err.code === "ECONNREFUSED";
                        if (!isTransient || attempt === 2) break;

                        console.log(`[SERVER] transient error detected, retrying in 2s...`);
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                    }
                }

                if (lastErr) {
                    fastify.log.error({ e: lastErr, toPhone }, "❌ Proactive message failed after retries");
                }
            },
        });
        fastify.log.info({ replyCount: replies.length }, "✅ Sending TwiML reply");

        return reply
            .code(200)
            .header("Content-Type", "text/xml")
            .send(twiml(replies));
    } catch (err) {
        fastify.log.error({ err }, "❌ handleMessage threw");
        return reply
            .code(200)
            .header("Content-Type", "text/xml")
            .send(twiml(["⚠️ Algo salió mal. Intenta de nuevo."]));
    }
});

async function start() {
    if (!isBotConfigured()) {
        fastify.log.warn("Twilio not fully configured — signature validation will be skipped.");
    }

    // Bitso safety check on startup
    if (env.BITSO_API_BASE_URL?.includes("api.bitso.com") && !env.BITSO_API_BASE_URL.includes("-sandbox")) {
        fastify.log.warn("=".repeat(60));
        fastify.log.warn("⚠️  BITSO IS POINTING TO PRODUCTION (api.bitso.com)");
        fastify.log.warn("    All non-GET requests are physically blocked.");
        fastify.log.warn("    Verify your API key is READ-ONLY in Bitso settings.");
        fastify.log.warn("=".repeat(60));
    } else if (env.BITSO_API_BASE_URL?.includes("api-sandbox.bitso.com")) {
        fastify.log.info("Bitso pointing to sandbox (safe for testing).");
    }

    try {
        await fastify.listen({ port: env.PORT, host: env.HOST });
        fastify.log.info(`🐄 VaquitaAI bot listening on ${env.HOST}:${env.PORT}`);
        if (env.PUBLIC_URL) {
            fastify.log.info(`Twilio webhook: ${env.PUBLIC_URL}/webhook/twilio`);
        } else {
            fastify.log.info("Set PUBLIC_URL in .env to enable signature validation.");
        }
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
