// constants

const PLAYER_SPEED = 0.05; // how fast player moves
const POP_PLACE_DELAY = 3000.0; // ms between placing pop corns
const POP_DELAY = 3000.0; // ms between pop corns popping
const POPING_LENGTH = 500; // how long poping animation is
const DIRECTIONS = {
  LEFT: 1,
  UP: 2,
  RIGHT: 3,
  DOWN: 4,
  ALL: 5
}; // enums to make directions a bit more readable


// globals

var game; // will hold game
var keyState = {}; // keep track of which keys are down

// classes

class Game {
  constructor () {
    this.players = [];
    this.kernels = [];

    this.map = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];

    this.mapScale = 50.0; // how many pixels in each square
    
    this.mapSizeX = 11; // how many squares wide
    this.mapSizeY = 11; // how many squares high
    this.totalX = this.mapSizeX * this.mapScale;
    this.totalY = this.mapSizeY * this.mapScale;

    this.playerRadius = this.mapScale / 4; // how wide player is
    this.kernelRadius = this.mapScale / 3; // how wide kernels are

    this.players.push(new Player(1, this.mapScale / 2, this.mapScale / 2)); // add player

    document.addEventListener('keydown', key_down_handler, true);
    function key_down_handler (key_down_event) {
      keyState[key_down_event.keyCode || key_down_event.which] = true;
    }
    document.addEventListener('keyup', key_up_handler, true);
    function key_up_handler (key_up_event) {
      keyState[key_up_event.keyCode || key_up_event.which] = false;
    }
  }

  areCornersOk (playerId, inStepX, inStepY) {
    // checks all 4 corners
    // var self = this;

    let cornerTR_X = this.players[playerId].X + this.playerRadius + inStepX;
    let cornerTR_Y = this.players[playerId].Y - this.playerRadius + inStepY;

    let cornerTL_X = this.players[playerId].X - this.playerRadius + inStepX;
    let cornerTL_Y = this.players[playerId].Y - this.playerRadius + inStepY;

    let cornerBL_X = this.players[playerId].X - this.playerRadius + inStepX;
    let cornerBL_Y = this.players[playerId].Y + this.playerRadius + inStepY;

    let cornerBR_X = this.players[playerId].X + this.playerRadius + inStepX;
    let cornerBR_Y = this.players[playerId].Y + this.playerRadius + inStepY;

    // if all 4 corners are clear after the move, rule it's safe to do the move
    return (cornerTR_X > 0) && (cornerTR_X <= this.totalX)
      && (cornerTL_X > 0) && (cornerTL_X <= this.totalX)
      && (cornerBL_X > 0) && (cornerBL_X <= this.totalX)
      && (cornerBR_X > 0) && (cornerBR_X <= this.totalX)

      && (cornerTR_Y > 0) && (cornerTR_Y <= this.totalY)
      && (cornerTL_Y > 0) && (cornerTL_Y <= this.totalY)
      && (cornerBL_Y > 0) && (cornerBL_Y <= this.totalY)
      && (cornerBR_Y > 0) && (cornerBR_Y <= this.totalY)

      && (this.map[this.positionToMapIndex(cornerTR_X, cornerTR_Y)] === 0)
      && (this.map[this.positionToMapIndex(cornerTL_X, cornerTL_Y)] === 0)
      && (this.map[this.positionToMapIndex(cornerBR_X, cornerBR_Y)] === 0)
      && (this.map[this.positionToMapIndex(cornerBL_X, cornerBL_Y)] === 0)
        ? true : false;
  }

  positionToMapIndex (posX, posY) {    
    // based on absolute position in X and Y determine what map tile index it's refering to
    // returns integer that equals to map index

    return this.mapSizeX * Math.floor(posY / this.mapScale) + Math.floor(posX / this.mapScale);
  }

  mapIndexToPosition (inIndex) {
    let tempPosition = {};
    
    tempPosition.centerX = (inIndex % this.mapSizeX) * this.mapScale + this.mapScale / 2;
    tempPosition.centerY = Math.floor(inIndex / this.mapSizeY) * this.mapScale + this.mapScale / 2;

    return tempPosition;
  }

  safeToTravel (playerId = 0) {
    // returns which directions it's safe to travel
    // return true if can move that direction
    // collision detection

    // by default set safe to travel to true
    let freeTest = {
      left: true,
      up: true,
      right: true,
      down: true
    };
    
    // if attempted move is not safe, disable it
    if (!this.areCornersOk(playerId, -PLAYER_SPEED * this.mapScale, 0)) {
      freeTest.left = false;
    }

    if (!this.areCornersOk(playerId, PLAYER_SPEED * this.mapScale, 0)) {
      freeTest.right = false;
    }

    if (!this.areCornersOk(playerId, 0, - PLAYER_SPEED * this.mapScale)) {
      freeTest.up = false;
    }

    if (!this.areCornersOk(playerId, 0, PLAYER_SPEED * this.mapScale)) {
      freeTest.down = false;
    }

    return freeTest;
  }

  checkKeys () {

    // var self = this;
    
    let isFree = this.safeToTravel(0); // minimize checks

    if (keyState[this.players[0].keys.left] && isFree.left) {
      this.players[0].X -= PLAYER_SPEED * this.mapScale;
    }
    if (keyState[this.players[0].keys.up] && isFree.up) {
      this.players[0].Y -= PLAYER_SPEED * this.mapScale;
    }
    if (keyState[this.players[0].keys.right] && isFree.right) {
      this.players[0].X += PLAYER_SPEED * this.mapScale;
    }
    if (keyState[this.players[0].keys.down] && isFree.down) {
      this.players[0].Y += PLAYER_SPEED * this.mapScale;
    }
    if (keyState[this.players[0].keys.action]) {
      // if action key pressed, check if time since last popcorn placed is long enough
      let rightNow = (new Date()).getTime();
      if (rightNow - this.players[0].lastPop > POP_PLACE_DELAY) {
        // create a new kernel
        let lastIndex = this.kernels.push(new Kernel(
          this.players[0].X,
          this.players[0].Y,
          this.positionToMapIndex(
            this.players[0].X,
            this.players[0].Y
          )
        ));
        // update it's X and Y to be at center of tile
        this.kernels[lastIndex - 1].setXY({
          X:  this.mapIndexToPosition(
                this.kernels[lastIndex - 1].mapIndex
              ).centerX,
          Y:  this.mapIndexToPosition(
                this.kernels[lastIndex - 1].mapIndex
              ).centerY
        }); 
          
        
        console.log(this.kernels); 
        this.players[0].lastPop = rightNow; // place popcorn
      }
    }

  }
}

