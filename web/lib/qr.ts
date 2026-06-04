import QRCode from "qrcode";

export interface QROptions {
    text: string;
    size?: number;
    darkColor?: string;
    lightColor?: string;
}

/**
 * Generates an SVG string for a QR code.
 * Uses error correction level H so we can overlay a logo in the center.
 */
export async function generateQRSvg(options: QROptions): Promise<string> {
    const { text, size = 400, darkColor = "#0a0a0f", lightColor = "#ffffff" } = options;
    const svg = await QRCode.toString(text, {
        type: "svg",
        errorCorrectionLevel: "H",
        width: size,
        margin: 2,
        color: {
            dark: darkColor,
            light: lightColor,
        },
    });
    return svg;
}

/**
 * Returns the WhatsApp deep link for the VaquitaAI sandbox onboarding.
 * Pre-filled with "join till-breathing" to activate the Twilio sandbox.
 */
export function getWhatsAppOnboardingUrl(): string {
    return "https://wa.me/14155238886?text=join%20till-breathing";
}

/**
 * Returns a WhatsApp deep link to directly create a vaquita.
 * Used when the user has already activated the sandbox.
 */
export function getWhatsAppCreateVaquitaUrl(): string {
    const message = "hacer una vaquita de 100 al mes con 4 amigos";
    return `https://wa.me/14155238886?text=${encodeURIComponent(message)}`;
}
