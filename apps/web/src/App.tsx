import { Flex } from "@chakra-ui/react";

import { Outlet } from "react-router-dom";
import Header from "./pages/Header";
import Footer from "./pages/Footer";

function App() {
  return (
    <Flex direction="column" align="stretch" width="100vw">
      <Header />
      <Outlet />
      <Footer />
    </Flex>
  );
}

export default App;
