import { generateQRSvg, getWhatsAppOnboardingUrl } from "@/lib/qr";
import { QRDisplay } from "@/components/qr-display";

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

    return (
        <main
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 24px",
                background:
                    "radial-gradient(ellipse at top, rgba(0, 212, 170, 0.15), transparent 50%), radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.15), transparent 50%), #0a0a0f",
            }}
        >
            {/* Logo + title */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 64, marginBottom: 8 }}>🐄</div>
                <h1
                    style={{
                        fontSize: "clamp(28px, 6vw, 44px)",
                        fontWeight: 800,
                        marginBottom: 8,
                    }}
                >
                    Escanea para probar
                </h1>
                <p
                    style={{
                        color: "var(--text-dim)",
                        fontSize: 18,
                        maxWidth: 480,
                        margin: "0 auto",
                    }}
                >
                    Conviértete en miembro de una vaquita digital con IA en{" "}
                    <strong style={{ color: "var(--primary)" }}>30 segundos</strong>
                </p>
            </div>

            {/* QR Code */}
            <QRDisplay svg={svg} />

            {/* Instructions below */}
            <div
                style={{
                    marginTop: 40,
                    maxWidth: 480,
                    width: "100%",
                    textAlign: "center",
                }}
            >
                <div
                    className="glass"
                    style={{
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <Step n={1} text="Abre la cámara de tu celular y escanea el código" />
                    <Step n={2} text="Se abrirá WhatsApp con un mensaje listo para activar" />
                    <Step n={3} text="Mándalo y empieza a conversar con VaquitaAI" />
                </div>

                <div style={{ marginTop: 24 }}>
                    <a
                        href="/demo"
                        style={{
                            color: "var(--text-dim)",
                            fontSize: 14,
                            textDecoration: "underline",
                        }}
                    >
                        ¿Prefieres ver primero el demo en navegador? →
                    </a>
                </div>
            </div>

            {/* Footer */}
            <footer
                style={{
                    marginTop: 60,
                    color: "var(--text-dim)",
                    fontSize: 13,
                    textAlign: "center",
                }}
            >
                🇲🇽 Ethereum México x Bitso Hackathon 2026 · Hecho con 🐄 para LATAM
            </footer>
        </main>
    );
}

function Step({ n, text }: { n: number; text: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <div
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #00d4aa, #a855f7)",
                    color: "#0a0a0f",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 14,
                }}
            >
                {n}
            </div>
            <span style={{ color: "var(--text)", fontSize: 15 }}>{text}</span>
        </div>
    );
}
