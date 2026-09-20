import { CONTRACTS } from "../config/contracts";

export interface OnchainProfile {
  handle: string;
  bio: string;
  avatarUri: string;
  registeredAt: number;
  updatedAt: number;
}

export interface RelayResponse {
  success: boolean;
  txHash?: `0x${string}`;
  blockNumber?: string;
  gasUsed?: string;
  status?: string;
  explorerUrl?: string;
  error?: string;
}

const RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

/**
 * Fetch profile directly from HustlerProfileRegistry on Monad Testnet
 */
export async function fetchProfileOnchain(
  userAddress: string
): Promise<OnchainProfile | null> {
  if (!userAddress || !userAddress.startsWith("0x")) return null;

  try {
    // getProfile(address) selector: 0x98150493
    // user address padded to 32 bytes
    const cleanAddr = userAddress.slice(2).padStart(64, "0");
    const callData = `0x98150493${cleanAddr}`;

    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: CONTRACTS.profileRegistry.address,
            data: callData,
          },
          "latest",
        ],
        id: 101,
      }),
    });

    const json = await res.json();
    if (!json.result || json.result === "0x") return null;

    // Decode ABI returned tuple (string, string, string, uint40, uint40)
    // We can use a lightweight decode or fetch via ABI helper
    const raw = json.result.slice(2);
    if (raw.length < 320) return null; // Minimum tuple length with offsets

    // Offset of handle string is in word 0
    const handleOffset = parseInt(raw.slice(0, 64), 16) * 2;
    const handleLen = parseInt(raw.slice(handleOffset, handleOffset + 64), 16) * 2;
    const handleHex = raw.slice(handleOffset + 64, handleOffset + 64 + handleLen);
    const handle = hexToString(handleHex);

    // If handle is empty string, user is not registered
    if (!handle || handle.trim() === "") return null;

    // Offset of bio string is in word 1
    const bioOffset = parseInt(raw.slice(64, 128), 16) * 2;
    const bioLen = parseInt(raw.slice(bioOffset, bioOffset + 64), 16) * 2;
    const bioHex = raw.slice(bioOffset + 64, bioOffset + 64 + bioLen);
    const bio = hexToString(bioHex);

    // Offset of avatar string is in word 2
    const avatarOffset = parseInt(raw.slice(128, 192), 16) * 2;
    const avatarLen = parseInt(raw.slice(avatarOffset, avatarOffset + 64), 16) * 2;
    const avatarHex = raw.slice(avatarOffset + 64, avatarOffset + 64 + avatarLen);
    const avatarUri = hexToString(avatarHex);

    // registeredAt is in word 3
    const registeredAt = parseInt(raw.slice(192, 256), 16);
    // updatedAt is in word 4
    const updatedAt = parseInt(raw.slice(256, 320), 16);

    return {
      handle,
      bio,
      avatarUri,
      registeredAt,
      updatedAt,
    };
  } catch (err) {
    console.error("fetchProfileOnchain error:", err);
    return null;
  }
}

/**
 * Register onchain handle and bio on Monad Testnet
 */
export async function registerHandleOnchain(
  userAddress: string,
  handle: string,
  bio?: string
): Promise<RelayResponse> {
  return callRelayApi("registerHandle", {
    user: userAddress,
    handle,
    bio: bio || "Monad Native ProofOfHustle Builder",
  });
}

/**
 * Stake attention futures ($HUSTLE) on Monad Testnet
 */
export async function stakeHypeOnchain(
  gigId: string,
  amount?: string
): Promise<RelayResponse> {
  return callRelayApi("stakeHype", { gigId, amount });
}

/**
 * Claim FCFS task on Monad Testnet
 */
export async function claimTaskOnchain(gigId: string): Promise<RelayResponse> {
  return callRelayApi("claimTask", { gigId });
}

/**
 * Submit work deliverable with authentic commit hash on Monad Testnet
 */
export async function submitWorkOnchain(
  gigId: string,
  deliverableUri: string,
  isSealed: boolean,
  commitHash?: string
): Promise<RelayResponse> {
  return callRelayApi("submitWork", {
    gigId,
    deliverableUri,
    isSealed,
    commitHash,
  });
}

/**
 * Approve payout and release escrow on Monad Testnet
 */
export async function approvePayoutOnchain(
  gigId: string,
  winningSubmission?: number,
  rating?: number
): Promise<RelayResponse> {
  return callRelayApi("approvePayout", {
    gigId,
    winningSubmission: winningSubmission || 1,
    rating: rating || 5,
  });
}

/**
 * Claim 1,000 Mock USDT testnet faucet onchain
 */
export async function claimUsdtFaucetOnchain(
  toAddress: string
): Promise<RelayResponse> {
  return callRelayApi("faucetUsdt", { to: toAddress });
}

/**
 * Claim 500 $HUSTLE community airdrop onchain
 */
export async function claimHustleAirdropOnchain(
  toAddress: string
): Promise<RelayResponse> {
  return callRelayApi("faucetHustle", { to: toAddress });
}

/**
 * Post a new gig with escrow locked on Monad Testnet
 */
export async function createGigOnchain(
  rewardAmount: string,
  gigType: string,
  isSealed: boolean
): Promise<RelayResponse> {
  return callRelayApi("createGig", {
    rewardAmount,
    gigType,
    isSealed,
  });
}

/**
 * Fetch total $HUSTLE burned directly from ProtocolBurnPool onchain
 */
export async function fetchTotalBurnedOnchain(): Promise<number> {
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          {
            to: CONTRACTS.protocolBurnPool.address,
            data: "0x07163038", // totalHustleBurned()
          },
          "latest",
        ],
        id: 102,
      }),
    });
    const json = await res.json();
    if (json.result && json.result !== "0x") {
      const wei = BigInt(json.result);
      return Number(wei / BigInt(10 ** 18));
    }
  } catch (err) {
    console.warn("fetchTotalBurnedOnchain failed:", err);
  }
  return 0;
}

/**
 * Execute permissionless burn of $HUSTLE onchain
 */
export async function burnHustleOnchain(amount?: string): Promise<RelayResponse> {
  return callRelayApi("burnHustle", { amount });
}

async function callRelayApi(action: string, params: any): Promise<RelayResponse> {
  try {
    const res = await fetch("/api/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, params }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`callRelayApi failed for action ${action}:`, err);
    return {
      success: false,
      error: err.message || "Network request failed",
    };
  }
}

function hexToString(hex: string): string {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.slice(i, i + 2), 16);
    if (code !== 0) {
      str += String.fromCharCode(code);
    }
  }
  return str;
}
