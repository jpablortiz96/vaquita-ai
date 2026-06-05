"use client";

interface Activity {
    id: string;
    type: "joined" | "contributed" | "received" | "started" | "completed";
    actor: string;
    timestamp: Date;
    amount?: string;
    txHash?: string;
}

interface Props {
    activities: Activity[];
    title?: string;
    emptyText?: string;
}

export function ActivityFeed({ activities, title = "Actividad reciente", emptyText = "Aún no hay actividad" }: Props) {
    if (activities.length === 0) {
        return (
            <div className="glass" style={{ padding: 24, textAlign: "center" }}>
                <div style={{ color: "var(--text-dim)", fontSize: 14 }}>
                    {emptyText}
                </div>
            </div>
        );
    }

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
                <span>📡</span>
                {title}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activities.map((a) => (
                    <ActivityItem key={a.id} activity={a} />
                ))}
            </div>
        </div>
    );
}

function ActivityItem({ activity }: { activity: Activity }) {
    const config = {
        joined: { emoji: "👋", text: "se unió", color: "var(--primary)" },
        contributed: { emoji: "💰", text: "contribuyó", color: "#00d4aa" },
        received: { emoji: "🎉", text: "recibió su turno", color: "#a855f7" },
        started: { emoji: "🚀", text: "arrancó la vaquita", color: "#f59e0b" },
        completed: { emoji: "✅", text: "completó la vaquita", color: "var(--primary)" },
    };

    const cfg = config[activity.type];
    const timeAgo = formatTimeAgo(activity.timestamp);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "start",
                gap: 12,
                padding: "8px 0",
            }}
        >
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                }}
            >
                {cfg.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <strong style={{ color: "var(--text)" }}>{activity.actor}</strong>{" "}
                    <span style={{ color: "var(--text-dim)" }}>{cfg.text}</span>
                    {activity.amount && (
                        <span style={{ color: cfg.color, marginLeft: 4 }}>
                            ({activity.amount} MXNB)
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                    {timeAgo}
                    {activity.txHash && (
                        <>
                            {" · "}
                            <a
                                href={`https://sepolia.arbiscan.io/tx/${activity.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--text-dim)", textDecoration: "underline" }}
                            >
                                Ver tx
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Hace unos segundos";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
}
