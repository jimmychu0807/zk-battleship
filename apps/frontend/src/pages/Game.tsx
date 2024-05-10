import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Flex, Text } from "@chakra-ui/react";
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

  const [totalShips, boardRows, boardCols] = bResult.data || [];

  useEffect(() => {
    async function getShipsInfo() {
      // const shipInfo = ['SHIP_NAMES', 'SHIP_SIZES'];
      if (!totalShips || !totalShips.result || totalShips.result === 0) return;

      const totalShipsVal = totalShips.result;
      const arr = Array(totalShipsVal)
        .fill("")
        .map((_, idx) => idx);
      const sResult = await readContracts(wagmiConfig, {
        contracts: arr.map((idx) => ({
          address,
          abi,
          functionName: "SHIP_NAMES",
          args: [idx],
        })),
      });

      setShipInfo(sResult.map((res) => res.result));
    }

    getShipsInfo();
  }, [totalShips, abi, address, wagmiConfig]);

  console.log("boardInfo:", totalShips, boardRows, boardCols);
  console.log("shipInfo:", shipInfo);

  return (
    <>
      <Text>Setup Ships</Text>
    </>
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
