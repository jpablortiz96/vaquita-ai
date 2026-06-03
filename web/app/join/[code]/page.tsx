"use client";

import { Header } from "@/components/header";
import { use } from "react";

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);

    return (
        <>
            <Header />
            <main style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 56 }}>🐄</div>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 16, marginBottom: 8 }}>
                    Te invitaron a una <span className="gradient-text">vaquita</span>
                </h1>
                <p style={{ color: "var(--text-dim)", marginBottom: 32 }}>
                    Código de invitación: <code style={{ color: "var(--primary)" }}>{code}</code>
                </p>

                <div className="glass" style={{ padding: 32, textAlign: "left" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                        ¿Cómo unirme?
                    </h3>
                    <ol style={{ listStyle: "decimal", paddingLeft: 24, color: "var(--text-dim)", lineHeight: 1.8 }}>
                        <li>
                            Abre WhatsApp y manda un mensaje a{" "}
                            <strong style={{ color: "var(--text)" }}>+1 415 523 8886</strong>
                        </li>
                        <li>
                            Escribe: <code>join till-breathing</code> (para activar el sandbox)
                        </li>
                        <li>
                            Después escribe: <code>quiero unirme con código {code}</code>
                        </li>
                        <li>
                            Responde las 4 preguntas que te haga el bot
                        </li>
                        <li>
                            La IA evaluará tu perfil y notificará al organizador
                        </li>
                    </ol>
                    <a
                        className="btn-primary"
                        href={`https://wa.me/14155238886?text=quiero+unirme+con+c%C3%B3digo+${code}`}
                        target="_blank"
                        style={{ display: "inline-block", marginTop: 24, textDecoration: "none" }}
                    >
                        Abrir WhatsApp ↗
                    </a>
                </div>
            </main>
        </>
    );
}
