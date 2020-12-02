import { GPU, IConstantsThis, IGPUKernelSettings, IKernelFunctionThis, IKernelMapRunShortcut, IKernelRunShortcut } from "gpu.js";

// CPU version of the lib
export const collideRhoCpu = function (n0: number,nN: number,nS: number,nE: number,nW: number,nNW: number,nNE: number,nSW: number,nSE: number): number {return n0+nN+nS+nE+nW+nNW+nNE+nSW+nSE;};
export const collideUxCpu = function (nE: number,nW: number,nNW: number,nNE: number,nSW: number,nSE:number,rho: number): number { return (nE+nNE+nSE-nW-nNW-nSW)/rho; };
export const collideUyCpu = function (nN: number, nNE: number, nNW: number, nS: number, nSE: number, nSW:number, rho: number): number {return (nN+nNE+nNW-nS-nSE-nSW)/rho;};
export const collideN0Cpu = function (n0: number, omega: number, rho: number, u215: number, four9ths:number, init: number): number {return (n0  + omega * (four9ths*rho * (1- u215) - (init===0?n0:0)));};
export const collideNECpu = function (nE: number, omega: number, one9thrho: number, ux2: number ,ux3: number, u215: number, init: number): number {return nE + omega * ( one9thrho * (1 + ux3 + 4.5 * ux2- u215) - (init===0?nE:0));};
export const collideNWCpu = function (nW: number, omega: number, one9thrho: number, ux2: number ,ux3: number, u215: number, init: number): number {return nW + omega * ( one9thrho * (1 - ux3 + 4.5 * ux2 - u215) - (init===0?nW:0));};
export const collideNNCpu = function (nN: number, omega: number, one9thrho: number, uy2: number, uy3:number, u215: number, init: number): number {return nN  + omega * ( one9thrho * (1 + uy3 + 4.5 * uy2 - u215) - (init===0?nN:0));};
export const collideNSCpu = function (nS: number, omega: number, one9thrho: number, uy2: number, uy3:number, u215: number, init: number): number {return nS + omega * ( one9thrho * (1 - uy3 + 4.5 * uy2 - u215) - (init===0?nS:0));};
export const collideNNECpu = function (nNE: number, omega: number ,ux3: number, uy3:number, u215: number, one36thrho: number, u2: number, uxuy2: number, init: number): number {return nNE + omega * ( one36thrho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215) - (init===0?nNE:0));};
export const collideNSECpu = function (nSE: number, omega: number, ux3: number, uy3:number, u215: number, one36thrho: number, u2: number, uxuy2: number, init: number): number {return nSE + omega * ( one36thrho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215) - (init===0?nSE:0));};
export const collideNNWCpu = function (nNW: number, omega: number, ux3: number, uy3:number, u215: number, one36thrho: number, u2: number, uxuy2: number, init: number): number {return nNW + omega * ( one36thrho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215) - (init===0?nNW:0));};
export const collideNSWCpu = function (nSW: number, omega: number, ux3: number, uy3:number, u215: number, one36thrho: number, u2: number, uxuy2: number, init: number): number {return nSW + omega * ( one36thrho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215) - (init===0?nSW:0));};
export const streamNECpu = (nE: Array<Array<number>>, x: number, y: number, xlen: number, ylen:number): number => {
  let ny = ylen-2-y
  let nx = xlen-2-x
  
  return (ny>=0&&nx>=0)?nE[ny][nx-1]:nE[y][x];
}
export const streamNWCpu = function (nW: Array<Array<number>>, x: number, y: number, xlen: number, ylen:number): number {
  return (y<ylen-1&&x<xlen-1)?nW[y][x+1]:nW[y][x];
}
export const streamNNCpu = function (nN: Array<Array<number>>, x: number, y: number, xlen: number, ylen:number): number {
  let ny = ylen-2-y
  
  return (ny>=0&&x<xlen-1)?nN[ny-1][x]:nN[y][x];
}
export const streamNSCpu = function (nS: Array<Array<number>>, x: number, y: number, xlen: number, ylen:number): number {
  let nx = xlen-2-x
  
  return (nx>=0&&y<ylen-1)?nS[y+1][nx]:nS[y][x];
}
export const streamNNECpu = function (nNE: Array<Array<number>>, x: number, y: number, xlen: number, ylen:number): number {
  let ny = ylen-2-y
  let nx = xlen-2-x
  
  return (ny>=0&&nx>=0)?nNE[ny-1][nx-1]:nNE[y][x];
}
export const streamNSECpu = function (nSE: Array<Array<number>>, x: number, y: number, xlen: number, ylen:number): number {
  let nx = xlen-2-x
  
  return (nx>=0&&y<ylen-1)?nSE[y+1][nx-1]:nSE[y][x];
}
export const streamNNWCpu = function (nNW: Array<Array<number>>, x: number, y: number, xlen: number, ylen:number): number {
  let ny = ylen-2-y
  
  return (ny>=0&&x<xlen-1)?nNW[ny-1][x+1]:nNW[y][x];
}
export const streamNSWCpu = function (nSW: Array<Array<number>>, x: number, y: number, xlen: number, ylen:number): number {
  return (y<ylen-1&&x<xlen-1)?nSW[y+1][x+1]:nSW[y][x];
}
// /CPU version of the lib

