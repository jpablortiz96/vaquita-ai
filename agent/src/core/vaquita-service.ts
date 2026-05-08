import { type Address, parseUnits, formatUnits, getContract } from "viem";
import { publicClient, walletClient, deployerAddress } from "../chain/client.js";
import { vaquitaAbi, vaquitaFactoryAbi, mockMXNBAbi } from "../chain/abis.js";
import { deployments } from "../config/deployments.js";
import { VaquitaStatus, type VaquitaState } from "../types/index.js";

const TOKEN_DECIMALS = deployments.contracts.MockMXNB.decimals;

/** Read-only utilities */
export const readService = {
    async getTokenBalance(holder: Address): Promise<bigint> {
        return publicClient.readContract({
            address: deployments.contracts.MockMXNB.address as Address,
            abi: mockMXNBAbi,
            functionName: "balanceOf",
            args: [holder],
        });
    },

    formatTokenAmount(amount: bigint): string {
        return formatUnits(amount, TOKEN_DECIMALS);
    },

    parseTokenAmount(human: string): bigint {
        return parseUnits(human, TOKEN_DECIMALS);
    },

    async getFactoryTotalVaquitas(): Promise<bigint> {
        return publicClient.readContract({
            address: deployments.contracts.VaquitaFactory.address as Address,
            abi: vaquitaFactoryAbi,
            functionName: "totalVaquitas",
        });
    },

    async getVaquitaState(address: Address): Promise<VaquitaState> {
        const contract = getContract({
            address,
            abi: vaquitaAbi,
            client: publicClient,
        });

        const [statusRaw, creator, contribution, collateral, total, cycle, currentCycle, members, recipient, deadline] =
            await Promise.all([
                contract.read.status(),
                contract.read.creator(),
                contract.read.contributionAmount(),
                contract.read.collateralAmount(),
                contract.read.totalMembers(),
                contract.read.cycleDuration(),
                contract.read.currentCycle(),
                contract.read.getMembers(),
                contract.read.getCurrentRecipient(),
                contract.read.getCycleDeadline(),
            ]);

        return {
            address,
            status: statusRaw as VaquitaStatus,
            creator: creator as Address,
            config: {
                contributionAmount: contribution as bigint,
                collateralAmount: collateral as bigint,
                totalMembers: Number(total),
                cycleDuration: cycle as bigint,
            },
            members: [...(members as readonly Address[])],
            currentCycle: Number(currentCycle),
            currentRecipient:
                (recipient as Address) === "0x0000000000000000000000000000000000000000"
                    ? null
                    : (recipient as Address),
            cycleDeadline: deadline as bigint,
        };
    },
};

/** Write utilities — requires the deployer signer (will be replaced per-user in Step 5) */
export const writeService = {
    async createVaquita(args: {
        contributionHuman: string;
        collateralHuman: string;
        totalMembers: number;
        cycleDurationSec: number;
    }): Promise<Address> {
        const hash = await walletClient.writeContract({
            address: deployments.contracts.VaquitaFactory.address as Address,
            abi: vaquitaFactoryAbi,
            functionName: "createVaquita",
            args: [
                deployments.contracts.MockMXNB.address as Address,
                readService.parseTokenAmount(args.contributionHuman),
                readService.parseTokenAmount(args.collateralHuman),
                args.totalMembers,
                BigInt(args.cycleDurationSec),
            ],
        });

        // Wait for the receipt and extract the new vaquita address from the event log.
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const log = receipt.logs.find(
            (l) =>
                l.address.toLowerCase() === deployments.contracts.VaquitaFactory.address.toLowerCase() &&
                l.topics.length >= 2,
        );
        if (!log || !log.topics[1]) {
            throw new Error("Failed to extract vaquita address from receipt");
        }
        // topic[1] is the indexed `vaquita` address, padded to 32 bytes.
        return (`0x${log.topics[1].slice(-40)}`) as Address;
    },

    async setPayoutOrder(vaquita: Address, order: Address[]): Promise<`0x${string}`> {
        return walletClient.writeContract({
            address: vaquita,
            abi: vaquitaAbi,
            functionName: "setPayoutOrder",
            args: [order],
        });
    },

    async startVaquita(vaquita: Address): Promise<`0x${string}`> {
        return walletClient.writeContract({
            address: vaquita,
            abi: vaquitaAbi,
            functionName: "start",
        });
    },

    async executeCycle(vaquita: Address): Promise<`0x${string}`> {
        return walletClient.writeContract({
            address: vaquita,
            abi: vaquitaAbi,
            functionName: "executeCycle",
        });
    },
};

export const SIGNER_ADDRESS = deployerAddress;
