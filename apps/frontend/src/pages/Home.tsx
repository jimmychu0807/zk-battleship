import { Flex, Text, ButtonGroup, Button } from "@chakra-ui/react";
import { useWalletInfo } from "@web3modal/wagmi/react";

function PromptForWalletConnect() {
  return (
    <>
      <Text fontSize="xl">Please connect with your wallet</Text>
    </>
  );
}

function GameStart() {
  return (
    <ButtonGroup colorScheme="blue" variant="outline" spacing="6">
      <Button height="5em" width="10em">
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