// GPU.js thingy i didn't really look into
interface IConstants extends IConstantsThis {
  rotation: number,
}

interface IThis extends IKernelFunctionThis {
  constants: IConstants,
}

// a type, just because i can ;)
export type KernelCollection = {
  [key: string]: IKernelRunShortcut
}

// simulation functions for a line
// would work on cpu if IThis was done a bit smarter ^^
export const initSim = function (max: number, min: number) {
  if (max===min) {
    return max;
  }
  return Math.random() * (max - min) + min;
}

export const collideRho = function  (this: IThis, n0: Array<Array<number>>, nN: Array<Array<number>>, nS: Array<Array<number>>, nE: Array<Array<number>>, nW: Array<Array<number>>, nNW: Array<Array<number>>, nNE: Array<Array<number>>, nSW: Array<Array<number>>, nSE: Array<Array<number>>): number {
  const x = this.thread.y;
  const y = this.thread.x;
  return n0[y][x]+nN[y][x]+nS[y][x]+nE[y][x]+nW[y][x]+nNW[y][x]+nNE[y][x]+nSW[y][x]+nSE[y][x];
}

export const collideOne9thRho = function  (this: IThis, rho: Array<Array<number>>) {
  return rho[this.thread.y][this.thread.x]/9.0;
}

export const collideOne36thRho = function  (this: IThis, rho: Array<Array<number>>): number {
  return rho[this.thread.y][this.thread.x]/36.0;
}

export const collideUx = function (this: IThis, nE: Array<Array<number>>,nW: Array<Array<number>>,nNW: Array<Array<number>>,nNE: Array<Array<number>>,nSW: Array<Array<number>>,nSE:Array<Array<number>>,rho: Array<Array<number>>): number {
  return (
    nE[this.thread.y][this.thread.x]
    + nNE[this.thread.y][this.thread.x]
    + nSE[this.thread.y][this.thread.x]
    - nW[this.thread.y][this.thread.x]
    - nNW[this.thread.y][this.thread.x]
    - nSW[this.thread.y][this.thread.x]
  )/rho[this.thread.y][this.thread.x];
}

export const collideUx2 = function  (this: IThis, ux: Array<Array<number>>): number {
  return ux[this.thread.y][this.thread.x]*ux[this.thread.y][this.thread.x];
}

export const collideUx3 = function  (this: IThis, ux: Array<Array<number>>): number {
  return ux[this.thread.y][this.thread.x]*3;
}

export const collideUy = function  (this: IThis, nN: Array<Array<number>>, nNE: Array<Array<number>>, nNW: Array<Array<number>>, nS: Array<Array<number>>, nSE: Array<Array<number>>, nSW:Array<Array<number>>, rho: Array<Array<number>>): number {
  return (
    nN[this.thread.y][this.thread.x]
    + nNE[this.thread.y][this.thread.x]
    + nNW[this.thread.y][this.thread.x]
    - nS[this.thread.y][this.thread.x]
    - nSE[this.thread.y][this.thread.x]
    - nSW[this.thread.y][this.thread.x]
  )/rho[this.thread.y][this.thread.x];
}

export const collideUy2 = function  (this: IThis, uy: Array<Array<number>>): number {
  return uy[this.thread.y][this.thread.x]*uy[this.thread.y][this.thread.x];
}

