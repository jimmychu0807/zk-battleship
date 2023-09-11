// import { useState } from 'react'
import { Stage, Container, Text } from '@pixi/react';

import './App.css'

function App() {
  return <Stage options={{ backgroundColor: 0xeef1f5 }}>
    <Container position={[150, 150]}>
      <Text text="Battleship" anchor={{ x: 0.5, y: 0.5 }}/>
    </Container>
  </Stage>
}

export default App
