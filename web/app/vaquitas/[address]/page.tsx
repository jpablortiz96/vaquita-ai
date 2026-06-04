"use client";

import { Header } from "@/components/header";
import { useReadContracts } from "wagmi";
import { vaquitaAbi, STATUS_LABELS } from "@/lib/contracts";
import { formatMXNB, shortAddress } from "@/lib/format";
import { RiskScoreGauge } from "@/components/risk-score-gauge";
import type { Address } from "viem";
import { use } from "react";

export default function VaquitaDetailPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = use(params);
    const vaquitaAddr = address as Address;

    const { data } = useReadContracts({
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

    if (!data) {
        return (
            <>
                <Header />
                <main style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}>Cargando vaquita...</main>
            </>
        );
    }

    const contribution = data[0]?.result as bigint | undefined;
    const collateral = data[1]?.result as bigint | undefined;
    const totalMembersRaw = data[2]?.result as number | undefined;
    const cycleDuration = data[3]?.result as bigint | undefined;
    const status = (data[4]?.result as number | undefined) ?? 0;
    const members = (data[5]?.result as readonly Address[] | undefined) ?? [];
    const currentCycle = data[6]?.result as number | undefined;

    if (contribution === undefined || collateral === undefined || totalMembersRaw === undefined || cycleDuration === undefined) {
        return (
            <>
                <Header />
                <main style={{ textAlign: "center", padding: 60 }}>
                    <h2>Vaquita no encontrada</h2>
                </main>
            </>
        );
    }

    const totalMembers = BigInt(totalMembersRaw);
    const cycleDays = Number(cycleDuration) / 86400;
    const pool = contribution * totalMembers;

    return (
        <>
            <Header />
            <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
                <a href="/vaquitas" style={{ color: "var(--text-dim)", fontSize: 14 }}>
                    ← Mis vaquitas
                </a>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>
                    🐄 Vaquita
                </h1>
                <code style={{ color: "var(--text-dim)", fontSize: 14 }}>{vaquitaAddr}</code>

                <div className="glass" style={{ padding: 24, marginTop: 24 }}>
                    <span
                        style={{
                            display: "inline-block",
                            background: status === 1 ? "rgba(0,212,170,0.2)" : "rgba(245,158,11,0.2)",
                            color: status === 1 ? "var(--primary)" : "#f59e0b",
                            padding: "4px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 16,
                        }}
                    >
                        {STATUS_LABELS[status]}
                    </span>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20 }}>
                        <Metric label="Aporte por ciclo" value={`${formatMXNB(contribution)} MXNB`} />
                        <Metric label="Colateral" value={`${formatMXNB(collateral)} MXNB`} />
                        <Metric label="Ciclo" value={`${cycleDays} días`} />
                        <Metric label="Pool total" value={`${formatMXNB(pool)} MXNB`} />
                        <Metric label="Miembros" value={`${members.length}/${Number(totalMembers)}`} />
                        <Metric label="Ciclo actual" value={`${currentCycle?.toString() ?? "0"}`} />
                    </div>
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 36, marginBottom: 16 }}>
                    Miembros
                </h2>
                <div style={{ display: "grid", gap: 12 }}>
                    {members.map((m, i) => (
                        <MemberRow key={`${m}-${i}`} address={m} position={i + 1} />
                    ))}
                </div>

                <div style={{ marginTop: 36, padding: 20, textAlign: "center" }} className="glass">
                    <span style={{ color: "var(--text-dim)", fontSize: 13 }}>Ver en blockchain:</span>
                    <br />
                    <a
                        href={`https://sepolia.arbiscan.io/address/${vaquitaAddr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 14 }}
                    >
                        sepolia.arbiscan.io/address/{shortAddress(vaquitaAddr)} ↗
                    </a>
                </div>
            </main>
        </>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
        </div>
    );
}

function MemberRow({ address, position }: { address: Address; position: number }) {
    // Demo: assign a pseudo-random score for display purposes.
    // In V2 this would come from the agent's API.
    const pseudoScore = (parseInt(address.slice(-2), 16) % 60) + 30;

    return (
        <div className="glass" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "var(--primary)",
                    flexShrink: 0,
                }}
            >
                #{position}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <code style={{ fontSize: 13, color: "var(--text-dim)" }}>{shortAddress(address)}</code>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Miembro</div>
            </div>
            <RiskScoreGauge score={pseudoScore} size={64} label="" />
        </div>
    );
}
