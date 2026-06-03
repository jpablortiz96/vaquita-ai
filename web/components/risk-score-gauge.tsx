"use client";

import { scoreColor, scoreLabel } from "@/lib/format";

interface Props {
    score: number;
    size?: number;
    label?: string;
}

export function RiskScoreGauge({ score, size = 200, label }: Props) {
    const clampedScore = Math.max(0, Math.min(100, score));
    const radius = size / 2 - 20;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedScore / 100) * circumference;
    const color = scoreColor(clampedScore);
    const labelText = scoreLabel(clampedScore);

    const gradientId = `gauge-gradient-${clampedScore}`;

    return (
        <div
            style={{
                position: "relative",
                width: size,
                height: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                    </linearGradient>
                </defs>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--border)"
                    strokeWidth="12"
                    fill="none"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span style={{ fontSize: size * 0.28, fontWeight: 800, color }}>{clampedScore}</span>
                <span style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: 1, textTransform: "uppercase" }}>
                    {label ?? labelText}
                </span>
            </div>
        </div>
    );
}
