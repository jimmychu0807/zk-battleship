import { createContext, useContext } from "react";
import { createPublicClient, http, PublicClient } from "viem";

const PublicClientContext = createContext(null);

export function PublicClientProvider({ children, chains }) {
  // Create public clients used in viem
  const publicClients: Record<number, PublicClient> = chains.reduce(
    (mem, chain) => {
      const pc = createPublicClient({
        chain,
        transport: http(),
      });
      mem[chain.id] = pc;
      return mem;
    },
    {}
  );

  return <PublicClientContext.Provider value={ publicClients }>
    { children }
  </PublicClientContext.Provider>
}

export function usePublicClient(networkId: number) {
  const pcs = useContext(PublicClientContext);
  const pc = pcs[networkId];

  if (!pc) throw new Error("Undefined public client");
  return pc;
}
