"use client";

import { Header } from "@/components/header";
import { KPICard } from "@/components/kpi-card";
import { CycleTimeline } from "@/components/cycle-timeline";
import { MemberRow } from "@/components/member-row";
import { ActivityFeed } from "@/components/activity-feed";
import { AlertBanner } from "@/components/alert-banner";
import { RiskDistribution } from "@/components/risk-distribution";
import { QuickActions } from "@/components/quick-actions";
import { useReadContracts } from "wagmi";
import { vaquitaAbi } from "@/lib/contracts";
import { formatMXNB, shortAddress } from "@/lib/format";
import { useT } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Address } from "viem";
import { use, useEffect } from "react";

export default function DashboardPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = use(params);
    const vaquitaAddr = address as Address;
    const { t } = useT();

    // The Vaquita contract exposes individual public getters (no config tuple).
    const { data, refetch } = useReadContracts({
        contracts: [
            { address: vaquitaAddr, abi: vaquitaAbi, functionName: "contributionAmount" },
            { address: vaquitaAddr, abi: vaquitaAbi, functionName: "collateralAmount" },
            { address: vaquitaAddr, abi: vaquitaAbi, functionName: "totalMembers" },
            { address: vaquitaAddr, abi: vaquitaAbi, functionName: "cycleDuration" },
            { address: vaquitaAddr, abi: vaquitaAbi, functionName: "status" },
            { address: vaquitaAddr, abi: vaquitaAbi, functionName: "getMembers" },
            { address: vaquitaAddr, abi: vaquitaAbi, functionName: "currentCycle" },
        ],
    });

    // Real-time polling every 15s
    useEffect(() => {
        const interval = setInterval(() => refetch(), 15000);
        return () => clearInterval(interval);
    }, [refetch]);

    if (!data) {
        return (
            <>
                <Header />
                <main style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}>
                    Cargando dashboard...
                </main>
            </>
        );
    }

    const contribution = data[0]?.result as bigint | undefined;
    const _collateral = data[1]?.result as bigint | undefined;
    const totalMembersRaw = data[2]?.result as number | undefined;
    const cycleDurationRaw = data[3]?.result as bigint | undefined;
    const status = (data[4]?.result as number | undefined) ?? 0;
    const members = (data[5]?.result as readonly Address[] | undefined) ?? [];
    const currentCycle = Number((data[6]?.result as number | undefined) ?? 0);

    if (contribution === undefined || totalMembersRaw === undefined || cycleDurationRaw === undefined) {
        return (
            <>
                <Header />
                <main style={{ textAlign: "center", padding: 60 }}>
                    <h2>Vaquita no encontrada</h2>
                </main>
            </>
        );
    }

    const cycleDays = Number(cycleDurationRaw) / 86400;
    const totalMembersNum = Number(totalMembersRaw);
    const pool = contribution * BigInt(totalMembersNum);
    const totalPool = formatMXNB(pool);
    const contributionStr = formatMXNB(contribution);

    // Generate cycle data (V1: based on members order; V2: from contracts)
    const cycles = Array.from({ length: totalMembersNum }, (_, i) => {
        const cycleNum = i + 1;
        const memberName = `Miembro ${cycleNum}`;
        let cycleStatus: "done" | "active" | "future" = "future";
        if (status === 1) {
            if (cycleNum < currentCycle) cycleStatus = "done";
            else if (cycleNum === currentCycle) cycleStatus = "active";
        }
        const estimatedDate = new Date(Date.now() + (cycleNum - currentCycle) * cycleDays * 86400000)
            .toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
        return { number: cycleNum, recipientName: memberName, status: cycleStatus, estimatedDate };
    });

    // Pseudo scores for members (V1: derived from address; V2: from agent API)
    const memberScores = members.map((m) => (parseInt(m.slice(-2), 16) % 60) + 30);

    // Alerts based on status
    const alerts = buildAlerts({
        status,
        currentMembers: members.length,
        totalMembers: totalMembersNum,
        currentCycle,
        cycleDays,
        t,
    });

    // Quick actions
    const actions = buildActions({ status, vaquitaAddress: vaquitaAddr, members, totalMembers: totalMembersNum, t });

    // Mock activity feed (V1; V2 = real onchain events)
    const activities = buildMockActivity({ members, status });

    const vaquitaName = `Vaquita ${shortAddress(vaquitaAddr)}`;

    return (
        <>
            <Header />
            <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
                {/* Breadcrumb */}
                <a href="/vaquitas" style={{ color: "var(--text-dim)", fontSize: 13 }}>
                    {t("dash.back")}
                </a>

                {/* Header */}
                <div style={{ marginTop: 12, marginBottom: 24 }}>
                    <h1
                        style={{
                            fontSize: "clamp(24px, 5vw, 32px)",
                            fontWeight: 800,
                            marginBottom: 8,
                        }}
                    >
                        🐄 {vaquitaName}
                    </h1>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, fontSize: 13, color: "var(--text-dim)" }}>
                        <StatusBadge status={status} t={t} />
                        <span>·</span>
                        <span>{members.length}/{totalMembersNum} · {t("dash.members.title")}</span>
                        <span>·</span>
                        <span>{t("dash.kpi.cycle")} {currentCycle || 0}/{totalMembersNum}</span>
                        <span>·</span>
                        <a
                            href={`https://sepolia.arbiscan.io/address/${vaquitaAddr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12 }}
                        >
                            {t("dash.actions.onchain")} ↗
                        </a>
                    </div>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                        {alerts.map((a, i) => (
                            <AlertBanner key={i} {...a} />
                        ))}
                    </div>
                )}

                {/* KPI cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: 12,
                        marginBottom: 24,
                    }}
                >
                    <KPICard
                        label={t("dash.kpi.pool")}
                        value={parseFloat(totalPool.replace(/,/g, ""))}
                        subValue={`MXNB · ${contributionStr}`}
                        icon="💰"
                        color="primary"
                    />
                    <KPICard
                        label={t("dash.kpi.punctuality")}
                        value={status === 1 ? 100 : 0}
                        subValue={status === 1 ? "100%" : "—"}
                        icon="✅"
                        color="primary"
                    />
                    <KPICard
                        label={t("dash.kpi.cycle")}
                        value={cycleDays}
                        subValue={t("dash.kpi.cycleDays")}
                        icon="📅"
                        color="accent"
                    />
                    <KPICard
                        label={t("dash.kpi.confidence")}
                        value={memberScores.length > 0 ? Math.round(memberScores.reduce((a, b) => a + b, 0) / memberScores.length) : 0}
                        subValue={t("dash.kpi.scoreSub")}
                        icon="🧠"
                        color="primary"
                    />
                </div>

                {/* Timeline */}
                {status === 1 && (
                    <div style={{ marginBottom: 24 }}>
                        <CycleTimeline cycles={cycles} title={t("dash.timeline.title")} />
                    </div>
                )}

                {/* Two-column layout: members + side panel */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
                        gap: 24,
                        marginBottom: 24,
                    }}
                    className="dashboard-grid"
                >
                    {/* Members */}
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
                            <span>👥</span>
                            {t("dash.members.title")} ({members.length}/{totalMembersNum})
                        </h3>
                        {members.length === 0 ? (
                            <p style={{ color: "var(--text-dim)", textAlign: "center", padding: 20 }}>
                                {t("dash.members.empty")}
                            </p>
                        ) : (
                            members.map((m, i) => (
                                <MemberRow
                                    key={`${m}-${i}`}
                                    address={m}
                                    name={`Miembro ${i + 1}`}
                                    position={i + 1}
                                    score={memberScores[i] ?? 50}
                                    status={
                                        status !== 1
                                            ? "pending"
                                            : i + 1 < currentCycle
                                              ? "received"
                                              : i + 1 === currentCycle
                                                ? "current"
                                                : "upcoming"
                                    }
                                    extraInfo={
                                        status === 1
                                            ? i + 1 === currentCycle
                                                ? "Recibe en este ciclo"
                                                : i + 1 < currentCycle
                                                  ? "Ya recibió"
                                                  : `Recibe en ${(i + 1 - currentCycle) * Math.round(cycleDays)} días aprox.`
                                            : shortAddress(m)
                                    }
                                />
                            ))
                        )}
                    </div>

                    {/* Side panel: distribution + actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {memberScores.length > 0 && (
                            <RiskDistribution
                                scores={memberScores}
                                title={t("dash.risk.title")}
                                avgLabel={t("dash.risk.avg")}
                                highLabel={t("dash.risk.high")}
                                midLabel={t("dash.risk.mid")}
                                lowLabel={t("dash.risk.low")}
                            />
                        )}
                        <QuickActions actions={actions} title={t("dash.actions.title")} />
                    </div>
                </div>

                {/* Activity Feed */}
                <ActivityFeed activities={activities} title={t("dash.activity.title")} emptyText={t("dash.activity.empty")} />

                {/* Footer */}
                <div style={{ marginTop: 32, textAlign: "center", padding: 16 }}>
                    <p style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {t("dash.footer")}
                    </p>
                </div>
            </main>

            <style>{`
                @media (max-width: 768px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </>
    );
}

