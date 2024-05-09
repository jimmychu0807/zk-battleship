import { useParams } from "react-router-dom";
import { Flex, Text } from "@chakra-ui/react";
import { useReadContracts } from "wagmi";

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
    </Flex>
  );
}

Game.loader = loader;
