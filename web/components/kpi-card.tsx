"use client";

import { useEffect, useState } from "react";

interface Props {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: string;
    color?: "primary" | "accent" | "warning" | "neutral";
    animate?: boolean;
}

export function KPICard({ label, value, subValue, icon, color = "neutral", animate = true }: Props) {
    const [displayValue, setDisplayValue] = useState<string | number>(
        animate && typeof value === "number" ? 0 : value,
    );

    useEffect(() => {
        if (!animate || typeof value !== "number") {
            setDisplayValue(value);
            return;
        }
        const target = value;
        const duration = 1200;
        const steps = 60;
        const stepValue = target / steps;
        const stepDuration = duration / steps;
        let current = 0;

        const interval = setInterval(() => {
            current += stepValue;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            setDisplayValue(Math.round(current));
        }, stepDuration);

        return () => clearInterval(interval);
    }, [value, animate]);

    const accentMap = {
        primary: "var(--primary)",
        accent: "var(--accent)",
        warning: "#f59e0b",
        neutral: "var(--text)",
    };

    return (
        <div
            className="glass fade-in"
            style={{
                padding: 20,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {icon && (
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontSize: 20,
                        opacity: 0.4,
                    }}
                >
                    {icon}
                </div>
            )}
            <div
                style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 26,
                    fontWeight: 800,
                    lineHeight: 1,
                    color: accentMap[color],
                }}
            >
                {displayValue}
            </div>
            {subValue && (
                <div
                    style={{
                        fontSize: 12,
                        color: "var(--text-dim)",
                        marginTop: 6,
                    }}
                >
                    {subValue}
                </div>
            )}
        </div>
    );
}
