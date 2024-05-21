import { useEffect, useId, useState, useCallback } from "react";
import { Form } from "react-router-dom";
import { Flex, Text, Heading, Button, Input } from "@chakra-ui/react";
import { useReadContracts, useAccount, useWriteContract } from "wagmi";

import { battleshipArtifact } from "../helpers";

const { abi, deployedAddress } = battleshipArtifact;
const contractCfg = { abi, address: deployedAddress };

function parseFormData(data) {
  return Object.entries(data).reduce((memo, [key, pos]) => {
    if (pos.trim().length === 0) return memo;

    const [x, y] = pos.split(",").map((s) => s.trim());
    const [shipId, posName] = key.split("-");
    const el = memo.find((el) => el.shipId === Number(shipId));
    if (!el) {
      const shipInfo = {
        shipId: Number(shipId),
        topLeft: [undefined, undefined],
        bottomRight: [undefined, undefined],
      };
      shipInfo[posName] = [Number(x), Number(y)];
      memo.push(shipInfo);
    } else {
      el[posName] = [Number(x), Number(y)];
    }
    return memo;
  }, []);
}

export function SetupShips({ roundId }) {
  const { address } = useAccount();
  const [setupShipState, setSetupShipState] = useState({});
  const result = useReadContracts({
    contracts: ["getShipTypes", "getBoardSize"]
      .map((call) => ({
        ...contractCfg,
        functionName: call,
      }))
      .concat([
        {
          ...contractCfg,
          functionName: "getRound",
          args: [roundId],
        },
      ])
      .concat([
        {
          ...contractCfg,
          functionName: "getRoundShips",
          args: [roundId, address],
        },
      ]),
  });
  const {
    writeContract,
    data: txHash,
    status: writeStatus,
    error: writeError,
  } = useWriteContract();
  const formId = useId();

  const [shipTypes, boardSize, roundInfo, shipInfo] =
    (Array.isArray(result.data) && result.data.map((item) => item.result)) ||
    [];

  const submitShipSetup = useCallback(
    async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(ev.target));
      const shipSetupInfo = parseFormData(data);

      writeContract({
        ...contractCfg,
        functionName: "setupShips",
        args: [roundId, shipSetupInfo],
      });
    },
    [roundId, writeContract]
  );

  const updateSetupShipState = useCallback(
    (ev) => {
      setSetupShipState((prev) => ({
        ...prev,
        [ev.target.name]: ev.target.value,
      }));
    },
    [setSetupShipState]
  );

  // listening to setupShips tx status change
  useEffect(() => {
    console.log("txHash", txHash);
    console.log("writeStatus", writeStatus);
    console.log("writeError", writeError);
  }, [txHash, writeStatus, writeError]);

  // listening to shipInfo and update setupShipState (expect to be run once when the component is loaded)
  useEffect(() => {
    if (shipInfo && shipInfo.length > 0) {
      const setupShipState = {};
      shipInfo
        .filter((el) => el.alive)
        .forEach((el, idx) => {
          setupShipState[`${idx}-topLeft`] = el.topLeft.join(",");
          setupShipState[`${idx}-bottomRight`] = el.bottomRight.join(",");
        });
      setSetupShipState(setupShipState);
    }
  }, [shipInfo]);

  return (
    <Flex direction="column">
      <Heading size="md">Setup Ship Position</Heading>

      {result.isPending ? (
        <Text>Fetching on-chain data...</Text>
      ) : result.isError ? (
        <Text>Fetching on-chain data ERROR!</Text>
      ) : roundInfo.p1 !== address && roundInfo.p2 !== address ? (
        <Text>You are not one of the player for this round.</Text>
      ) : (
        <>
          <Text>
            Board size: {boardSize[0]} rows x {boardSize[1]} cols
          </Text>
          <Form id={formId} method="post" onSubmit={submitShipSetup}>
            {shipTypes.map((shipType, sId) => (
              <Flex key={`form-${formId}-${shipType.name}`} my={4}>
                <span style={{ display: "block", width: "250px" }}>
                  Position of {shipType.name} ({shipType.size[0]} x{" "}
                  {shipType.size[1]})
                </span>
                <span>topLeft:</span>
                <Input
                  name={`${sId}-topLeft`}
                  type="text"
                  size="sm"
                  w="12em"
                  mx={3}
                  value={setupShipState[`${sId}-topLeft`] || ""}
                  onChange={updateSetupShipState}
                />
                <span>bottomRight:</span>
                <Input
                  name={`${sId}-bottomRight`}
                  type="text"
                  size="sm"
                  w="12em"
                  mx={3}
                  value={setupShipState[`${sId}-bottomRight`] || ""}
                  onChange={updateSetupShipState}
                />
              </Flex>
            ))}
            <Button type="submit">Submit</Button>
          </Form>
        </>
      )}
    </Flex>
  );
}
