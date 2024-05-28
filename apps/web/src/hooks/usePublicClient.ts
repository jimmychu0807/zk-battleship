import { useContext } from "react";
import { PublicClientContext } from "../components/PublicClientContext";

export function usePublicClient(networkId: number) {
  const pcs = useContext(PublicClientContext);
  const pc = pcs[networkId];

  if (!pc) throw new Error("Undefined public client");
  return pc;
}
