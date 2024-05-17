import { useEffect, useState, useCallback } from "react";
import { Flex, Text, Button, Card, CardBody } from "@chakra-ui/react";
import { useWalletInfo, useWeb3ModalState } from "@web3modal/wagmi/react";
import {
  useAccount,
  useWalletClient,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { WalletClient, PublicClient, parseEventLogs } from "viem";
import { useNavigate, Link } from "react-router-dom";
import { usePublicClient } from "../hooks/usePublicClient";

import { battleshipArtifact, battleshipEventTypes } from "../helpers";

interface WalletInfo {
  address: string;
  walletClient: WalletClient;
  publicClient: PublicClient;
}

const { abi, deployedAddress } = battleshipArtifact;
const contractCfg = { abi, address: deployedAddress };

function PromptForWalletConnect() {
  return (
    <>
      <Text fontSize="xl">Please connect with your wallet</Text>
    </>
  );
}

function GameStart() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | undefined>(
    undefined
  );
  const [newGameClicked, setNewGameClicked] = useState<boolean>(false);
  const wcResult = useWalletClient();
  const queryClient = useQueryClient();
  const { address: userAddr } = useAccount();
  const { selectedNetworkId } = useWeb3ModalState();
  const publicClient = usePublicClient(selectedNetworkId);
  const navigate = useNavigate();
  const { data: txHash, isPending, writeContract } = useWriteContract();
  const { data: txReceipt, isSuccess: txSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });
  const roundsResult = useReadContract({
    ...contractCfg,
    functionName: "getAllRounds",
  });

  const newGame = useCallback(() => {
    if (!walletInfo) return;

    writeContract({
      ...contractCfg,
      functionName: "newGame",
      args: [],
    });

    setNewGameClicked(true);
  }, [walletInfo, writeContract]);

  useEffect(() => {
    if (wcResult.data && selectedNetworkId) {
      setWalletInfo({
        address: userAddr as string,
        walletClient: wcResult.data,
        publicClient,
      });
    }
  }, [wcResult.data, userAddr, publicClient, selectedNetworkId]);

  useEffect(() => {
    if (!txReceipt || !txSuccess || !roundsResult) return;

    queryClient.invalidateQueries({ queryKey: roundsResult.queryKey });

    if (newGameClicked) {
      const evLogs = parseEventLogs({
        abi,
        eventName: battleshipEventTypes.newGame,
        logs: txReceipt.logs,
      });
      const roundId = Number(evLogs[0].args.roundId);

      setNewGameClicked(false);
      navigate(`/game/${roundId}`);
    }
  }, [
    queryClient,
    txReceipt,
    txSuccess,
    navigate,
    newGameClicked,
    roundsResult,
  ]);

  return wcResult.isError || roundsResult.isError ? (
    <h1>Fetching results Error</h1>
  ) : wcResult.isPending || roundsResult.isPending ? (
    <h1>Loading...</h1>
  ) : (
    <Flex direction="column" gap={10} alignItems="center">
      <Flex direction="column" gap={5}>
        {roundsResult.data.map((round, idx: number) => (
          <GameCard
            id={`gameCard-${idx}`}
            key={`gameCard-${idx}`}
            idx={idx}
            round={round}
          />
        ))}
      </Flex>
      <Button
        colorScheme="blue"
        variant="outline"
        width="10em"
        isLoading={isPending}
        onClick={newGame}
      >
        New Game
      </Button>
    </Flex>
  );
}

function GameCard({ idx, round }) {
  return (
    <Link to={`/game/${idx}`}>
      <Card>
        <CardBody>
          <Text>ID: {idx}</Text>
          <Text>p1: {round.p1}</Text>
          <Text>p2: {round.p2}</Text>
          <Text>state: {round.state}</Text>
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
