import type { ParkConfig } from "../types";

export const serengeti: ParkConfig = {
  id: "serengeti",
  name: "Serengeti",
  country: "Tanzània",
  description: "Sabana oberta, riu estacional i grans depredadors.",
  briefingTitle: "A la recerca del guepard",
  briefingDescription:
    "Condueix lliurement des del seient del 4x4. El riu i els límits rocosos marquen la zona explorable. Troba un guepard, centra'l al visor i fotografia'l.",
  available: true,
  skyColor: 0x9ac3d0,
  fogColor: 0x9ac3d0,
  fogNear: 72,
  fogFar: 245,
  ground: {
    width: 340,
    depth: 250,
    color: 0xbda05a,
  },
  bounds: {
    halfWidth: 156,
    halfDepth: 112,
  },
  sun: {
    color: 0xffefc4,
    intensity: 3.2,
    position: [-60, 95, 45],
    shadowSize: 160,
  },
  river: {
    width: 18,
    length: 188,
    rotation: -0.2,
    position: [44, 0.05, -5],
    localHalfWidth: 10.5,
    localHalfLength: 96,
  },
  vegetation: {
    treeCount: 54,
    treeSeed: 1,
    treeScaleBase: 0.72,
    treeScaleVar: 0.12,
    patchCount: 18,
  },
  rocks: {
    count: 22,
    borderInset: 0,
  },
  camp: {
    position: [0, 3, 112],
    rotation: Math.PI / 4,
  },
  playerStart: {
    x: 0,
    z: 104,
    yaw: 0,
  },
  animals: [
    {
      species: "guepard",
      texture: "animals/cheetah.png?v=2",
      width: 2.4,
      height: 1.92,
      scale: 1,
      positions: [
        [-38, -46],
        [88, 34],
        [-92, 48],
      ],
      speed: 0,
      fleeSpeed: 0,
      photoTarget: true,
    },
  ],
  missions: [
    {
      id: "cheetah-photo",
      species: "guepard",
      count: 1,
      label: "Guepard",
    },
  ],
};
