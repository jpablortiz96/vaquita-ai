"use client";

import { Header } from "@/components/header";
import { RiskScoreGauge } from "@/components/risk-score-gauge";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContract } from "wagmi";
import { CONTRACTS, factoryAbi } from "@/lib/contracts";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/context";

export default function HomePage() {
    const { authenticated } = usePrivy();
    const { t } = useT();

    const { data: totalVaquitas } = useReadContract({
        address: CONTRACTS.VaquitaFactory,
        abi: factoryAbi,
        functionName: "totalVaquitas",
    });

    const [animatedScore, setAnimatedScore] = useState(0);
    useEffect(() => {
        const target = 82;
        let cur = 0;
        const interval = setInterval(() => {
            cur += 2;
            if (cur >= target) {
                cur = target;
                clearInterval(interval);
            }
            setAnimatedScore(cur);
        }, 25);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Header />
            <main style={{ minHeight: "100vh", padding: "0 24px" }}>

                {/* ─── HERO ─── */}
                <section
                    style={{
                        maxWidth: 1100,
                        margin: "0 auto",
                        padding: "60px 0 60px",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: 56, marginBottom: 16 }}>🐄</div>
                    <h1
                        style={{
                            fontSize: "clamp(40px, 8vw, 72px)",
                            fontWeight: 800,
                            lineHeight: 1.05,
                            marginBottom: 20,
                        }}
                    >
                        {t("landing.hero.title.before")}
                        <br />
                        <span className="gradient-text">{t("landing.hero.title.gradient")}</span>
                    </h1>
                    <p
                        style={{
                            fontSize: 20,
                            color: "var(--text-dim)",
                            maxWidth: 640,
                            margin: "0 auto 36px",
                            lineHeight: 1.6,
                        }}
                    >
                        {t("landing.hero.subtitle")}
                    </p>

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
                        {authenticated ? (
                            <a href="/vaquitas" className="btn-primary">
                                {t("landing.hero.cta.mine")}
                            </a>
                        ) : (
                            <a
                                href="https://wa.me/14155238886?text=join%20till-breathing"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary pulse-glow"
                                style={{ textDecoration: "none", display: "inline-block" }}
                            >
                                🚀 {t("landing.hero.cta.start")}
                            </a>
                        )}
                        <a href="#como-funciona" className="btn-ghost">
                            {t("landing.hero.cta.howItWorks")}
                        </a>
                    </div>

                    <p style={{ fontSize: 14, color: "var(--text-dim)" }}>
                        {t("landing.hero.footer")}
                    </p>
                </section>

                {/* ─── ANTES vs AHORA ─── */}
                <section style={{ maxWidth: 1100, margin: "0 auto 80px" }}>
                    <h2
                        style={{
                            fontSize: "clamp(28px, 5vw, 40px)",
                            fontWeight: 800,
                            textAlign: "center",
                            marginBottom: 12,
                        }}
                    >
                        {t("landing.compare.title")}
                    </h2>
                    <p style={{ color: "var(--text-dim)", textAlign: "center", marginBottom: 40, fontSize: 17 }}>
                        {t("landing.compare.subtitle")}
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                            gap: 24,
                        }}
                    >
                        {/* ANTES card */}
                        <div className="glass" style={{ padding: 32, position: "relative", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                            <div
                                style={{
                                    display: "inline-block",
                                    background: "rgba(239, 68, 68, 0.15)",
                                    color: "#ef4444",
                                    padding: "4px 12px",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    letterSpacing: 1,
                                    marginBottom: 16,
                                }}
                            >
                                📓 {t("landing.compare.before.badge")}
                            </div>
                            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
                                {t("landing.compare.before.title")}
                            </h3>
                            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                                <BadItem text={t("landing.compare.before.item1")} />
                                <BadItem text={t("landing.compare.before.item2")} />
                                <BadItem text={t("landing.compare.before.item3")} />
                                <BadItem text={t("landing.compare.before.item4")} />
                                <BadItem text={t("landing.compare.before.item5")} />
                            </ul>
                        </div>

                        {/* AHORA card */}
                        <div className="glass" style={{ padding: 32, position: "relative", border: "1px solid rgba(0, 212, 170, 0.3)" }}>
                            <div
                                style={{
                                    display: "inline-block",
                                    background: "rgba(0, 212, 170, 0.15)",
                                    color: "#00d4aa",
                                    padding: "4px 12px",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    letterSpacing: 1,
                                    marginBottom: 16,
                                }}
                            >
                                ✨ {t("landing.compare.after.badge")}
                            </div>
                            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
                                {t("landing.compare.after.title")}
                            </h3>
                            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                                <GoodItem text={t("landing.compare.after.item1")} />
                                <GoodItem text={t("landing.compare.after.item2")} />
                                <GoodItem text={t("landing.compare.after.item3")} />
                                <GoodItem text={t("landing.compare.after.item4")} />
                                <GoodItem text={t("landing.compare.after.item5")} />
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ─── COMO FUNCIONA ─── */}
                <section id="como-funciona" style={{ maxWidth: 1100, margin: "0 auto 80px", scrollMarginTop: 80 }}>
                    <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, textAlign: "center", marginBottom: 12 }}>
                        {t("landing.how.title")}
                        <span className="gradient-text">{t("landing.how.titleGradient")}</span>
                    </h2>
                    <p style={{ color: "var(--text-dim)", textAlign: "center", marginBottom: 48, fontSize: 17 }}>
                        {t("landing.how.subtitle")}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
                        <StepCard n="1" emoji="📱" title={t("landing.how.step1.title")} desc={t("landing.how.step1.desc")} />
                        <StepCard n="2" emoji="👥" title={t("landing.how.step2.title")} desc={t("landing.how.step2.desc")} />
                        <StepCard n="3" emoji="🤖" title={t("landing.how.step3.title")} desc={t("landing.how.step3.desc")} />
                        <StepCard n="4" emoji="💰" title={t("landing.how.step4.title")} desc={t("landing.how.step4.desc")} />
                    </div>
                </section>

                {/* ─── IA TRUST ─── */}
                <section
                    className="glass fade-in"
                    style={{
                        maxWidth: 1100,
                        margin: "0 auto 80px",
                        padding: "clamp(32px, 5vw, 56px)",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 48,
                        alignItems: "center",
                    }}
                >
                    <div>
                        <span
                            style={{
                                color: "var(--primary)",
                                fontSize: 12,
                                letterSpacing: 2,
                                textTransform: "uppercase",
                                fontWeight: 700,
                            }}
                        >
                            {t("landing.ai.badge")}
                        </span>
                        <h2 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 800, marginTop: 8, marginBottom: 16 }}>
                            {t("landing.ai.title.before")}
                            <span className="gradient-text">{t("landing.ai.title.gradient")}</span>
                        </h2>
                        <p style={{ color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 20, fontSize: 16 }}>
                            {t("landing.ai.desc1")}
                        </p>
                        <p style={{ color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 24, fontSize: 16 }}>
                            <strong style={{ color: "var(--text)" }}>{t("landing.ai.descBold")}</strong> {t("landing.ai.desc2")}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <BulletPoint>{t("landing.ai.point1")}</BulletPoint>
                            <BulletPoint>{t("landing.ai.point2")}</BulletPoint>
                            <BulletPoint>{t("landing.ai.point3")}</BulletPoint>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                        <RiskScoreGauge score={animatedScore} size={240} label={animatedScore >= 80 ? "Confiable" : "..."} />
                        <div style={{ textAlign: "center" }}>
                            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{t("landing.ai.example.name")}</p>
                            <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
                                {t("landing.ai.example.role")}
                            </p>
                            <p style={{ color: "var(--primary)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                                {t("landing.ai.example.tip")}
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─── TESTIMONIOS ─── */}
                <section style={{ maxWidth: 1100, margin: "0 auto 80px" }}>
                    <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, textAlign: "center", marginBottom: 48 }}>
                        {t("landing.testimonials.title")}
                        <span className="gradient-text">{t("landing.testimonials.titleGradient")}</span>
                    </h2>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                        <Testimonial
                            quote={t("landing.testimonials.t1.quote")}
                            name={t("landing.testimonials.t1.name")}
                            role={t("landing.testimonials.t1.role")}
                        />
                        <Testimonial
                            quote={t("landing.testimonials.t2.quote")}
                            name={t("landing.testimonials.t2.name")}
                            role={t("landing.testimonials.t2.role")}
                        />
                        <Testimonial
                            quote={t("landing.testimonials.t3.quote")}
                            name={t("landing.testimonials.t3.name")}
                            role={t("landing.testimonials.t3.role")}
                        />
                    </div>
                </section>

                {/* ─── STATS ─── */}
                <section style={{ maxWidth: 900, margin: "0 auto 80px", textAlign: "center" }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--text-dim)" }}>
                        {t("landing.stats.title")}
                    </h2>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                            gap: 16,
                            marginTop: 24,
                        }}
                    >
                        <StatHuman value={totalVaquitas?.toString() ?? "—"} label={t("landing.stats.vaquitas")} sub={t("landing.stats.vaquitasSub")} />
                        <StatHuman value="100%" label={t("landing.stats.money")} sub={t("landing.stats.moneySub")} />
                        <StatHuman value="0" label={t("landing.stats.banks")} sub={t("landing.stats.banksSub")} />
                        <StatHuman value="24/7" label={t("landing.stats.whatsapp")} sub={t("landing.stats.whatsappSub")} />
                    </div>
                </section>

                {/* ─── CTA FINAL ─── */}
                <section style={{ maxWidth: 700, margin: "0 auto 80px", textAlign: "center", padding: "48px 24px" }} className="glass">
                    <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, marginBottom: 16 }}>
                        {t("landing.cta.title.before")}
                        <span className="gradient-text">{t("landing.cta.titleGradient")}</span>
                        {t("landing.cta.title.after")}
                    </h2>
                    <p style={{ color: "var(--text-dim)", marginBottom: 28, fontSize: 17 }}>
                        {t("landing.cta.subtitle")}
                    </p>
                    <a
                        href="https://wa.me/14155238886?text=join%20till-breathing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary pulse-glow"
                        style={{ textDecoration: "none", display: "inline-block", fontSize: 17, padding: "16px 32px" }}
                    >
                        🚀 {t("landing.cta.button")}
                    </a>
                    <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-dim)" }}>
                        {t("landing.cta.footer")}
                    </p>
                </section>

                {/* ─── TECNOLOGÍA ─── */}
                <section style={{ maxWidth: 900, margin: "0 auto 60px" }}>
                    <details className="glass" style={{ padding: 24 }}>
                        <summary
                            style={{
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                color: "var(--text-dim)",
                                letterSpacing: 1,
                                textTransform: "uppercase",
                            }}
                        >
                            {t("landing.tech.summary")}
                        </summary>
                        <div style={{ marginTop: 20, color: "var(--text-dim)", lineHeight: 1.7, fontSize: 14 }}>
                            <p style={{ marginBottom: 12 }}>
                                {t("landing.tech.p1.before")}
                                <strong style={{ color: "var(--text)" }}>{t("landing.tech.p1.bold1")}</strong>
                                {t("landing.tech.p1.middle")}
                                <em>{t("landing.tech.p1.em")}</em>
                                {t("landing.tech.p1.after")}
                            </p>
                            <p style={{ marginBottom: 12 }}>
                                {t("landing.tech.p2.before")}
                                <strong style={{ color: "var(--text)" }}>{t("landing.tech.p2.bold1")}</strong>
                                {t("landing.tech.p2.middle")}
                                <strong style={{ color: "var(--text)" }}>{t("landing.tech.p2.bold2")}</strong>
                                {t("landing.tech.p2.after")}
                            </p>
                            <p style={{ marginBottom: 12 }}>
                                {t("landing.tech.p3.before")}
                                <strong style={{ color: "var(--text)" }}>{t("landing.tech.p3.bold1")}</strong>
                                {t("landing.tech.p3.middle")}
                                <strong style={{ color: "var(--text)" }}>{t("landing.tech.p3.bold2")}</strong>
                                {t("landing.tech.p3.after")}
                            </p>
                            <p>
                                {t("landing.tech.p4.before")}
                                <a
                                    href="https://sepolia.arbiscan.io/address/0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "underline" }}
                                >
                                    {t("landing.tech.p4.link")} ↗
                                </a>
                                .
                            </p>
                        </div>
                    </details>
                </section>

                {/* ─── FOOTER ─── */}
                <footer
                    style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "var(--text-dim)",
                        fontSize: 14,
                        borderTop: "1px solid var(--border)",
                    }}
                >
                    {t("footer.tagline")}
                </footer>
            </main>
        </>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────

