import { useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Flex, Text, Button } from "@chakra-ui/react";
import {
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { isAddressEqual } from "viem";

import { SetupShips } from "./SetupShips";
import { battleshipArtifact, GameState, formatters } from "../helpers";

const { abi, deployedAddress } = battleshipArtifact;
const contractCfg = { abi, address: deployedAddress };

export default function Game() {
  const { roundId } = useParams();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const {
    data,
    error,
    isPending,
    queryKey: roundQueryKey,
  } = useReadContract({
    ...contractCfg,
    functionName: "getRound",
    args: [roundId],
  });
  const {
    data: joinGameHash,
    writeContract: joinGameTx,
    isPending: jgPending,
  } = useWriteContract();
  const { data: txReceipt, isSuccess } = useWaitForTransactionReceipt({
    hash: joinGameHash,
  });

  const joinGameCB = useCallback(() => {
    joinGameTx({
      ...contractCfg,
      functionName: "p2join",
      args: [roundId],
    });
  }, [roundId, joinGameTx]);

  useEffect(() => {
    if (!isSuccess || !txReceipt) return;
    queryClient.invalidateQueries({ queryKey: roundQueryKey });
  }, [isSuccess, txReceipt, queryClient, roundQueryKey]);

  const { state, p1, p2, startTime, lastUpdate } = data || {};

  return isPending ? (
    <Text>Pending for smart contract data...</Text>
  ) : error ? (
    <Text>Error {error.toString()}</Text>
  ) : (
    <Flex direction="column" gap={3} alignItems="center">
      <Text>Round ID: {roundId}</Text>
      <Text>Game status: {GameState[state]}</Text>
      <Text>Player 1: {p1}</Text>
      <Text>Player 2: {p2}</Text>
      <Text>Start Time: {formatters.dateTime(startTime)}</Text>
      <Text>Last Update: {formatters.dateTime(lastUpdate)}</Text>
      {GameState[state] === "P1Joined" && isAddressEqual(address, p1) ? (
        <Text>Waiting for another player to join.</Text>
      ) : GameState[state] === "P1Joined" && !isAddressEqual(address, p1) ? (
        <Button
          colorScheme="blue"
          variant="outline"
          width="10em"
          isLoading={jgPending}
          onClick={joinGameCB}
        >
          Join Game
        </Button>
      ) : GameState[state] === "P2Joined" ? (
        <SetupShips roundId={roundId} />
      ) : GameState[state] === "P1Move" || GameState[state] === "P2Move" ? (
        <PlayerMove roundId={roundId} />
      ) : (
        <GameFinished roundId={roundId} />
      )}
    </Flex>
  );
}

function PlayerMove() {
  return (
    <>
      <Text>Player Move</Text>
    </>
  );
}

function GameFinished() {
  return (
    <>
      <Text>Game Finished</Text>
    </>
  );
}
