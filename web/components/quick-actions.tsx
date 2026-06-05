"use client";

interface Action {
    icon: string;
    label: string;
    href: string;
    primary?: boolean;
}

interface Props {
    actions: Action[];
    title?: string;
}

export function QuickActions({ actions, title = "Acciones rápidas" }: Props) {
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
                <span>⚡</span>
                {title}
            </h3>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 10,
                }}
            >
                {actions.map((a, i) => (
                    <a
                        key={i}
                        href={a.href}
                        target={a.href.startsWith("http") ? "_blank" : undefined}
                        rel={a.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: a.primary
                                ? "linear-gradient(135deg, var(--primary), var(--accent))"
                                : "var(--surface)",
                            border: a.primary ? "none" : "1px solid var(--border)",
                            color: a.primary ? "#0a0a0f" : "var(--text)",
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: "none",
                            textAlign: "center",
                            transition: "transform 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                        }}
                    >
                        <span style={{ fontSize: 16 }}>{a.icon}</span>
                        <span>{a.label}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}
