export type ColliderData = {
  n0: Array<number>
  nN: Array<number>
  nS: Array<number>
  nE: Array<number>
  nW: Array<number>
  nNE: Array<number>
  nSE: Array<number>
  nNW: Array<number>
  nSW: Array<number>
  rho: Array<number>
  ux: Array<number>
  uy: Array<number>
  barrier?: Array<boolean>
}

// abbreviations
export const four9ths = 4.0 / 9.0;
export const one9th = 1.0 / 9.0;
export const one36th = 1.0 / 36.0;
// Functions to convert rgb to hex color string (from stackoverflow):
export function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}
export function rgbToHex(r: number, g: number, b: number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export type CfdOptions = {
  canvas: HTMLCanvasElement,
  precision: number,
  speed: number,
  viscosity: number,
  contrast: number,
  animationPrecision: number,
  browserAnim: boolean,
  rho?:number
}

export class Cfd {
  canvas: HTMLCanvasElement;
  image: ImageData;
  precision: number;
  animationPrecision: number;
  dimensions: {
    x: number,
    y: number
  } = {x:0,y:0};
  speed: number;
  equilRho: number = 1;
  viscosity: number;
  contrast: number;
  running: boolean = false;
  stepCount: number = 0;
  startTime: number = 0;
  browserAnim: boolean;
  n0: Array<number>
  nN: Array<number>
  nS: Array<number>
  nE: Array<number>
  nW: Array<number>
  nNE: Array<number>
  nSE: Array<number>
  nNW: Array<number>
  nSW: Array<number>
  rho: Array<number>
  ux: Array<number>
  uy: Array<number>
  curl: Array<number>
  barrier: Array<boolean>
  nColors: number;
  hexColorList: any[];
  redList: any[];
  greenList: any[];
  blueList: any[];
  barrierCount: number;
  barrierxSum: number;
  barrierySum: number;
  barrierFx: number;
  barrierFy: number;
  collectingData: boolean;
  time: number;
  showingPeriod: boolean;
  lastBarrierFy: number;
  lastFyOscTime: number;
  speedReadout: number = 0;
  speedReadoutElt?: HTMLElement;
  plotType: number = 0;
  worker?: Worker;
  fb: Array<ColliderData> = [];
  buffer: boolean = false;
  pulser?:any;

  constructor(options: CfdOptions) {
    this.canvas = options.canvas;
    // for direct pixel manipulation (faster than fillRect)
    // @ts-ignore
    this.image = this.context?.createImageData(this.canvas.width, this.canvas.height);
    // set all alpha values to opaque
    for (var i=3; i<this.image.data.length; i+=4) this.image.data[i] = 255;
    
    // set precision
    this.precision = options.precision;
    if (this.precision === 0) {
      this.precision = 1;
    }

    // grid dimensions for simulation
    this.dimensions.x = this.canvas.width / this.precision;
    this.dimensions.y = this.canvas.height / this.precision;
    
    this.speed = options.speed;
    this.animationPrecision = options.animationPrecision;
    this.viscosity = options.viscosity;
    if (options.rho !== undefined) {
      this.equilRho = options.rho;
    }
    this.contrast = options.contrast;
    this.browserAnim = options.browserAnim;

    this.resetTimer();
    
    this.barrierCount = 0;
    this.barrierxSum = 0;
    this.barrierySum = 0;
    this.barrierFx = 0.0;						// total force on all barrier sites
    this.barrierFy = 0.0;
    var sensorX = this.dimensions.x / 2;						// coordinates of "sensor" to measure local fluid properties	
    var sensorY = this.dimensions.y / 2;
    var draggingSensor = false;
    var mouseIsDown = false;
    var mouseX, mouseY;							// mouse location in this.canvas coordinates
    var oldMouseX = -1, oldMouseY = -1;			// mouse coordinates from previous simulation frame
    this.collectingData = false;
    this.time = 0;								// time (in simulation step units) since data collection started
    this.showingPeriod = false;
    this.lastBarrierFy = 1;						// for determining when F_y oscillation begins
    this.lastFyOscTime = 0;						// for calculating F_y oscillation period

    // this.canvas.addEventListener('mousedown', () => {
    //   this.mouseDown();
    // }, false);
    // this.canvas.addEventListener('mousemove', () => {
    //   this.mouseMove();
    // }, false);
    // document.body.addEventListener('mouseup', () => {
    //   this.mouseUp();
    // }, false);	// button release could occur outside this.canvas
    // this.canvas.addEventListener('touchstart', () => {
    //   this.mouseDown();
    // }, false);
    // this.canvas.addEventListener('touchmove', () => {
    //   this.mouseMove();
    // }, false);
    // document.body.addEventListener('touchend', () => {
    //   this.mouseUp();
    // }, false);

    // Create the arrays of fluid particle densities, etc. (using 1D arrays for speed):
    // To index into these arrays, use x + y*this.dimensions.x, traversing rows first and then columns.
    this.n0 = new Array(this.dimensions.x*this.dimensions.y);			// microscopic densities along each lattice direction
    this.nN = new Array(this.dimensions.x*this.dimensions.y);
    this.nS = new Array(this.dimensions.x*this.dimensions.y);
    this.nE = new Array(this.dimensions.x*this.dimensions.y);
    this.nW = new Array(this.dimensions.x*this.dimensions.y);
    this.nNE = new Array(this.dimensions.x*this.dimensions.y);
    this.nSE = new Array(this.dimensions.x*this.dimensions.y);
    this.nNW = new Array(this.dimensions.x*this.dimensions.y);
    this.nSW = new Array(this.dimensions.x*this.dimensions.y);
    this.rho = new Array(this.dimensions.x*this.dimensions.y);			// macroscopic density
    this.ux = new Array(this.dimensions.x*this.dimensions.y);			// macroscopic velocity
    this.uy = new Array(this.dimensions.x*this.dimensions.y);
    this.curl = new Array(this.dimensions.x*this.dimensions.y);
    this.barrier = new Array(this.dimensions.x*this.dimensions.y);		// boolean array of barrier locations

    // Initialize to a steady rightward flow with no barriers:
    for (var y=0; y<this.dimensions.y; y++) {
      for (var x=0; x<this.dimensions.x; x++) {
        this.barrier[x+y*this.dimensions.x] = false;
      }
    }

    // Create a simple linear "wall" barrier (intentionally a little offset from center):
    var barrierSize = 8;
    
    for (var y=(this.dimensions.y/2)-barrierSize; y<=(this.dimensions.y/2)+barrierSize; y++) {
      var x = Math.round(this.dimensions.y/3);
      this.barrier[x+y*this.dimensions.x] = true;
    }

    // Set up the array of colors for plotting (mimicks matplotlib "jet" colormap):
    // (Kludge: Index nColors+1 labels the color used for drawing barriers.)
    this.nColors = 400;							// there are actually nColors+2 colors
    this.hexColorList = new Array(this.nColors+2);
    this.redList = new Array(this.nColors+2);
    this.greenList = new Array(this.nColors+2);
    this.blueList = new Array(this.nColors+2);
    for (var c=0; c<=this.nColors; c++) {
      var r, g, b;
      if (c < this.nColors/8) {
        r = 0; g = 0; b = Math.round(255 * (c + this.nColors/8) / (this.nColors/4));
      } else if (c < 3*this.nColors/8) {
        r = 0; g = Math.round(255 * (c - this.nColors/8) / (this.nColors/4)); b = 255;
      } else if (c < 5*this.nColors/8) {
        r = Math.round(255 * (c - 3*this.nColors/8) / (this.nColors/4)); g = 255; b = 255 - r;
      } else if (c < 7*this.nColors/8) {
        r = 255; g = Math.round(255 * (7*this.nColors/8 - c) / (this.nColors/4)); b = 0;
      } else {
        r = Math.round(255 * (9*this.nColors/8 - c) / (this.nColors/4)); g = 0; b = 0;
      }
      this.redList[c] = r; this.greenList[c] = g; this.blueList[c] = b;
      this.hexColorList[c] = rgbToHex(r, g, b);
    }
    this.redList[this.nColors+1] = 0; this.greenList[this.nColors+1] = 0; this.blueList[this.nColors+1] = 0;	// barriers are black
    this.hexColorList[this.nColors+1] = rgbToHex(0, 0, 0);

    // Initialize array of partially transparant blacks, for drawing flow lines:
    var transBlackArraySize = 50;
    var transBlackArray = new Array(transBlackArraySize);
    for (var i=0; i<transBlackArraySize; i++) {
      transBlackArray[i] = "rgba(0,0,0," + Number(i/transBlackArraySize).toFixed(2) + ")";
    }

    // Initialize tracers (but don't place them yet):
    var nTracers = 144;
    var tracerX = new Array(nTracers);
    var tracerY = new Array(nTracers);
    for (var t=0; t<nTracers; t++) {
      tracerX[t] = 0.0; tracerY[t] = 0.0;
    }
    this.initFluid();
    // this.initWorker();
  }

  get context() {
    return this.canvas.getContext('2d');
  }

  // Convert page coordinates to canvas coordinates:
  pageToCanvas(pageX: number, pageY: number) {
    // this simple subtraction may not work when the canvas is nested in other elements
    return { x:pageX - this.canvas.offsetLeft, y:pageY - this.canvas.offsetTop };
  }
  
  // Convert canvas coordinates to grid coordinates:
  canvasToGrid(canvasX: number, canvasY: number) {
    var gridX = Math.floor(canvasX / this.precision);
    var gridY = Math.floor((this.canvas.height - 1 - canvasY) / this.precision); 	// off by 1?
    return { x:gridX, y:gridY };
  }

  // Compute the curl (actually times 2) of the macroscopic velocity field, for plotting:
  computeCurl() {
    for (var y=1; y<this.dimensions.y-1; y++) {			// interior sites only; leave edges set to zero
      for (var x=1; x<this.dimensions.x-1; x++) {
        this.curl[x+y*this.dimensions.x] = this.uy[x+1+y*this.dimensions.x] - this.uy[x-1+y*this.dimensions.x] - this.ux[x+(y+1)*this.dimensions.x] + this.ux[x+(y-1)*this.dimensions.x];
      }
    }
  }

  // Color a grid square in the image data array, one pixel at a time (rgb each in range 0 to 255):
  colorSquare(x: number, y: number, r: number, g: number, b: number) {
  //function colorSquare(x, y, cIndex) {		// for some strange reason, this version is quite a bit slower on Chrome
    //var r = redList[cIndex];
    //var g = greenList[cIndex];
    //var b = blueList[cIndex];
    var flippedy = this.dimensions.y - y - 1;			// put y=0 at the bottom
    for (var py=flippedy*this.precision; py<(flippedy+1)*this.precision; py++) {
      for (var px=x*this.precision; px<(x+1)*this.precision; px++) {
        var index = (px + py*this.image.width) * 4;
        this.image.data[index+0] = r;
        this.image.data[index+1] = g;
        this.image.data[index+2] = b;
      }
    }
  }

  // Paint the canvas:
  paintCanvas(fbi?: number) {
    var cIndex=0;
    var contrast = Math.pow(1.2,Number(this.contrast));
    // var plotType = 1;
    //var pixelGraphics = pixelCheck.checked;
    if (this.plotType == 4) {this.computeCurl();}
    
    let fb:ColliderData = this;
    if (fbi!==undefined && this.fb[fbi] !== undefined) {
      fb = this.fb[fbi];
    }

    for (var y=0; y<this.dimensions.y; y++) {
      for (var x=0; x<this.dimensions.x; x++) {
        if (this.barrier[x+y*this.dimensions.x]) {
          cIndex = this.nColors + 1;	// kludge for barrier color which isn't really part of color map
        } else {
          if (this.plotType == 0) {
            cIndex = Math.round(this.nColors * ((this.rho[x+y*this.dimensions.x]-1)*6*contrast + 0.5));
          } else if (this.plotType == 1) {
            cIndex = Math.round(this.nColors * (this.ux[x+y*this.dimensions.x]*2*contrast + 0.5));
          } else if (this.plotType == 2) {
            cIndex = Math.round(this.nColors * (this.uy[x+y*this.dimensions.x]*2*contrast + 0.5));
          } else if (this.plotType == 3) {
            var speed = Math.sqrt(this.ux[x+y*this.dimensions.x]*this.ux[x+y*this.dimensions.x] + this.uy[x+y*this.dimensions.x]*this.uy[x+y*this.dimensions.x]);
            cIndex = Math.round(this.nColors * (speed*4*contrast));
          } else {
            cIndex = Math.round(this.nColors * (this.curl[x+y*this.dimensions.x]*5*contrast + 0.5));
          }
          if (cIndex < 0) cIndex = 0;
          if (cIndex > this.nColors) cIndex = this.nColors;
        }
        //if (pixelGraphics) {
          //colorSquare(x, y, cIndex);
        this.colorSquare(x, y, this.redList[cIndex], this.greenList[cIndex], this.blueList[cIndex]);
        //} else {
        //	this.context.fillStyle = this.hexColorList[cIndex];
        //	this.context.fillRect(x*this.precision, (this.dimensions.y-y-1)*this.precision, this.precision, this.precision);
        //}
      }
    }
    //if (pixelGraphics) 
    
    // @ts-ignore
    this.context.putImageData(this.image, 0, 0);		// blast image to the screen
    
    // Draw tracers, force vector, and/or sensor if appropriate:
    // if (tracerCheck.checked) drawTracers();
    // if (flowlineCheck.checked) drawFlowlines();
    // if (forceCheck.checked) drawForceArrow(barrierxSum/barrierCount, barrierySum/barrierCount, barrierFx, barrierFy);
    // if (sensorCheck.checked) drawSensor();
  }

  // Add a barrier at a given grid coordinate location:
  addBarrier(x: number, y: number) {
    if ((x > 1) && (x < this.dimensions.x-2) && (y > 1) && (y < this.dimensions.y-2)) {
      this.barrier[x+y*this.dimensions.x] = true;
    }
  }
  
  // Remove a barrier at a given grid coordinate location:
  removeBarrier(x: number, y: number) {
    if (this.barrier[x+y*this.dimensions.x]) {
      this.barrier[x+y*this.dimensions.x] = false;
      this.paintCanvas();
    }
  }
  
  // Clear all barriers:
  clearBarriers() {
    for (var y=0; y<this.dimensions.y; y++) {
      for (var x=0; x<this.dimensions.x; x++) {
        this.barrier[x+y*this.dimensions.x] = false;
      }
    }
    this.paintCanvas();
  }

  // Reset the timer that handles performance evaluation:
  resetTimer() {
    this.stepCount = 0;
    this.startTime = (new Date()).getTime();
  }

  // Set all densities in a cell to their equilibrium values for a given velocity and density:
  // (If density is omitted, it's left unchanged.)
  setEquil(x: number, y: number, newux: number, newuy: number, newrho?: number) {
    var i = x + y*this.dimensions.x;
    if (typeof newrho == 'undefined') {
      newrho = this.rho[i];
    }
    var ux3 = 3 * newux;
    var uy3 = 3 * newuy;
    var ux2 = newux * newux;
    var uy2 = newuy * newuy;
    var uxuy2 = 2 * newux * newuy;
    var u2 = ux2 + uy2;
    var u215 = 1.5 * u2;
    this.n0[i]  = four9ths * newrho * (1                              - u215);
    this.nE[i]  =   one9th * newrho * (1 + ux3       + 4.5*ux2        - u215);
    this.nW[i]  =   one9th * newrho * (1 - ux3       + 4.5*ux2        - u215);
    this.nN[i]  =   one9th * newrho * (1 + uy3       + 4.5*uy2        - u215);
    this.nS[i]  =   one9th * newrho * (1 - uy3       + 4.5*uy2        - u215);
    this.nNE[i] =  one36th * newrho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215);
    this.nSE[i] =  one36th * newrho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215);
    this.nNW[i] =  one36th * newrho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215);
    this.nSW[i] =  one36th * newrho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215);
    this.rho[i] = newrho;
    this.ux[i] = newux;
    this.uy[i] = newuy;
  }

  // Set the fluid variables at the boundaries, according to the current slider value:
  setBoundaries() {
    let ym = this.dimensions.y-1
    let xm = this.dimensions.x-1
    for (var x=0; x<this.dimensions.x; x++) {
      this.setEquil(x, 0, this.speed, 0, this.equilRho);
      this.setEquil(x, ym, this.speed, 0, this.equilRho);
    }
    for (var y=1; y<ym; y++) {
      this.setEquil(0, y, this.speed, 0, this.equilRho);
      this.setEquil(xm, y, this.speed, 0, this.equilRho);
    }
  }

  // Resize the grid:
  resize() {
    // First up-sample the macroscopic variables into temporary arrays at max resolution:
    var tempRho = new Array(this.canvas.width*this.canvas.height);
    var tempUx = new Array(this.canvas.width*this.canvas.height);
    var tempUy = new Array(this.canvas.width*this.canvas.height);
    var tempBarrier = new Array(this.canvas.width*this.canvas.height);
    for (var y=0; y<this.canvas.height; y++) {
      for (var x=0; x<this.canvas.width; x++) {
        var tempIndex = x + y*this.canvas.width;
        var xOld = Math.floor(x / this.precision);
        var yOld = Math.floor(y / this.precision);
        var oldIndex = xOld + yOld*this.dimensions.x;
        tempRho[tempIndex] = this.rho[oldIndex];
        tempUx[tempIndex] = this.ux[oldIndex];
        tempUy[tempIndex] = this.uy[oldIndex];
        tempBarrier[tempIndex] = this.barrier[oldIndex];
      }
    }
    // Get new size from GUI selector:
    var oldPxPerSquare = this.precision;
    var growRatio = oldPxPerSquare / this.precision;
    this.dimensions.x = this.canvas.width / this.precision;
    this.dimensions.y = this.canvas.height / this.precision;
    // Create new arrays at the desired resolution:
    this.n0 = new Array(this.dimensions.x*this.dimensions.y);
    this.nN = new Array(this.dimensions.x*this.dimensions.y);
    this.nS = new Array(this.dimensions.x*this.dimensions.y);
    this.nE = new Array(this.dimensions.x*this.dimensions.y);
    this.nW = new Array(this.dimensions.x*this.dimensions.y);
    this.nNE = new Array(this.dimensions.x*this.dimensions.y);
    this.nSE = new Array(this.dimensions.x*this.dimensions.y);
    this.nNW = new Array(this.dimensions.x*this.dimensions.y);
    this.nSW = new Array(this.dimensions.x*this.dimensions.y);
    this.rho = new Array(this.dimensions.x*this.dimensions.y);
    this.ux = new Array(this.dimensions.x*this.dimensions.y);
    this.uy = new Array(this.dimensions.x*this.dimensions.y);
    this.curl = new Array(this.dimensions.x*this.dimensions.y);
    this.barrier = new Array(this.dimensions.x*this.dimensions.y);
    // Down-sample the temporary arrays into the new arrays:
    for (var yNew=0; yNew<this.dimensions.y; yNew++) {
      for (var xNew=0; xNew<this.dimensions.x; xNew++) {
        var rhoTotal = 0;
        var uxTotal = 0;
        var uyTotal = 0;
        var barrierTotal = 0;
        for (var y=yNew*this.precision; y<(yNew+1)*this.precision; y++) {
          for (var x=xNew*this.precision; x<(xNew+1)*this.precision; x++) {
            var index = x + y*this.canvas.width;
            rhoTotal += tempRho[index];
            uxTotal += tempUx[index];
            uyTotal += tempUy[index];
            if (tempBarrier[index]) barrierTotal++;
          }
        }
        this.setEquil(xNew, yNew, uxTotal/(this.precision*this.precision), uyTotal/(this.precision*this.precision), rhoTotal/(this.precision*this.precision))
        this.curl[xNew+yNew*this.dimensions.x] = 0.0;
        this.barrier[xNew+yNew*this.dimensions.x] = (barrierTotal >= this.precision*this.precision/2);
      }
    }
    this.setBoundaries();
    // if (tracerCheck.checked) {
    //   for (var t=0; t<nTracers; t++) {
    //     tracerX[t] *= growRatio;
    //     tracerY[t] *= growRatio;
    //   }
    // }
    // sensorX = Math.round(sensorX * growRatio);
    // sensorY = Math.round(sensorY * growRatio);
    //computeCurl();
    this.paintCanvas();
    this.resetTimer();
  }

  // Function to initialize or re-initialize the fluid, based on speed slider setting:
  initFluid(uy: number = 0, ux?: number, rho: number = 1) {
    for (var y=0; y<this.dimensions.y; y++) {
      for (var x=0; x<this.dimensions.x; x++) {
        this.setEquil(x, y, ux===undefined?this.speed:ux, uy, rho);
        this.curl[x+y*this.dimensions.x] = 0.0;
      }
    }
    this.paintCanvas();
  }

  // Collide particles within each cell (here's the physics!):
  collide(startx:number, starty:number, maxx:number, maxy:number) {
    let omega = 1 / (3*this.viscosity + 0.5);		// reciprocal of relaxation time
    for (let y=starty; y<maxy; y++) {
      for (let x=startx; x<maxx; x++) {
        // array index for this lattice site
        let i = x + y*this.dimensions.x;
        // 
        let thisrho = this.n0[i] + this.nN[i] + this.nS[i] + this.nE[i] + this.nW[i] + this.nNW[i] + this.nNE[i] + this.nSW[i] + this.nSE[i];
        this.rho[i] = thisrho;
        let thisux = (this.nE[i] + this.nNE[i] + this.nSE[i] - this.nW[i] - this.nNW[i] - this.nSW[i]) / thisrho;
        this.ux[i] = thisux;
        let thisuy = (this.nN[i] + this.nNE[i] + this.nNW[i] - this.nS[i] - this.nSE[i] - this.nSW[i]) / thisrho;
        this.uy[i] = thisuy

        // pre-compute a bunch of stuff for optimization
        let one9thrho = one9th * thisrho;
        let one36thrho = one36th * thisrho;
        let ux3 = 3 * thisux;
        let uy3 = 3 * thisuy;
        let ux2 = thisux * thisux;
        let uy2 = thisuy * thisuy;
        let uxuy2 = 2 * thisux * thisuy;
        let u2 = ux2 + uy2;
        let u215 = 1.5 * u2;

        // compute collision
        this.n0[i]  += omega * (four9ths*thisrho * (1                        - u215) - this.n0[i]);
        this.nE[i]  += omega * (   one9thrho * (1 + ux3       + 4.5*ux2        - u215) - this.nE[i]);
        this.nW[i]  += omega * (   one9thrho * (1 - ux3       + 4.5*ux2        - u215) - this.nW[i]);
        this.nN[i]  += omega * (   one9thrho * (1 + uy3       + 4.5*uy2        - u215) - this.nN[i]);
        this.nS[i]  += omega * (   one9thrho * (1 - uy3       + 4.5*uy2        - u215) - this.nS[i]);
        this.nNE[i] += omega * (  one36thrho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215) - this.nNE[i]);
        this.nSE[i] += omega * (  one36thrho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215) - this.nSE[i]);
        this.nNW[i] += omega * (  one36thrho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215) - this.nNW[i]);
        this.nSW[i] += omega * (  one36thrho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215) - this.nSW[i]);
      }
      this.nW[this.dimensions.x-1+y*this.dimensions.x] = this.nW[this.dimensions.x-2+y*this.dimensions.x];		// at right end, copy left-flowing densities from next row to the left
      this.nNW[this.dimensions.x-1+y*this.dimensions.x] = this.nNW[this.dimensions.x-2+y*this.dimensions.x];
      this.nSW[this.dimensions.x-1+y*this.dimensions.x] = this.nSW[this.dimensions.x-2+y*this.dimensions.x];
    }
  }

  // Move particles along their directions of motion:
  stream() {
    this.barrierCount = 0; this.barrierxSum = 0; this.barrierySum = 0;
    this.barrierFx = 0.0; this.barrierFy = 0.0;

    for (var y=this.dimensions.y-2; y>0; y--) {			// first start in NW corner...
      for (var x=1; x<this.dimensions.x-1; x++) {
        this.nN[x+y*this.dimensions.x] = this.nN[x+(y-1)*this.dimensions.x];			// move the north-moving particles
        this.nNW[x+y*this.dimensions.x] = this.nNW[x+1+(y-1)*this.dimensions.x];		// and the northwest-moving particles
      }
      for (var x=this.dimensions.x-2; x>0; x--) {
        this.nE[x+y*this.dimensions.x] = this.nE[x-1+y*this.dimensions.x];			// move the east-moving particles
        this.nNE[x+y*this.dimensions.x] = this.nNE[x-1+(y-1)*this.dimensions.x];		// and the northeast-moving particles
      }
    }
    for (var y=1; y<this.dimensions.y-1; y++) {			// now start in SE corner...
      for (var x=this.dimensions.x-2; x>0; x--) {
        this.nS[x+y*this.dimensions.x] = this.nS[x+(y+1)*this.dimensions.x];			// move the south-moving particles
        this.nSE[x+y*this.dimensions.x] = this.nSE[x-1+(y+1)*this.dimensions.x];		// and the southeast-moving particles				
      }
      // now start in the SW corner...
      for (var x=1; x<this.dimensions.x-1; x++) {
        this.nW[x+y*this.dimensions.x] = this.nW[x+1+y*this.dimensions.x];			// move the west-moving particles
        this.nSW[x+y*this.dimensions.x] = this.nSW[x+1+(y+1)*this.dimensions.x];		// and the southwest-moving particles

        if (this.barrier[x+y*this.dimensions.x]) {
          var index = x + y*this.dimensions.x;
          this.nE[x+1+y*this.dimensions.x] = this.nW[index];
          this.nW[x-1+y*this.dimensions.x] = this.nE[index];
          this.nN[x+(y+1)*this.dimensions.x] = this.nS[index];
          this.nS[x+(y-1)*this.dimensions.x] = this.nN[index];
          this.nNE[x+1+(y+1)*this.dimensions.x] = this.nSW[index];
          this.nNW[x-1+(y+1)*this.dimensions.x] = this.nSE[index];
          this.nSE[x+1+(y-1)*this.dimensions.x] = this.nNW[index];
          this.nSW[x-1+(y-1)*this.dimensions.x] = this.nNE[index];
          // Keep track of stuff needed to plot force vector:
          this.barrierCount++;
          this.barrierxSum += x;
          this.barrierySum += y;
          this.barrierFx += this.nE[index] + this.nNE[index] + this.nSE[index] - this.nW[index] - this.nNW[index] - this.nSW[index];
          this.barrierFy += this.nN[index] + this.nNE[index] + this.nNW[index] - this.nS[index] - this.nSE[index] - this.nSW[index];
        }
      }
    }
  }

  // Write one line of data to the data area:
  writeData() {
    // var timeString = String(time);
    // while (timeString.length < 5) timeString = "0" + timeString;
    // sIndex = sensorX + sensorY*xdim;
    // dataArea.innerHTML += timeString + "\t" + Number(rho[sIndex]).toFixed(4) + "\t"
    //   + Number(ux[sIndex]).toFixed(4) + "\t" + Number(uy[sIndex]).toFixed(4) + "\t"
    //   + Number(barrierFx).toFixed(4) + "\t" + Number(barrierFy).toFixed(4) + "\n";
    // dataArea.scrollTop = dataArea.scrollHeight;
  }

  // Start or stop collecting data:
  startOrStopData() {
    // collectingData = !collectingData;
    // if (collectingData) {
    //   time = 0;
    //   dataArea.innerHTML = "Time \tDensity\tVel_x \tVel_y \tForce_x\tForce_y\n";
    //   writeData();
    //   dataButton.value = "Stop data collection";
    //   showingPeriod = false;
    //   periodButton.value = "Show F_y period";
    // } else {
    //   dataButton.value = "Start data collection";
    // }
  }

  // Function to start or pause the simulation:
  startStop() {
    this.running = !this.running;
    if (this.running) {
      // startButton.value = "Pause";
      this.resetTimer();
      this.simulate();
    } else {
      // startButton.value = " Run ";
    }
  }


  // Simulate function executes a bunch of steps and then schedules another call to itself:
  simulate() {
    this.setBoundaries();
    // Test to see if we're dragging the fluid:
    // var pushing = false;
    // var pushX, pushY, pushUX, pushUY;
    // if (mouseIsDown && mouseSelect.selectedIndex==2) {
    //   if (oldMouseX >= 0) {
    //     var gridLoc = canvasToGrid(mouseX, mouseY);
    //     pushX = gridLoc.x;
    //     pushY = gridLoc.y;
    //     pushUX = (mouseX - oldMouseX) / pxPerSquare / this.animationPrecision;
    //     pushUY = -(mouseY - oldMouseY) / pxPerSquare / this.animationPrecision;	// y axis is flipped
    //     if (Math.abs(pushUX) > 0.1) pushUX = 0.1 * Math.abs(pushUX) / pushUX;
    //     if (Math.abs(pushUY) > 0.1) pushUY = 0.1 * Math.abs(pushUY) / pushUY;
    //     pushing = true;
    //   }
    //   oldMouseX = mouseX; oldMouseY = mouseY;
    // } else {
    //   oldMouseX = -1; oldMouseY = -1;
    // }
    // Execute a bunch of time steps:
    for (var step=0; step<this.animationPrecision; step++) {
      this.collide(1, 1, this.dimensions.x-1, this.dimensions.y-1);
      this.stream();
      // if (tracerCheck.checked) moveTracers();
      // if (pushing) push(pushX, pushY, pushUX, pushUY);
      this.time++;
      if (this.showingPeriod && (this.barrierFy > 0) && (this.lastBarrierFy <=0)) {
        var thisFyOscTime = this.time - this.barrierFy/(this.barrierFy-this.lastBarrierFy);	// interpolate when Fy changed sign
        if (this.lastFyOscTime > 0) {
          var period = thisFyOscTime - this.lastFyOscTime;
          // dataArea.innerHTML += Number(period).toFixed(2) + "\n";
          // dataArea.scrollTop = dataArea.scrollHeight;
        }
        this.lastFyOscTime = thisFyOscTime;
      }
      this.lastBarrierFy = this.barrierFy;
    }
    this.paintCanvas();
    if (this.collectingData) {
      this.writeData();
      if (this.time >= 10000) this.startOrStopData();
    }
    if (this.running) {
      this.stepCount += this.animationPrecision;
      this.speedReadout = Math.round(this.stepCount/(((new Date()).getTime() - this.startTime) / 1000));
      if (this.speedReadoutElt !== undefined) {
        this.speedReadoutElt.innerText = this.speedReadout.toString();
      }
    }
    var stable = true;
    for (var x=0; x<this.dimensions.x; x++) {
      var index = x + (this.dimensions.y/2)*this.dimensions.x;	// look at middle row only
      if (this.rho[index] <= 0) stable = false;
    }
    if (!stable) {
      window.alert("The simulation has become unstable due to excessive fluid speeds.");
      this.startStop();
      this.initFluid();
    }
    if (this.running) {
      // let browser schedule next frame
      if (this.browserAnim) {
        window.requestAnimationFrame(() => {this.simulate()});
      }
      // schedule next frame asap (nominally 1 ms but always more)
      else {
        window.setTimeout(() => {this.simulate()}, 1);
      }
    }
  }

  pulse(speed: number, pressure: number, duration: number, spacing?: number) {
    this.pulser = {
      speed: speed,
      pressure: pressure,
      duration: duration,
      spacing: spacing,
      equilibrium: {
        speed: this.speed,
        pressure: this.equilRho
      },
      run: setTimeout(() => {
        this.speed = this.pulser.equilibrium.speed;
        this.equilRho = this.pulser.equilibrium.pressure;
        if (this.pulser.spacing === undefined) {
          this.stopPulse();
        }
        else {
          setTimeout(() => {
            this.pulse(
              this.pulser.speed,
              this.pulser.pressure,
              this.pulser.duration,
              this.pulser.spacing
            )
          }, this.pulser.spacing)
        }
      }, duration)
    };
    
    this.speed = speed;
    this.equilRho = pressure;
  }

  stopPulse() {
    if (this.pulser !== undefined && this.pulser !== null) {
      clearTimeout(this.pulser.run);
    
      this.speed = this.pulser.equilibrium.speed;
      this.equilRho = this.pulser.equilibrium.pressure;
      this.pulser = null;
    }
  }
  
  fromSvg(file: Blob, wrapperElt?: HTMLElement) {
    if (wrapperElt === undefined) {
      wrapperElt = document.getElementById('simulationWrapper')||document.body;
    }

    let _canvas = document.createElement('canvas');
    _canvas.id = "simulationBarrierImg";
    _canvas.width = 600;
    _canvas.height = 240;
    _canvas.style.position = 'absolute';
    _canvas.style.left = '15px';
    _canvas = wrapperElt.appendChild(_canvas);

    let _context = _canvas.getContext('2d');
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      let image__ = new Image();    
      image__.onload = () => {
        if (_context !== null) {          
          _context.drawImage(image__, 0, 0, _canvas.width, _canvas.height );
          this.clearBarriers()      
          for(let _yPx = 0; _yPx < _canvas.height; _yPx++) {
            for(let _xPx = 0; _xPx < _canvas.width; _xPx++) {
              let pxData = _context.getImageData(_xPx, _yPx, 1, 1).data;
              if(pxData[0] != 0 || pxData[1] != 0 || pxData[2] != 0 || pxData[3] != 0) {
                this.addBarrier(_xPx, _canvas.height - _yPx);
              }
            }
          }
          this.paintCanvas()
        }
      };
      if (event.target !== null && typeof event.target.result === 'string') {
        image__.src = event.target.result;
      }    
    });
    reader.readAsDataURL(file);
  }
  
  // initWorker() {
  //   this.worker = new Worker('build/worker.js');
  //   this.worker.addEventListener('message', (evt) => {
  //     switch (evt.data.performed) {
  //       case 'step':
  //       case 'stream':
  //         this.barrierCount = evt.data.data.barrierCount
  //         this.barrierxSum = evt.data.data.barrierxSum
  //         this.barrierySum = evt.data.data.barrierySum
  //         this.barrierFx = evt.data.data.barrierFx
  //         this.barrierFy = evt.data.data.barrierFy
  //       case 'collide':
  //         this.n0 = evt.data.data.n0;
  //         this.nN = evt.data.data.nN;
  //         this.nS = evt.data.data.nS;
  //         this.nE = evt.data.data.nE;
  //         this.nW = evt.data.data.nW;
  //         this.nNE = evt.data.data.nNE;
  //         this.nSE = evt.data.data.nSE;
  //         this.nNW = evt.data.data.nNW;
  //         this.nSW = evt.data.data.nSW;
  //         this.rho = evt.data.data.rho;
  //         this.ux = evt.data.data.ux;
  //         this.uy = evt.data.data.uy;

  //         this.fb.push(evt.data.data)
  //         console.log('buffering...', this.fb.length);
  //         if (this.buffer) {
  //           this.workerStep();
  //         }
  //         break;
      
  //       default:
  //         console.log(evt.data.performed, evt.data.data);
  //         break;
  //     }
  //   });
  //   this.worker.postMessage({
  //     perform: 'init',
  //     init:'collider',
  //     options: {
  //       dimensions: {
  //         x: this.dimensions.x,
  //         y: this.dimensions.y
  //       },
  //       viscosity: this.viscosity
  //     }
  //   });
  // }

  // workerCollide() {
  //   this.worker?.postMessage({
  //     perform: 'collide',
  //     data:{
  //       n0: this.n0,
  //       nN: this.nN,
  //       nS: this.nS,
  //       nE: this.nE,
  //       nW: this.nW,
  //       nNE: this.nNE,
  //       nSE: this.nSE,
  //       nNW: this.nNW,
  //       nSW: this.nSW,
  //       rho: this.rho,
  //       ux: this.ux,
  //       uy: this.uy,
  //     },
  //     startx:1,
  //     starty:1,
  //     maxx:this.dimensions.x-1,
  //     maxy:this.dimensions.y-1,
  //   });
  // }

  // workerStream() {
  //   this.worker?.postMessage({
  //     perform: 'stream',
  //     data:{
  //       n0: this.n0,
  //       nN: this.nN,
  //       nS: this.nS,
  //       nE: this.nE,
  //       nW: this.nW,
  //       nNE: this.nNE,
  //       nSE: this.nSE,
  //       nNW: this.nNW,
  //       nSW: this.nSW,
  //       rho: this.rho,
  //       ux: this.ux,
  //       uy: this.uy,
  //       barrier: this.barrier
  //     },
  //     startx:0,
  //     starty:0,
  //     maxx:this.dimensions.x,
  //     maxy:this.dimensions.y,
  //   });
  // }

  // workerStep() {
  //   this.worker?.postMessage({
  //     perform: 'step',
  //     data:{
  //       n0: this.n0,
  //       nN: this.nN,
  //       nS: this.nS,
  //       nE: this.nE,
  //       nW: this.nW,
  //       nNE: this.nNE,
  //       nSE: this.nSE,
  //       nNW: this.nNW,
  //       nSW: this.nSW,
  //       rho: this.rho,
  //       ux: this.ux,
  //       uy: this.uy,
  //       barrier: this.barrier
  //     },
  //     startx:0,
  //     starty:0,
  //     maxx:this.dimensions.x,
  //     maxy:this.dimensions.y,
  //   });
  // }

  // workerSimulate() {
  //   this.worker?.postMessage({
  //     perform: 'simulate',
  //     data:{
  //       n0: this.n0,
  //       nN: this.nN,
  //       nS: this.nS,
  //       nE: this.nE,
  //       nW: this.nW,
  //       nNE: this.nNE,
  //       nSE: this.nSE,
  //       nNW: this.nNW,
  //       nSW: this.nSW,
  //       rho: this.rho,
  //       ux: this.ux,
  //       uy: this.uy,
  //       barrier: this.barrier
  //     },
  //     startx:0,
  //     starty:0,
  //     maxx:this.dimensions.x,
  //     maxy:this.dimensions.y,
  //   });
  // }

  // startStopBuffer() {
  //   this.buffer = !this.buffer;
  //   if (this.buffer) {
  //     this.workerStep();
  //   }
  // }
}

(window as any).Cfd = Cfd;
