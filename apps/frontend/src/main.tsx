import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

import { Web3ModalProvider } from "./components/Web3ModalProvider.js";
import App from "./App.tsx";
import "./index.css";

// Extend the theme to include custom colors, fonts, etc
const colors = {
  brand: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
  },
};

const theme = extendTheme({ colors });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Web3ModalProvider>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </Web3ModalProvider>
  </React.StrictMode>
);
