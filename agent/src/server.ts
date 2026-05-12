import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { env, isBotConfigured } from "./config/env.js";
import { handleMessage } from "./bot/engine.js";
import { normalizePhone } from "./bot/sessions.js";
import { sendWhatsApp, validateTwilioSignature } from "./bot/twilio-client.js";

const fastify = Fastify({
    logger: {
        level: env.LOG_LEVEL,
    },
});

// Twilio sends webhooks as application/x-www-form-urlencoded
await fastify.register(formbody);

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
 * Twilio inbound webhook for WhatsApp. Configure this URL in the Twilio console:
 *   "When a message comes in" → https://<your-ngrok-url>/webhook/twilio
 */
fastify.post<{ Body: TwilioWebhookBody }>("/webhook/twilio", async (request, reply) => {
    const body = request.body;
    const fromRaw = body.From;
    const text = body.Body;

    if (!fromRaw || !text) {
        fastify.log.warn({ body }, "Webhook missing From or Body");
        return reply.code(400).send({ error: "missing fields" });
    }

    // Verify webhook signature in production. Skipped if PUBLIC_URL not configured
    // (during local dev when you don't know the ngrok URL up front).
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
    fastify.log.info({ phone, text }, "Inbound message");

    // Reply 200 immediately to Twilio (they retry if we're slow), then process async.
    reply.code(200).send("<Response/>");

    try {
        const replies = await handleMessage({ phone, body: text });
        for (const r of replies) {
            await sendWhatsApp({ to: fromRaw, body: r });
        }
    } catch (err) {
        fastify.log.error({ err }, "Failed to process message");
        try {
            await sendWhatsApp({ to: fromRaw, body: "⚠️ Algo salió mal. Intenta de nuevo." });
        } catch (sendErr) {
            fastify.log.error({ sendErr }, "Failed to send error reply");
        }
    }
});

async function start() {
    if (!isBotConfigured()) {
        fastify.log.warn("Twilio is not configured — bot endpoints will return errors when triggered.");
    }
    try {
        await fastify.listen({ port: env.PORT, host: env.HOST });
        fastify.log.info(`VaquitaAI bot listening on ${env.HOST}:${env.PORT}`);
        if (env.PUBLIC_URL) {
            fastify.log.info(`Configure Twilio webhook to: ${env.PUBLIC_URL}/webhook/twilio`);
        } else {
            fastify.log.info("Set PUBLIC_URL after starting ngrok so signature validation activates.");
        }
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
