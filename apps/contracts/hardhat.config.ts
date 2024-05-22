import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

const {
  IGNITION_SALT = "",
  DEPLOYER_SK = "",
  ALCHEMY_OP_SEPOLIA_KEY = "",
  ALCHEMY_SEPOLIA_KEY = "",
  QUICKNODE_BSCTESTNET_KEY = "",
  ETHERSCAN_APIKEY = "",
} = process.env;

const env: Record<string, string> = {
  IGNITION_SALT,
  DEPLOYER_SK,
  ALCHEMY_SEPOLIA_KEY,
  ALCHEMY_OP_SEPOLIA_KEY,
  QUICKNODE_BSCTESTNET_KEY,
  ETHERSCAN_APIKEY,
};

for (const [key, val] of Object.entries(env)) {
  if (val.length === 0) {
    throw new Error(`missing env ${key}`);
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    localhost: {},
    sepolia: {
      chainId: 11155111,
      url: `https://eth-sepolia.g.alchemy.com/v2/${env.ALCHEMY_SEPOLIA_KEY}`,
      accounts: [env.DEPLOYER_SK],
    },
    optimismSepolia: {
      chainId: 11155420,
      url: `https://opt-sepolia.g.alchemy.com/v2/${env.ALCHEMY_OP_SEPOLIA_KEY}`,
      accounts: [env.DEPLOYER_SK],
    },
    bscTestnet: {
      chainId: 97,
      url: `https://blue-long-market.bsc-testnet.quiknode.pro/${env.QUICKNODE_BSCTESTNET_KEY}/`,
      accounts: [env.DEPLOYER_SK],
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 77,
      },
    },
  },
  ignition: {
    strategyConfig: {
      create2: {
        salt: env.IGNITION_SALT,
      },
    },
  },
  mocha: {
    timeout: 40000,
  },
  etherscan: {
    apiKey: env.ETHERSCAN_APIKEY,
  },
};

export default config;
