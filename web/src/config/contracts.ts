import { defineChain } from "viem";
import GigEscrowAbi from "../abis/GigEscrow.json";
import HustleTokenAbi from "../abis/HustleToken.json";
import ProofOfHustleSBTAbi from "../abis/ProofOfHustleSBT.json";
import ProtocolBurnPoolAbi from "../abis/ProtocolBurnPool.json";
import MockERC20Abi from "../abis/MockERC20.json";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MONAD_RPC_URL ||
          process.env.NEXT_PUBLIC_ALCHEMY_RPC ||
          "https://testnet-rpc.monad.xyz",
        "https://testnet-rpc.monad.xyz",
      ],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadVision",
      url: "https://testnet.monadscan.com",
    },
  },
  testnet: true,
});

export const CONTRACTS = {
  gigEscrow: {
    address: (process.env.NEXT_PUBLIC_GIG_ESCROW_ADDRESS ||
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9") as `0x${string}`,
    abi: GigEscrowAbi,
  },
  hustleToken: {
    address: (process.env.NEXT_PUBLIC_HUSTLE_TOKEN_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`,
    abi: HustleTokenAbi,
  },
  proofOfHustleSBT: {
    address: (process.env.NEXT_PUBLIC_SBT_ADDRESS ||
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as `0x${string}`,
    abi: ProofOfHustleSBTAbi,
  },
  protocolBurnPool: {
    address: (process.env.NEXT_PUBLIC_BURN_POOL_ADDRESS ||
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0") as `0x${string}`,
    abi: ProtocolBurnPoolAbi,
  },
  mockUsdt: {
    address: (process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS ||
      "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9") as `0x${string}`,
    abi: MockERC20Abi,
  },
} as const;
