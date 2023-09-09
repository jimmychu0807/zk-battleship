pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/poseidon.circom";

include "./consts.circom";

template ShipPosInit() {
  signal input nonce;
  signal input ships[5][3]; // [x, y, direction - 0: vertical, 1: horizontal]
  signal output out;

  var totalShip = TotalShip();
  var boardSize = getBoardSize();
  var lengths[5] = getShipLengths();
  var pts[boardSize][boardSize] = getEmptyBoard();

  for (var i = 0; i < totalShip; i++) {
    var len = lengths[i];
    assert(ships[i][0] >= 0 && ships[i][0] < boardSize);
    assert(ships[i][1] >= 0 && ships[i][1] < boardSize);
    assert(ships[i][2] == 0 || ships[i][2] == 1);

    // validate the ship doesn't overflow the board
    if (ships[i][2] == 0) {
      assert(ships[i][1] + lengths[i] < boardSize);
    } else {
      assert(ships[i][0] + lengths[i] < boardSize);
    }

    // validate no overlap
    for (var l = 0; l < len; l++) {
      var x_a = ships[i][2] == 0 ? 0 : l;
      var y_a = ships[i][2] == 0 ? l : 0;
      var x = ships[i][0] + x_a;
      var y = ships[i][1] + y_a;
      assert(pts[x][y] == 0);
      pts[x][y] = 1;
    }
  }

  component poseidon = Poseidon(6);
  poseidon.inputs[0] <== nonce;
  for (var i = 0; i < totalShip; i++) {
    // Poseidon takes in a series of numbers, so we serialize each ship position
    // to a number.
    // We know a battleship position is (0...9), so we can store our (x,y,p) array
    // as a 3-digit number, ie, [3,2,1] would become "123"
    poseidon.inputs[i+1] <== ships[i][0] + ships[i][1] * 10 + ships[i][2] * 100;
  }
  out <-- poseidon.out;
}

component main = ShipPosInit();
