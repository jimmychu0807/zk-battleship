import { useEffect, useContext, useState } from "react";
import {
  Flex,
  Text,
  ButtonGroup,
  Button,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { useWalletInfo, useWeb3ModalState } from "@web3modal/wagmi/react";
import { useAccount, useWalletClient } from "wagmi";
import { getContractAddress, WalletClient, PublicClient } from "viem";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";

import { PublicClientsContext } from "../components/Web3ModalProvider";

// QUESTION: how do you package and deploy the contract artifact from hardhat package?
//   L NX> check how dark forest handle this.
import battleshipArtifact from "../../../hardhat/artifacts/contracts/Battleship.sol/Battleship.json";

interface WalletInfo {
  address: string;
  walletClient: WalletClient;
  publicClient: PublicClient;
}

function PromptForWalletConnect() {
  return (
    <>
      <Text fontSize="xl">Please connect with your wallet</Text>
    </>
  );
}

async function deployBattleshipGame(
  walletInfo: WalletInfo | undefined,
  navigate,
  setCreatedGames
) {
  if (!walletInfo) throw new Error("walletInfo undefined");

  const { abi, bytecode } = battleshipArtifact;
  const { walletClient, publicClient } = walletInfo;

  const txHash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [],
  });

  const tx = await publicClient.getTransaction({ hash: txHash });
  const contractAddr = getContractAddress({
    from: tx.from,
    nonce: BigInt(tx.nonce),
  });

  console.log("Battleship contract addr:", contractAddr);

  // save the contractAddr in localStorage
  setCreatedGames((prev: Array<string>) => [...prev, contractAddr]);

  // navigate to another page
  navigate(`/game/${contractAddr}`);
}

function GameStart() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | undefined>(
    undefined
  );
  const result = useWalletClient();
  const { address } = useAccount();
  const { selectedNetworkId } = useWeb3ModalState();
  const navigate = useNavigate();
  const pcs = useContext(PublicClientsContext);
  const [createdGames, setCreatedGames] = useLocalStorage("created-games", []);

  console.log("createdGames:", createdGames);

  useEffect(() => {
    if (result.data && selectedNetworkId) {
      setWalletInfo({
        address: address as string,
        walletClient: result.data,
        publicClient: pcs[parseInt(selectedNetworkId)],
      });
    }
  }, [result.data, address, pcs, selectedNetworkId]);

  return result.isError ? (
    <h1>Wallet fetching Error</h1>
  ) : result.isPending ? (
    <h1>Loading...</h1>
  ) : (
    <Flex direction="column">
      <Flex>
        {createdGames.map((addr) => (
          <GameCard contractAddr={addr} />
        ))}
      </Flex>
      <ButtonGroup colorScheme="blue" variant="outline" spacing="6">
        <Button
          height="5em"
          width="10em"
          onClick={() =>
            deployBattleshipGame(walletInfo, navigate, setCreatedGames)
          }
        >
          Create Game
        </Button>
        <Button height="5em" width="10em">
          Join Game
        </Button>
      </ButtonGroup>
    </Flex>
  );
}

function GameCard({ contractAddr }) {
  return (
    <Card>
      <CardBody>
        <Text>{contractAddr}</Text>
      </CardBody>
    </Card>
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
