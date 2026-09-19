import { GigItem } from "../types";

export const INITIAL_GIGS: GigItem[] = [
  {
    id: "1",
    title: "Parallel EVM Hot Storage Slot Collision Benchmark Suite",
    summary:
      "Develop a high-intensity Solidity test suite measuring parallel execution conflict rates and abort retry overhead across hot storage slots on Monad.",
    description: `### Objective
Build an open benchmark suite evaluating concurrent execution conflict rates under Monad's parallel execution scheduler. The test suite should stress test isolated vs shared storage slots, measuring effective throughput (TPS) and abort/retry latency.

### Requirements
- Solidity 0.8.28 contracts with Foundry fuzzing
- Parametric storage collision generator (1 to 64 concurrent threads)
- Automated gas and latency reporting script
- Full comparison matrix: sequential EVM vs parallel EVM

### Deliverables
- GitHub PR with contracts and test cases
- Benchmark report markdown with graphs
- Reproducible \`forge test\` benchmark command`,
    creator: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    rewardAmount: "2,500",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 7 * 86400,
    hypeCount: 342,
    submissionsCount: 5,
    skillTags: ["Solidity", "Foundry", "Parallel EVM", "Gas Optimization"],
    deliverables: ["Foundry Benchmark Suite", "Performance Analysis Report", "Grafana Dashboard JSON"],
    createdAt: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: "2",
    title: "Alchemy Multi-Transport Failover & Latency Monitor",
    summary:
      "High-performance TypeScript RPC client that monitors block latency on Monad testnet and seamlessly fails over to backup RPCs under 100ms.",
    description: `### Objective
Monad's 400ms block time requires sub-second transport failover. Build a client-side TypeScript routing manager that routes \`eth_sendRawTransactionSync\` through Alchemy Monad RPC with sub-100ms automatic fallback to backup nodes.

### Requirements
- TypeScript / Viem fallback transport wrapper
- Active latency heartbeat tracking block progression
- Zero dropped transactions during simulated network partition
- Integration example for Next.js 15 apps`,
    creator: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    rewardAmount: "1,200",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 3 * 86400,
    hypeCount: 184,
    submissionsCount: 0,
    skillTags: ["TypeScript", "Viem", "Alchemy RPC", "WebSockets"],
    deliverables: ["NPM Package Source", "Next.js 15 Example Repo", "Latency Benchmarks"],
    createdAt: Math.floor(Date.now() / 1000) - 120000,
  },
  {
    id: "3",
    title: "MERA Passkey PRF Decryption Chrome MV3 Extension",
    summary:
      "Browser extension leveraging WebAuthn PRF extension to provide seamless 1-click zero-knowledge commit reveals for sealed submissions.",
    description: `### Objective
Build a Manifest V3 Chrome Extension that bridges browser WebAuthn PRF hardware keys directly into dapps for instant sealed deliverable encryption and post-deadline zero-knowledge reveal.

### Requirements
- Chrome Manifest V3 service worker architecture
- Deterministic salt derivation per dapp origin
- AES-GCM-256 client-side cryptographic decryptor
- Zero remote servers or external data transmission`,
    creator: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    rewardAmount: "1,800",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 5 * 86400,
    hypeCount: 276,
    submissionsCount: 3,
    skillTags: ["WebAuthn", "TypeScript", "Chrome MV3", "Cryptography"],
    deliverables: ["Chrome Extension CRX & Source", "Live Demo Video", "Documentation"],
    createdAt: Math.floor(Date.now() / 1000) - 172800,
  },
  {
    id: "4",
    title: "3D Animated Molandak & Chog Mascot Discord Sticker Pack",
    summary:
      "15 high-fidelity, looping 3D animated stickers featuring Chog and Molandak celebrating sub-second transactions and hustle wins.",
    description: `### Objective
Craft an iconic collection of 15 looping 3D animated stickers featuring Monad's beloved mascots Molandak and Chog. The stickers will be used across official Monad Discord and Telegram communities.

### Requirements
- 15 unique animation loops (.tgs for Telegram, .gif/.png for Discord)
- Master .blend / .fbx source project files
- Transparent backgrounds with smooth 60fps rendering`,
    creator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    rewardAmount: "800",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 4 * 86400,
    hypeCount: 412,
    submissionsCount: 8,
    skillTags: ["Blender", "3D Animation", "Monad Lore", "Figma"],
    deliverables: ["15 Animated Stickers Pack", "Blender Project Source", "4K Showcase Reel"],
    createdAt: Math.floor(Date.now() / 1000) - 250000,
  },
  {
    id: "5",
    title: "Cairo to Monad Solidity Transpiler Opcode Cheatsheet",
    summary:
      "Technical documentation comparing Starknet Cairo memory patterns with Monad EVM execution and gas cost equivalents.",
    description: `### Objective
Help developers porting Starknet protocols to Monad by creating an authoritative reference guide comparing Cairo felt arithmetic, memory segments, and syscalls to Monad EVM 0.8.28 opcodes and storage slots.`,
    creator: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    rewardAmount: "950",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 3 * 86400,
    hypeCount: 156,
    submissionsCount: 0,
    skillTags: ["Starknet", "Solidity", "EVM Opcodes", "Research"],
    deliverables: ["Markdown Cheatsheet Guide", "Code Equivalency Snippets", "Gas Delta Analysis"],
    createdAt: Math.floor(Date.now() / 1000) - 90000,
  },
  {
    id: "6",
    title: "EIP-7702 Delegation Simulator & Gasless Sponsor Relayer",
    summary:
      "Implementation and test suite demonstrating EIP-7702 batch transaction delegation on Monad with gas sponsorship.",
    description: `### Objective
Monad natively supports EIP-7702. Implement an end-to-end relayer service and test suite that allows standard EOA accounts to temporarily delegate code execution to an ERC-4337 smart account for zero-gas batch operations.`,
    creator: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    rewardAmount: "2,000",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 6 * 86400,
    hypeCount: 298,
    submissionsCount: 2,
    skillTags: ["ERC-7702", "Account Abstraction", "Foundry", "Monad"],
    deliverables: ["Solidity Delegation Contract", "TypeScript Relayer Service", "E2E Integration Test"],
    createdAt: Math.floor(Date.now() / 1000) - 180000,
  },
  {
    id: "7",
    title: "Devnads Multi-Explorer Verification GitHub Action",
    summary:
      "CI/CD workflow that automatically verifies compiled Foundry contracts on MonadVision, Socialscan, and Monadscan in a single pipeline run.",
    description: `### Objective
Create a reusable GitHub Action that taps into the Devnads open verification API (\`https://agents.devnads.com/v1/verify\`) to verify deployed smart contracts across all Monad block explorers in one command.`,
    creator: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    rewardAmount: "650",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 2 * 86400,
    hypeCount: 92,
    submissionsCount: 0,
    skillTags: ["GitHub Actions", "Devnads API", "Bash", "Foundry"],
    deliverables: ["action.yml Source", "Workflow Example", "Test Run Logs"],
    createdAt: Math.floor(Date.now() / 1000) - 45000,
  },
  {
    id: "8",
    title: "Telegram Mini App for 1-Tap Monad Gig Claiming",
    summary:
      "Fluid Telegram Mini-App enabling hustle hunters to receive sub-second notifications and 1-tap claim FCFS tasks on mobile.",
    description: `### Objective
Build a lightweight Telegram WebApp (TWA) connecting to ProofOfHustle. Freelancers can receive instant push notifications when a bounty matching their skill tags goes live, and claim it in 400ms using embedded Privy auth.`,
    creator: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    rewardAmount: "1,500",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 5 * 86400,
    hypeCount: 380,
    submissionsCount: 4,
    skillTags: ["Next.js", "Telegram API", "Privy Auth", "Tailwind CSS"],
    deliverables: ["Telegram Bot & Mini App Source", "Live Telegram Bot Link", "Demo Recording"],
    createdAt: Math.floor(Date.now() / 1000) - 210000,
  },
  {
    id: "9",
    title: "Monad BFT Consensus Latency Telemetry Dashboard",
    summary:
      "Real-time visual telemetry dashboard visualizing pipelined consensus, tail block intervals, and execution finality metrics.",
    description: `### Objective
Develop a real-time analytics visualizer observing Monad BFT leader rotation and asynchronous execution pipelines with smooth 60fps animations and WebSocket telemetry.`,
    creator: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    rewardAmount: "1,100",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 4 * 86400,
    hypeCount: 165,
    submissionsCount: 0,
    skillTags: ["React", "D3.js", "Monad RPC", "WebSockets"],
    deliverables: ["Telemetry Dashboard Web App", "WebSocket Ingestion Layer", "Vercel Demo"],
    createdAt: Math.floor(Date.now() / 1000) - 150000,
  },
  {
    id: "10",
    title: "Zero-Knowledge Sealed Bug Bounty Audit Escrow",
    summary:
      "Sealed-bid security audit escrow where bug reports remain encrypted with biometric passkeys until bounty settlement.",
    description: `### Objective
Build a specialized escrow module where whitehat auditors submit vulnerability reports sealed with MERA PRF. If the client confirms the bug, the key is revealed and payout is immediately unlocked.`,
    creator: "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
    rewardAmount: "2,200",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 7 * 86400,
    hypeCount: 310,
    submissionsCount: 1,
    skillTags: ["Solidity", "ZK Proofs", "Web Crypto", "Security Audit"],
    deliverables: ["Audit Escrow Contract", "Web UI for Auditor Submissions", "Verification Specs"],
    createdAt: Math.floor(Date.now() / 1000) - 300000,
  },
  {
    id: "11",
    title: "Liquid Staking Adapter for $HUSTLE Attention Curation",
    summary:
      "Smart contract vault adapter that stakes idle curation collateral into Monad native yield pools while retaining voting liquidity.",
    description: `### Objective
Create an ERC-4626 compliant vault adapter allowing curators to stake $HUSTLE into ecosystem bounties while underlying assets generate yield on Monad testnet DeFi protocols.`,
    creator: "0x71bE63f3384f5fb9899544c7be52417906944043",
    rewardAmount: "1,400",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 4 * 86400,
    hypeCount: 195,
    submissionsCount: 0,
    skillTags: ["ERC-4626", "Solidity", "Yield Farming", "DeFi"],
    deliverables: ["ERC-4626 Vault Contract", "Foundry Test Suite", "Integration Documentation"],
    createdAt: Math.floor(Date.now() / 1000) - 110000,
  },
  {
    id: "12",
    title: "Monad Hacker House London Kinetic Video Recap",
    summary:
      "Fast-paced, 60-second vertical video edit recapping London Hacker Lounge builder sprints with kinetic typography and Monad audio design.",
    description: `### Objective
Create a high-energy 60-second vertical video (9:16) capturing the intensity, code commits, and builder hustle at the Monad London Hacker Lounge for X and Instagram Reels.`,
    creator: "0xFabb0ac9d68B0B445fB7357272Ff202C5651694a",
    rewardAmount: "750",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 3 * 86400,
    hypeCount: 460,
    submissionsCount: 6,
    skillTags: ["Video Editing", "After Effects", "Sound Design", "Marketing"],
    deliverables: ["4K 60fps MP4 Master", "Project File (Premiere/After Effects)", "Thumbnail Package"],
    createdAt: Math.floor(Date.now() / 1000) - 200000,
  },
  {
    id: "13",
    title: "Sub-400ms Pyth Oracle Binary Prediction Escrow",
    summary:
      "Ultrafast binary outcome prediction escrow resolving within 3 blocks using Pyth low-latency price feeds on Monad.",
    description: `### Objective
Capitalize on Monad's 400ms finality by implementing an ultra-fast micro-prediction market contract that resolves 10-second price movements using Pyth low-latency pull oracles.`,
    creator: "0x1CBD3E2b806688295689814400508b98b0907e88",
    rewardAmount: "1,750",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 5 * 86400,
    hypeCount: 220,
    submissionsCount: 3,
    skillTags: ["Solidity", "Oracle Integration", "Pyth", "Micro-escrow"],
    deliverables: ["Prediction Escrow Contract", "Pyth Oracle Pull Worker", "Integration Tests"],
    createdAt: Math.floor(Date.now() / 1000) - 160000,
  },
  {
    id: "14",
    title: "Precision Studio Obsidian Dark Component Library",
    summary:
      "20 accessible UI components adhering strictly to the obsidian dark palette, hairline borders, and fluid Monad Iris accents.",
    description: `### Objective
Package the design system powering ProofOfHustle into an open-source React / Tailwind CSS component package for all Monad ecosystem builders.`,
    creator: "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
    rewardAmount: "850",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 3 * 86400,
    hypeCount: 140,
    submissionsCount: 0,
    skillTags: ["Tailwind CSS", "React", "Design Systems", "Accessibility"],
    deliverables: ["NPM Component Package", "Storybook Showcase", "Tailwind Config Preset"],
    createdAt: Math.floor(Date.now() / 1000) - 80000,
  },
  {
    id: "15",
    title: "Cross-Chain Outbox Gas & Finality Estimator Widget",
    summary:
      "React widget estimating exact cross-chain gas execution costs and time-to-finality when bridging assets to Monad.",
    description: `### Objective
Build a lightweight embeddable widget that tracks live gas prices and message execution delays across Monad, Ethereum, Arbitrum, and Base for cross-chain gig escrows.`,
    creator: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    rewardAmount: "900",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 3 * 86400,
    hypeCount: 115,
    submissionsCount: 0,
    skillTags: ["Viem", "LayerZero / Wormhole", "Next.js", "TypeScript"],
    deliverables: ["Embeddable React Widget", "Gas Oracle Hook", "Demo Site"],
    createdAt: Math.floor(Date.now() / 1000) - 70000,
  },
  {
    id: "16",
    title: "Monad Deferred Execution MEV Backrunning Simulator",
    summary:
      "Comprehensive research paper and code simulation analyzing MEV searcher dynamics under Monad's deferred execution model.",
    description: `### Objective
Produce a rigorous technical paper and simulation engine exploring how backrunning and arbitrage bots operate under Monad's separate consensus and execution phases.`,
    creator: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    rewardAmount: "2,400",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 7 * 86400,
    hypeCount: 510,
    submissionsCount: 2,
    skillTags: ["MEV", "Rust", "EVM Trace", "Foundry"],
    deliverables: ["Research Paper PDF", "Rust Simulator Code", "Jupyter Notebook Visualizations"],
    createdAt: Math.floor(Date.now() / 1000) - 340000,
  },
  {
    id: "17",
    title: "Decentralized Juror Dispute Tribunal Smart Contract",
    summary:
      "Kleros-style community juror staking mechanism to arbitrate contested deliverable rejections with Schelling point incentives.",
    description: `### Objective
Build the governance arbitration contract for ProofOfHustle where staked $HUSTLE token holders are pseudo-randomly selected as jurors to vote on disputed milestone deliverable claims.`,
    creator: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    rewardAmount: "1,350",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 4 * 86400,
    hypeCount: 175,
    submissionsCount: 0,
    skillTags: ["Solidity", "Governance", "Staking", "Game Theory"],
    deliverables: ["Arbitration Contract", "Foundry Test Suite", "Mechanism Design Spec"],
    createdAt: Math.floor(Date.now() / 1000) - 130000,
  },
  {
    id: "18",
    title: "Social Guardian WebAuthn Passkey Recovery Flow",
    summary:
      "Frictionless social recovery implementation allowing passkey holders to designate 3 friend guardians without seed phrase backups.",
    description: `### Objective
Design an intuitive recovery mechanism for passkey-only wallets on Monad where 2-of-3 designated friends can authorize a passkey replacement transaction via Privy embedded signatures.`,
    creator: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    rewardAmount: "1,600",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 5 * 86400,
    hypeCount: 320,
    submissionsCount: 3,
    skillTags: ["WebAuthn", "Privy", "Cryptography", "UX Design"],
    deliverables: ["Recovery Contract", "React UI Modal", "Security Analysis Document"],
    createdAt: Math.floor(Date.now() / 1000) - 220000,
  },
  {
    id: "19",
    title: "Onchain Sybil-Resistant Hustler Credibility Index",
    summary:
      "Scoring engine aggregating completed gigs, average ratings, and SBT seniority into a fraud-resistant Hustle Credibility Index.",
    description: `### Objective
Develop a composite scoring algorithm that indexes ERC-5192 Soulbound Tokens, completed escrows, and stake curation history to calculate a portable credit and credibility rating for Monad hustlers.`,
    creator: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    rewardAmount: "1,000",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 3 * 86400,
    hypeCount: 205,
    submissionsCount: 0,
    skillTags: ["GraphQL", "Envio", "Algorithms", "Reputation"],
    deliverables: ["Scoring Engine Code", "Envio Indexer Mapping", "API Documentation"],
    createdAt: Math.floor(Date.now() / 1000) - 95000,
  },
  {
    id: "20",
    title: "Category Labs 'One Passkey, Many Keys' 3D Showcase",
    summary:
      "Educational interactive playground demonstrating how 1 hardware passkey securely generates 5 distinct cryptographic keys for email, code, and chat.",
    description: `### Objective
Build a dazzling WebGL / Three.js 3D interactive showcase illustrating Category Labs' MERA PRF architecture: showing visually how a single biometric touch branches into isolated cryptographic namespaces.`,
    creator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    rewardAmount: "1,900",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 6 * 86400,
    hypeCount: 640,
    submissionsCount: 7,
    skillTags: ["Next.js", "MERA PRF", "Web Crypto", "Interactive 3D"],
    deliverables: ["Interactive 3D Web App", "GitHub Repo Source", "Live Vercel Link"],
    createdAt: Math.floor(Date.now() / 1000) - 360000,
  },
];
