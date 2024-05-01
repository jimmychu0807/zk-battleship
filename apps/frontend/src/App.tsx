import { Flex } from "@chakra-ui/react";
import { useWalletInfo } from "@web3modal/wagmi/react";

import Header from "./pages/Header.tsx";
import Footer from "./pages/Footer.tsx";
import "./App.css";

function PromptForWalletConnect() {
  return (
    <>
      <h1>Please connect with your wallet</h1>
    </>
  );
}

function GameStart() {
  return (
    <>
      <h1>Start Game</h1>
    </>
  );
}

function Body() {
  const { walletInfo } = useWalletInfo();

  return (
    <Flex grow="1" justify="center" alignItems="center">
      {walletInfo ? <GameStart /> : <PromptForWalletConnect />}
    </Flex>
  );
}

function App() {
  return (
    <Flex direction="column" height="100vh">
      <Header />
      <Body />
      <Footer />
    </Flex>
  );
}

export default App;
