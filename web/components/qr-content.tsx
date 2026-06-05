"use client";

import { QRDisplay } from "@/components/qr-display";
import { useT } from "@/lib/i18n/context";

export function QrContent({ svg }: { svg: string }) {
    const { t } = useT();

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
                <h1 style={{ fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 800, marginBottom: 8 }}>
                    {t("qr.title")}
                </h1>
                <p style={{ color: "var(--text-dim)", fontSize: 18, maxWidth: 480, margin: "0 auto" }}>
                    {t("qr.subtitle")}{" "}
                    <strong style={{ color: "var(--primary)" }}>{t("qr.subtitleBold")}</strong>
                </p>
            </div>

            {/* QR Code */}
            <QRDisplay svg={svg} />

            {/* Instructions below */}
            <div style={{ marginTop: 40, maxWidth: 480, width: "100%", textAlign: "center" }}>
                <div className="glass" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    <Step n={1} text={t("qr.step1")} />
                    <Step n={2} text={t("qr.step2")} />
                    <Step n={3} text={t("qr.step3")} />
                </div>

                <div style={{ marginTop: 24 }}>
                    <a href="/demo" style={{ color: "var(--text-dim)", fontSize: 14, textDecoration: "underline" }}>
                        {t("qr.demoLink")}
                    </a>
                </div>
            </div>

            {/* Footer */}
            <footer style={{ marginTop: 60, color: "var(--text-dim)", fontSize: 13, textAlign: "center" }}>
                {t("footer.tagline")}
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
