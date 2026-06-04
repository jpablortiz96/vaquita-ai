export const CONTRACTS = {
    MockMXNB: "0xBA717164E68625e5e9E9C5Cd380c38ecFACf481c" as const,
    VaquitaImplementation: "0xdf0Da6E12A77a90bbb4cEF1ef448FFAFf1352717" as const,
    VaquitaFactory: "0xfFa51C1A2c2BDCA722045CB637D1b36E1bE6892E" as const,
} as const;

/**
 * In V1 the bot's deployer wallet signs every on-chain action (creates all
 * vaquitas on behalf of WhatsApp users). The web app reads vaquitas from this
 * signer so the demo shows the real on-chain data. V2 = per-user Privy wallets.
 */
export const SIGNER_ADDRESS = "0x8f60C29a7BAC9E16aeBa053e509d7C5FDff8a377" as const;

export const vaquitaAbi = [
    {
        type: "function",
        name: "config",
        stateMutability: "view",
        inputs: [],
        outputs: [
            { name: "contributionAmount", type: "uint256" },
            { name: "collateralAmount", type: "uint256" },
            { name: "totalMembers", type: "uint256" },
            { name: "cycleDuration", type: "uint256" },
            { name: "token", type: "address" },
            { name: "creator", type: "address" },
        ],
    },
    {
        type: "function",
        name: "status",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
    },
    {
        type: "function",
        name: "getMembers",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "address[]" }],
    },
    {
        type: "function",
        name: "currentCycle",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
] as const;

export const factoryAbi = [
    {
        type: "function",
        name: "getVaquitasByCreator",
        stateMutability: "view",
        inputs: [{ name: "creator", type: "address" }],
        outputs: [{ name: "", type: "address[]" }],
    },
    {
        type: "function",
        name: "totalVaquitas",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
] as const;

export const erc20Abi = [
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        type: "function",
        name: "symbol",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
    },
    {
        type: "function",
        name: "decimals",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
    },
] as const;

export const STATUS_LABELS = ["Creada", "Activa", "Completada", "Cancelada"] as const;
