import { ReactNode } from "react";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { WagmiProvider } from "wagmi";
import { optimism, bsc, optimismGoerli, bscTestnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { wagmiProjectId, project } from "../consts.ts";

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

const chains = [optimism, bsc, optimismGoerli, bscTestnet] as const;
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: wagmiProjectId,
  metadata,
});

// create the modal
createWeb3Modal({
  wagmiConfig,
  projectId: wagmiProjectId,
  enableAnalytics: true,
});

export function Web3ModalProvider({ children }: Props) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
