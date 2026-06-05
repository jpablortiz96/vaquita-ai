"use client";

import { RiskScoreGauge } from "./risk-score-gauge";
import { shortAddress } from "@/lib/format";

interface Props {
    address: string;
    name: string;
    position: number;
    score: number;
    status: "received" | "current" | "upcoming" | "pending";
    extraInfo?: string;
}

export function MemberRow({ address, name, position, score, status, extraInfo }: Props) {
    const statusConfig = {
        received: { label: "Ya recibió", color: "#00d4aa", bg: "rgba(0, 212, 170, 0.15)" },
        current: { label: "Recibe ahora", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)" },
        upcoming: { label: "Próximo", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
        pending: { label: "En espera", color: "#8a8a96", bg: "rgba(138, 138, 150, 0.15)" },
    };

    const cfg = statusConfig[status];
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

    return (
        <div
            className="fade-in"
            style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 0",
                borderBottom: "1px solid var(--border)",
            }}
        >
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--primary), var(--accent))",
                    color: "#0a0a0f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 15,
                    flexShrink: 0,
                }}
            >
                {initials || "?"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                    <div
                        style={{
                            fontSize: 11,
                            color: "var(--text-dim)",
                            background: "var(--surface)",
                            padding: "2px 6px",
                            borderRadius: 4,
                        }}
                    >
                        #{position}
                    </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    {extraInfo ?? shortAddress(address)}
                </div>
            </div>
            <span
                style={{
                    background: cfg.bg,
                    color: cfg.color,
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                }}
            >
                {cfg.label}
            </span>
            <RiskScoreGauge score={score} size={56} label="" />
        </div>
    );
}
