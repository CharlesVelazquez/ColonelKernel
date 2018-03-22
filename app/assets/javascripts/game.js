// ************* constants *************

// grab instance info from rails generated html elements
const ROOM_NUMBER = parseInt(document.querySelectorAll('meta[name="roomnumber"]')[0].content);
const USER_NUMBER = parseInt(document.querySelectorAll('meta[name="usernumber"]')[0].content);

const PORT_NUMBER = ':3000'; // server port
const URL = window.location.hostname; // server url

const FRAME_RATE = 60; // frame rate for game/rendering loop

const PLAYER_SPEED = 1.2 / FRAME_RATE; // how fast player moves
const POP_PLACE_DELAY = 2000.0; // ms between placing pop corns
const POP_DELAY = 3000.0; // ms between pop corns popping
const POPING_LENGTH = 20; // how long poping animation is
const POP_TIMEOUT = 300; // how long after pop til kernel times out

const SIZE_DOWN = 0.90; // how much smaller than max should game area be
const DIRECTIONS = {
  LEFT: 1,
  UP: 2,
  RIGHT: 3,
  DOWN: 4,
  ALL: 5
}; // enums to make directions a bit more readable
const GAME_ACTIONS = {
  PLACE_POPCORN: 1,
  WALL: 2
}; // enums to make actions a bit more readable


// globals

var game; // will hold game
var keyState = {}; // keep track of which keys are down
var myPlayerIndex; // keep track of where in player array local player is

// ************* classes *************

class Game {
  constructor (inMap, inMapX, inMapY) {
    this.players = []; // class Player
    this.kernels = []; // class Kernel
    this.actionQueue  = []; // class LocalPlayerActions
    this.things = []; // class Thing

    this.nonce = 1; // keeps track of latest action number to transmit once
    this.thingNonce = 1;

    this.map = inMap;
    this.isReady = false;

    // this.map = [
    //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //   0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //   0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //   0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //   0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //   0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    //   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    // ];

    // there are two types of coordinates
    // pixelsXY, for which mapScale is used to convert to pixels
    // mapXY, where 1.0 is a length of a tile or square 
    // only drawing should care about pixels, all else in map coods

    this.mapScale = 50.0; // how many pixels in each square

    // this.mapSizeX = 11.0; // how many squares wide in map scale
    // this.mapSizeY = 11.0; // how many squares high in map scale
    this.mapSizeX = inMapX;
    this.mapSizeY = inMapY;


    this.totalX = this.mapSizeX * this.mapScale; // total X width in pixels
    this.totalY = this.mapSizeY * this.mapScale; // total Y height in pixels

    this.playerRadius = 1 / 4.0; // how wide player is
    this.kernelRadius = 1 / 3.0; // how wide kernels are
    this.popRadiusMax = 1 * 0.9 / 2.0; // widest pops grow
    
    this.outlineWidth = 1 / 16.0; // line thickness

    // this.players.push(new Player(1, 0.5, 0.5)); // add player

    document.addEventListener('keydown', key_down_handler, true);
    function key_down_handler (key_down_event) {
      keyState[key_down_event.keyCode || key_down_event.which] = true;
      // cross browser comatibility
    }
    document.addEventListener('keyup', key_up_handler, true);
    function key_up_handler (key_up_event) {
      keyState[key_up_event.keyCode || key_up_event.which] = false;
      // console.log('key up detected');
      // cross browser comatibility
    }

  }

  tryToPlaceKernel (localPlayer) {
    // check if time since last popcorn placed is long enough
    let rightNow = (new Date()).getTime();
    if (rightNow - localPlayer.lastPop > POP_PLACE_DELAY) {
      
      // this.placeLocalKernel(localPlayer); // this will have to be done in future from network data

      //  onsole.log(this.kernels); 
      localPlayer.lastPop = rightNow; // update local timer

      // add Kernel Placement action to queue for transmission
      // this actually does the action of attacking
      this.addAction(new LocalPlayerAction(this.nonce++, GAME_ACTIONS.PLACE_POPCORN));
    }
  }

