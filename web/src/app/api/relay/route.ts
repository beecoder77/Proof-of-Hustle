import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  maxUint256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACTS, monadTestnet } from "@/config/contracts";

// Initialize Monad RPC & Relayer Account
function getRelayerClient() {
  const rawKey = process.env.PRIVATE_KEY;
  if (!rawKey) {
    throw new Error("PRIVATE_KEY not configured in environment.");
  }
  const formattedKey = (
    rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`
  ) as `0x${string}`;

  const account = privateKeyToAccount(formattedKey);
  const rpcUrl =
    process.env.MONAD_RPC_URL ||
    process.env.NEXT_PUBLIC_MONAD_RPC_URL ||
    "https://testnet-rpc.monad.xyz";

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(rpcUrl),
  });

  return { account, publicClient, walletClient };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, params } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Missing 'action' parameter." },
        { status: 400 }
      );
    }

    const { account, publicClient, walletClient } = getRelayerClient();

    let txHash: `0x${string}`;

    switch (action) {
      case "registerHandle": {
        const { user, handle, bio } = params || {};
        if (!handle) {
          return NextResponse.json(
            { success: false, error: "Missing handle" },
            { status: 400 }
          );
        }

        const targetUser = user || account.address;
        const cleanBio = bio || "Monad Native ProofOfHustle Builder";

        if (targetUser.toLowerCase() === account.address.toLowerCase()) {
          txHash = await walletClient.writeContract({
            address: CONTRACTS.profileRegistry.address,
            abi: CONTRACTS.profileRegistry.abi,
            functionName: "registerHandle",
            args: [handle, cleanBio],
          });
        } else {
          // Gas-sponsored registration by owner for user
          txHash = await walletClient.writeContract({
            address: CONTRACTS.profileRegistry.address,
            abi: CONTRACTS.profileRegistry.abi,
            functionName: "registerHandleFor",
            args: [targetUser, handle, cleanBio],
          });
        }
        break;
      }

      case "stakeHype": {
        const { gigId, amount } = params || {};
        if (!gigId) {
          return NextResponse.json(
            { success: false, error: "Missing gigId" },
            { status: 400 }
          );
        }

        const stakeAmount = amount
          ? BigInt(amount)
          : parseUnits("100", 18); // 100 $HUSTLE default

        // 1. Check & Approve $HUSTLE allowance to gigEscrow
        const allowance = (await publicClient.readContract({
          address: CONTRACTS.hustleToken.address,
          abi: CONTRACTS.hustleToken.abi,
          functionName: "allowance",
          args: [account.address, CONTRACTS.gigEscrow.address],
        })) as bigint;

        if (allowance < stakeAmount) {
          const approveTx = await walletClient.writeContract({
            address: CONTRACTS.hustleToken.address,
            abi: CONTRACTS.hustleToken.abi,
            functionName: "approve",
            args: [CONTRACTS.gigEscrow.address, maxUint256],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }

        // 2. Call stakeHype on GigEscrow
        txHash = await walletClient.writeContract({
          address: CONTRACTS.gigEscrow.address,
          abi: CONTRACTS.gigEscrow.abi,
          functionName: "stakeHype",
          args: [BigInt(gigId), stakeAmount],
        });
        break;
      }

      case "claimTask": {
        const { gigId } = params || {};
        if (!gigId) {
          return NextResponse.json(
            { success: false, error: "Missing gigId" },
            { status: 400 }
          );
        }

        txHash = await walletClient.writeContract({
          address: CONTRACTS.gigEscrow.address,
          abi: CONTRACTS.gigEscrow.abi,
          functionName: "claimTask",
          args: [BigInt(gigId)],
        });
        break;
      }

      case "submitWork": {
        const { gigId, deliverableUri, isSealed, commitHash } = params || {};
        if (!gigId) {
          return NextResponse.json(
            { success: false, error: "Missing gigId" },
            { status: 400 }
          );
        }

        const uri = deliverableUri || "ipfs://bafybeicraftsmanproofsubmission";
        const sealed = !!isSealed;
        const hash =
          (commitHash && commitHash.startsWith("0x") && commitHash.length === 66
            ? commitHash
            : "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`;

        txHash = await walletClient.writeContract({
          address: CONTRACTS.gigEscrow.address,
          abi: CONTRACTS.gigEscrow.abi,
          functionName: "submitWork",
          args: [BigInt(gigId), uri, sealed, hash],
        });
        break;
      }

      case "approvePayout": {
        const { gigId, winningSubmission, rating } = params || {};
        if (!gigId) {
          return NextResponse.json(
            { success: false, error: "Missing gigId" },
            { status: 400 }
          );
        }

        txHash = await walletClient.writeContract({
          address: CONTRACTS.gigEscrow.address,
          abi: CONTRACTS.gigEscrow.abi,
          functionName: "releasePayout",
          args: [
            BigInt(gigId),
            BigInt(winningSubmission || 1),
            Number(rating || 5),
          ],
        });
        break;
      }

      case "faucetUsdt": {
        const { to, amount } = params || {};
        const recipient = (to || account.address) as `0x${string}`;
        const mintAmount = amount
          ? BigInt(amount)
          : parseUnits("1000", 18); // 1,000 USDT

        txHash = await walletClient.writeContract({
          address: CONTRACTS.mockUsdt.address,
          abi: CONTRACTS.mockUsdt.abi,
          functionName: "mint",
          args: [recipient, mintAmount],
        });
        break;
      }

      case "faucetHustle": {
        const { to, amount } = params || {};
        const recipient = (to || account.address) as `0x${string}`;
        const transferAmount = amount
          ? BigInt(amount)
          : parseUnits("500", 18); // 500 $HUSTLE

        txHash = await walletClient.writeContract({
          address: CONTRACTS.hustleToken.address,
          abi: CONTRACTS.hustleToken.abi,
          functionName: "transfer",
          args: [recipient, transferAmount],
        });
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Wait for transaction receipt with sub-second Monad finality
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    return NextResponse.json({
      success: true,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      explorerUrl: `https://testnet.monadscan.com/tx/${txHash}`,
    });
  } catch (error: any) {
    console.error("Relayer execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.shortMessage || error?.message || "Internal relay error",
      },
      { status: 500 }
    );
  }
}
