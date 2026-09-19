"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { monadTestnet } from "../config/contracts";

const queryClient = new QueryClient();

// Fallback 25-character demo app ID if not yet configured in .env.local
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clhustle00000000000000001";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#7C5CFC",
          logo: "/logo.png",
          walletChainType: "ethereum-only",
        },
        loginMethods: ["wallet", "email"],
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PrivyProvider>
  );
}