  // creates object for animating kernel locally
  placeLocalKernel (inX, inY, inRange, in_db_id) {
    // create a new kernel
    // let lastIndex = this.kernels.push(new Kernel(
    //   localPlayer.X,
    //   localPlayer.Y,
    //   this.xyPositionToMapIndex(
    //     localPlayer.X,
    //     localPlayer.Y
    //   )
    // ));
    let lastIndex = this.kernels.push(
      new Kernel(
        inX,
        inY,
        inRange,
        in_db_id
      )
    ) - 1;

    // update it's X and Y to be at center of tile
    // this.kernels[lastIndex - 1].setXY({
    //   X:  this.mapIndexToXYPosition(
    //         this.kernels[lastIndex - 1].mapIndex
    //       ).centerX,
    //   Y:  this.mapIndexToXYPosition(
    //         this.kernels[lastIndex - 1].mapIndex
    //       ).centerY
    // }); 

    this.kernels[lastIndex].setXY({
      X:  Math.floor(this.kernels[lastIndex].X) + 0.5,
      Y:  Math.floor(this.kernels[lastIndex].Y) + 0.5
    }); 
  }

  addAction (inAction) {
    // add new action

    this.actionQueue.push(inAction);

  }

  updateActions () {
    // check which actions need to be removed from queue

    this.actionQueue.forEach((eaAction, eaActionIndex) => {
      if (eaAction.transmitted) {
        rmAction(eaActionIndex);
      }
    });
  }

  cleanActions () {
    // remove all actions
    this.actionQueue = [];
  }

  rmAction (inIndex) {
    this.actionQueue.splice(inIndex, 1);
  }

  updateMap (inMap) {
    this.map = inMap;
  }

  addPlayer (inPlayerID, inX, inY, isLocal = false) {
    this.players.push(new Player(inPlayerID, inX, inY, isLocal));
  }

  rmPlayer (inIndex) {
    this.players.splice(inIndex, 1);
  }

  resize (inX, inY) {
    this.totalX = inX; // total X width
    this.totalY = inY; // total Y height

    this.mapScale = this.totalX / this.mapSizeX; // how many pixels in each square
    
    this.playerRadius = 1 / 4; // how wide player is
    this.kernelRadius = 1 / 3; // how wide kernels are
    this.popRadiusMax = 1 * 0.9 / 2; // widest pops grow
  }

  eraseKernel (inIndex) {
    this.kernels.splice(inIndex, 1);
  }


  areCornersOk (inX, inY, inR = this.playerRadius, inStepX, inStepY) {
    // returns if all corners are clear for specific travel

    let cornerTR_X = inX + inR + inStepX;
    let cornerTR_Y = inY - inR + inStepY; 

    let cornerTL_X = inX - inR + inStepX;
    let cornerTL_Y = inY - inR + inStepY;

    let cornerBL_X = inX - inR + inStepX;
    let cornerBL_Y = inY + inR + inStepY;

    let cornerBR_X = inX + inR + inStepX;
    let cornerBR_Y = inY + inR + inStepY;

    // if all 4 corners are clear after the move, rule it's safe to do the move
    return (
      (cornerTR_X > 0) && (cornerTR_X <= this.mapSizeX)
      && (cornerTL_X > 0) && (cornerTL_X <= this.mapSizeX)
      && (cornerBL_X > 0) && (cornerBL_X <= this.mapSizeX)
      && (cornerBR_X > 0) && (cornerBR_X <= this.mapSizeX)

      && (cornerTR_Y > 0) && (cornerTR_Y <= this.mapSizeY)
      && (cornerTL_Y > 0) && (cornerTL_Y <= this.mapSizeY)
      && (cornerBL_Y > 0) && (cornerBL_Y <= this.mapSizeY)
      && (cornerBR_Y > 0) && (cornerBR_Y <= this.mapSizeY)

      && (this.map[this.xyPositionToMapIndex(cornerTR_X, cornerTR_Y)] === 0)
      && (this.map[this.xyPositionToMapIndex(cornerTL_X, cornerTL_Y)] === 0)
      && (this.map[this.xyPositionToMapIndex(cornerBR_X, cornerBR_Y)] === 0)
      && (this.map[this.xyPositionToMapIndex(cornerBL_X, cornerBL_Y)] === 0)
    ) ? true : false;
  }

