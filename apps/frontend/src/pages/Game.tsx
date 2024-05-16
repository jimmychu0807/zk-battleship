import { useEffect, useState, useId, useCallback } from "react";
import { useParams, Form } from "react-router-dom";
import { Flex, Text, Heading, Button, Input } from "@chakra-ui/react";
import {
  useConfig,
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { readContracts } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
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

      {GameState[state] === "P1Joined" && address !== p1 && (
        <Button
          colorScheme="blue"
          variant="outline"
          width="10em"
          isLoading={jgPending}
          onClick={joinGameCB}
        >
          Join Game
        </Button>
      )}

      {GameState[state] === "P2Joined" && <SetupShips roundId={roundId} />}
      {(GameState[state] === "P1Move" || GameState[state] === "P2Move") && (
        <PlayerMove roundId={roundId} />
      )}
      {(GameState[state] === "P1Won" || GameState[state] === "P2Won") && (
        <GameFinished roundId={roundId} />
      )}
    </Flex>
  );
}

function SetupShips({ roundId }) {
  console.log("roundId:", roundId);
  // const wagmiConfig = useConfig();

  // const boardInfo = ["TOTAL_SHIPS", "BOARD_ROWS", "BOARD_COLS"];
  // const [address, abi] = [contractAddr, battleshipArtifact.abi];
  // const bResult = useReadContracts({
  //   contracts: boardInfo.map((functionName) => ({
  //     address,
  //     abi,
  //     functionName,
  //   })),
  // });

  // const [shipInfo, setShipInfo] = useState([]);
  // const formId = useId();

  // const [totalShips, boardRows, boardCols] = bResult.data || [];

  // useEffect(() => {
  //   async function getShipsInfo() {
  //     // const shipInfo = ['SHIP_NAMES', 'SHIP_SIZES'];
  //     if (!totalShips || !totalShips.result || totalShips.result === 0) return;

  //     const contractInfo = { address, abi };
  //     const totalShipsVal = totalShips.result;
  //     const arr = Array(totalShipsVal)
  //       .fill("")
  //       .map((_, idx) => idx);
  //     const shipNames = await readContracts(wagmiConfig, {
  //       contracts: arr.map((idx) => ({
  //         ...contractInfo,
  //         functionName: "SHIP_NAMES",
  //         args: [idx],
  //       })),
  //     });

  //     const arr2 = Array(totalShipsVal)
  //       .fill("")
  //       .map((_, idx) => [
  //         [idx, 0],
  //         [idx, 1],
  //       ])
  //       .flat();
  //     const shipSizes = await readContracts(wagmiConfig, {
  //       contracts: arr2.map(([idx, rc]) => ({
  //         ...contractInfo,
  //         functionName: "SHIP_SIZES",
  //         args: [idx, rc],
  //       })),
  //     });

  //     const shipInfo = shipNames.reduce(
  //       (memo, data, idx) => ({
  //         ...memo,
  //         [data.result]: [
  //           shipSizes[idx * 2].result,
  //           shipSizes[idx * 2 + 1].result,
  //         ],
  //       }),
  //       {}
  //     );

  //     setShipInfo(shipInfo);
  //   }

  //   getShipsInfo();
  // }, [totalShips, abi, address, wagmiConfig]);

  // console.log("boardInfo:", totalShips, boardRows, boardCols);
  // console.log("shipInfo:", shipInfo);

  return (
    <Flex direction="column">
      <Heading size="md">Setup Ship Position</Heading>
      {/*      <Form method="post" action={`/game/${contractAddr}/setupShip`}>
        {Object.entries(shipInfo).map(([shipName, shipSize]) => (
          <Flex key={`form-${formId}-${shipName}`} my={4}>
            <span style={{ display: "block", width: "250px" }}>
              Position of {shipName} ({shipSize[0]} x {shipSize[1]})
            </span>
            <span>topLeft:</span>
            <Input
              name={`${shipName}-topLeft`}
              type="text"
              size="sm"
              w="12em"
              mx={3}
            />

            <span>bottomRight:</span>
            <Input
              name={`${shipName}-bottomRight`}
              type="text"
              size="sm"
              w="12em"
              mx={3}
            />
          </Flex>
        ))}
        <Button type="submit">Submit</Button>
      </Form>*/}
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
