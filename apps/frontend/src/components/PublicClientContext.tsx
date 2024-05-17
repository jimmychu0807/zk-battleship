import { createContext } from "react";
import { createPublicClient, http, PublicClient } from "viem";
import { RpcUrls } from "../consts";

export const PublicClientContext = createContext(null);

export function PublicClientProvider({ children, chains }) {
  // Create public clients used in viem
  const publicClients: Record<number, PublicClient> = Object.entries(
    chains
  ).reduce((mem, [key, chain]) => {
    const pc = createPublicClient({
      chain,
      transport: http(RpcUrls[key]),
    });
    mem[chain.id] = pc;
    return mem;
  }, {});

  return (
    <PublicClientContext.Provider value={publicClients}>
      {children}
    </PublicClientContext.Provider>
  );
}