  safeToTravel (inX, inY, inR = this.playerRadius, travelDistance = PLAYER_SPEED) {
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
    if (!this.areCornersOk(inX, inY, inR, -travelDistance, 0)) {
      freeTest.left = false;
    }

    if (!this.areCornersOk(inX, inY, inR, travelDistance, 0)) {
      freeTest.right = false;
    }

    if (!this.areCornersOk(inX, inY, inR, 0, -travelDistance)) {
      freeTest.up = false;
    }

    if (!this.areCornersOk(inX, inY, inR, 0, travelDistance)) {
      freeTest.down = false;
    }

    return freeTest;
  }


  xyPositionToMapIndex (posX, posY) {    
    // based on absolute position in X and Y determine what map tile index it's refering to
    // returns integer that equals to map index

    return this.mapSizeX * Math.floor(posY) + Math.floor(posX);
  }

  mapIndexToXYPosition (inIndex) {
    let tempPosition = {};
    
    tempPosition.centerX = (inIndex % this.mapSizeX) + 0.5;
    tempPosition.centerY = Math.floor(inIndex / this.mapSizeY) + 0.5;

    return tempPosition;
  }
  
  findMe () {
    
    myPlayerIndex = this.players.findIndex((element)=>{
      //  onsole.log(element.isLocal);
      return element.isLocal;
    });

    return myPlayerIndex;
  }

  checkKeysAndUpdateState () {

    // let player_id = 0;
    let player_id = this.findMe();

    let localPlayer = this.players[player_id];
    //  onsole.log('player_id', player_id);
    //  onsole.log('x ', localPlayer.X);
    //  onsole.log('y', localPlayer.Y);
    let isAlive = (localPlayer.lives > 0);
    
    let isFree = this.safeToTravel(localPlayer.X, localPlayer.Y); // minimize checks

    if ((keyState[localPlayer.keys.left] || keyState[65]) && isFree.left && isAlive) {
      localPlayer.X -= PLAYER_SPEED;
    }
    if ((keyState[localPlayer.keys.up] || keyState[87]) && isFree.up && isAlive) {
      localPlayer.Y -= PLAYER_SPEED;
    }
    if ((keyState[localPlayer.keys.right] || keyState[68]) && isFree.right && isAlive) {
      localPlayer.X += PLAYER_SPEED;
    }
    if ((keyState[localPlayer.keys.down] || keyState[83]) && isFree.down && isAlive) {
      localPlayer.Y += PLAYER_SPEED;
    }
    if (keyState[localPlayer.keys.action] || keyState[70] && isAlive) {
      game.tryToPlaceKernel(localPlayer);
    }

  }
}

class Player {
  constructor (inUserId = 1, inPlayerX = 0, inPlayerY = 0, inIsLocal = false) {
    this.player_id = null; // grab database ID when possible
    this.userId = inUserId;
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
    this.isLocal = inIsLocal; // is this the local player
    this.lives = 1;
  }
}

class LocalPlayerAction {
  constructor (inNonce, inType = 1) {
    this.nonce = inNonce; // number of action
    this.type = inType;
    // this.transmitted = false;
  }
}

