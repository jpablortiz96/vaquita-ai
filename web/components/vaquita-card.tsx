"use client";

import { formatMXNB, shortAddress } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/contracts";

interface Props {
    address: string;
    contributionAmount: bigint;
    totalMembers: number;
    currentMembers: number;
    status: number;
    cycleDays: number;
}

export function VaquitaCard({
    address,
    contributionAmount,
    totalMembers,
    currentMembers,
    status,
    cycleDays,
}: Props) {
    const statusLabel = STATUS_LABELS[status] ?? "Desconocida";
    const statusColor =
        status === 0 ? "#f59e0b" : status === 1 ? "#00d4aa" : status === 2 ? "#a855f7" : "#ef4444";

    return (
        <a
            href={`/vaquitas/${address}`}
            className="glass fade-in"
            style={{
                display: "block",
                padding: 20,
                cursor: "pointer",
                transition: "transform 0.2s, border-color 0.2s",
                textDecoration: "none",
                color: "inherit",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🐄 Vaquita</h3>
                    <code style={{ fontSize: 12, color: "var(--text-dim)" }}>{shortAddress(address)}</code>
                </div>
                <span
                    style={{
                        background: `${statusColor}22`,
                        color: statusColor,
                        padding: "4px 10px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    {statusLabel}
                </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <Metric label="Aporte" value={`${formatMXNB(contributionAmount)} MXNB`} />
                <Metric label="Ciclo" value={`${cycleDays} días`} />
                <Metric label="Miembros" value={`${currentMembers}/${totalMembers}`} />
                <Metric label="Pool total" value={`${formatMXNB(contributionAmount * BigInt(totalMembers))} MXNB`} />
            </div>
        </a>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{value}</div>
        </div>
    );
}
