import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Providers } from "@/lib/privy-config";

export const metadata: Metadata = {
    title: "VaquitaAI — Vaquitas onchain con IA",
    description: "Ahorros rotativos digitales para LATAM. Pesos digitales, sin papeles, con IA evaluando confianza.",
    manifest: "/manifest.json",
    icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#0a0a0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