class Kernel {
  constructor (inX, inY, inRange = 2.0, in_thing_id = null) {
    // user passes in X, Y, and map index where kernel is    
    this.X = inX; // X location
    this.Y = inY; // Y location
    this.spawnTime = (new Date()).getTime(); // get time of creation
    this.thing_id = in_thing_id; // grab database ID for the kernel when possible
    this.mapIndex = null; // grab index on map when possible
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

  constructor (inX, inY,  fiR, inR = 0, inP = 0, inDirection = DIRECTIONS.ALL, inRange = 2.0) {
    this.X = inX; // X pos
    this.Y = inY; // Y pos
    this.initialR = inR; // initialR
    this.finalR = fiR; // final R
    this.initialP = inP; // initial time progress
    this.direction = inDirection; // direction to create new corn
    this.rangeLeft = inRange;
    this.popTime = (new Date()).getTime();
    this.complete = false;
    
  }
} 

// ********** helper drawing functions *************

function drawMap () {
  // draw tiles
  
  game.map.forEach((tile_type, index) => {
    // ground tile is everywhere at the bottom
    // noStroke();
    stroke(color(113,191,137)); strokeWeight(game.outlineWidth * game.mapScale);
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
      stroke(0); strokeWeight(game.outlineWidth * game.mapScale);
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

    stroke(0); strokeWeight(game.outlineWidth * game.mapScale);

    let isAlive = (ea_player.lives > 0);


    // draw each player
    if (isAlive) {
      ellipse(
        ea_player.X * game.mapScale, // position X
        ea_player.Y * game.mapScale, // position Y
        game.playerRadius * 2 * game.mapScale, // size X
        game.playerRadius * 2 * game.mapScale // size Y
      );
    } else {
      textAlign(CENTER);
      stroke(255, 125);
      fill(color(ea_player.style.R, ea_player.style.G, ea_player.style.B, 125))
      strokeWeight(game.mapScale / 32)
      textSize(0.3 * game.mapScale);
      text(
        'REKT', 
        ea_player.X, 
        ea_player.Y, 
        1 * game.mapScale, 
        0.3 * game.mapScale
      );
    }
  });

}

function drawKernels () {
  // draw kernels

  // set style
  stroke(0); strokeWeight(game.outlineWidth * game.mapScale);  

  // draw each kernel
  game.kernels.forEach( (ea_kernel, ea_kernel_index) => {

    // grab fraction of time that has passed in popcorn
    let rightNow = (new Date()).getTime();
    let timeProgress = rightNow - ea_kernel.spawnTime;
    let phase = timeProgress / POP_DELAY; // normalized cooking  0-1

    // cooking render
    if (phase < 1) {
      // draw kernel

      fill(
        color(interpolate(220, 250, phase),
              interpolate(103, 250, phase),
              interpolate(10, 100, phase)
        )
      );  // rgb(220, 103, 10) rgb(250, 250, 100)
      
      stroke(0); strokeWeight(game.outlineWidth * game.mapScale);
      ellipse(
        ea_kernel.X * game.mapScale, // position X
        ea_kernel.Y * game.mapScale, // position Y
        interpolate(game.kernelRadius, game.kernelRadius * 2, phase) * game.mapScale, // size X
        interpolate(game.kernelRadius, game.kernelRadius * 2, phase) * game.mapScale // size Y
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
        ea_kernel.pop(game.popRadiusMax, game.kernelRadius, 0.7);
        //  onsole.log('first pop generated');
      }
    }
    
    let normPopTimer, normBurnTimer;
    // for each kernel, iterate through each pop event
    ea_kernel.pops.forEach((ea_pop) => {
      // normPopTimer is based on spawn time of each Pop
      // so Pop's spawned later will have fresh timer
      normPopTimer = ((rightNow - ea_pop.popTime) / POPING_LENGTH) + ea_pop.initialP;
      // after it pops, the popcorn burns and fades away during last 20% of time
      // offset makes sure popcorn stays white during first 80% of time
      normBurnTimer = ((rightNow - ea_kernel.spawnTime - POP_DELAY - POPING_LENGTH) / POP_TIMEOUT - 0.8) * 5;
      //  onsole.log(normBurnTimer);
      // draw ea pop
      noStroke();
      fill(
        interpolate(220, 0, normBurnTimer), // color R
        interpolate(240, 0, normBurnTimer), // color G
        interpolate(220, 0, normBurnTimer), // color B
        interpolate(255, 0, normBurnTimer) // opacity
      ); // rgb(220, 240, 220) to rgb(30, 30, 10)
      ellipse(
        ea_pop.X * game.mapScale,
        ea_pop.Y * game.mapScale,
        interpolate(ea_pop.initialR * 2, ea_pop.finalR * 2, normPopTimer) * game.mapScale,
        interpolate(ea_pop.initialR * 2, ea_pop.finalR * 2, normPopTimer) * game.mapScale
      );

      //  onsole.log(' ');
      //  onsole.log('timer: ', normPopTimer);
      //  onsole.log('complete? ', ea_pop.complete);
      if (normPopTimer >= 1 && ea_pop.complete == false) {
        ea_pop.complete = true;
        
        
        if (ea_pop.direction == DIRECTIONS.ALL && ea_pop.rangeLeft > 0) {
          genLeft();
          genRight();
          genDown();
          genUp();
        }

        if (ea_pop.direction == DIRECTIONS.LEFT && ea_pop.rangeLeft > 0) {
          genLeft();
        }

        if (ea_pop.direction == DIRECTIONS.RIGHT && ea_pop.rangeLeft > 0) {
          genRight();
        }

        if (ea_pop.direction == DIRECTIONS.UP && ea_pop.rangeLeft > 0) {
          genUp();
        }

        if (ea_pop.direction == DIRECTIONS.DOWN && ea_pop.rangeLeft > 0) {
          genDown();
        }

        function genLeft () {
          game.safeToTravel(ea_pop.X, ea_pop.Y, 0, 1).left && // if
            ea_kernel.pops.push(
              new Pop(
                ea_pop.X - ea_pop.finalR,
                ea_pop.Y,
                game.popRadiusMax,
                0,
                0,
                DIRECTIONS.LEFT,
                ea_pop.rangeLeft - ea_pop.finalR
              )
            );
          

          //  onsole.log('pop to the left generated!');
        }

        function genRight () {
          game.safeToTravel(ea_pop.X, ea_pop.Y, 0, 1).right && // if
            ea_kernel.pops.push(
              new Pop(
                ea_pop.X + ea_pop.finalR,
                ea_pop.Y,
                game.popRadiusMax,
                0,
                0,
                DIRECTIONS.RIGHT,
                ea_pop.rangeLeft - (ea_pop.finalR)
              )
            );
          //  onsole.log('pop to the left generated!');
        }

        function genUp () {
          game.safeToTravel(ea_pop.X, ea_pop.Y, 0, 1).up && // if
            ea_kernel.pops.push(
              new Pop(
                ea_pop.X,
                ea_pop.Y - ea_pop.finalR,
                game.popRadiusMax,
                0,
                0,
                DIRECTIONS.UP,
                ea_pop.rangeLeft - (ea_pop.finalR)
              )
            );
          //  onsole.log('pop to the top generated!');
        }

        function genDown () {
          game.safeToTravel(ea_pop.X, ea_pop.Y, 0, 1).down && // if
            ea_kernel.pops.push(
              new Pop(
                ea_pop.X,
                ea_pop.Y + ea_pop.finalR,
                game.popRadiusMax,
                0,
                0,
                DIRECTIONS.DOWN,
                ea_pop.rangeLeft - (ea_pop.finalR)
              )
            );
          //  onsole.log('pop to the bottom generated!');
        }

        //  onsole.log(ea_kernel.pops);
      }

    });

    if (popProgress > POP_TIMEOUT) {
      // erase the kernel that times out
      game.eraseKernel(ea_kernel_index);
    }
      
    
    

  });
}

// ********** helper math functions *************

function interpolate (inI, inF, inPosition, inCutOff = true) {
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
    : inPosition; // no cut-off, no change
  

  return inI + (inF - inI) * temp;
}

// ********************************************
// *********** p5.js main functions ***********
// ********************************************

// p5.js: runs before setup loop
function preload () {
  // this preloads before the rest
  // img = loadImage('cat.jpg');
}

// p5.js: runs once before draw loop
function setup () {

  getGameStateInitial();
  // developerConsole();
}

// p5.js's method that runs in a loop
// used for game render loop
function draw () {

  if (game? game.isReady : false) {
    //  onsole.log(game);

    background(0); // clear canvas
    drawMap(); // draw tiles
    
    drawKernels(); // draw kernels
    drawPlayers(); // draw players

    game.checkKeysAndUpdateState(); // get player input & update data

    // textAlign(CENTER);
    // stroke(255, 125);
    // fill(0, 125)
    // strokeWeight(1)
    // textSize(0.3*game.mapScale);
    // text('Testing text ksdjflskdfjsldkfjlsdkfj', 200, 150, 1*game.mapScale, 0.3*game.mapScale);
    // text('Testing text ksdjflskdfjsldkfjlsdkfj', 200, 400);
  }
}

// whenever window is resized
function windowResized() {

  if (game && game.isReady) {
    // get X/Y ratio for game window for this map
    let gameRatio = game.totalX / (1.0 * game.totalY);

    // get X/Y ratio for game window for this map
    let windowRatio = windowWidth / (1.0 * windowHeight);

    // if game ratio is bigger than window ratio, let window width decide play area
    // if game ratio is less than window ratio, let window height decide play area

    if (gameRatio > windowRatio) {
      resizeCanvas(windowWidth * SIZE_DOWN | 0, windowWidth / gameRatio * SIZE_DOWN | 0);
      game.resize(windowWidth * SIZE_DOWN | 0, windowWidth / gameRatio * SIZE_DOWN | 0);
    } else {
      resizeCanvas(windowHeight * gameRatio * SIZE_DOWN | 0, windowHeight * SIZE_DOWN | 0);
      game.resize(windowHeight * gameRatio * SIZE_DOWN | 0, windowHeight * SIZE_DOWN | 0);
    }
  }
  
}

// ********* Network data Functions ************

// create game based on data from server
function getGameStateInitial () {

  let url = '/rooms_api_passive/' + ROOM_NUMBER;

  fetch(url)
  .then(res => res.json())
  .then((res) => {
    
    // update map
    game = new Game(res.map_info.map, res.map_info.map_max_x, res.map_info.map_max_y);

    // sets up drawing based on map
    var canvas = createCanvas(game.totalX, game.totalY); // create canvas
    canvas.parent('room'); // place canvas into div with id 'main'
    canvas.class("room-c"); // give canvas a name
    frameRate(FRAME_RATE); // rendering frame rate

    // update players
    res.player_info.forEach((ea_player, ea_index)=>{

      isThisMe = ea_player.user_id === USER_NUMBER ? true : false;   // current_user match player's user_id?

      if (isThisMe) {
        // onsole.log('localplayer x=' , ea_player.game_x, '  , y=', ea_player.game_y);
      }

      game.addPlayer(
        ea_player.user_id,                                  // user id of this player
        ea_player.game_x,                                   // x location of this player
        ea_player.game_y,                                   // y location of this player
        isThisMe                                            // is this player the signed in user
      );

    });

    // update things - mostly prevent from old mines from being drawn
    // will need rework on getting timeouts of existing mines rather than ignoring
    // (to do)
    res.things.forEach((eachServerThing) => {
      if (eachServerThing.id > game.thingNonce) {
        game.thingNonce = eachServerThing.id;
      }

    });

    game.isReady = true;
    windowResized();

    sendGameState();
  })
  .catch(err => {
    //  onsole.log(err)
  }); // throw err

}

// depreciated in favor of response from sending data & getting response in 1 go
// gets all info from server
function getGameStateOld () {
  //  onsole.log('preloadGame() ran');

  let url = '/rooms_api/' + ROOM_NUMBER;

  fetch(url)
  .then(response => response.json())
  .then((res) => {

    res.player_info.forEach((ea_server_player, ea_server_player_index) => {

      // here I have to update current players if they already exist
      // if they do not exist, I add new players
      // if they existed but no longer do, remove them

      // does ea_player's user_id match any current player's user_id?      
      indexOfClientPlayerMatch = game.players.findIndex((clientPlayer) => {
        
        return clientPlayer.userId == ea_server_player.user_id;
      });

      isThisMe = ea_server_player.user_id === USER_NUMBER ? true : false;   // current_user match player's user_id?

      if (isThisMe) {
        //  onsole.log('localplayer x=' , ea_server_player.game_x, '  , y=', ea_server_player.game_y);
      }

      if (indexOfClientPlayerMatch > -1) {
        // if match existing, update existing players at found index
        game.players[indexOfClientPlayerMatch].X = ea_server_player.game_x;
        game.players[indexOfClientPlayerMatch].Y = ea_server_player.game_y;
        game.players[indexOfClientPlayerMatch].isLocal = isThisMe;
      } else {
        // if match doesn't exist, add the player
        game.addPlayer(
          ea_server_player.user_id,                          // user id of this player
          ea_server_player.game_x,                           // x location of this player
          ea_server_player.game_y,                           // y location of this player
          isThisMe                                           // is this player the signed in user
        );
      }

    });

    game.isReady = true; // mark game as ready to start render loop

    sendGameState();

  })
  .catch(err => {
    //  onsole.log(err)
  });

}

// processes info received (get/gotten) from server
function analyzeServerResponse (res) {

  // update players 
  updateLocalPlayersFromResponse(res);

  // update map
  game.updateMap(res.map_info.map);

  // update things, now only one type of thing, in future could be more (to do)
  updateThingsFromResponse(res);

}

function updateThingsFromResponse (res) {

  

  res.things.forEach((eachServerThing, eachServerThingIndex) => {

    // have to compare server kernels vs existing and only create
    // if it wasn't found on client side
    // client takes care of clearing old kernels
    // database takes care of clearing their kernels

    indexOfClientThingMatch = game.things.findIndex((clientThing) => {
      return clientThing.in_db_id == eachServerThing.id;
    });


    if (indexOfClientThingMatch < 0) {
      if (game.thingNonce < eachServerThing.id) {
        // if highest num thing added to the game is older than this thing
        // update highest num thing added to local game

        game.thingNonce = eachServerThing.id; 
        
        // and render the new thing locally
        game.placeLocalKernel(
          eachServerThing.game_x,
          eachServerThing.game_y,
          eachServerThing.strength,
          eachServerThing.id
        )
      }

      // onsole.log(game.kernels);
    }

    
  });

  
}

function updateLocalPlayersFromResponse (res) {

  res.player_info.forEach((ea_server_player, ea_server_player_index) => {

    // here I have to update current players if they already exist
    // if they do not exist, I add new players
    // if they existed but no longer do, remove them

    // does ea_player's user_id match any current player's user_id?      
    indexOfClientPlayerMatch = game.players.findIndex((clientPlayer) => {
      
      return clientPlayer.userId == ea_server_player.user_id;
    });

    // check if current_user match player's user_id?
    isThisMe = ea_server_player.user_id === USER_NUMBER ? true : false;

    // if (isThisMe) {
      //  onsole.log('localplayer x=' , ea_server_player.game_x, '  , y=', ea_server_player.game_y);
    // }

    if (indexOfClientPlayerMatch > -1 && !isThisMe) {
      // if match existing, update existing players at found index
      game.players[indexOfClientPlayerMatch].X = ea_server_player.game_x;
      game.players[indexOfClientPlayerMatch].Y = ea_server_player.game_y;
      game.players[indexOfClientPlayerMatch].isLocal = isThisMe;
    } else if (indexOfClientPlayerMatch > -1 && isThisMe) {
      // if this is the local player,
      // check if the server rejected the last move via rejection flag
      // no point not to update since server didn't update with the move
      // security thing. (to do)      
      game.players[indexOfClientPlayerMatch].lives = ea_server_player.lives
    } else {
      // if match doesn't exist, add the player
      game.addPlayer(
        ea_server_player.user_id,                          // user id of this player
        ea_server_player.game_x,                           // x location of this player
        ea_server_player.game_y,                           // y location of this player
        isThisMe                                           // is this player the signed in user
      );
    }

    
  });

  // there can still be client players that don't exist on server anymore for this room
  // so opposite search might be easiest
  // look for local players which ones can't be found in server player list
  // and remove them from local list
  game.players.forEach((ea_local_player, ea_local_player_index) => {
    indexOfServerPlayerMatch = res.player_info.findIndex((serverPlayer) => {
      return serverPlayer.user_id == ea_local_player.userId;
    });
    if (indexOfServerPlayerMatch < 0) {
      game.rmPlayer(ea_local_player_index);
    }
  });
}
// sends this player info to server
function sendGameState () {
  
  myPlayerIndex = game.findMe();

  let dataForSending = JSON.stringify({
    X: game.players[myPlayerIndex].X,
    Y: game.players[myPlayerIndex].Y,
    game_actions: game.actionQueue
  });

  // onsole.log('sent: ', dataForSending);

  // erase all old actions now
  game.cleanActions();
  
  // very last action after sending is receiving data
  // and sending that data to analyzeServerResponse function
  // and only after re-running this function

  $.ajax({ url: '/rooms_api/' + ROOM_NUMBER,
    type: 'POST',
    headers: { 'X-CSRF-Token': Rails.csrfToken() },
    data: dataForSending,
    contentType : 'application/json',
    error: function(xhr){ 
      // alert("ERROR ON SUBMIT");
      //  onsole.log('error on submit');
      //  onsole.log(xhr);
    },
    success: function(res){ 
      //data response can contain what we want here...
      //  onsole.log("successful send");
      // onsole.log('response from sending game state is:');
      // onsole.log(res);

      // getGameState(); // try to get game state
      // onsole.log(res);

      analyzeServerResponse(res); // update the board based on received data
      sendGameState(); // testing repeating send game state call instead
    }
  });

  
 
}

// mouse click event (for testing only) (p5 lib)
function mousePressed () {
  // testing only
  // getGameState();
  // sendGameState();
}

// function developerConsole () {
  // let div = document.createElement("div");
  // document.body.appendChild(div);

