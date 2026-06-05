"use client";

import { Header } from "@/components/header";
import { RiskScoreGauge } from "@/components/risk-score-gauge";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/context";

export default function DemoPage() {
    const { t } = useT();
    const [showScore, setShowScore] = useState(false);
    const [scoreValue, setScoreValue] = useState(0);

    // Animate score on mount for the demo effect
    useEffect(() => {
        setTimeout(() => setShowScore(true), 300);
        let cur = 0;
        const target = 78;
        const interval = setInterval(() => {
            cur += 2;
            if (cur >= target) {
                cur = target;
                clearInterval(interval);
            }
            setScoreValue(cur);
        }, 30);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Header />
            <main
                style={{
                    minHeight: "100vh",
                    padding: "32px 24px",
                    background:
                        "radial-gradient(ellipse at top right, rgba(0, 212, 170, 0.1), transparent 50%), radial-gradient(ellipse at bottom left, rgba(168, 85, 247, 0.1), transparent 50%)",
                }}
            >
                <div style={{ maxWidth: 800, margin: "0 auto" }}>
                    {/* Hero */}
                    <section style={{ textAlign: "center", padding: "40px 0" }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🐄</div>
                        <h1
                            style={{
                                fontSize: "clamp(32px, 7vw, 52px)",
                                fontWeight: 800,
                                lineHeight: 1.1,
                                marginBottom: 16,
                            }}
                        >
                            {t("demo.title.before")}
                            <span className="gradient-text">{t("demo.title.gradient")}</span>
                        </h1>
                        <p style={{ color: "var(--text-dim)", fontSize: 18, maxWidth: 560, margin: "0 auto" }}>
                            {t("demo.subtitle")}
                        </p>
                    </section>

                    {/* Demo del Risk Score animado */}
                    <section className="glass fade-in" style={{ padding: 32, marginBottom: 24, textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: 12,
                                color: "var(--primary)",
                                fontWeight: 700,
                                letterSpacing: 2,
                                textTransform: "uppercase",
                                marginBottom: 12,
                            }}
                        >
                            {t("demo.ai.badge")}
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
                            {t("demo.ai.title")}
                        </h2>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                            <RiskScoreGauge score={scoreValue} size={220} label={showScore ? "Confiable" : "..."} />
                        </div>
                        <p style={{ color: "var(--text-dim)", fontSize: 15, maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
                            <strong style={{ color: "var(--text)" }}>{t("demo.ai.exampleName")}</strong>
                            <br />
                            {t("demo.ai.exampleDesc")}
                            <br />
                            <strong style={{ color: "var(--primary)" }}>{t("demo.ai.exampleTip")}</strong>
                        </p>
                    </section>

                    {/* CTA Buttons */}
                    <section
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 16,
                            marginBottom: 32,
                        }}
                    >
                        <a
                            href="https://wa.me/14155238886?text=join%20till-breathing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary pulse-glow"
                            style={{ textDecoration: "none", textAlign: "center", padding: "16px 24px", fontSize: 16, display: "block" }}
                        >
                            {t("demo.cta.whatsapp")}
                        </a>
                        <a
                            href="/vaquitas"
                            className="btn-ghost"
                            style={{ textDecoration: "none", textAlign: "center", padding: "16px 24px", fontSize: 16, display: "block", color: "var(--text)" }}
                        >
                            {t("demo.cta.see")}
                        </a>
                    </section>

                    {/* Features grid */}
                    <section
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: 16,
                            marginBottom: 40,
                        }}
                    >
                        <Feature icon="🤖" title={t("demo.f1.title")} desc={t("demo.f1.desc")} />
                        <Feature icon="🎙️" title={t("demo.f2.title")} desc={t("demo.f2.desc")} />
                        <Feature icon="📱" title={t("demo.f3.title")} desc={t("demo.f3.desc")} />
                        <Feature icon="⛓️" title={t("demo.f4.title")} desc={t("demo.f4.desc")} />
                        <Feature icon="🇲🇽" title={t("demo.f5.title")} desc={t("demo.f5.desc")} />
                        <Feature icon="🛡️" title={t("demo.f6.title")} desc={t("demo.f6.desc")} />
                    </section>

                    {/* Footer */}
                    <footer
                        style={{
                            textAlign: "center",
                            padding: "32px 0",
                            color: "var(--text-dim)",
                            fontSize: 14,
                            borderTop: "1px solid var(--border)",
                        }}
                    >
                        {t("footer.tagline")}
                    </footer>
                </div>
            </main>
        </>
    );
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div className="glass" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</h3>
            <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.5 }}>{desc}</p>
        </div>
    );
}
