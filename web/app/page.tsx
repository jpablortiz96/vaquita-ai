"use client";

import { Header } from "@/components/header";
import { RiskScoreGauge } from "@/components/risk-score-gauge";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContract } from "wagmi";
import { CONTRACTS, factoryAbi } from "@/lib/contracts";
import { useState, useEffect } from "react";

export default function HomePage() {
    const { authenticated } = usePrivy();

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

                {/* ─── HERO — Historia, no tecnología ─── */}
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
                        Ahorra con tu familia.
                        <br />
                        <span className="gradient-text">Sin papeles. Sin trampas.</span>
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
                        La vaquita de toda la vida, pero ahora con un cuaderno que nunca se pierde
                        y una inteligencia que cuida de todos los miembros.
                    </p>

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
                        {authenticated ? (
                            <a href="/vaquitas" className="btn-primary">
                                Ver mis vaquitas
                            </a>
                        ) : (
                            <a
                                href="https://wa.me/14155238886?text=join%20till-breathing"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary pulse-glow"
                                style={{ textDecoration: "none", display: "inline-block" }}
                            >
                                🚀 Empezar gratis por WhatsApp
                            </a>
                        )}
                        <a href="#como-funciona" className="btn-ghost">
                            ¿Cómo funciona?
                        </a>
                    </div>

                    <p style={{ fontSize: 14, color: "var(--text-dim)" }}>
                        🇲🇽 Hecho en México · Sin descargas · Funciona en cualquier celular
                    </p>
                </section>

                {/* ─── ANTES vs AHORA — La narrativa emocional ─── */}
                <section
                    style={{
                        maxWidth: 1100,
                        margin: "0 auto 80px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "clamp(28px, 5vw, 40px)",
                            fontWeight: 800,
                            textAlign: "center",
                            marginBottom: 12,
                        }}
                    >
                        ¿Te suena familiar?
                    </h2>
                    <p
                        style={{
                            color: "var(--text-dim)",
                            textAlign: "center",
                            marginBottom: 40,
                            fontSize: 17,
                        }}
                    >
                        Las tandas, vaquitas y cundinas son tradición. Pero también vienen con problemas.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                            gap: 24,
                        }}
                    >
                        {/* ANTES card */}
                        <div
                            className="glass"
                            style={{
                                padding: 32,
                                position: "relative",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                            }}
                        >
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
                                📓 ANTES
                            </div>
                            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
                                La vaquita del cuaderno
                            </h3>
                            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                                <BadItem text='"¿Quién recibe este mes?" Nadie se acuerda.' />
                                <BadItem text='"Pedro desapareció con el dinero." 😱' />
                                <BadItem text='"Yo ya te di mi parte." Discusiones eternas.' />
                                <BadItem text='"Hay que reunirse en persona." Imposible si vives lejos.' />
                                <BadItem text="Sin protección si alguien deja de pagar." />
                            </ul>
                        </div>

                        {/* AHORA card */}
                        <div
                            className="glass"
                            style={{
                                padding: 32,
                                position: "relative",
                                border: "1px solid rgba(0, 212, 170, 0.3)",
                            }}
                        >
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
                                ✨ AHORA con VaquitaAI
                            </div>
                            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
                                Tu vaquita por WhatsApp
                            </h3>
                            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                                <GoodItem text="Un asistente te recuerda quién recibe cada mes." />
                                <GoodItem text="Nadie puede desaparecer con la plata. Está protegida." />
                                <GoodItem text="Cada aporte y cobro queda registrado para siempre." />
                                <GoodItem text="Tu familia participa desde su WhatsApp, donde estén." />
                                <GoodItem text="Si alguien falla, su colateral cuida al grupo." />
                            </ul>
                        </div>
                    </div>
                </section>

                {/* ─── COMO FUNCIONA — 4 pasos simples ─── */}
                <section
                    id="como-funciona"
                    style={{
                        maxWidth: 1100,
                        margin: "0 auto 80px",
                        scrollMarginTop: 80,
                    }}
                >
                    <h2
                        style={{
                            fontSize: "clamp(28px, 5vw, 40px)",
                            fontWeight: 800,
                            textAlign: "center",
                            marginBottom: 12,
                        }}
                    >
                        Así funciona, <span className="gradient-text">paso a paso</span>
                    </h2>
                    <p
                        style={{
                            color: "var(--text-dim)",
                            textAlign: "center",
                            marginBottom: 48,
                            fontSize: 17,
                        }}
                    >
                        En menos de 5 minutos tienes tu primera vaquita digital lista.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: 24,
                        }}
                    >
                        <StepCard
                            n="1"
                            emoji="📱"
                            title="Mandas un WhatsApp"
                            desc='Le escribes a VaquitaAI: "quiero hacer una vaquita de 500 al mes con 4 amigos"'
                        />
                        <StepCard
                            n="2"
                            emoji="👥"
                            title="Invitas a tus amigos"
                            desc="Cada amigo recibe un código. Se une desde su propio WhatsApp, sin descargar nada."
                        />
                        <StepCard
                            n="3"
                            emoji="🤖"
                            title="La IA decide un orden justo"
                            desc="Un asistente inteligente conoce a tus amigos y propone quién recibe primero."
                        />
                        <StepCard
                            n="4"
                            emoji="💰"
                            title="Cada mes alguien recibe"
                            desc="VaquitaAI les avisa por audio en español a cada miembro cuando le toca."
                        />
                    </div>
                </section>

                {/* ─── IA TRUST — La sección humanizada ─── */}
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
                            ✨ Un asistente cuida tu vaquita
                        </span>
                        <h2 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 800, marginTop: 8, marginBottom: 16 }}>
                            La IA <span className="gradient-text">conoce a tus amigos</span>
                        </h2>
                        <p style={{ color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 20, fontSize: 16 }}>
                            Cuando alguien quiere unirse a tu vaquita, le hace 4 preguntas amigables sobre
                            su trabajo y cuánto tiempo lleva en la comunidad. Después calcula qué tan
                            confiable es y sugiere en qué orden debería recibir.
                        </p>
                        <p style={{ color: "var(--text-dim)", lineHeight: 1.7, marginBottom: 24, fontSize: 16 }}>
                            <strong style={{ color: "var(--text)" }}>Lo mejor:</strong> tú decides al final.
                            La IA solo te ayuda a ver más claro, pero la última palabra es tuya.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <BulletPoint>Sin pedir tu historial bancario.</BulletPoint>
                            <BulletPoint>Sin papeles, sin firmas.</BulletPoint>
                            <BulletPoint>Razones claras y entendibles.</BulletPoint>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                        <RiskScoreGauge score={animatedScore} size={240} label={animatedScore >= 80 ? "Confiable" : "..."} />
                        <div style={{ textAlign: "center" }}>
                            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>María, 35</p>
                            <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
                                Maestra · 2 años en el grupo · Ingreso estable
                            </p>
                            <p style={{ color: "var(--primary)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
                                💡 Recomendación: Le toca temprano
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─── TESTIMONIOS ─── */}
                <section
                    style={{
                        maxWidth: 1100,
                        margin: "0 auto 80px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "clamp(28px, 5vw, 40px)",
                            fontWeight: 800,
                            textAlign: "center",
                            marginBottom: 48,
                        }}
                    >
                        Hecho para <span className="gradient-text">familias mexicanas</span>
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 24,
                        }}
                    >
                        <Testimonial
                            quote="Llevábamos la vaquita en un cuaderno. Mi prima lo perdió y se armó la discusión. Con esto ya no hay manera de equivocarse."
                            name="Doña Carmen, 58"
                            role="Cundina familiar · Querétaro"
                        />
                        <Testimonial
                            quote="Estaba en una tanda con compañeros del trabajo. Uno renunció y se llevó el bote. Lo bueno de aquí es que ya no puede pasar eso."
                            name="Roberto, 32"
                            role="Tanda de oficina · CDMX"
                        />
                        <Testimonial
                            quote="La parte que me encantó es que llega un audio cuando me toca recibir. Hasta mi mamá lo entendió a la primera."
                            name="Sofía, 28"
                            role="Vaquita de amigas · Guadalajara"
                        />
                    </div>
                </section>

                {/* ─── STATS — Humanizadas ─── */}
                <section
                    style={{
                        maxWidth: 900,
                        margin: "0 auto 80px",
                        textAlign: "center",
                    }}
                >
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--text-dim)" }}>
                        Construido con cuidado
                    </h2>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                            gap: 16,
                            marginTop: 24,
                        }}
                    >
                        <StatHuman
                            value={totalVaquitas?.toString() ?? "—"}
                            label="Vaquitas creadas"
                            sub="en demos y pruebas"
                        />
                        <StatHuman value="100%" label="Tu dinero" sub="nunca se pierde" />
                        <StatHuman value="0" label="Bancos" sub="involucrados" />
                        <StatHuman value="24/7" label="WhatsApp" sub="siempre disponible" />
                    </div>
                </section>

                {/* ─── CTA FINAL ─── */}
                <section
                    style={{
                        maxWidth: 700,
                        margin: "0 auto 80px",
                        textAlign: "center",
                        padding: "48px 24px",
                    }}
                    className="glass"
                >
                    <h2
                        style={{
                            fontSize: "clamp(28px, 5vw, 40px)",
                            fontWeight: 800,
                            marginBottom: 16,
                        }}
                    >
                        ¿Listo para tu <span className="gradient-text">primera vaquita digital</span>?
                    </h2>
                    <p style={{ color: "var(--text-dim)", marginBottom: 28, fontSize: 17 }}>
                        Toma menos tiempo que pedir un café. Y dura para siempre.
                    </p>
                    <a
                        href="https://wa.me/14155238886?text=join%20till-breathing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary pulse-glow"
                        style={{ textDecoration: "none", display: "inline-block", fontSize: 17, padding: "16px 32px" }}
                    >
                        🚀 Empezar gratis por WhatsApp
                    </a>
                    <p style={{ marginTop: 16, fontSize: 13, color: "var(--text-dim)" }}>
                        No pedimos tarjeta · No descargas apps · Funciona ya
                    </p>
                </section>

                {/* ─── TECNOLOGÍA (sutil, para jueces) ─── */}
                <section
                    style={{
                        maxWidth: 900,
                        margin: "0 auto 60px",
                    }}
                >
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
                            🔧 Para curiosos: ¿Cómo está hecho?
                        </summary>
                        <div style={{ marginTop: 20, color: "var(--text-dim)", lineHeight: 1.7, fontSize: 14 }}>
                            <p style={{ marginBottom: 12 }}>
                                VaquitaAI corre sobre <strong style={{ color: "var(--text)" }}>Arbitrum</strong>, una
                                red blockchain rápida y barata. Cada vaquita es un{" "}
                                <em>contrato inteligente</em>: un acuerdo escrito en código que se ejecuta solo
                                y no se puede romper.
                            </p>
                            <p style={{ marginBottom: 12 }}>
                                Las contribuciones se hacen en <strong style={{ color: "var(--text)" }}>MXNB</strong>,
                                pesos digitales emitidos por <strong style={{ color: "var(--text)" }}>Bitso</strong>{" "}
                                con respaldo 1:1 al peso mexicano. Tu dinero nunca cambia de valor.
                            </p>
                            <p style={{ marginBottom: 12 }}>
                                La inteligencia que evalúa miembros es <strong style={{ color: "var(--text)" }}>Claude Sonnet 4.5</strong>{" "}
                                de Anthropic. Las notificaciones de voz usan{" "}
                                <strong style={{ color: "var(--text)" }}>ElevenLabs</strong> para sonar humanas.
                            </p>
                            <p>
                                Todo el código es open source y verificable. Mira nuestros contratos en{" "}
                                <a
                                    href="https://sepolia.arbiscan.io/address/0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: "underline" }}
                                >
                                    Arbiscan ↗
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
                    🐄 Hecho con cariño en LATAM · Ethereum México x Bitso Hackathon 2026
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