class Player {
  constructor (inPlayerId = 1, inPlayerX = 0, inPlayerY = 0) {
    this.databaseID = null; // grab database ID when possible
    this.playerId = inPlayerId;
    this.X = inPlayerX;
    this.Y = inPlayerY;
    this.keys = {
      right: 39, // right arrow
      left: 37,  // left arrow
      up: 38, // up arrow
      down: 40, // down arrow
      action: 191 // forward slash '/'    
    }
    this.lastPop = 0; // last time pop corn placed
    this.style = {
      R: Math.random() * 255 | 0,
      G: Math.random() * 255 | 0,
      B: Math.random() * 255 | 0
    }
  }
}

class Kernel {
  constructor (inX, inY, inMapIndex = null, inRange = 3) {
    // user passes in X, Y, and map index where kernel is    
    this.X = inX; // X location
    this.Y = inY; // Y location
    this.spawnTime = (new Date()).getTime(); // get time of creation
    this.databaseID = null; // grab database ID for the kernel when possible
    this.mapIndex = inMapIndex; // grab index on map when possible
    this.range = inRange; // how far kernels reach
    this.pops = []; // poping objects
  }

  setXY (inXY) {
    this.X = inXY.X;
    this.Y = inXY.Y;
  }

  pop (fiR, inR = 0, inP = 0) {
    this.pops.push(new Pop(this.X, this.Y, fiR, inR, inP, DIRECTIONS.ALL, this.range));
  }
}

class Pop {
  // this is a class for local animations that don't need to be passed
  // to server, but when randomly generated (like in popcorn popping)
  // can keep track of the animation state being generated
  // this is spawned both by specific kernel

  constructor (inX, inY,  fiR, inR = 0, inP = 0, inDirection = DIRECTIONS.ALL, inRange = 3) {
    this.X = inX; // X pos
    this.Y = inY; // Y pos
    this.initialR = inR; // initialR
    this.finalR = fiR; // final R
    this.initialP = inP; // initial time progress
    this.direction = inDirection; // direction to create new corn
    this.rangeLeft = inRange;
    this.popTime = (new Date()).getTime();
    console.log('pop popppp!!');
  }
} 

// main helper functions

