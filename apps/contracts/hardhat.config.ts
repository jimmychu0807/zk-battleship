import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

const requiredEnvs = ["DEPLOYER_SK", "IGNITION_SALT"];
requiredEnvs.forEach((envName) => {
  if (!process.env[envName] || (process.env[envName] as string).length === 0) {
    throw new Error(`${envName} is not set in .env`);
  }
})

const config: HardhatUserConfig = {
  defaultNetwork: process.env.DEFAULT_NETWORK || "hardhat",
  networks: {
    sepolia: {
      chainId: 11155111,
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_SEPOLIA_KEY}`,
      accounts: [process.env.DEPLOYER_SK as string],
    },
    optimismSepolia: {
      chainId: 11155420,
      url: `https://opt-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_OP_SEPOLIA_KEY}`,
      accounts: [process.env.DEPLOYER_SK as string],
    },
    bscTestnet: {
      chainId: 97,
      url: `https://blue-long-market.bsc-testnet.quiknode.pro/${process.env.QUICKNODE_BSCTESTNET_KEY}/`,
      accounts: [process.env.DEPLOYER_SK as string],
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      // We hit the "Stack too deep. Try compiling with `--via-ir` (cli) or the equivalent
      //   `viaIR: true` (standard JSON) while enabling the optimizer. Otherwise, try removing
      //   local variables." problem. So we enable it.
      //   ref: https://hardhat.org/hardhat-runner/docs/reference/solidity-support#support-for-ir-based-codegen
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 77,
        details: {
          yulDetails: {
            optimizerSteps: "u",
          },
        },
      },
    },
  },
  ignition: {
    strategyConfig: {
      create2: {
        salt: process.env.IGNITION_SALT as string,
      },
    },
  },
  mocha: {
    timeout: 40000,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },
};

export default config;
