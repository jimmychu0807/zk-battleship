import { ReactNode, createContext } from "react";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { WagmiProvider } from "wagmi";
import {
  sepolia, // Ethereum
  optimismSepolia, // Optimism
  bscTestnet, // BSC Testnet
} from "wagmi/chains";
import { createPublicClient, http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { wagmiProjectId, project, devChain } from "../consts.ts";

interface Props {
  children?: ReactNode;
  // any props that come into the component
}

// ref: https://docs.walletconnect.com/web3modal/react/about?platform=wagmi
const queryClient = new QueryClient();
const metadata = {
  name: project.name,
  description: project.desc,
  url: project.homepage,
  icons: [`${project.homepage}/logo/battleship-logo.jpeg`],
};

const chains = [sepolia, optimismSepolia, bscTestnet];

// Add the hardhat node devnet
const isDev = import.meta.env.DEV;
if (isDev) chains.push(devChain);

const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: wagmiProjectId,
  metadata,
});

// Create Public Client used in viem
const publicClients = chains.reduce((mem, chain) => {
  const pc = createPublicClient({
    chain,
    transport: http(),
  });
  mem[chain.id] = pc;
  return mem;
}, {});

export const PublicClientsContext = createContext(publicClients);

// create the modal
createWeb3Modal({
  wagmiConfig,
  projectId: wagmiProjectId,
  enableAnalytics: true,
  defaultChain: isDev ? devChain : undefined,
});

export function Web3ModalProvider({ children }: Props) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PublicClientsContext.Provider value={publicClients}>
          {children}
        </PublicClientsContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
