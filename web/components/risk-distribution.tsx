"use client";

interface Props {
    scores: number[];
}

export function RiskDistribution({ scores }: Props) {
    if (scores.length === 0) {
        return null;
    }

    const buckets = {
        low: scores.filter((s) => s < 40).length,
        mid: scores.filter((s) => s >= 40 && s < 70).length,
        high: scores.filter((s) => s >= 70).length,
    };

    const max = Math.max(buckets.low, buckets.mid, buckets.high, 1);
    const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return (
        <div className="glass" style={{ padding: 20 }}>
            <h3
                style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <span>🧠</span>
                Confianza del grupo
            </h3>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>
                Score promedio: <strong style={{ color: "var(--primary)" }}>{average}/100</strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <DistRow label="🟢 Confiables (70+)" count={buckets.high} max={max} color="#00d4aa" />
                <DistRow label="🟡 Moderados (40-69)" count={buckets.mid} max={max} color="#f59e0b" />
                <DistRow label="🔴 Riesgo (<40)" count={buckets.low} max={max} color="#ef4444" />
            </div>
        </div>
    );
}

function DistRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
    const percent = (count / max) * 100;
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--text-dim)" }}>{label}</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{count}</span>
            </div>
            <div
                style={{
                    height: 6,
                    background: "var(--surface)",
                    borderRadius: 4,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${percent}%`,
                        background: color,
                        borderRadius: 4,
                        transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </div>
        </div>
    );
}