export const collideUy3 = function  (this: IThis, uy: Array<Array<number>>): number {
  return uy[this.thread.y][this.thread.x]*3;
}

export const collideUxUy2 = function  (this: IThis, ux: Array<Array<number>>, uy: Array<Array<number>>): number {
  return ux[this.thread.y][this.thread.x]*uy[this.thread.y][this.thread.x]*2;
}

export const collideU2 = function  (this: IThis, ux2: Array<Array<number>>, uy2: Array<Array<number>>): number {
  return ux2[this.thread.y][this.thread.x]+uy2[this.thread.y][this.thread.x];
}

export const collideU215 = function  (this: IThis, u2: Array<Array<number>>): number {
  return u2[this.thread.y][this.thread.x]*1.5;
}

export const collideN0 = function (this: IThis, rho: Array<Array<number>>, u215: Array<Array<number>>, four9ths:number, omega: number): number {
  return omega
    * (
      four9ths
      * rho[this.thread.y][this.thread.x]
      * (
        1
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const collideNE = function (this: IThis, one9thrho: Array<Array<number>>, ux2: Array<Array<number>> ,ux3: Array<Array<number>>, u215: Array<Array<number>>, omega: number): number {
  return omega
    *  (
      one9thrho[this.thread.y][this.thread.x]
      *  (
        1
        + ux3[this.thread.y][this.thread.x]
        + 4.5
        * ux2[this.thread.y][this.thread.x]
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const collideNW = function (this: IThis, one9thrho: Array<Array<number>>, ux2: Array<Array<number>> ,ux3: Array<Array<number>>, u215: Array<Array<number>>, omega: number): number {
  return omega
    * (
      one9thrho[this.thread.y][this.thread.x]
      * (
        1
        - ux3[this.thread.y][this.thread.x]
        + 4.5
        * ux2[this.thread.y][this.thread.x]
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const collideNN = function (this: IThis, one9thrho: Array<Array<number>>, uy2: Array<Array<number>>, uy3: Array<Array<number>>, u215: Array<Array<number>>, omega: number): number {
  return omega
    * (
      one9thrho[this.thread.y][this.thread.x]
      * (
        1
        + uy3[this.thread.y][this.thread.x]
        + 4.5
        * uy2[this.thread.y][this.thread.x]
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const collideNS = function (this: IThis, one9thrho: Array<Array<number>>, uy2: Array<Array<number>>, uy3: Array<Array<number>>, u215: Array<Array<number>>, omega: number): number {
  return omega
    * (
      one9thrho[this.thread.y][this.thread.x]
      * (
        1
        - uy3[this.thread.y][this.thread.x]
        + 4.5
        * uy2[this.thread.y][this.thread.x]
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const collideNNE = function (this: IThis ,ux3: Array<Array<number>>, uy3: Array<Array<number>>, u215: Array<Array<number>>, one36thrho: Array<Array<number>>, u2: Array<Array<number>>, uxuy2: Array<Array<number>>, omega: number): number {
  return omega
    * (
      one36thrho[this.thread.y][this.thread.x]
      * (
        1
        + ux3[this.thread.y][this.thread.x]
        + uy3[this.thread.y][this.thread.x]
        + 4.5
        * (
          u2[this.thread.y][this.thread.x]
          + uxuy2[this.thread.y][this.thread.x]
        )
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const collideNSE = function (this: IThis, ux3: Array<Array<number>>, uy3: Array<Array<number>>, u215: Array<Array<number>>, one36thrho: Array<Array<number>>, u2: Array<Array<number>>, uxuy2: Array<Array<number>>, omega: number): number {
  return omega
    * (
      one36thrho[this.thread.y][this.thread.x]
      * (
        1
        + ux3[this.thread.y][this.thread.x]
        - uy3[this.thread.y][this.thread.x]
        + 4.5
        * (
          u2[this.thread.y][this.thread.x]
          - uxuy2[this.thread.y][this.thread.x]
        )
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const collideNNW = function (this: IThis, ux3: Array<Array<number>>, uy3: Array<Array<number>>, u215: Array<Array<number>>, one36thrho: Array<Array<number>>, u2: Array<Array<number>>, uxuy2: Array<Array<number>>, omega: number): number {
  return omega
    * (
      one36thrho[this.thread.y][this.thread.x]
      * (
        1
        - ux3[this.thread.y][this.thread.x]
        + uy3[this.thread.y][this.thread.x]
        + 4.5
        * (
          u2[this.thread.y][this.thread.x]
          - uxuy2[this.thread.y][this.thread.x]
        )
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const collideNSW = function (this: IThis, ux3: Array<Array<number>>, uy3: Array<Array<number>>, u215: Array<Array<number>>, one36thrho: Array<Array<number>>, u2: Array<Array<number>>, uxuy2: Array<Array<number>>, omega: number): number {
  return omega
    * (
      one36thrho[this.thread.y][this.thread.x]
      * (
        1
        - ux3[this.thread.y][this.thread.x]
        - uy3[this.thread.y][this.thread.x]
        + 4.5
        * (
          u2[this.thread.y][this.thread.x]
          + uxuy2[this.thread.y][this.thread.x]
        )
        - u215[this.thread.y][this.thread.x]
      )
    );
}

export const streamNE = function (this:IThis, nE: Array<Array<number>>, xlen: number, ylen:number): number {
  const x = this.thread.x;
  const y = this.thread.y;
  let ny = ylen-2-y
  let nx = xlen-2-x
  
  return (ny>=0&&nx>=0)?nE[ny][nx-1]:nE[y][x];
}

export const streamNW = function (this:IThis, nW: Array<Array<number>>, xlen: number, ylen:number): number {
  const x = this.thread.x;
  const y = this.thread.y;
  return (y<ylen-1&&x<xlen-1)?nW[y][x+1]:nW[y][x];
}

export const streamNN = function (this:IThis, nN: Array<Array<number>>, xlen: number, ylen:number): number {
  const x = this.thread.x;
  const y = this.thread.y;
  let ny = ylen-2-y
  
  return (ny>=0&&x<xlen-1)?nN[ny-1][x]:nN[y][x];
}

export const streamNS = function (this:IThis, nS: Array<Array<number>>, xlen: number, ylen:number): number {
  const x = this.thread.x;
  const y = this.thread.y;
  let nx = xlen-2-x
  
  return (nx>=0&&y<ylen-1)?nS[y+1][nx]:nS[y][x];
}

export const streamNNE = function (this:IThis, nNE: Array<Array<number>>, xlen: number, ylen:number): number {
  const x = this.thread.x;
  const y = this.thread.y;
  let ny = ylen-2-y
  let nx = xlen-2-x
  
  return (ny>=0&&nx>=0)?nNE[ny-1][nx-1]:nNE[y][x];
}

export const streamNSE = function (this:IThis, nSE: Array<Array<number>>, xlen: number, ylen:number): number {
  const x = this.thread.x;
  const y = this.thread.y;
  let nx = xlen-2-x
  
  return (nx>=0&&y<ylen-1)?nSE[y+1][nx-1]:nSE[y][x];
}

export const streamNNW = function (this:IThis, nNW: Array<Array<number>>, xlen: number, ylen:number): number {
  const x = this.thread.x;
  const y = this.thread.y;
  let ny = ylen-2-y
  
  return (ny>=0&&x<xlen-1)?nNW[ny-1][x+1]:nNW[y][x];
}

export const streamNSW = function (this:IThis, nSW: Array<Array<number>>, xlen: number, ylen:number): number {
  const x = this.thread.x;
  const y = this.thread.y;
  return (y<ylen-1&&x<xlen-1)?nSW[y+1][x+1]:nSW[y][x];
}

//
export type LBMKernelCollection = {
  initSim: IKernelRunShortcut
  collideRho: IKernelRunShortcut
  collideOne9thRho: IKernelRunShortcut
  collideOne36thRho: IKernelRunShortcut
  collideUx: IKernelRunShortcut
  collideUx2: IKernelRunShortcut
  collideUx3: IKernelRunShortcut
  collideUy: IKernelRunShortcut
  collideUy2: IKernelRunShortcut
  collideUy3: IKernelRunShortcut
  collideUxUy2: IKernelRunShortcut
  collideU2: IKernelRunShortcut
  collideU215: IKernelRunShortcut
  collideN0: IKernelRunShortcut
  collideNE: IKernelRunShortcut
  collideNW: IKernelRunShortcut
  collideNN: IKernelRunShortcut
  collideNS: IKernelRunShortcut
  collideNNE: IKernelRunShortcut
  collideNSE: IKernelRunShortcut
  collideNNW: IKernelRunShortcut
  collideNSW: IKernelRunShortcut
  streamNE: IKernelRunShortcut
  streamNW: IKernelRunShortcut
  streamNN: IKernelRunShortcut
  streamNS: IKernelRunShortcut
  streamNNE: IKernelRunShortcut
  streamNSE: IKernelRunShortcut
  streamNNW: IKernelRunShortcut
  streamNSW: IKernelRunShortcut
} & KernelCollection;

export const getLBMKernels = function (settings?: IGPUKernelSettings): LBMKernelCollection {
  const gpu = new GPU();
  return {
    initSim: gpu.createKernel(initSim, settings),
    collideRho: gpu.createKernel(collideRho, settings),
    collideOne9thRho: gpu.createKernel(collideOne9thRho, settings),
    collideOne36thRho: gpu.createKernel(collideOne36thRho, settings),
    collideUx: gpu.createKernel(collideUx, settings),
    collideUx2: gpu.createKernel(collideUx2, settings),
    collideUx3: gpu.createKernel(collideUx3, settings),
    collideUy: gpu.createKernel(collideUy, settings),
    collideUy2: gpu.createKernel(collideUy2, settings),
    collideUy3: gpu.createKernel(collideUy3, settings),
    collideUxUy2: gpu.createKernel(collideUxUy2, settings),
    collideU2: gpu.createKernel(collideU2, settings),
    collideU215: gpu.createKernel(collideU215, settings),
    collideN0: gpu.createKernel(collideN0, settings),
    collideNE: gpu.createKernel(collideNE, settings),
    collideNW: gpu.createKernel(collideNW, settings),
    collideNN: gpu.createKernel(collideNN, settings),
    collideNS: gpu.createKernel(collideNS, settings),
    collideNNE: gpu.createKernel(collideNNE, settings),
    collideNSE: gpu.createKernel(collideNSE, settings),
    collideNNW: gpu.createKernel(collideNNW, settings),
    collideNSW: gpu.createKernel(collideNSW, settings),
    streamNE: gpu.createKernel(streamNE, settings),
    streamNW: gpu.createKernel(streamNW, settings),
    streamNN: gpu.createKernel(streamNN, settings),
    streamNS: gpu.createKernel(streamNS, settings),
    streamNNE: gpu.createKernel(streamNNE, settings),
    streamNSE: gpu.createKernel(streamNSE, settings),
    streamNNW: gpu.createKernel(streamNNW, settings),
    streamNSW: gpu.createKernel(streamNSW, settings),
  };
};

export class LBM {
  viscosity: number;
  dimensions: {
    x: number;
    y: number;
  };
  data!: {
    rho: Array<Array<number>>
    ux: Array<Array<number>>
    uy: Array<Array<number>>
    n0: Array<Array<number>>
    nN: Array<Array<number>>
    nS: Array<Array<number>>
    nE: Array<Array<number>>
    nW: Array<Array<number>>
    nNE: Array<Array<number>>
    nSE: Array<Array<number>>
    nNW: Array<Array<number>>
    nSW: Array<Array<number>>
    one9thRho: Array<Array<number>>
    one36thRho: Array<Array<number>>
    ux2: Array<Array<number>>
    ux3: Array<Array<number>>
    uy2: Array<Array<number>>
    uy3: Array<Array<number>>
    uxUy2: Array<Array<number>>
    u2: Array<Array<number>>
    u215: Array<Array<number>>
  }
  barrier: Array<Array<boolean>>
  omega: number;
  kernels: LBMKernelCollection;

  constructor(
    x: number,
    y: number,
    viscosity: number,
    rho: number|[number, number] = [0.95,1.05],
    ux: number|[number, number] = [0.05,0.15],
    uy: number|[number, number] = [0.05,0.15]
  ) {
    this.dimensions = {x: x, y: y};
    this.viscosity = viscosity;
    this.omega = 1 / (3*this.viscosity + 0.5);
    this.kernels = getLBMKernels({
      output:[x,y]
    });    
    this.barrier = Array(y).map(() => {return  Array(x).map(() => {return false;})});
    this.init(rho, ux, uy);
  }

  init(rho: number|[number, number], ux: number|[number, number], uy: number|[number, number]) {
    if (!Array.isArray(rho)) {
      rho = [rho, rho]
    }
    if (!Array.isArray(ux)) {
      ux = [ux, ux]
    }
    if (!Array.isArray(uy)) {
      uy = [uy, uy]
    }
    this.data = {
      rho:this.kernels.initSim(0.8, 1) as number[][],
      ux:this.kernels.initSim(0, 0.15) as number[][],
      uy:this.kernels.initSim(0, 0.15) as number[][],
      n0:[[]],
      nN:[[]],
      nS:[[]],
      nE:[[]],
      nW:[[]],
      nNE:[[]],
      nSE:[[]],
      nNW:[[]],
      nSW:[[]],
      one9thRho:[[]],
      one36thRho:[[]],
      ux2:[[]],
      ux3:[[]],
      uy2:[[]],
      uy3:[[]],
      uxUy2:[[]],
      u2:[[]],
      u215:[[]],
    };
    this.collide(true);
  }

  collide(init: boolean = false) {
    // Computing parts of the collision simulation

    // Rho
    if (!init) {
      this.data.rho = this.kernels.collideRho(this.data.n0,this.data.nN,this.data.nS,this.data.nE,this.data.nW,this.data.nNW,this.data.nNE,this.data.nSW,this.data.nSE) as number[][]
    }
    this.data.one9thRho = this.kernels.collideOne9thRho(this.data.rho) as number[][];
    this.data.one36thRho = this.kernels.collideOne36thRho(this.data.rho) as number[][];

    // Speeds
    // Speed x
    if (!init) {
      this.data.ux = this.kernels.collideUx(this.data.nE,this.data.nW,this.data.nNW,this.data.nNE,this.data.nSW,this.data.nSE,this.data.rho) as number[][]
    }
    this.data.ux2 = this.kernels.collideUx2(this.data.ux) as number[][];
    this.data.ux3 = this.kernels.collideUx3(this.data.ux) as number[][];
    // speed y
    if (!init) {
      this.data.uy = this.kernels.collideUy(this.data.nN,this.data.nNE,this.data.nNW,this.data.nS,this.data.nSE,this.data.nSW,this.data.rho) as number[][]
    }
    this.data.uy2 = this.kernels.collideUy2(this.data.uy) as number[][];
    this.data.uy3 = this.kernels.collideUy3(this.data.uy) as number[][];
    // speed x-y
    this.data.uxUy2 = this.kernels.collideUxUy2(this.data.ux, this.data.uy) as number[][];
    this.data.u2 = this.kernels.collideU2(this.data.ux2, this.data.uy2) as number[][];
    this.data.u215 = this.kernels.collideU215(this.data.u2) as number[][];
    
    // actual collisions
    this.data.n0 = this.kernels.collideN0(this.data.rho, this.data.u215, 4.0/9.0, this.omega) as number[][];
    this.data.nE = this.kernels.collideNE(this.data.one9thRho,this.data.ux2,this.data.ux3,this.data.u215,this.omega) as number[][];
    this.data.nW = this.kernels.collideNW(this.data.one9thRho,this.data.ux2,this.data.ux3,this.data.u215,this.omega) as number[][];
    this.data.nN = this.kernels.collideNN(this.data.one9thRho,this.data.ux2,this.data.ux3,this.data.u215,this.omega) as number[][];
    this.data.nS = this.kernels.collideNS(this.data.one9thRho,this.data.ux2,this.data.ux3,this.data.u215,this.omega) as number[][];
    this.data.nNE = this.kernels.collideNNE(this.data.ux3,this.data.uy3,this.data.u215,this.data.one36thRho,this.data.u2,this.data.uxUy2,this.omega) as number[][];
    this.data.nSE = this.kernels.collideNSE(this.data.ux3,this.data.uy3,this.data.u215,this.data.one36thRho,this.data.u2,this.data.uxUy2,this.omega) as number[][];
    this.data.nNW = this.kernels.collideNNW(this.data.ux3,this.data.uy3,this.data.u215,this.data.one36thRho,this.data.u2,this.data.uxUy2,this.omega) as number[][];
    this.data.nSW = this.kernels.collideNSW(this.data.ux3,this.data.uy3,this.data.u215,this.data.one36thRho,this.data.u2,this.data.uxUy2,this.omega) as number[][];
  }
  
}

(window as any).LBM = LBM;