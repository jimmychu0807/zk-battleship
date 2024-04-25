pragma circom 2.1.4;

function TotalShip() {
  return 5;
}

function getBoardSize() {
  return 10;
}

function getEmptyBoard() {
  return [
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0]
  ];
}

function getShipLengths() {
  return [
    5, // Carrier
    4, // Battleship
    3, // Cruiser
    3, // Submarine
    2  // Destroyer
  ];
}
