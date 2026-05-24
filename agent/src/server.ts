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
 * Twilio inbound webhook for WhatsApp.
 *
 * Twilio expects one of two response types:
 *   A) Empty 200 (we'll send the reply ourselves via REST API), OR
 *   B) Valid TwiML XML <Response>...</Response> that Twilio will send to the user
 *
 * We use option A: respond with valid empty TwiML and Content-Type=text/xml so
 * Twilio doesn't interpret anything as a message body. Then we send the real
 * reply asynchronously via the REST API.
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
            .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
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

    // Respond immediately with empty TwiML so Twilio doesn't echo anything.
    // This is the CRITICAL fix — sending "<Response/>" without proper Content-Type
    // and XML declaration caused Twilio to treat it as a message body.
    reply
        .code(200)
        .header("Content-Type", "text/xml")
        .send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

    // Process and reply asynchronously via REST API
    try {
        fastify.log.info("⚙️ Calling handleMessage...");
        const replies = await handleMessage({ phone, body: text });
        fastify.log.info({ replyCount: replies.length }, "✅ handleMessage returned replies");

        for (let i = 0; i < replies.length; i++) {
            const r = replies[i];
            if (!r) continue;
            fastify.log.info({ index: i, preview: r.slice(0, 80) }, "📤 Sending reply via Twilio REST");
            try {
                const sid = await sendWhatsApp({ to: fromRaw, body: r });
                fastify.log.info({ sid }, "✅ Twilio accepted reply");
            } catch (sendErr) {
                fastify.log.error({ err: sendErr, replyIndex: i }, "❌ Twilio REST send failed");
            }
        }
    } catch (err) {
        fastify.log.error({ err }, "❌ handleMessage threw");
        try {
            await sendWhatsApp({ to: fromRaw, body: "⚠️ Algo salió mal. Intenta de nuevo." });
        } catch (sendErr) {
            fastify.log.error({ sendErr }, "❌ Failed to send error reply");
        }
    }
});

async function start() {
    if (!isBotConfigured()) {
        fastify.log.warn("Twilio is not configured — bot endpoints will return errors when triggered.");
    }
    try {
        await fastify.listen({ port: env.PORT, host: env.HOST });
        fastify.log.info(`🐄 VaquitaAI bot listening on ${env.HOST}:${env.PORT}`);
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