type TFn = (key: TranslationKey) => string;

function StatusBadge({ status, t }: { status: number; t: TFn }) {
    const config = {
        0: { label: t("dash.status.created"), color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
        1: { label: t("dash.status.active"), color: "var(--primary)", bg: "rgba(0, 212, 170, 0.15)" },
        2: { label: t("dash.status.completed"), color: "var(--accent)", bg: "rgba(168, 85, 247, 0.15)" },
        3: { label: t("dash.status.cancelled"), color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
    }[status] ?? { label: "—", color: "var(--text-dim)", bg: "var(--surface)" };

    return (
        <span
            style={{
                background: config.bg,
                color: config.color,
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                animation: status === 1 ? "pulse-glow 2s infinite" : "none",
            }}
        >
            ● {config.label}
        </span>
    );
}

function buildAlerts(args: { status: number; currentMembers: number; totalMembers: number; currentCycle: number; cycleDays: number; t: TFn }) {
    const { t } = args;
    const alerts: Array<{ type: "info" | "warning" | "success" | "danger"; title: string; description?: string; action?: { label: string; href: string } }> = [];

    if (args.status === 0) {
        if (args.currentMembers < args.totalMembers) {
            alerts.push({
                type: "warning",
                title: `${t("dash.actions.invite")} (${args.totalMembers - args.currentMembers})`,
                description: t("dash.members.empty"),
                action: { label: t("dash.actions.whatsapp"), href: "https://wa.me/14155238886?text=invitar" },
            });
        } else {
            alerts.push({
                type: "success",
                title: t("dash.actions.start"),
                action: { label: t("dash.actions.start"), href: "https://wa.me/14155238886?text=arrancar" },
            });
        }
    } else if (args.status === 1) {
        alerts.push({
            type: "info",
            title: `${t("dash.kpi.cycle")} ${args.currentCycle}`,
        });
    } else if (args.status === 2) {
        alerts.push({
            type: "success",
            title: `🎉 ${t("dash.status.completed")}`,
        });
    }

    return alerts;
}

function buildActions(args: { status: number; vaquitaAddress: Address; members: readonly Address[]; totalMembers: number; t: TFn }) {
    const { t } = args;
    const base = [
        {
            icon: "💬",
            label: t("dash.actions.whatsapp"),
            href: "https://wa.me/14155238886?text=mis%20vaquitas",
        },
        {
            icon: "🔗",
            label: t("dash.actions.onchain"),
            href: `https://sepolia.arbiscan.io/address/${args.vaquitaAddress}`,
        },
    ];

    if (args.status === 0) {
        return [
            {
                icon: "👥",
                label: t("dash.actions.invite"),
                href: "https://wa.me/14155238886?text=invitar",
                primary: true,
            },
            ...(args.members.length === args.totalMembers
                ? [{ icon: "🚀", label: t("dash.actions.start"), href: "https://wa.me/14155238886?text=arrancar", primary: true }]
                : []),
            ...base,
        ];
    } else if (args.status === 1) {
        return [
            {
                icon: "📊",
                label: t("dash.actions.pending"),
                href: "https://wa.me/14155238886?text=pendientes",
                primary: true,
            },
            ...base,
        ];
    }

    return base;
}

function buildMockActivity(args: { members: readonly Address[]; status: number }) {
    const now = Date.now();
    const activities: Array<{ id: string; type: "joined" | "contributed" | "received" | "started" | "completed"; actor: string; timestamp: Date; amount?: string; txHash?: string }> = [];

    if (args.status >= 1) {
        activities.push({
            id: "started",
            type: "started",
            actor: "El organizador",
            timestamp: new Date(now - 3 * 86400000),
        });
    }

    args.members.forEach((_, i) => {
        activities.push({
            id: `joined-${i}`,
            type: "joined",
            actor: `Miembro ${i + 1}`,
            timestamp: new Date(now - (args.members.length - i) * 3600000),
        });
    });

    if (args.status === 2) {
        activities.push({
            id: "completed",
            type: "completed",
            actor: "La vaquita",
            timestamp: new Date(now - 86400000),
        });
    }

    return activities.reverse().slice(0, 8);
}
