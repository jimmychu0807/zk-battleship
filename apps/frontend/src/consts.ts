import { defineChain } from "viem";

export const wagmiProjectId = "9f9039746115860d0e5657789eb84202";

export const project = {
  name: "ZK Battleship",
  desc: "ZK Battleship Game",
  homepage: "https://jimmychu0807.hk/zk-battleship",
  github: "https://github.com/jimmychu0807/zk-battleship",
};

export const devChain = defineChain({
  id: 31337,
  name: "Hardhat Node",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://localhost:8545"] },
  },
});