function BadItem({ text }: { text: string }) {
    return (
        <li style={{ display: "flex", alignItems: "start", gap: 10, color: "var(--text-dim)" }}>
            <span style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }}>❌</span>
            <span style={{ fontSize: 15, lineHeight: 1.5 }}>{text}</span>
        </li>
    );
}

function GoodItem({ text }: { text: string }) {
    return (
        <li style={{ display: "flex", alignItems: "start", gap: 10 }}>
            <span style={{ color: "#00d4aa", flexShrink: 0, marginTop: 2 }}>✅</span>
            <span style={{ fontSize: 15, lineHeight: 1.5, color: "var(--text)" }}>{text}</span>
        </li>
    );
}

function StepCard({ n, emoji, title, desc }: { n: string; emoji: string; title: string; desc: string }) {
    return (
        <div className="glass" style={{ padding: 24, position: "relative" }}>
            <div
                style={{
                    position: "absolute",
                    top: -16,
                    right: 16,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #00d4aa, #a855f7)",
                    color: "#0a0a0f",
                    fontWeight: 800,
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {n}
            </div>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>{desc}</p>
        </div>
    );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-dim)", fontSize: 14 }}>
            <span style={{ color: "var(--primary)" }}>→</span>
            <span>{children}</span>
        </div>
    );
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
    return (
        <div className="glass" style={{ padding: 24, position: "relative" }}>
            <div style={{ fontSize: 32, color: "var(--primary)", lineHeight: 1, marginBottom: 8 }}>&ldquo;</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 16, color: "var(--text)", fontStyle: "italic" }}>
                {quote}
            </p>
            <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{name}</p>
                <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{role}</p>
            </div>
        </div>
    );
}

function StatHuman({ value, label, sub }: { value: string; label: string; sub: string }) {
    return (
        <div className="glass" style={{ padding: 20, textAlign: "center" }}>
            <div className="gradient-text" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                {value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, color: "var(--text)" }}>{label}</div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{sub}</div>
        </div>
    );
}
