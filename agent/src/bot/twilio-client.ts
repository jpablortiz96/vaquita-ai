import twilio from "twilio";
import { env, isBotConfigured } from "../config/env.js";

let cachedClient: ReturnType<typeof twilio> | null = null;

export function getTwilioClient(): ReturnType<typeof twilio> {
    if (!isBotConfigured()) {
        throw new Error("Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM.");
    }
    if (cachedClient) return cachedClient;
    cachedClient = twilio(env.TWILIO_ACCOUNT_SID!, env.TWILIO_AUTH_TOKEN!);
    return cachedClient;
}

export async function sendWhatsApp(args: { to: string; body: string }): Promise<string> {
    const client = getTwilioClient();
    const to = args.to.startsWith("whatsapp:") ? args.to : `whatsapp:${args.to}`;
    console.log(`[TWILIO SEND] from=${env.TWILIO_WHATSAPP_FROM} to=${to} body.length=${args.body.length}`);
    console.log(`[TWILIO SEND] body preview: ${args.body.slice(0, 120).replace(/\n/g, " ")}`);
    try {
        const message = await client.messages.create({
            from: env.TWILIO_WHATSAPP_FROM!,
            to,
            body: args.body,
        });
        console.log(`[TWILIO SEND] SUCCESS sid=${message.sid} status=${message.status} to=${message.to}`);
        return message.sid;
    } catch (err) {
        console.error(`[TWILIO SEND] FAILURE to=${to}`, err);
        throw err;
    }
}

/**
 * Sends a WhatsApp message and polls Twilio for the final delivery status.
 * Useful for debugging the 24h messaging window in the sandbox.
 */
export async function sendWhatsAppAndVerify(args: { to: string; body: string }): Promise<{ sid: string; finalStatus: string; errorCode: string | null }> {
    const client = getTwilioClient();
    const to = args.to.startsWith("whatsapp:") ? args.to : `whatsapp:${args.to}`;

    const message = await client.messages.create({
        from: env.TWILIO_WHATSAPP_FROM!,
        to,
        body: args.body,
    });

    // Poll for final status (up to 5 seconds)
    let finalStatus = message.status;
    let errorCode: string | null = message.errorCode?.toString() ?? null;
    for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const updated = await client.messages(message.sid).fetch();
        finalStatus = updated.status;
        errorCode = updated.errorCode?.toString() ?? null;
        if (["delivered", "failed", "undelivered"].includes(finalStatus)) {
            break;
        }
    }

    return { sid: message.sid, finalStatus, errorCode };
}

/**
 * Sends a WhatsApp message with an attached media file (audio, image, etc).
 * The mediaUrl must be publicly accessible — Twilio will download it.
 * MP3 files are rendered as inline voice notes on the recipient's WhatsApp.
 */
export async function sendWhatsAppMedia(args: {
    to: string;
    body: string;
    mediaUrl: string;
}): Promise<string> {
    const client = getTwilioClient();
    const to = args.to.startsWith("whatsapp:") ? args.to : `whatsapp:${args.to}`;
    console.log(`[TWILIO MEDIA] to=${to} mediaUrl=${args.mediaUrl}`);
    try {
        const message = await client.messages.create({
            from: env.TWILIO_WHATSAPP_FROM!,
            to,
            body: args.body,
            mediaUrl: [args.mediaUrl],
        });
        console.log(`[TWILIO MEDIA] SUCCESS sid=${message.sid} status=${message.status}`);
        return message.sid;
    } catch (err) {
        console.error(`[TWILIO MEDIA] FAILURE to=${to}`, err);
        throw err;
    }
}

/** Validates a Twilio webhook signature so we know it's really Twilio calling us. */
export function validateTwilioSignature(args: {
    signature: string | undefined;
    url: string;
    params: Record<string, string>;
}): boolean {
    if (!env.TWILIO_AUTH_TOKEN) return false;
    if (!args.signature) return false;
    return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, args.signature, args.url, args.params);
}
