import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Path to the deployments JSON committed at the repo root.
 * agent/src/config/deployments.ts → ../../../deployments/arbitrum-sepolia.json
 */
const DEPLOYMENTS_PATH = join(__dirname, "../../../deployments/arbitrum-sepolia.json");

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address");

const deploymentSchema = z.object({
    network: z.string(),
    chainId: z.number(),
    deployer: addressSchema,
    deployedAt: z.string().optional(),
    contracts: z.object({
        MockMXNB: z.object({
            address: addressSchema,
            decimals: z.number(),
            symbol: z.string(),
            explorerUrl: z.string().url(),
        }),
        VaquitaImplementation: z.object({
            address: addressSchema,
            explorerUrl: z.string().url(),
        }),
        VaquitaFactory: z.object({
            address: addressSchema,
            explorerUrl: z.string().url(),
        }),
    }),
    demoVaquita: z
        .object({
            address: addressSchema,
            creator: addressSchema,
            explorerUrl: z.string().url(),
        })
        .passthrough()
        .optional(),
});

export type Deployment = z.infer<typeof deploymentSchema>;

let cached: Deployment | null = null;

export function loadDeployments(): Deployment {
    if (cached) return cached;
    const raw = readFileSync(DEPLOYMENTS_PATH, "utf-8");
    const parsed = deploymentSchema.parse(JSON.parse(raw));
    cached = parsed;
    return parsed;
}

export const deployments = loadDeployments();
