"use client";

import { useT } from "@/lib/i18n/context";

export function LanguageToggle() {
    const { locale, setLocale } = useT();

    return (
        <div
            style={{
                display: "inline-flex",
                background: "var(--surface)",
                borderRadius: 8,
                padding: 3,
                border: "1px solid var(--border)",
                fontSize: 12,
                fontWeight: 600,
            }}
        >
            <button
                onClick={() => setLocale("es")}
                style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: locale === "es" ? "linear-gradient(135deg, var(--primary), var(--accent))" : "transparent",
                    color: locale === "es" ? "#0a0a0f" : "var(--text-dim)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                }}
            >
                ES
            </button>
            <button
                onClick={() => setLocale("en")}
                style={{
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: locale === "en" ? "linear-gradient(135deg, var(--primary), var(--accent))" : "transparent",
                    color: locale === "en" ? "#0a0a0f" : "var(--text-dim)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                }}
            >
                EN
            </button>
        </div>
    );
}
