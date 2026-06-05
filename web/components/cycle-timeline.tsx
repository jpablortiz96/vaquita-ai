"use client";

interface Cycle {
    number: number;
    recipientName: string;
    status: "done" | "active" | "future";
    estimatedDate?: string;
}

interface Props {
    cycles: Cycle[];
}

export function CycleTimeline({ cycles }: Props) {
    return (
        <div className="glass" style={{ padding: 20 }}>
            <h3
                style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}
            >
                <span>📅</span>
                Timeline de ciclos
            </h3>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cycles.length}, minmax(0, 1fr))`,
                    gap: 8,
                }}
            >
                {cycles.map((c) => (
                    <CycleItem key={c.number} cycle={c} />
                ))}
            </div>
        </div>
    );
}

function CycleItem({ cycle }: { cycle: Cycle }) {
    const styles = {
        done: {
            background: "rgba(0, 212, 170, 0.15)",
            color: "var(--primary)",
            border: "1px solid rgba(0, 212, 170, 0.3)",
        },
        active: {
            background: "linear-gradient(135deg, rgba(0, 212, 170, 0.2), rgba(168, 85, 247, 0.2))",
            color: "#ededf3",
            border: "1px solid var(--primary)",
            boxShadow: "0 0 20px rgba(0, 212, 170, 0.3)",
        },
        future: {
            background: "var(--surface)",
            color: "var(--text-dim)",
            border: "1px solid var(--border)",
        },
    };

    const icons = {
        done: "✓",
        active: "⏳",
        future: "",
    };

    return (
        <div
            style={{
                ...styles[cycle.status],
                borderRadius: 10,
                padding: "12px 8px",
                textAlign: "center",
                fontSize: 12,
                position: "relative",
                animation: cycle.status === "active" ? "pulse-glow 2.5s infinite" : "none",
            }}
        >
            <div style={{ fontWeight: 700, fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
                Ciclo {cycle.number} {icons[cycle.status]}
            </div>
            <div
                style={{
                    fontWeight: cycle.status === "active" ? 700 : 500,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {cycle.recipientName}
            </div>
            {cycle.estimatedDate && cycle.status !== "done" && (
                <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>
                    {cycle.estimatedDate}
                </div>
            )}
        </div>
    );
}
