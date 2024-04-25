import { createContext, Dispatch, SetStateAction } from "react";
import { Container } from "pixi.js";

export interface AppState {
  board?: Container;
}

export interface AppContextType {
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
