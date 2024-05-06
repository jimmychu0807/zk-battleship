import { useEffect, useContext, useState } from "react";
import { Flex, Text, ButtonGroup, Button } from "@chakra-ui/react";
import { useWalletInfo, useWeb3ModalState } from "@web3modal/wagmi/react";
import { useAccount, useWalletClient } from "wagmi";
import { getContractAddress } from "viem";

import { PublicClientsContext } from "../components/Web3ModalProvider";

// QUESTION: how do you package and deploy the contract artifact from hardhat package?
//   L NX> check how dark forest handle this.
import battleshipArtifact from "../../../hardhat/artifacts/contracts/Battleship.sol/Battleship.json";

function PromptForWalletConnect() {
  return (
    <>
      <Text fontSize="xl">Please connect with your wallet</Text>
    </>
  );
}

async function deployBattleshipGame(walletInfo) {
  if (!walletInfo) throw new Error("walletInfo undefined");

  const { abi, bytecode } = battleshipArtifact;
  const { walletClient, publicClient } = walletInfo;

  const txHash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [],
  });
  console.log("Deployment hash:", txHash);

  const tx = await publicClient.getTransaction({ hash: txHash });
  const contractAddr = getContractAddress({ from: tx.from, nonce: tx.nonce });

  console.log("Battleship contract addr:", contractAddr);
}

function GameStart() {
  const [walletInfo, setWalletInfo] = useState(undefined);
  const result = useWalletClient();
  const { address } = useAccount();
  const { selectedNetworkId } = useWeb3ModalState();
  const pcs = useContext(PublicClientsContext);

  useEffect(() => {
    if (result.data) {
      setWalletInfo({
        address,
        walletClient: result.data,
        publicClient: pcs[selectedNetworkId],
      });
    }
  }, [result.data, address, pcs, selectedNetworkId]);

  return result.isError ? (
    <h1>Wallet fetching Error</h1>
  ) : result.isPending ? (
    <h1>Loading...</h1>
  ) : (
    <ButtonGroup colorScheme="blue" variant="outline" spacing="6">
      <Button
        height="5em"
        width="10em"
        onClick={() => deployBattleshipGame(walletInfo)}
      >
        Create Game
      </Button>
      <Button height="5em" width="10em">
        Join Game
      </Button>
    </ButtonGroup>
  );
}

export default function Home() {
  const { walletInfo } = useWalletInfo();

  return (
    <Flex grow="1" justify="center" alignItems="center">
      {walletInfo ? <GameStart /> : <PromptForWalletConnect />}
    </Flex>
  );
}
