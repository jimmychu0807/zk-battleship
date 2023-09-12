import { Stage } from '@pixi/react';
import BoardGrid from './BoardGrid';
import './App.css'

function App() {
  return <Stage options={{ antialias: true, autoDensity: true, backgroundColor: 0xeef1f5 }}>
    <BoardGrid />
  </Stage>
}

export default App
