import { useParams } from "react-router-dom";

export default function Game() {
  const urlParams = useParams();
  const { contractAddr } = urlParams;
  return <h1>Game Contract: { contractAddr }</h1>;
}
