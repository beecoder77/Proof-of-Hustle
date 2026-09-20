import { defineChain } from "viem";
import GigEscrowAbi from "../abis/GigEscrow.json";
import HustleTokenAbi from "../abis/HustleToken.json";
import ProofOfHustleSBTAbi from "../abis/ProofOfHustleSBT.json";
import ProtocolBurnPoolAbi from "../abis/ProtocolBurnPool.json";
import MockERC20Abi from "../abis/MockERC20.json";
import HustlerProfileRegistryAbi from "../abis/HustlerProfileRegistry.json";

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
      "0x9ebE2bd656F9d4C158dE698284329a5F2994Beb5") as `0x${string}`,
    abi: GigEscrowAbi,
  },
  hustleToken: {
    address: (process.env.NEXT_PUBLIC_HUSTLE_TOKEN_ADDRESS ||
      "0xCd81b45cE054C8A9Fde4447826D406d41712FB73") as `0x${string}`,
    abi: HustleTokenAbi,
  },
  proofOfHustleSBT: {
    address: (process.env.NEXT_PUBLIC_SBT_ADDRESS ||
      "0xf84666CbA55368E8F2bE2134e20AFc89027f33b2") as `0x${string}`,
    abi: ProofOfHustleSBTAbi,
  },
  protocolBurnPool: {
    address: (process.env.NEXT_PUBLIC_BURN_POOL_ADDRESS ||
      "0xef73DfFdD7795CFe57839f7493D452cf534B506c") as `0x${string}`,
    abi: ProtocolBurnPoolAbi,
  },
  mockUsdt: {
    address: (process.env.NEXT_PUBLIC_MOCK_USDT_ADDRESS ||
      "0x0Ba9DA718Adfa048f4EF9F2BF1afe9A5E4077637") as `0x${string}`,
    abi: MockERC20Abi,
  },
  profileRegistry: {
    address: (process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS ||
      "0x6781Dd555313828f570F84e13ECa8684081E1B6D") as `0x${string}`,
    abi: HustlerProfileRegistryAbi,
  },
} as const;
