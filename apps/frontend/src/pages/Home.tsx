import { useEffect, useState } from "react";
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
import { useNavigate, Link } from "react-router-dom";
import { useLocalStorage, useToggle } from "usehooks-ts";
import { usePublicClient } from "../hooks/usePublicClient";

import { battleshipArtifact } from "../helpers";

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
  const publicClient = usePublicClient(selectedNetworkId);
  const navigate = useNavigate();
  const [showJoinGame, toggleJoinGame] = useToggle(false);
  const [createdGames, setCreatedGames, forgetCreatedGames] = useLocalStorage(
    "created-games",
    []
  );

  useEffect(() => {
    if (result.data && selectedNetworkId) {
      setWalletInfo({
        address: address as string,
        walletClient: result.data,
        publicClient,
      });
    }
  }, [result.data, address, publicClient, selectedNetworkId]);

  return result.isError ? (
    <h1>Wallet fetching Error</h1>
  ) : result.isPending ? (
    <h1>Loading...</h1>
  ) : (
    <Flex direction="column" gap={10}>
      <Flex direction="column" gap={5}>
        {createdGames.map((addr) => (
          <GameCard
            id={`gameCard-${addr}`}
            key={`gameCard-${addr}`}
            contractAddr={addr}
          />
        ))}
      </Flex>
      <ButtonGroup
        display="flex"
        justifyContent="space-between"
        colorScheme="blue"
        variant="outline"
        spacing="6"
      >
        <Button
          height="5em"
          width="10em"
          onClick={() =>
            deployBattleshipGame(walletInfo, navigate, setCreatedGames)
          }
        >
          Create Game
        </Button>
        <Button height="5em" width="10em" onClick={toggleJoinGame}>
          Join Game
        </Button>
      </ButtonGroup>
      {showJoinGame && <JoinGame />}

      {import.meta.env.DEV && (
        <Button onClick={forgetCreatedGames}>Forget Games</Button>
      )}
    </Flex>
  );
}

function JoinGame() {
  return <h1>Join Game</h1>;
}

function GameCard({ contractAddr }) {
  return (
    <Link to={`/game/${contractAddr}`}>
      <Card>
        <CardBody>
          <Text>{contractAddr}</Text>
        </CardBody>
      </Card>
    </Link>
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
