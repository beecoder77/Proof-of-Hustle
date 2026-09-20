import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  parseUnits,
  keccak256,
  toHex,
  formatUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as fs from "fs";
import * as path from "path";
import { CONTRACTS, monadTestnet } from "../src/config/contracts";

// Helper to load private key from env files
function getDeployerKey(): `0x${string}` {
  if (process.env.PRIVATE_KEY) {
    const k = process.env.PRIVATE_KEY;
    return (k.startsWith("0x") ? k : `0x${k}`) as `0x${string}`;
  }

  const envPaths = [
    path.join(__dirname, "../.env"),
    path.join(__dirname, "../.env.local"),
    path.join(__dirname, "../../contracts/.env"),
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf8");
      const match = content.match(/PRIVATE_KEY=["']?(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})["']?/);
      if (match) {
        const k = match[1];
        return (k.startsWith("0x") ? k : `0x${k}`) as `0x${string}`;
      }
    }
  }

  throw new Error("PRIVATE_KEY not found in environment or .env files.");
}

async function main() {
  console.log("==================================================================");
  console.log("🚀 STARTING 100% REAL ONCHAIN SEEDING ON MONAD TESTNET (CHAIN 10143)");
  console.log("==================================================================");

  const deployerKey = getDeployerKey();
  const deployerAccount = privateKeyToAccount(deployerKey);
  const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(rpcUrl),
  });

  const deployerWallet = createWalletClient({
    account: deployerAccount,
    chain: monadTestnet,
    transport: http(rpcUrl),
  });

  const deployerBalance = await publicClient.getBalance({ address: deployerAccount.address });
  console.log(`Deployer Address: ${deployerAccount.address}`);
  console.log(`Deployer Balance: ${formatUnits(deployerBalance, 18)} MON`);

  if (deployerBalance < parseEther("0.5")) {
    throw new Error("Insufficient MON balance for seeding. At least 0.5 MON required.");
  }

  // Define the 7 Builder Personas with deterministic private keys derived from a local seed salt
  const PERSONA_CONFIGS = [
    {
      seedSalt: "poh_persona_1_nad_architect",
      handle: "nad_architect",
      bio: "Solidity Core Dev & Monad Parallel EVM Builder",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      skills: ["Parallel EVM", "Foundry", "Gas Tuning"],
    },
    {
      seedSalt: "poh_persona_2_monad_vanguard",
      handle: "monad_vanguard",
      bio: "TypeScript & High-Speed RPC Transport Engineer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
      skills: ["TypeScript", "Viem", "Alchemy Transport"],
    },
    {
      seedSalt: "poh_persona_3_keccak_cipher",
      handle: "keccak_cipher",
      bio: "Cryptography Specialist & MERA PRF Implementer",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
      skills: ["WebCrypto", "Mera PRF", "Zero-Knowledge"],
    },
    {
      seedSalt: "poh_persona_4_solidity_samurai",
      handle: "solidity_samurai",
      bio: "Smart Contract Auditor & Gas Optimization Engineer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
      skills: ["Solidity", "Reentrancy Guard", "ERC-5192"],
    },
    {
      seedSalt: "poh_persona_5_monad_memelord",
      handle: "monad_memelord",
      bio: "Culture, 3D Animations & Creative Content Creator",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
      skills: ["Motion Graphics", "3D Blender", "Culture"],
    },
    {
      seedSalt: "poh_persona_6_evm_auditor",
      handle: "evm_auditor",
      bio: "Formal Verification & Protocol Dispute Juror 1",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
      skills: ["Auditing", "Formal Verification", "Arbitration"],
      isJuror: true,
    },
    {
      seedSalt: "poh_persona_7_parallel_hustler",
      handle: "parallel_hustler",
      bio: "Foundry Benchmark & Protocol Dispute Juror 2",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
      skills: ["Parallel EVM", "Benchmarking", "Arbitration"],
      isJuror: true,
    },
  ];

  const personas = PERSONA_CONFIGS.map((cfg) => {
    // Deterministic key generation per persona
    const privKey = keccak256(toHex(`antigravity_poh_seed_${cfg.seedSalt}_monad_10143`));
    const account = privateKeyToAccount(privKey);
    const wallet = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(rpcUrl),
    });
    return {
      ...cfg,
      privKey,
      account,
      wallet,
      address: account.address,
    };
  });

  const outputReceipts: any = {
    generatedAt: new Date().toISOString(),
    chainId: 10143,
    network: "Monad Testnet",
    contracts: {
      gigEscrow: CONTRACTS.gigEscrow.address,
      hustleToken: CONTRACTS.hustleToken.address,
      proofOfHustleSBT: CONTRACTS.proofOfHustleSBT.address,
      protocolBurnPool: CONTRACTS.protocolBurnPool.address,
      mockUsdt: CONTRACTS.mockUsdt.address,
      profileRegistry: CONTRACTS.profileRegistry.address,
    },
    personas: [],
    fundedTransactions: [],
    profileRegistrations: [],
    completedGigs: [],
    hypeStakes: [],
    disputes: [],
    protocolBurns: [],
  };

  console.log("\n------------------------------------------------------------------");
  console.log("STEP 1: Distributing Native MON Gas to all 7 Personas...");
  console.log("------------------------------------------------------------------");

  for (const p of personas) {
    const currentBal = await publicClient.getBalance({ address: p.address });
    console.log(`Checking ${p.handle} (${p.address}): current balance = ${formatUnits(currentBal, 18)} MON`);

    if (currentBal < parseEther("0.05")) {
      const fundAmount = parseEther("0.12");
      console.log(`-> Sending 0.12 MON to ${p.handle}...`);
      const txHash = await deployerWallet.sendTransaction({
        to: p.address,
        value: fundAmount,
        gas: 21000n, // Explicit gas limit for native transfer per gas/SKILL.md
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log(`   ✓ Confirmed in Block #${receipt.blockNumber}: ${txHash}`);

      outputReceipts.fundedTransactions.push({
        recipient: p.address,
        handle: p.handle,
        amount: "0.12 MON",
        txHash,
        blockNumber: receipt.blockNumber.toString(),
        explorerUrl: `https://testnet.monadscan.com/tx/${txHash}`,
      });
    }
  }

  console.log("\n------------------------------------------------------------------");
  console.log("STEP 2: Registering Onchain Handles in HustlerProfileRegistry...");
  console.log("------------------------------------------------------------------");

  for (const p of personas) {
    try {
      console.log(`Registering onchain handle @${p.handle} for ${p.address}...`);
      // Deployer registers handle for user via registerHandleFor (authorized by owner)
      const txHash = await deployerWallet.writeContract({
        address: CONTRACTS.profileRegistry.address,
        abi: CONTRACTS.profileRegistry.abi,
        functionName: "registerHandleFor",
        args: [p.address, p.handle, p.bio],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log(`   ✓ Registered @${p.handle} in Block #${receipt.blockNumber}: ${txHash}`);

      outputReceipts.profileRegistrations.push({
        user: p.address,
        handle: `@${p.handle}`,
        bio: p.bio,
        txHash,
        blockNumber: receipt.blockNumber.toString(),
        explorerUrl: `https://testnet.monadscan.com/tx/${txHash}`,
      });
    } catch (err: any) {
      console.log(`   Handle registration note for @${p.handle}: ${err.shortMessage || err.message}`);
    }
  }

  console.log("\n------------------------------------------------------------------");
  console.log("STEP 3: Minting Mock USDT & Transferring $HUSTLE to Personas...");
  console.log("------------------------------------------------------------------");

  // Mint 25,000 Mock USDT to Deployer
  const mintDeployerTx = await deployerWallet.writeContract({
    address: CONTRACTS.mockUsdt.address,
    abi: CONTRACTS.mockUsdt.abi,
    functionName: "mint",
    args: [deployerAccount.address, parseUnits("25000", 18)],
  });
  await publicClient.waitForTransactionReceipt({ hash: mintDeployerTx });
  console.log("✓ Minted 25,000 Mock USDT to deployer.");

  // Approve Escrow for USDT
  const approveEscrowTx = await deployerWallet.writeContract({
    address: CONTRACTS.mockUsdt.address,
    abi: CONTRACTS.mockUsdt.abi,
    functionName: "approve",
    args: [CONTRACTS.gigEscrow.address, parseUnits("100000", 18)],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveEscrowTx });
  console.log("✓ Approved GigEscrow for deployer USDT deposits.");

  // Transfer 1,000 $HUSTLE to each persona for hype staking
  for (const p of personas) {
    const tx = await deployerWallet.writeContract({
      address: CONTRACTS.hustleToken.address,
      abi: CONTRACTS.hustleToken.abi,
      functionName: "transfer",
      args: [p.address, parseUnits("1000", 18)],
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log(`✓ Transferred 1,000 $HUSTLE to ${p.handle}`);

    // Approve GigEscrow from persona wallet for hype staking
    const approveHype = await p.wallet.writeContract({
      address: CONTRACTS.hustleToken.address,
      abi: CONTRACTS.hustleToken.abi,
      functionName: "approve",
      args: [CONTRACTS.gigEscrow.address, parseUnits("10000", 18)],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHype });
  }

  console.log("\n------------------------------------------------------------------");
  console.log("STEP 4: Authorizing Community Dispute Jurors...");
  console.log("------------------------------------------------------------------");

  const juror1 = personas[5]; // @evm_auditor
  const juror2 = personas[6]; // @parallel_hustler

  const setJuror1Tx = await deployerWallet.writeContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "setJuror",
    args: [juror1.address, true],
  });
  await publicClient.waitForTransactionReceipt({ hash: setJuror1Tx });
  console.log(`✓ Authorized Juror 1: ${juror1.handle} (${juror1.address})`);

  const setJuror2Tx = await deployerWallet.writeContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "setJuror",
    args: [juror2.address, true],
  });
  await publicClient.waitForTransactionReceipt({ hash: setJuror2Tx });
  console.log(`✓ Authorized Juror 2: ${juror2.handle} (${juror2.address})`);

  console.log("\n------------------------------------------------------------------");
  console.log("STEP 5: Creating, Claiming, Delivering & Settling Real Gigs (SBT Mints!)...");
  console.log("------------------------------------------------------------------");

  const GIG_SEEDS = [
    {
      title: "Parallel EVM Storage Slot Collision Benchmark Suite",
      reward: "2500",
      worker: personas[0], // @nad_architect
      deliverable: "https://github.com/monad-developers/parallel-benchmark-suite/pull/42",
      rating: 5,
    },
    {
      title: "Alchemy Multi-Transport Failover & Latency Monitor",
      reward: "1200",
      worker: personas[1], // @monad_vanguard
      deliverable: "https://github.com/alchemyplatform/monad-failover-sdk/pull/18",
      rating: 5,
    },
    {
      title: "MERA PRF Biometric Key Derivation Test Suite",
      reward: "1500",
      worker: personas[2], // @keccak_cipher
      deliverable: "https://github.com/mera-security/monad-passkey-prf/pull/7",
      rating: 5,
      isSealed: true,
    },
    {
      title: "Monad Gas Tuning & Cold Storage Benchmark",
      reward: "1000",
      worker: personas[3], // @solidity_samurai
      deliverable: "https://github.com/monad-community/gas-optimization-cheatsheet/pull/12",
      rating: 5,
    },
    {
      title: "Monad 3D Animated Video Meme & Sticker Collection",
      reward: "800",
      worker: personas[4], // @monad_memelord
      deliverable: "https://ipfs.io/ipfs/bafybeianimationpackmonadculture3d",
      rating: 5,
    },
  ];

  for (let i = 0; i < GIG_SEEDS.length; i++) {
    const seed = GIG_SEEDS[i];
    console.log(`\n--- [Gig ${i + 1}/${GIG_SEEDS.length}]: ${seed.title} ---`);

    // 1. Create Gig
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 7 * 86400);
    const amount = parseUnits(seed.reward, 18);
    const createTx = await deployerWallet.writeContract({
      address: CONTRACTS.gigEscrow.address,
      abi: CONTRACTS.gigEscrow.abi,
      functionName: "createGig",
      args: [
        CONTRACTS.mockUsdt.address,
        amount,
        0, // FCFS
        !!seed.isSealed,
        Number(deadline),
        `ipfs://bafybeipoh_${Date.now()}_${i}`,
      ],
    });
    const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createTx });
    const gigCount = (await publicClient.readContract({
      address: CONTRACTS.gigEscrow.address,
      abi: CONTRACTS.gigEscrow.abi,
      functionName: "gigCount",
    })) as bigint;

    console.log(`1. Created Gig #${gigCount} (Tx: ${createTx})`);

    // 2. Curators stake attention futures while gig is OPEN
    const hypingPersona = personas[(i + 1) % personas.length];
    const hypeTx = await hypingPersona.wallet.writeContract({
      address: CONTRACTS.gigEscrow.address,
      abi: CONTRACTS.gigEscrow.abi,
      functionName: "stakeHype",
      args: [gigCount, parseUnits("100", 18)],
    });
    await publicClient.waitForTransactionReceipt({ hash: hypeTx });
    console.log(`2. ${hypingPersona.handle} staked 100 $HUSTLE Attention Futures (Tx: ${hypeTx})`);

    // 3. Worker Claims Task (Status becomes IN_PROGRESS)
    const claimTx = await seed.worker.wallet.writeContract({
      address: CONTRACTS.gigEscrow.address,
      abi: CONTRACTS.gigEscrow.abi,
      functionName: "claimTask",
      args: [gigCount],
    });
    await publicClient.waitForTransactionReceipt({ hash: claimTx });
    console.log(`3. ${seed.worker.handle} claimed Gig #${gigCount} (Tx: ${claimTx})`);

    // 4. Worker Submits Deliverable (Status becomes IN_REVIEW)
    const commitHash = keccak256(toHex(`commit_seed_${seed.title}_${Date.now()}`));
    const submitTx = await seed.worker.wallet.writeContract({
      address: CONTRACTS.gigEscrow.address,
      abi: CONTRACTS.gigEscrow.abi,
      functionName: "submitWork",
      args: [gigCount, seed.deliverable, !!seed.isSealed, commitHash],
    });
    await publicClient.waitForTransactionReceipt({ hash: submitTx });
    console.log(`4. Submitted deliverable (Tx: ${submitTx})`);

    // 5. Creator Releases Payout -> Mints real ERC-5192 SBT!
    const payoutTx = await deployerWallet.writeContract({
      address: CONTRACTS.gigEscrow.address,
      abi: CONTRACTS.gigEscrow.abi,
      functionName: "releasePayout",
      args: [gigCount, 1n, seed.rating],
    });
    const payoutReceipt = await publicClient.waitForTransactionReceipt({ hash: payoutTx });
    console.log(`5. Settled & Released! Real ERC-5192 SBT Minted! (Tx: ${payoutTx})`);

    // Fetch Worker's minted SBT Token IDs
    const userTokens = (await publicClient.readContract({
      address: CONTRACTS.proofOfHustleSBT.address,
      abi: CONTRACTS.proofOfHustleSBT.abi,
      functionName: "getUserTokens",
      args: [seed.worker.address],
    })) as bigint[];

    const latestTokenId = userTokens[userTokens.length - 1]?.toString() || "1";
    console.log(`   -> Worker ${seed.worker.handle} now holds SBT Token ID #${latestTokenId}`);

    outputReceipts.completedGigs.push({
      gigId: gigCount.toString(),
      title: seed.title,
      reward: seed.reward,
      worker: seed.worker.address,
      workerHandle: `@${seed.worker.handle}`,
      sbtTokenId: latestTokenId,
      createTx,
      claimTx,
      submitTx,
      hypeTx,
      payoutTx,
      blockNumber: payoutReceipt.blockNumber.toString(),
      explorerUrl: `https://testnet.monadscan.com/tx/${payoutTx}`,
    });
  }

  console.log("\n------------------------------------------------------------------");
  console.log("STEP 6: Raising & Resolving Real Onchain Dispute with Jurors...");
  console.log("------------------------------------------------------------------");

  // 1. Create a Gig to Dispute
  const disputeDeadline = BigInt(Math.floor(Date.now() / 1000) + 7 * 86400);
  const createDisputeGigTx = await deployerWallet.writeContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "createGig",
    args: [
      CONTRACTS.mockUsdt.address,
      parseUnits("1500", 18),
      0, // FCFS
      false,
      Number(disputeDeadline),
      `ipfs://bafybeidisputetest_${Date.now()}`,
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash: createDisputeGigTx });
  const disputeGigId = (await publicClient.readContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "gigCount",
  })) as bigint;

  // 2. Worker claims & submits
  const disputeWorker = personas[3]; // @solidity_samurai
  const claimDisputeTx = await disputeWorker.wallet.writeContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "claimTask",
    args: [disputeGigId],
  });
  await publicClient.waitForTransactionReceipt({ hash: claimDisputeTx });

  const submitDisputeTx = await disputeWorker.wallet.writeContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "submitWork",
    args: [disputeGigId, "https://github.com/disputed-repo/pr/1", false, keccak256(toHex("dispute_hash"))],
  });
  await publicClient.waitForTransactionReceipt({ hash: submitDisputeTx });

  // 3. Raise Dispute
  const raiseDisputeTx = await deployerWallet.writeContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "raiseDispute",
    args: [disputeGigId, "ipfs://bafybeireason_test_evidence_scope_mismatch"],
  });
  await publicClient.waitForTransactionReceipt({ hash: raiseDisputeTx });
  console.log(`✓ Dispute Raised on Gig #${disputeGigId} (Tx: ${raiseDisputeTx})`);

  // 4. Juror 1 Votes WORKER (1)
  const vote1Tx = await juror1.wallet.writeContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "voteDispute",
    args: [disputeGigId, 1], // WORKER
  });
  await publicClient.waitForTransactionReceipt({ hash: vote1Tx });
  console.log(`✓ Juror 1 (${juror1.handle}) voted for Worker (Tx: ${vote1Tx})`);

  // 5. Juror 2 Votes WORKER (1) -> Triggers 2-of-3 Quorum Settlement!
  const vote2Tx = await juror2.wallet.writeContract({
    address: CONTRACTS.gigEscrow.address,
    abi: CONTRACTS.gigEscrow.abi,
    functionName: "voteDispute",
    args: [disputeGigId, 1], // WORKER
  });
  const vote2Receipt = await publicClient.waitForTransactionReceipt({ hash: vote2Tx });
  console.log(`✓ Juror 2 (${juror2.handle}) voted for Worker -> Dispute Resolved in Block #${vote2Receipt.blockNumber}! (Tx: ${vote2Tx})`);

  outputReceipts.disputes.push({
    gigId: disputeGigId.toString(),
    title: "EVM Storage Collision Verification Dispute",
    disputeTx: raiseDisputeTx,
    vote1Tx,
    vote2Tx,
    winner: disputeWorker.address,
    winnerHandle: `@${disputeWorker.handle}`,
    resolutionTx: vote2Tx,
    blockNumber: vote2Receipt.blockNumber.toString(),
    explorerUrl: `https://testnet.monadscan.com/tx/${vote2Tx}`,
  });

  console.log("\n------------------------------------------------------------------");
  console.log("STEP 7: Performing Real Protocol Burn on ProtocolBurnPool...");
  console.log("------------------------------------------------------------------");

  const transferToBurnTx = await deployerWallet.writeContract({
    address: CONTRACTS.hustleToken.address,
    abi: CONTRACTS.hustleToken.abi,
    functionName: "transfer",
    args: [CONTRACTS.protocolBurnPool.address, parseUnits("300", 18)],
  });
  await publicClient.waitForTransactionReceipt({ hash: transferToBurnTx });

  const burnTx = await deployerWallet.writeContract({
    address: CONTRACTS.protocolBurnPool.address,
    abi: CONTRACTS.protocolBurnPool.abi,
    functionName: "burnHeldHustle",
    args: [],
  });
  const burnReceipt = await publicClient.waitForTransactionReceipt({ hash: burnTx });
  console.log(`✓ Burned 300 $HUSTLE permanently (Tx: ${burnTx})`);

  outputReceipts.protocolBurns.push({
    amount: "300 HUSTLE",
    burnTx,
    blockNumber: burnReceipt.blockNumber.toString(),
    explorerUrl: `https://testnet.monadscan.com/tx/${burnTx}`,
  });

  // Construct Final Leaderboard Data from Real Onchain Results
  outputReceipts.leaderboard = personas.slice(0, 5).map((p, idx) => {
    const completedGig = outputReceipts.completedGigs.find((g: any) => g.worker.toLowerCase() === p.address.toLowerCase());
    return {
      rank: idx + 1,
      handle: `@${p.handle}`,
      address: p.address,
      avatar: p.avatar,
      totalEarningsUsdt: completedGig ? parseInt(completedGig.reward) : 1000 + (5 - idx) * 500,
      completedTasks: 1,
      sbtCount: 1,
      rating: 5.0,
      hustleMined: completedGig ? (parseInt(completedGig.reward) * 0.015) : 25,
      topSkills: p.skills,
      recentWorkTitle: completedGig ? completedGig.title : "Monad High-Throughput Smart Contract",
      recentTxHash: completedGig ? completedGig.payoutTx : outputReceipts.completedGigs[0].payoutTx,
    };
  });

  // Write out to web/src/data/seededOnchainData.json
  const outputPath = path.join(__dirname, "../src/data/seededOnchainData.json");
  fs.writeFileSync(outputPath, JSON.stringify(outputReceipts, null, 2), "utf8");
  console.log("\n==================================================================");
  console.log(`✅ SUCCESS: Real onchain data written to: ${outputPath}`);
  console.log("==================================================================");
}

main().catch((err) => {
  console.error("FATAL SEED ERROR:", err);
  process.exit(1);
});
