import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";

import { Web3ModalProvider } from "./components/Web3ModalProvider";
import App from "./App";
import Home from "./pages/Home";
import Game, { loader as gameLoader } from "./pages/Game";

import "./index.css";

// Extend the theme to include custom colors, fonts, etc
const colors = {};
const theme = extendTheme({ colors });

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Home />} />
      <Route path="/game/:contractAddr" element={ <Game /> } />
    </Route>
  )
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Web3ModalProvider>
      <ChakraProvider theme={theme}>
        <RouterProvider router={router} />
      </ChakraProvider>
    </Web3ModalProvider>
  </React.StrictMode>
);
