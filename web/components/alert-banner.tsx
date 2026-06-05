"use client";

type AlertType = "info" | "warning" | "success" | "danger";

interface Props {
    type: AlertType;
    title: string;
    description?: string;
    icon?: string;
    action?: { label: string; href: string };
}

export function AlertBanner({ type, title, description, icon, action }: Props) {
    const styles = {
        info: { bg: "rgba(0, 212, 170, 0.1)", border: "rgba(0, 212, 170, 0.3)", color: "var(--primary)" },
        warning: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", color: "#f59e0b" },
        success: { bg: "rgba(0, 212, 170, 0.15)", border: "rgba(0, 212, 170, 0.4)", color: "var(--primary)" },
        danger: { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", color: "#ef4444" },
    };

    const cfg = styles[type];
    const defaultIcon = { info: "ℹ️", warning: "⚠️", success: "✅", danger: "🚨" }[type];

    return (
        <div
            className="fade-in"
            style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 12,
                padding: 16,
                display: "flex",
                gap: 12,
                alignItems: "start",
            }}
        >
            <div style={{ fontSize: 20, flexShrink: 0 }}>{icon ?? defaultIcon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>{title}</div>
                {description && (
                    <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4, lineHeight: 1.5 }}>
                        {description}
                    </div>
                )}
                {action && (
                    <a
                        href={action.href}
                        target={action.href.startsWith("http") ? "_blank" : undefined}
                        rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        style={{
                            display: "inline-block",
                            marginTop: 10,
                            fontSize: 12,
                            fontWeight: 600,
                            color: cfg.color,
                            textDecoration: "underline",
                        }}
                    >
                        {action.label} →
                    </a>
                )}
            </div>
        </div>
    );
}
