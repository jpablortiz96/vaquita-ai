import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { env, isBotConfigured } from "./config/env.js";
import { handleMessage } from "./bot/engine.js";
import { normalizePhone } from "./bot/sessions.js";
import { validateTwilioSignature } from "./bot/twilio-client.js";

const fastify = Fastify({
    logger: {
        level: env.LOG_LEVEL,
    },
});

await fastify.register(formbody);

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
 * Architecture: we respond synchronously with TwiML <Message> elements.
 * Twilio reads them and delivers the messages to the user — no outbound
 * REST call from our server needed. This is simpler and more reliable than
 * the "reply 200 + async REST" pattern, which required network access to
 * api.twilio.com from our server.
 *
 * Timeout budget: Twilio allows up to 30 s for a webhook response.
 * Claude intent classification takes ~1-3 s, well within the limit.
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

    // Optional: verify Twilio signature if PUBLIC_URL is set
    if (env.PUBLIC_URL) {
        const signature = request.headers["x-twilio-signature"] as string | undefined;
        const fullUrl = `${env.PUBLIC_URL}/webhook/twilio`;
        const ok = validateTwilioSignature({
            signature,
            url: fullUrl,
            params: body as Record<string, string>,
        });
        if (!ok) {
            fastify.log.warn("Invalid Twilio signature");
            return reply.code(403).send({ error: "invalid signature" });
        }
    }

    const phone = normalizePhone(fromRaw);
    fastify.log.info({ phone, text }, "🤖 Processing message");

    try {
        const replies = await handleMessage({ phone, body: text });
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
