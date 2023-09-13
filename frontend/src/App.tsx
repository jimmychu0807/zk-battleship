import { Stage } from '@pixi/react';
import BoardGrid from './BoardGrid';
import ShipSprites from './ShipSprites';

import './App.css'

function App() {
  return <Stage options={{ antialias: true, autoDensity: true, backgroundColor: 0xeef1f5 }}>
    <BoardGrid />
    <ShipSprites ship="aircraftCarrier" row={0} col={0}/>
    <ShipSprites ship="warship" row={3} col={5}/>
  </Stage>
}

export default App
