import { Container, Text } from "@pixi/react";

export default function ShipPlate(props: { x: number; y: number }) {
  const { x, y } = props;
  return (
    <Container position={[x, y]}>
      <Text text="my ships here" />
    </Container>
  );
}
