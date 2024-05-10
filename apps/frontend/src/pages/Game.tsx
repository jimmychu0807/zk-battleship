import { useEffect, useState, useId } from "react";
import { useParams, Form } from "react-router-dom";
import { Flex, Text, Heading, Button, Input } from "@chakra-ui/react";
import { useConfig, useReadContracts } from "wagmi";
import { readContracts } from "wagmi/actions";
import { battleshipArtifact, GameState } from "../helpers";

async function loader({ params }) {
  const { contractAddr } = params;
  return { contractAddr };
}

const { abi } = battleshipArtifact;

export default function Game() {
  const { contractAddr: address } = useParams();

  const { data, error, isPending } = useReadContracts({
    // prettier-ignore
    contracts: [
      { abi, address, functionName: "gameState" },
      { abi, address, functionName: "p1" },
      { abi, address, functionName: "p2" },
    ],
  });
  const [gameState, p1Addr, p2Addr] = data || [];

  return isPending ? (
    <Text>Pending for smart contract data...</Text>
  ) : error ? (
    <Text>Error {error.toString()}</Text>
  ) : (
    <Flex direction="column" gap={3}>
      <Text>Game Contract: {address}</Text>
      <Text>Game status: {GameState[gameState.result]}</Text>
      <Text>Player 1: ${p1Addr.result}</Text>
      <Text>Player 2: ${p2Addr.result}</Text>
      {GameState[gameState.result] === "P2Joined" && (
        <SetupShips contractAddr={address} />
      )}
      {(GameState[gameState.result] === "P1Move" ||
        GameState[gameState.result] === "P2Move") && (
        <PlayerMove contractAddr={address} />
      )}
      {(GameState[gameState.result] === "P1Won" ||
        GameState[gameState.result] === "P2Won") && (
        <GameFinished contractAddr={address} />
      )}
    </Flex>
  );
}

function SetupShips({ contractAddr }) {
  const wagmiConfig = useConfig();

  const boardInfo = ["TOTAL_SHIPS", "BOARD_ROWS", "BOARD_COLS"];
  const [address, abi] = [contractAddr, battleshipArtifact.abi];
  const bResult = useReadContracts({
    contracts: boardInfo.map((functionName) => ({
      address,
      abi,
      functionName,
    })),
  });

  const [shipInfo, setShipInfo] = useState([]);
  const formId = useId();

  const [totalShips, boardRows, boardCols] = bResult.data || [];

  useEffect(() => {
    async function getShipsInfo() {
      // const shipInfo = ['SHIP_NAMES', 'SHIP_SIZES'];
      if (!totalShips || !totalShips.result || totalShips.result === 0) return;

      const contractInfo = { address, abi };
      const totalShipsVal = totalShips.result;
      const arr = Array(totalShipsVal)
        .fill("")
        .map((_, idx) => idx);
      const shipNames = await readContracts(wagmiConfig, {
        contracts: arr.map((idx) => ({
          ...contractInfo,
          functionName: "SHIP_NAMES",
          args: [idx],
        })),
      });

      const arr2 = Array(totalShipsVal)
        .fill("")
        .map((_, idx) => [
          [idx, 0],
          [idx, 1],
        ])
        .flat();
      const shipSizes = await readContracts(wagmiConfig, {
        contracts: arr2.map(([idx, rc]) => ({
          ...contractInfo,
          functionName: "SHIP_SIZES",
          args: [idx, rc],
        })),
      });

      const shipInfo = shipNames.reduce(
        (memo, data, idx) => ({
          ...memo,
          [data.result]: [
            shipSizes[idx * 2].result,
            shipSizes[idx * 2 + 1].result,
          ],
        }),
        {}
      );

      setShipInfo(shipInfo);
    }

    getShipsInfo();
  }, [totalShips, abi, address, wagmiConfig]);

  console.log("boardInfo:", totalShips, boardRows, boardCols);
  console.log("shipInfo:", shipInfo);

  return (
    <Flex direction="column">
      <Heading size="md">Setup Ship Position</Heading>
      <Form method="post" action={`/game/${contractAddr}/setupShip`}>
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
      </Form>
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

Game.loader = loader;
