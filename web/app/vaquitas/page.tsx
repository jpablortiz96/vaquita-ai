"use client";

import { Header } from "@/components/header";
import { VaquitaCard } from "@/components/vaquita-card";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContract, useReadContracts } from "wagmi";
import { CONTRACTS, SIGNER_ADDRESS, factoryAbi, vaquitaAbi } from "@/lib/contracts";
import type { Address } from "viem";

export default function VaquitasPage() {
    const { ready, authenticated, login } = usePrivy();

    // V1: all vaquitas are created on-chain by the bot's deployer signer (it acts
    // on behalf of WhatsApp users). We read the signer's vaquitas so the logged-in
    // user sees the real on-chain data. V2 = filter by the user's own Privy wallet.
    const { data: vaquitaAddresses } = useReadContract({
        address: CONTRACTS.VaquitaFactory,
        abi: factoryAbi,
        functionName: "getVaquitasByCreator",
        args: [SIGNER_ADDRESS as Address],
        query: { enabled: authenticated },
    });

    const list = (vaquitaAddresses as Address[] | undefined) ?? [];

    const CALLS_PER_VAQUITA = 5;
    const { data: statesData } = useReadContracts({
        contracts: list.flatMap((addr) => [
            { address: addr, abi: vaquitaAbi, functionName: "contributionAmount" as const },
            { address: addr, abi: vaquitaAbi, functionName: "totalMembers" as const },
            { address: addr, abi: vaquitaAbi, functionName: "cycleDuration" as const },
            { address: addr, abi: vaquitaAbi, functionName: "status" as const },
            { address: addr, abi: vaquitaAbi, functionName: "getMembers" as const },
        ]),
        query: { enabled: list.length > 0 },
    });

    if (!ready) return <Loading />;

    if (!authenticated) {
        return (
            <>
                <Header />
                <Empty title="Conecta tu cuenta">
                    <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>
                        Inicia sesión para ver y crear tus vaquitas.
                    </p>
                    <button className="btn-primary" onClick={() => login()}>
                        Conectar
                    </button>
                </Empty>
            </>
        );
    }

    return (
        <>
            <Header />
            <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>
                    Tus <span className="gradient-text">vaquitas</span>
                </h1>

                {list.length === 0 ? (
                    <Empty title="Aún no tienes vaquitas">
                        <p style={{ color: "var(--text-dim)", marginBottom: 16 }}>
                            Crea una desde WhatsApp escribiendo &ldquo;hacer una vaquita&rdquo;.
                        </p>
                        <a className="btn-primary" href="https://wa.me/14155238886?text=hacer+una+vaquita" target="_blank">
                            Abrir WhatsApp
                        </a>
                    </Empty>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {list.map((addr, i) => {
                            const base = i * CALLS_PER_VAQUITA;
                            const contribution = statesData?.[base]?.result as bigint | undefined;
                            const totalMembers = statesData?.[base + 1]?.result as number | undefined;
                            const cycleDuration = statesData?.[base + 2]?.result as bigint | undefined;
                            const status = (statesData?.[base + 3]?.result as number | undefined) ?? 0;
                            const members = (statesData?.[base + 4]?.result as readonly Address[] | undefined) ?? [];

                            if (contribution === undefined || totalMembers === undefined || cycleDuration === undefined) {
                                return <SkeletonCard key={addr} />;
                            }
                            return (
                                <VaquitaCard
                                    key={addr}
                                    address={addr}
                                    contributionAmount={contribution}
                                    totalMembers={Number(totalMembers)}
                                    currentMembers={members.length}
                                    status={status}
                                    cycleDays={Number(cycleDuration) / 86400}
                                />
                            );
                        })}
                    </div>
                )}
            </main>
        </>
    );
}

function Loading() {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "var(--text-dim)" }}>
            Cargando...
        </div>
    );
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <main style={{ maxWidth: 600, margin: "60px auto 0", textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🐄</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
            {children}
        </main>
    );
}

function SkeletonCard() {
    return (
        <div className="glass" style={{ height: 140, opacity: 0.5 }}>
            <div style={{ padding: 20, color: "var(--text-dim)" }}>Cargando vaquita...</div>
        </div>
    );
}
