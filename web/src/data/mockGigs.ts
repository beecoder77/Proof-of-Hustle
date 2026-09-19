import { GigItem } from "../types";

export const INITIAL_GIGS: GigItem[] = [
  {
    id: "1",
    title: "Build Monad Multi-RPC Failover Dashboard with Alchemy Metrics",
    summary:
      "Develop a high-performance React widget monitoring RPC block heights, sync latency, and automatic failover between Alchemy Monad Testnet and backup nodes.",
    description: `### Objective
Build a mission-critical infrastructure status dashboard for Monad developers. The tool must ping Tier 1 (Alchemy Monad RPC), Tier 2 (QuickNode), and Tier 3 (Canonical Public), measure 400ms block inclusion times, and trigger seamless client transport fallback.

### Requirements
- Next.js 15 / React 19 component with Tailwind styling
- Live latency and TPS visualizer
- Viem fallback transport integration code snippet
- 100% test coverage with Vitest

### Evaluation Criteria
- Sub-second UI refresh (<150ms)
- Clean error state recovery when primary RPC is simulated offline`,
    creator: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    rewardAmount: "1,250",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 3 * 86400, // 3 days
    hypeCount: 148,
    submissionsCount: 4,
    skillTags: ["Solidity", "Next.js", "Alchemy", "RPC"],
    deliverables: ["GitHub Repository PR", "Live Vercel Demo URL", "Technical Architecture Diagram"],
    createdAt: Math.floor(Date.now() / 1000) - 86400,
  },
  {
    id: "2",
    title: "Design 3D Animated Monad Mascot & Vector Stickers",
    summary:
      "Create high-poly 3D renders and animated WebP/Lottie stickers of the Monad community mascot for hackathon winner announcements and social hype.",
    description: `### Objective
We need iconic, production-grade 3D mascot assets representing Monad's speed, energy, and community spirit.

### Deliverables
- 3D model source files (.blend / .fbx)
- 5 loop animations: Celebration, Coding at 10,000 TPS, Fire Hype, Coffee Sprint, Winning Bounty
- Transparent PNG renders (4K resolution)
- Animated WebP and Telegram/Discord sticker pack`,
    creator: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    rewardAmount: "750",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "OPEN",
    isSealed: true,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 5 * 86400, // 5 days
    hypeCount: 215,
    submissionsCount: 7,
    skillTags: ["Blender", "3D Design", "Motion Graphics", "Lottie"],
    deliverables: ["Blender 3D Source", "4K Render Renders Pack", "Discord Stickers"],
    createdAt: Math.floor(Date.now() / 1000) - 172800,
  },
  {
    id: "3",
    title: "Port OpenZeppelin Governor to Monad Sub-Second Finality",
    summary:
      "Optimize OpenZeppelin GovernorUpgradeable for 400ms block time dynamics, testing quorum clocks and flash-loan voting defense on Monad Testnet.",
    description: `### Objective
Standard Governor contracts assume 12-second Ethereum blocks. On Monad, with 400ms block intervals, block-based voting periods require timestamp calibration to prevent voting fatigue or flash loan vulnerabilities.

### Requirements
- Timestamp-based voting delay and period implementation
- Integration with Foundry test suite ('forge test')
- MonadVision explorer verification script`,

    creator: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    rewardAmount: "1,500",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "IN_REVIEW",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 1 * 86400,
    hypeCount: 92,
    submissionsCount: 1,
    skillTags: ["Solidity", "Governance", "Foundry", "Security"],
    deliverables: ["Foundry Test Suite", "Deploy Script", "Security Audit Notes"],
    createdAt: Math.floor(Date.now() / 1000) - 250000,
  },
  {
    id: "4",
    title: "Write Monad Parallel EVM Developer Cheatsheet & Deepdive",
    summary:
      "Create an authoritative technical tutorial explaining asynchronous execution, cold storage access cost differences, and state merge conflict resolution.",
    description: `### Deliverables
- 2,500-word comprehensive developer article published to Mirror or Substack
- Illustrated diagrams explaining pipelined execution
- Code examples highlighting anti-patterns with cold storage reads`,
    creator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    rewardAmount: "500",
    rewardToken: "USDT",
    gigType: "FCFS",
    status: "OPEN",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) + 2 * 86400,
    hypeCount: 64,
    submissionsCount: 0,
    skillTags: ["Technical Writing", "EVM", "Monad Architecture"],
    deliverables: ["Markdown Article", "Figma Diagrams Source"],
    createdAt: Math.floor(Date.now() / 1000) - 40000,
  },
  {
    id: "5",
    title: "Create Viral Monad Metropolis Community Video Edit",
    summary:
      "Produce a 60-second fast-paced cinematic trailer highlighting top projects, hackathon tracks, and ecosystem hype.",
    description: `### Deliverables
- 60-second 4K video edit formatted for X (16:9 and 9:16)
- Sound design with punchy bass hits and kinetic typography
- Premier Pro / After Effects project archive`,
    creator: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
    rewardAmount: "600",
    rewardToken: "USDT",
    gigType: "CONTEST",
    status: "SETTLED",
    isSealed: false,
    deadlineTimestamp: Math.floor(Date.now() / 1000) - 86400,
    hypeCount: 310,
    submissionsCount: 6,
    skillTags: ["Video Editing", "Motion Design", "X Viral", "Sound Design"],
    deliverables: ["4K MP4 Master Export", "After Effects Project Archive"],
    clientRating: 5,
    winnerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    createdAt: Math.floor(Date.now() / 1000) - 400000,
  },
];