  // div.style.width = "100px";
  // div.style.height = "100px";
  // div.style.background = "darkgrey";
  // div.style.color = "white";
  // div.style.position = "absolute";  
  // div.setAttribute('draggable', true);
  // // div.innerHTML = 'Console<br>';
  // div.style.left = "10px";
  // div.style.top = "10px";

// }


// ******* trashed but maybe for future use? **********

/** 
    // you have got to be kidding me, tag name capitalization might be the issue with fetch command....
    // https://github.com/github/fetch/issues/478


    let url = 'http://localhost:3000/rooms_api/' + ROOM_NUMBER;
    let CSRF_TOKEN = document.querySelectorAll('meta[name="csrf-token"]')[0].content;
    onsole.log('CSRF token should be: ', CSRF_TOKEN)

    

    let messageBeingSent = {
      method: 'POST',
      body: JSON.stringify(dataForSending),
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'X-CSRF-Token': CSRF_TOKEN
      }
    }

     onsole.log('sendGameState() is sending this:');
     onsole.log(messageBeingSent);

    fetch(url, messageBeingSent).then((res) => {
       onsole.log('Sent data. Got response back: ', res);
    }).catch((err) => {
       onsole.log('Caught error: '); 
       onsole.log(err);
    });
*/

// beforeSend: function(xhr) {xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content'))},

