import { defineChain } from "viem";

const {
  VITE_WALLETCONNECT_PROJECT_ID,
  VITE_BATTLESHIP_CONTRACT_ADDRESS,
  VITE_ALCHEMY_SEPOLIA_KEY,
  VITE_ALCHEMY_OP_SEPOLIA_KEY,
  VITE_QUICKNODE_BSCTESTNET_KEY,
} = import.meta.env;

export const walletConnectProjectId = VITE_WALLETCONNECT_PROJECT_ID as string;

// Battleship contract deployed address
export const deployedAddress = VITE_BATTLESHIP_CONTRACT_ADDRESS as string;

export const project = {
  name: "ZK Battleship",
  desc: "ZK Battleship Game",
  homepage: "https://jimmychu0807.hk/zk-battleship",
  authorHomepage: "https://jimmychu0807.hk",
  github: "https://github.com/jimmychu0807/zk-battleship",
};

export const RpcUrls = {
  sepolia: `https://eth-sepolia.g.alchemy.com/v2/${VITE_ALCHEMY_SEPOLIA_KEY}`,
  optimismSepolia: `https://opt-sepolia.g.alchemy.com/v2/${VITE_ALCHEMY_OP_SEPOLIA_KEY}`,
  bscTestnet: `https://blue-long-market.bsc-testnet.quiknode.pro/${VITE_QUICKNODE_BSCTESTNET_KEY}/`,
  devChain: "http://localhost:8545",
};

export const devChain = defineChain({
  id: 31337,
  name: "Hardhat Node",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://localhost:8545"] },
  },
});
