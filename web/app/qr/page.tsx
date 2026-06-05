import { generateQRSvg, getWhatsAppOnboardingUrl } from "@/lib/qr";
import { QrContent } from "@/components/qr-content";

export const metadata = {
    title: "VaquitaAI — Escanea para probar",
    description: "Escanea este código QR para crear tu primera vaquita digital",
};

// Render the page on every request — keeps QR generation fresh in case URL changes
export const dynamic = "force-dynamic";

export default async function QRPage() {
    const whatsappUrl = getWhatsAppOnboardingUrl();
    const svg = await generateQRSvg({
        text: whatsappUrl,
        size: 400,
        darkColor: "#0a0a0f",
        lightColor: "#ffffff",
    });

    // The QR SVG is generated server-side; QrContent is a client component that
    // handles the translated labels via the i18n context.
    return <QrContent svg={svg} />;
}
