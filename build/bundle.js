(() => {
  var __defProp = Object.defineProperty;
  var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
  var __commonJS = (callback, module) => () => {
    if (!module) {
      module = {exports: {}};
      callback(module.exports, module);
    }
    return module.exports;
  };
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, {get: all[name], enumerable: true});
  };

  // index.ts
  var require_CFD = __commonJS((exports) => {
    __export(exports, {
      Cfd: () => Cfd
    });
  });

  // src/cfd.ts
  const four9ths = 4 / 9;
  const one9th = 1 / 9;
  const one36th = 1 / 36;
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  class Cfd {
    constructor(options) {
      this.dimensions = {x: 0, y: 0};
      this.equilRho = 1;
      this.running = false;
      this.stepCount = 0;
      this.startTime = 0;
      this.speedReadout = 0;
      this.plotType = 0;
      this.fb = [];
      this.buffer = false;
      this.canvas = options.canvas;
      this.image = this.context?.createImageData(this.canvas.width, this.canvas.height);
      for (var i = 3; i < this.image.data.length; i += 4)
        this.image.data[i] = 255;
      this.precision = options.precision;
      if (this.precision === 0) {
        this.precision = 1;
      }
      this.dimensions.x = this.canvas.width / this.precision;
      this.dimensions.y = this.canvas.height / this.precision;
      this.speed = options.speed;
      this.animationPrecision = options.animationPrecision;
      this.viscosity = options.viscosity;
      if (options.rho !== void 0) {
        this.equilRho = options.rho;
      }
      this.contrast = options.contrast;
      this.browserAnim = options.browserAnim;
      this.resetTimer();
      this.barrierCount = 0;
      this.barrierxSum = 0;
      this.barrierySum = 0;
      this.barrierFx = 0;
      this.barrierFy = 0;
      var sensorX = this.dimensions.x / 2;
      var sensorY = this.dimensions.y / 2;
      var draggingSensor = false;
      var mouseIsDown = false;
      var mouseX, mouseY;
      var oldMouseX = -1, oldMouseY = -1;
      this.collectingData = false;
      this.time = 0;
      this.showingPeriod = false;
      this.lastBarrierFy = 1;
      this.lastFyOscTime = 0;
      this.n0 = new Array(this.dimensions.x * this.dimensions.y);
      this.nN = new Array(this.dimensions.x * this.dimensions.y);
      this.nS = new Array(this.dimensions.x * this.dimensions.y);
      this.nE = new Array(this.dimensions.x * this.dimensions.y);
      this.nW = new Array(this.dimensions.x * this.dimensions.y);
      this.nNE = new Array(this.dimensions.x * this.dimensions.y);
      this.nSE = new Array(this.dimensions.x * this.dimensions.y);
      this.nNW = new Array(this.dimensions.x * this.dimensions.y);
      this.nSW = new Array(this.dimensions.x * this.dimensions.y);
      this.rho = new Array(this.dimensions.x * this.dimensions.y);
      this.ux = new Array(this.dimensions.x * this.dimensions.y);
      this.uy = new Array(this.dimensions.x * this.dimensions.y);
      this.curl = new Array(this.dimensions.x * this.dimensions.y);
      this.barrier = new Array(this.dimensions.x * this.dimensions.y);
      for (var y = 0; y < this.dimensions.y; y++) {
        for (var x = 0; x < this.dimensions.x; x++) {
          this.barrier[x + y * this.dimensions.x] = false;
        }
      }
      var barrierSize = 8;
      for (var y = this.dimensions.y / 2 - barrierSize; y <= this.dimensions.y / 2 + barrierSize; y++) {
        var x = Math.round(this.dimensions.y / 3);
        this.barrier[x + y * this.dimensions.x] = true;
      }
      this.nColors = 400;
      this.hexColorList = new Array(this.nColors + 2);
      this.redList = new Array(this.nColors + 2);
      this.greenList = new Array(this.nColors + 2);
      this.blueList = new Array(this.nColors + 2);
      for (var c = 0; c <= this.nColors; c++) {
        var r, g, b;
        if (c < this.nColors / 8) {
          r = 0;
          g = 0;
          b = Math.round(255 * (c + this.nColors / 8) / (this.nColors / 4));
        } else if (c < 3 * this.nColors / 8) {
          r = 0;
          g = Math.round(255 * (c - this.nColors / 8) / (this.nColors / 4));
          b = 255;
        } else if (c < 5 * this.nColors / 8) {
          r = Math.round(255 * (c - 3 * this.nColors / 8) / (this.nColors / 4));
          g = 255;
          b = 255 - r;
        } else if (c < 7 * this.nColors / 8) {
          r = 255;
          g = Math.round(255 * (7 * this.nColors / 8 - c) / (this.nColors / 4));
          b = 0;
        } else {
          r = Math.round(255 * (9 * this.nColors / 8 - c) / (this.nColors / 4));
          g = 0;
          b = 0;
        }
        this.redList[c] = r;
        this.greenList[c] = g;
        this.blueList[c] = b;
        this.hexColorList[c] = rgbToHex(r, g, b);
      }
      this.redList[this.nColors + 1] = 0;
      this.greenList[this.nColors + 1] = 0;
      this.blueList[this.nColors + 1] = 0;
      this.hexColorList[this.nColors + 1] = rgbToHex(0, 0, 0);
      var transBlackArraySize = 50;
      var transBlackArray = new Array(transBlackArraySize);
      for (var i = 0; i < transBlackArraySize; i++) {
        transBlackArray[i] = "rgba(0,0,0," + Number(i / transBlackArraySize).toFixed(2) + ")";
      }
      var nTracers = 144;
      var tracerX = new Array(nTracers);
      var tracerY = new Array(nTracers);
      for (var t = 0; t < nTracers; t++) {
        tracerX[t] = 0;
        tracerY[t] = 0;
      }
      this.initFluid();
    }
    get context() {
      return this.canvas.getContext("2d");
    }
    pageToCanvas(pageX, pageY) {
      return {x: pageX - this.canvas.offsetLeft, y: pageY - this.canvas.offsetTop};
    }
    canvasToGrid(canvasX, canvasY) {
      var gridX = Math.floor(canvasX / this.precision);
      var gridY = Math.floor((this.canvas.height - 1 - canvasY) / this.precision);
      return {x: gridX, y: gridY};
    }
    computeCurl() {
      for (var y = 1; y < this.dimensions.y - 1; y++) {
        for (var x = 1; x < this.dimensions.x - 1; x++) {
          this.curl[x + y * this.dimensions.x] = this.uy[x + 1 + y * this.dimensions.x] - this.uy[x - 1 + y * this.dimensions.x] - this.ux[x + (y + 1) * this.dimensions.x] + this.ux[x + (y - 1) * this.dimensions.x];
        }
      }
    }
    colorSquare(x, y, r, g, b) {
      var flippedy = this.dimensions.y - y - 1;
      for (var py = flippedy * this.precision; py < (flippedy + 1) * this.precision; py++) {
        for (var px = x * this.precision; px < (x + 1) * this.precision; px++) {
          var index = (px + py * this.image.width) * 4;
          this.image.data[index + 0] = r;
          this.image.data[index + 1] = g;
          this.image.data[index + 2] = b;
        }
      }
    }
    paintCanvas(fbi) {
      var cIndex = 0;
      var contrast = Math.pow(1.2, Number(this.contrast));
      if (this.plotType == 4) {
        this.computeCurl();
      }
      let fb = this;
      if (fbi !== void 0 && this.fb[fbi] !== void 0) {
        fb = this.fb[fbi];
      }
      for (var y = 0; y < this.dimensions.y; y++) {
        for (var x = 0; x < this.dimensions.x; x++) {
          if (this.barrier[x + y * this.dimensions.x]) {
            cIndex = this.nColors + 1;
          } else {
            if (this.plotType == 0) {
              cIndex = Math.round(this.nColors * ((this.rho[x + y * this.dimensions.x] - 1) * 6 * contrast + 0.5));
            } else if (this.plotType == 1) {
              cIndex = Math.round(this.nColors * (this.ux[x + y * this.dimensions.x] * 2 * contrast + 0.5));
            } else if (this.plotType == 2) {
              cIndex = Math.round(this.nColors * (this.uy[x + y * this.dimensions.x] * 2 * contrast + 0.5));
            } else if (this.plotType == 3) {
              var speed = Math.sqrt(this.ux[x + y * this.dimensions.x] * this.ux[x + y * this.dimensions.x] + this.uy[x + y * this.dimensions.x] * this.uy[x + y * this.dimensions.x]);
              cIndex = Math.round(this.nColors * (speed * 4 * contrast));
            } else {
              cIndex = Math.round(this.nColors * (this.curl[x + y * this.dimensions.x] * 5 * contrast + 0.5));
            }
            if (cIndex < 0)
              cIndex = 0;
            if (cIndex > this.nColors)
              cIndex = this.nColors;
          }
          this.colorSquare(x, y, this.redList[cIndex], this.greenList[cIndex], this.blueList[cIndex]);
        }
      }
      this.context.putImageData(this.image, 0, 0);
    }
    addBarrier(x, y) {
      if (x > 1 && x < this.dimensions.x - 2 && y > 1 && y < this.dimensions.y - 2) {
        this.barrier[x + y * this.dimensions.x] = true;
      }
    }
    removeBarrier(x, y) {
      if (this.barrier[x + y * this.dimensions.x]) {
        this.barrier[x + y * this.dimensions.x] = false;
        this.paintCanvas();
      }
    }
    clearBarriers() {
      for (var y = 0; y < this.dimensions.y; y++) {
        for (var x = 0; x < this.dimensions.x; x++) {
          this.barrier[x + y * this.dimensions.x] = false;
        }
      }
      this.paintCanvas();
    }
    resetTimer() {
      this.stepCount = 0;
      this.startTime = new Date().getTime();
    }
    setEquil(x, y, newux, newuy, newrho) {
      var i = x + y * this.dimensions.x;
      if (typeof newrho == "undefined") {
        newrho = this.rho[i];
      }
      var ux3 = 3 * newux;
      var uy3 = 3 * newuy;
      var ux2 = newux * newux;
      var uy2 = newuy * newuy;
      var uxuy2 = 2 * newux * newuy;
      var u2 = ux2 + uy2;
      var u215 = 1.5 * u2;
      this.n0[i] = four9ths * newrho * (1 - u215);
      this.nE[i] = one9th * newrho * (1 + ux3 + 4.5 * ux2 - u215);
      this.nW[i] = one9th * newrho * (1 - ux3 + 4.5 * ux2 - u215);
      this.nN[i] = one9th * newrho * (1 + uy3 + 4.5 * uy2 - u215);
      this.nS[i] = one9th * newrho * (1 - uy3 + 4.5 * uy2 - u215);
      this.nNE[i] = one36th * newrho * (1 + ux3 + uy3 + 4.5 * (u2 + uxuy2) - u215);
      this.nSE[i] = one36th * newrho * (1 + ux3 - uy3 + 4.5 * (u2 - uxuy2) - u215);
      this.nNW[i] = one36th * newrho * (1 - ux3 + uy3 + 4.5 * (u2 - uxuy2) - u215);
      this.nSW[i] = one36th * newrho * (1 - ux3 - uy3 + 4.5 * (u2 + uxuy2) - u215);
      this.rho[i] = newrho;
      this.ux[i] = newux;
      this.uy[i] = newuy;
    }
    setBoundaries() {
      let ym = this.dimensions.y - 1;
      let xm = this.dimensions.x - 1;
      for (var x = 0; x < this.dimensions.x; x++) {
        this.setEquil(x, 0, this.speed, 0, this.equilRho);
        this.setEquil(x, ym, this.speed, 0, this.equilRho);
      }
      for (var y = 1; y < ym; y++) {
        this.setEquil(0, y, this.speed, 0, this.equilRho);
        this.setEquil(xm, y, this.speed, 0, this.equilRho);
      }
    }
    resize() {
      var tempRho = new Array(this.canvas.width * this.canvas.height);
      var tempUx = new Array(this.canvas.width * this.canvas.height);
      var tempUy = new Array(this.canvas.width * this.canvas.height);
      var tempBarrier = new Array(this.canvas.width * this.canvas.height);
      for (var y = 0; y < this.canvas.height; y++) {
        for (var x = 0; x < this.canvas.width; x++) {
          var tempIndex = x + y * this.canvas.width;
          var xOld = Math.floor(x / this.precision);
          var yOld = Math.floor(y / this.precision);
          var oldIndex = xOld + yOld * this.dimensions.x;
          tempRho[tempIndex] = this.rho[oldIndex];
          tempUx[tempIndex] = this.ux[oldIndex];
          tempUy[tempIndex] = this.uy[oldIndex];
          tempBarrier[tempIndex] = this.barrier[oldIndex];
        }
      }
      var oldPxPerSquare = this.precision;
      var growRatio = oldPxPerSquare / this.precision;
      this.dimensions.x = this.canvas.width / this.precision;
      this.dimensions.y = this.canvas.height / this.precision;
      this.n0 = new Array(this.dimensions.x * this.dimensions.y);
      this.nN = new Array(this.dimensions.x * this.dimensions.y);
      this.nS = new Array(this.dimensions.x * this.dimensions.y);
      this.nE = new Array(this.dimensions.x * this.dimensions.y);
      this.nW = new Array(this.dimensions.x * this.dimensions.y);
      this.nNE = new Array(this.dimensions.x * this.dimensions.y);
      this.nSE = new Array(this.dimensions.x * this.dimensions.y);
      this.nNW = new Array(this.dimensions.x * this.dimensions.y);
      this.nSW = new Array(this.dimensions.x * this.dimensions.y);
      this.rho = new Array(this.dimensions.x * this.dimensions.y);
      this.ux = new Array(this.dimensions.x * this.dimensions.y);
      this.uy = new Array(this.dimensions.x * this.dimensions.y);
      this.curl = new Array(this.dimensions.x * this.dimensions.y);
      this.barrier = new Array(this.dimensions.x * this.dimensions.y);
      for (var yNew = 0; yNew < this.dimensions.y; yNew++) {
        for (var xNew = 0; xNew < this.dimensions.x; xNew++) {
          var rhoTotal = 0;
          var uxTotal = 0;
          var uyTotal = 0;
          var barrierTotal = 0;
          for (var y = yNew * this.precision; y < (yNew + 1) * this.precision; y++) {
            for (var x = xNew * this.precision; x < (xNew + 1) * this.precision; x++) {
              var index = x + y * this.canvas.width;
              rhoTotal += tempRho[index];
              uxTotal += tempUx[index];
              uyTotal += tempUy[index];
              if (tempBarrier[index])
                barrierTotal++;
            }
          }
          this.setEquil(xNew, yNew, uxTotal / (this.precision * this.precision), uyTotal / (this.precision * this.precision), rhoTotal / (this.precision * this.precision));
          this.curl[xNew + yNew * this.dimensions.x] = 0;
          this.barrier[xNew + yNew * this.dimensions.x] = barrierTotal >= this.precision * this.precision / 2;
        }
      }
      this.setBoundaries();
      this.paintCanvas();
      this.resetTimer();
    }
    initFluid(uy = 0, ux, rho = 1) {
      for (var y = 0; y < this.dimensions.y; y++) {
        for (var x = 0; x < this.dimensions.x; x++) {
          this.setEquil(x, y, ux === void 0 ? this.speed : ux, uy, rho);
          this.curl[x + y * this.dimensions.x] = 0;
        }
      }
      this.paintCanvas();
    }
    collide(startx, starty, maxx, maxy) {
      let omega = 1 / (3 * this.viscosity + 0.5);
      for (let y = starty; y < maxy; y++) {
        for (let x = startx; x < maxx; x++) {
          let i = x + y * this.dimensions.x;
          let thisrho = this.n0[i] + this.nN[i] + this.nS[i] + this.nE[i] + this.nW[i] + this.nNW[i] + this.nNE[i] + this.nSW[i] + this.nSE[i];
          this.rho[i] = thisrho;
          let thisux = (this.nE[i] + this.nNE[i] + this.nSE[i] - this.nW[i] - this.nNW[i] - this.nSW[i]) / thisrho;
          this.ux[i] = thisux;
          let thisuy = (this.nN[i] + this.nNE[i] + this.nNW[i] - this.nS[i] - this.nSE[i] - this.nSW[i]) / thisrho;
          this.uy[i] = thisuy;
          let one9thrho = one9th * thisrho;
          let one36thrho = one36th * thisrho;
          let ux3 = 3 * thisux;
          let uy3 = 3 * thisuy;
          let ux2 = thisux * thisux;
          let uy2 = thisuy * thisuy;
          let uxuy2 = 2 * thisux * thisuy;
          let u2 = ux2 + uy2;
          let u215 = 1.5 * u2;
          this.n0[i] += omega * (four9ths * thisrho * (1 - u215) - this.n0[i]);
          this.nE[i] += omega * (one9thrho * (1 + ux3 + 4.5 * ux2 - u215) - this.nE[i]);
          this.nW[i] += omega * (one9thrho * (1 - ux3 + 4.5 * ux2 - u215) - this.nW[i]);
          this.nN[i] += omega * (one9thrho * (1 + uy3 + 4.5 * uy2 - u215) - this.nN[i]);
          this.nS[i] += omega * (one9thrho * (1 - uy3 + 4.5 * uy2 - u215) - this.nS[i]);
          this.nNE[i] += omega * (one36thrho * (1 + ux3 + uy3 + 4.5 * (u2 + uxuy2) - u215) - this.nNE[i]);
          this.nSE[i] += omega * (one36thrho * (1 + ux3 - uy3 + 4.5 * (u2 - uxuy2) - u215) - this.nSE[i]);
          this.nNW[i] += omega * (one36thrho * (1 - ux3 + uy3 + 4.5 * (u2 - uxuy2) - u215) - this.nNW[i]);
          this.nSW[i] += omega * (one36thrho * (1 - ux3 - uy3 + 4.5 * (u2 + uxuy2) - u215) - this.nSW[i]);
        }
        this.nW[this.dimensions.x - 1 + y * this.dimensions.x] = this.nW[this.dimensions.x - 2 + y * this.dimensions.x];
        this.nNW[this.dimensions.x - 1 + y * this.dimensions.x] = this.nNW[this.dimensions.x - 2 + y * this.dimensions.x];
        this.nSW[this.dimensions.x - 1 + y * this.dimensions.x] = this.nSW[this.dimensions.x - 2 + y * this.dimensions.x];
      }
    }
    stream() {
      this.barrierCount = 0;
      this.barrierxSum = 0;
      this.barrierySum = 0;
      this.barrierFx = 0;
      this.barrierFy = 0;
      for (var y = this.dimensions.y - 2; y > 0; y--) {
        for (var x = 1; x < this.dimensions.x - 1; x++) {
          this.nN[x + y * this.dimensions.x] = this.nN[x + (y - 1) * this.dimensions.x];
          this.nNW[x + y * this.dimensions.x] = this.nNW[x + 1 + (y - 1) * this.dimensions.x];
        }
        for (var x = this.dimensions.x - 2; x > 0; x--) {
          this.nE[x + y * this.dimensions.x] = this.nE[x - 1 + y * this.dimensions.x];
          this.nNE[x + y * this.dimensions.x] = this.nNE[x - 1 + (y - 1) * this.dimensions.x];
        }
      }
      for (var y = 1; y < this.dimensions.y - 1; y++) {
        for (var x = this.dimensions.x - 2; x > 0; x--) {
          this.nS[x + y * this.dimensions.x] = this.nS[x + (y + 1) * this.dimensions.x];
          this.nSE[x + y * this.dimensions.x] = this.nSE[x - 1 + (y + 1) * this.dimensions.x];
        }
        for (var x = 1; x < this.dimensions.x - 1; x++) {
          this.nW[x + y * this.dimensions.x] = this.nW[x + 1 + y * this.dimensions.x];
          this.nSW[x + y * this.dimensions.x] = this.nSW[x + 1 + (y + 1) * this.dimensions.x];
          if (this.barrier[x + y * this.dimensions.x]) {
            var index = x + y * this.dimensions.x;
            this.nE[x + 1 + y * this.dimensions.x] = this.nW[index];
            this.nW[x - 1 + y * this.dimensions.x] = this.nE[index];
            this.nN[x + (y + 1) * this.dimensions.x] = this.nS[index];
            this.nS[x + (y - 1) * this.dimensions.x] = this.nN[index];
            this.nNE[x + 1 + (y + 1) * this.dimensions.x] = this.nSW[index];
            this.nNW[x - 1 + (y + 1) * this.dimensions.x] = this.nSE[index];
            this.nSE[x + 1 + (y - 1) * this.dimensions.x] = this.nNW[index];
            this.nSW[x - 1 + (y - 1) * this.dimensions.x] = this.nNE[index];
            this.barrierCount++;
            this.barrierxSum += x;
            this.barrierySum += y;
            this.barrierFx += this.nE[index] + this.nNE[index] + this.nSE[index] - this.nW[index] - this.nNW[index] - this.nSW[index];
            this.barrierFy += this.nN[index] + this.nNE[index] + this.nNW[index] - this.nS[index] - this.nSE[index] - this.nSW[index];
          }
        }
      }
    }
    writeData() {
    }
    startOrStopData() {
    }
    startStop() {
      this.running = !this.running;
      if (this.running) {
        this.resetTimer();
        this.simulate();
      } else {
      }
    }
    simulate() {
      this.setBoundaries();
      for (var step = 0; step < this.animationPrecision; step++) {
        this.collide(1, 1, this.dimensions.x - 1, this.dimensions.y - 1);
        this.stream();
        this.time++;
        if (this.showingPeriod && this.barrierFy > 0 && this.lastBarrierFy <= 0) {
          var thisFyOscTime = this.time - this.barrierFy / (this.barrierFy - this.lastBarrierFy);
          if (this.lastFyOscTime > 0) {
            var period = thisFyOscTime - this.lastFyOscTime;
          }
          this.lastFyOscTime = thisFyOscTime;
        }
        this.lastBarrierFy = this.barrierFy;
      }
      this.paintCanvas();
      if (this.collectingData) {
        this.writeData();
        if (this.time >= 1e4)
          this.startOrStopData();
      }
      if (this.running) {
        this.stepCount += this.animationPrecision;
        this.speedReadout = Math.round(this.stepCount / ((new Date().getTime() - this.startTime) / 1e3));
        if (this.speedReadoutElt !== void 0) {
          this.speedReadoutElt.innerText = this.speedReadout.toString();
        }
      }
      var stable = true;
      for (var x = 0; x < this.dimensions.x; x++) {
        var index = x + this.dimensions.y / 2 * this.dimensions.x;
        if (this.rho[index] <= 0)
          stable = false;
      }
      if (!stable) {
        window.alert("The simulation has become unstable due to excessive fluid speeds.");
        this.startStop();
        this.initFluid();
      }
      if (this.running) {
        if (this.browserAnim) {
          window.requestAnimationFrame(() => {
            this.simulate();
          });
        } else {
          window.setTimeout(() => {
            this.simulate();
          }, 1);
        }
      }
    }
    pulse(speed, pressure, duration, spacing) {
      this.pulser = {
        speed,
        pressure,
        duration,
        spacing,
        equilibrium: {
          speed: this.speed,
          pressure: this.equilRho
        },
        run: setTimeout(() => {
          this.speed = this.pulser.equilibrium.speed;
          this.equilRho = this.pulser.equilibrium.pressure;
          if (this.pulser.spacing === void 0) {
            this.stopPulse();
          } else {
            setTimeout(() => {
              this.pulse(this.pulser.speed, this.pulser.pressure, this.pulser.duration, this.pulser.spacing);
            }, this.pulser.spacing);
          }
        }, duration)
      };
      this.speed = speed;
      this.equilRho = pressure;
    }
    stopPulse() {
      if (this.pulser !== void 0 && this.pulser !== null) {
        clearTimeout(this.pulser.run);
        this.speed = this.pulser.equilibrium.speed;
        this.equilRho = this.pulser.equilibrium.pressure;
        this.pulser = null;
      }
    }
    fromSvg(file, wrapperElt) {
      if (wrapperElt === void 0) {
        wrapperElt = document.getElementById("simulationWrapper") || document.body;
      }
      let _canvas = document.createElement("canvas");
      _canvas.id = "simulationBarrierImg";
      _canvas.width = 600;
      _canvas.height = 240;
      _canvas.style.position = "absolute";
      _canvas.style.left = "15px";
      _canvas = wrapperElt.appendChild(_canvas);
      let _context = _canvas.getContext("2d");
      const reader = new FileReader();
      reader.addEventListener("load", (event) => {
        let image__ = new Image();
        image__.onload = () => {
          if (_context !== null) {
            _context.drawImage(image__, 0, 0, _canvas.width, _canvas.height);
            this.clearBarriers();
            for (let _yPx = 0; _yPx < _canvas.height; _yPx++) {
              for (let _xPx = 0; _xPx < _canvas.width; _xPx++) {
                let pxData = _context.getImageData(_xPx, _yPx, 1, 1).data;
                if (pxData[0] != 0 || pxData[1] != 0 || pxData[2] != 0 || pxData[3] != 0) {
                  this.addBarrier(_xPx, _canvas.height - _yPx);
                }
              }
            }
            this.paintCanvas();
          }
        };
        if (event.target !== null && typeof event.target.result === "string") {
          image__.src = event.target.result;
        }
      });
      reader.readAsDataURL(file);
    }
  }
  window.Cfd = Cfd;
  require_CFD();
})();
