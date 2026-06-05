"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arbitrumSepolia } from "viem/chains";
import { http } from "wagmi";
import type { ReactNode } from "react";
import { I18nProvider } from "./i18n/context";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
    chains: [arbitrumSepolia],
    transports: { [arbitrumSepolia.id]: http() },
});

export function Providers({ children }: { children: ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    if (!appId) {
        return (
            <div style={{ padding: 24, color: "#ef4444" }}>
                <strong>Privy not configured.</strong> Set NEXT_PUBLIC_PRIVY_APP_ID in web/.env.local
            </div>
        );
    }
    return (
        <I18nProvider>
            <PrivyProvider
                appId={appId}
                config={{
                    loginMethods: ["email", "google", "twitter"],
                    appearance: {
                        theme: "dark",
                        accentColor: "#00d4aa",
                    },
                    embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
                    defaultChain: arbitrumSepolia,
                    supportedChains: [arbitrumSepolia],
                }}
            >
                <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
                </QueryClientProvider>
            </PrivyProvider>
        </I18nProvider>
    );
}