function drawMap () {
  // draw tiles
  
  game.map.forEach((tile_type, index) => {
    // ground tile is everywhere at the bottom
    noStroke();
    fill(color(113,191,137));  // rgb(113, 191, 137)
    rect(
      (index % game.mapSizeX) * game.mapScale, // position X
      Math.floor(index / game.mapSizeY) * game.mapScale, // position Y
      game.mapScale, // height X
      game.mapScale // height Y
    );
  });

  game.map.forEach((tile_type, index) => {
    
    

    // undestructable tile
    if (tile_type === 1) {
      // noStroke();
      stroke(0); strokeWeight(3);
      fill(30, 87, 255); // rgb(30, 87, 255)
      rect(
        (index % game.mapSizeX) * game.mapScale, // position X
        Math.floor(index / game.mapSizeY) * game.mapScale, // position Y
        game.mapScale, // height X
        game.mapScale, // height Y
        game.mapScale / 5 // rounded corners
      );
    }

  });
}

function drawPlayers () {

  // draw each player:
  game.players.forEach( (ea_player, player_index) => {
    // set each style
    fill(color(ea_player.style.R, ea_player.style.G, ea_player.style.B));

    stroke(0); strokeWeight(2);

    // draw each player
    ellipse(
      ea_player.X, // position X
      ea_player.Y, // position Y
      game.playerRadius * 2, // size X
      game.playerRadius * 2 // size Y
    );
  });

}

function drawKernels () {
  // draw kernels

  // set style
  stroke(0); strokeWeight(3);
  

  // calculate radius based on time alive
  

  // draw each kernel
  game.kernels.forEach( (ea_kernel) => {
    let centeredX = ea_kernel.X;
    let centeredY = ea_kernel            .Y;

    // grab fraction of time that has passed in popcorn
    let rightNow = (new Date()).getTime();
    let timeProgress = rightNow - ea_kernel.spawnTime;
    let phase = timeProgress / POP_DELAY; // normalized cooking  0-1

    // cooking render
    if (phase < 1) {
      fill(
        color(interpolate(220, 250, phase),
              interpolate(103, 250, phase),
              interpolate(10, 100, phase)
        )
      );  // rgb(220, 103, 10) rgb(250, 250, 100)

      // draw
      ellipse(
        centeredX, // position X
        centeredY, // position Y
        interpolate(game.kernelRadius, game.kernelRadius * 2, phase), // size X
        interpolate(game.kernelRadius, game.kernelRadius * 2, phase) // size Y
      );
    }

    let popProgress = rightNow - ea_kernel.spawnTime - POP_DELAY;
    // let popPhase = popProgress / POPING_LENGTH; // normalized animation 0-1

    // poping render
    if (popProgress > 0) {
      // popping will spawn a circle that will expand rapidly
      // when it reaches some radius, it will spawn other circles

      // if popcorn hasn't pop'ed yet, pop it
      if (ea_kernel.pops.length === 0) {
        ea_kernel.pop(game.mapScale * 0.9, game.kernelRadius * 2, 0.7);
      }
    }
   
    // for each kernel, iterate through each pop event
    ea_kernel.pops.forEach((ea_pop) => {
      normPopTimer = (rightNow - ea_pop.popTime) / POPING_LENGTH; // 0-1
      stroke(0); strokeWeight(3);
      fill(220, 240, 220); // rgb(220, 240, 220)
      ellipse(ea_pop.X,
              ea_pop.Y,
              interpolate(ea_pop.initialR, ea_pop.finalR, normPopTimer + ea_pop.initialP),
              interpolate(ea_pop.initialR, ea_pop.finalR, normPopTimer + ea_pop.initialP));
    });

      
    
    

  });
}

function interpolate(inI, inF, inPosition, inCutOff = true) {
  // inI - initial value
  // inF - final value
  // inPosition 0-1 float for where
  // returns value at inProgress fraction between inI and inF

  // if cut off allowed, position is limited to values between 0 and 1
  let temp = inCutOff ? 
    (inPosition > 1 ?
      1
      : (inPosition < 0 ?
        0
        : inPosition
      )
    )
    : inPosition;
  

  return inI + (inF - inI) * temp;
}

// ********************************************
// *********** p5.js main functions ***********
// ********************************************

// p5.js: runs before
function preload() {
  // this preloads before the rest
  // img = loadImage('cat.jpg');
}

// p5.js: runs once
function setup() {
  game = new Game();

  var canvas = createCanvas(game.totalX, game.totalY); // create canvas
  canvas.parent('main'); // place canvas into div with id 'main'
  canvas.class("main-c"); // give canvas a name
  frameRate(60); // rendering frame rate
  
}

// p5.js: runs in a loop
function draw() {
  game.checkKeys(); // get player input & update data

  background(0); // clear canvas
  drawMap(); // draw tiles
  drawPlayers(); // draw players
  drawKernels(); // draw kernels
  
}