"use client";

import { Header } from "@/components/header";
import { RiskScoreGauge } from "@/components/risk-score-gauge";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContract } from "wagmi";
import { CONTRACTS, factoryAbi } from "@/lib/contracts";

export default function HomePage() {
    const { authenticated, login } = usePrivy();

    const { data: totalVaquitas } = useReadContract({
        address: CONTRACTS.VaquitaFactory,
        abi: factoryAbi,
        functionName: "totalVaquitas",
    });

    return (
        <>
            <Header />
            <main style={{ minHeight: "100vh", padding: "0 24px" }}>
                <section
                    style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        padding: "60px 0 80px",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: 64, marginBottom: 24 }}>🐄</div>
                    <h1
                        style={{
                            fontSize: "clamp(36px, 7vw, 64px)",
                            fontWeight: 800,
                            lineHeight: 1.1,
                            marginBottom: 16,
                        }}
                    >
                        Tu vaquita,
                        <br />
                        <span className="gradient-text">programable.</span>
                    </h1>
                    <p
                        style={{
                            fontSize: 18,
                            color: "var(--text-dim)",
                            maxWidth: 600,
                            margin: "0 auto 32px",
                            lineHeight: 1.6,
                        }}
                    >
                        Ahorra con tu familia en pesos digitales, sin papeles y con IA evaluando confianza.
                        Onchain en Arbitrum, transparente para todos.
                    </p>

                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        {authenticated ? (
                            <a href="/vaquitas" className="btn-primary">
                                Ver mis vaquitas
                            </a>
                        ) : (
                            <button className="btn-primary pulse-glow" onClick={() => login()}>
                                Empezar gratis
                            </button>
                        )}
                        <a href="https://wa.me/14155238886?text=join%20till-breathing" target="_blank" className="btn-ghost">
                            Probar por WhatsApp
                        </a>
                    </div>

                    {/* Stats row */}
                    <div
                        style={{
                            marginTop: 60,
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                            gap: 20,
                            maxWidth: 700,
                            marginInline: "auto",
                        }}
                    >
                        <Stat label="Vaquitas creadas" value={totalVaquitas?.toString() ?? "—"} />
                        <Stat label="Red" value="Arbitrum" />
                        <Stat label="Moneda" value="MXNB" />
                        <Stat label="UI" value="WhatsApp + Web" />
                    </div>
                </section>

                {/* AI Risk Score showcase */}
                <section
                    className="glass fade-in"
                    style={{
                        maxWidth: 1000,
                        margin: "0 auto 80px",
                        padding: 48,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
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
                            ⚡ IA en tiempo real
                        </span>
                        <h2 style={{ fontSize: 36, fontWeight: 800, marginTop: 8, marginBottom: 16 }}>
                            Risk Score con<br />
                            <span className="gradient-text">Claude Sonnet 4.5</span>
                        </h2>
                        <p style={{ color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 16 }}>
                            Cada miembro nuevo es evaluado por IA basándose en su ocupación, ingresos
                            y tiempo en la comunidad. El score determina su posición en el orden de
                            pagos — los más confiables reciben primero.
                        </p>
                        <ul style={{ listStyle: "none", color: "var(--text-dim)", lineHeight: 2 }}>
                            <li>✅ Sin SCORE bancario tradicional</li>
                            <li>✅ Razonamiento explicable</li>
                            <li>✅ Pesos LATAM, contexto LATAM</li>
                        </ul>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <RiskScoreGauge score={78} size={240} label="Ejemplo" />
                    </div>
                </section>

                <footer
                    style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "var(--text-dim)",
                        fontSize: 14,
                        borderTop: "1px solid var(--border)",
                    }}
                >
                    Hecho con 🐄 para LATAM · Ethereum México x Bitso Hackathon 2026
                </footer>
            </main>
        </>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="glass" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700 }} className="gradient-text">
                {value}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
            </div>
        </div>
    );
}
