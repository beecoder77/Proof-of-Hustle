"use client";

import { useState, useCallback } from "react";
import { useWalletClient } from "wagmi";

interface SendSyncResult {
  txHash: string;
  receipt?: unknown;
}

/**
 * @notice Hook utilizing Monad's custom eth_sendRawTransactionSync RPC method
 *         to broadcast and confirm transactions synchronously under 400ms.
 */
export function useSendTransactionSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { data: walletClient } = useWalletClient();

  const sendSync = useCallback(
    async (serializedTx: `0x${string}`): Promise<SendSyncResult> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!walletClient) {
          throw new Error("Wallet client not connected");
        }

        // Send via eth_sendRawTransactionSync if supported by RPC
        const result = (await (walletClient.request as (args: { method: string; params: unknown[] }) => Promise<unknown>)({
          method: "eth_sendRawTransactionSync",
          params: [serializedTx],
        })) as { transactionHash: string };

        return { txHash: result.transactionHash, receipt: result };
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient]
  );

  return { sendSync, isLoading, error };
}
