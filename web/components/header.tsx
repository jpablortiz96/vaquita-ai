"use client";

import { usePrivy } from "@privy-io/react-auth";
import { shortAddress } from "@/lib/format";

export function Header() {
    const { ready, authenticated, user, login, logout } = usePrivy();
    const address = user?.wallet?.address;

    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: "1px solid var(--border)",
                backdropFilter: "blur(12px)",
                position: "sticky",
                top: 0,
                zIndex: 50,
                background: "rgba(10, 10, 15, 0.8)",
            }}
        >
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 20 }}>
                <span style={{ fontSize: 28 }}>🐄</span>
                <span className="gradient-text">VaquitaAI</span>
            </a>
            <div>
                {!ready ? (
                    <span style={{ color: "var(--text-dim)", fontSize: 14 }}>Cargando...</span>
                ) : authenticated ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 14, color: "var(--text-dim)" }}>{shortAddress(address)}</span>
                        <button className="btn-ghost" onClick={() => logout()}>
                            Salir
                        </button>
                    </div>
                ) : (
                    <button className="btn-primary" onClick={() => login()}>
                        Conectar
                    </button>
                )}
            </div>
        </header>
    );
}
