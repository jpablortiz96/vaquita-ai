import { formatUnits } from "viem";

export function formatMXNB(amount: bigint | undefined, decimals = 6): string {
    if (amount === undefined || amount === null) return "0";
    const human = formatUnits(amount, decimals);
    const num = parseFloat(human);
    return num.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

export function shortAddress(addr: string | undefined): string {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatDate(date: Date | number): string {
    const d = typeof date === "number" ? new Date(date) : date;
    return d.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function scoreColor(score: number): string {
    if (score >= 70) return "#00d4aa"; // turquesa
    if (score >= 40) return "#f59e0b"; // amber
    return "#ef4444"; // red
}

export function scoreLabel(score: number): string {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bueno";
    if (score >= 40) return "Aceptable";
    if (score >= 20) return "Bajo";
    return "Riesgo";
}
