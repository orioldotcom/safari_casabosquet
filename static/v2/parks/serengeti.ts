import type { ParkConfig } from "../types";

export const serengeti: ParkConfig = {
  id: "serengeti",
  name: "Serengeti",
  country: "Tanzània",
  description: "Sabana oberta immensa, riu estacional i grans depredadors.",
  briefingTitle: "A la recerca del guepard",
  briefingDescription:
    "Condueix lliurement pel parc ampliat. El riu i els límits rocosos marquen la zona explorable. Troba un guepard, centra'l al visor i fotografia'l.",
  available: true,
  skyColor: 0x9ac3d0,
  fogColor: 0x9ac3d0,
  fogNear: 150,
  fogFar: 800,
  ground: {
    width: 900,
    depth: 720,
    color: 0xbda05a,
    texture: "serengeti-map.png",
  },
  bounds: {
    halfWidth: 450,
    halfDepth: 360,
  },
  sun: {
    color: 0xffefc4,
    intensity: 3.2,
    position: [-180, 140, 135],
    shadowSize: 480,
  },
  vegetation: {
    treeCount: 600,
    treeSeed: 1,
    treeScaleBase: 0.55,
    treeScaleVar: 0.1,
    bushCount: 1000,
    bushSeed: 7,
    bushScaleBase: 0.65,
    bushScaleVar: 0.15,
    patchCount: 0,
  },
  rocks: {
    count: 60,
    borderInset: 42,
  },
  camp: {
    position: [-318.75, 3, 136.875],
    rotation: Math.PI / 4,
  },
  paths: [
    // Eix est-oest principal
    { x: 0, z: 0, width: 27, length: 810, rotation: Math.PI / 2 },
    // Eix nord-sud principal
    { x: 0, z: 0, width: 27, length: 690, rotation: 0 },
    // Connexió des del camp base a l’eix est-oest
    { x: -318.75, z: 67.5, width: 24, length: 135, rotation: 0 },
    // Branca nord-est
    { x: 150, z: 180, width: 21, length: 390, rotation: Math.PI / 2 },
    // Branca sud-oest
    { x: -210, z: -120, width: 21, length: 240, rotation: 0 },
    // Branca sud-est
    { x: 225, z: -105, width: 21, length: 210, rotation: 0 },
    // Branca nord-oest
    { x: -120, z: 240, width: 21, length: 210, rotation: 0 },
    // Accés secundari a l’est
    { x: 300, z: 0, width: 21, length: 270, rotation: 0 },
    // Anell nord
    { x: 0, z: 270, width: 21, length: 570, rotation: Math.PI / 2 },
    // Anell sud
    { x: 0, z: -270, width: 21, length: 570, rotation: Math.PI / 2 },
    // Anell oest
    { x: -270, z: 0, width: 21, length: 540, rotation: 0 },
    // Anell est
    { x: 270, z: 0, width: 21, length: 540, rotation: 0 },
    // Diagonal nord-oest a sud-est
    { x: 0, z: 0, width: 18, length: 660, rotation: Math.PI / 4 },
    // Diagonal sud-oest a nord-est
    { x: 0, z: 0, width: 18, length: 660, rotation: -Math.PI / 4 },
    // Branca interna nord-est
    { x: 135, z: 135, width: 18, length: 270, rotation: Math.PI / 2 },
    // Branca interna sud-oest
    { x: -135, z: -135, width: 18, length: 270, rotation: Math.PI / 2 },
  ],
  bridges: [
    { x: 105, z: 0, width: 33, length: 78, rotation: Math.PI / 2 },
    { x: 0, z: 75, width: 33, length: 78, rotation: 0 },
    { x: 180, z: 180, width: 33, length: 78, rotation: Math.PI / 2 },
    { x: 270, z: 90, width: 33, length: 78, rotation: 0 },
  ],
  terrain: {
    landPolygon: [
      [-423.75, -63.75],
      [-416.25, -195],
      [-273.75, -290.625],
      [-67.5, -279.375],
      [142.5, -247.5],
      [363.75, -200.625],
      [425.625, -101.25],
      [393.75, 112.5],
      [202.5, 255],
      [11.25, 277.5],
      [-255, 228.75],
      [-391.875, 135],
    ],
    riverPolygon: [
      [238.125, -213.75],
      [273.75, -125.625],
      [255, -30],
      [193.125, 75],
      [112.5, 183.75],
      [30, 260.625],
    ],
    mountain: { x: -288.75, z: -202.5, rx: 129.375, rz: 95.625 },
    pond: { x: -195, z: -41.25, rx: 71.25, rz: 39.375 },
  },
  playerStart: {
    x: -318.75,
    z: 136.875,
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
        [-204.375, 75],
        [-56.25, 7.5],
        [-142.5, 120],
      ],
      speed: 1.6,
      fleeSpeed: 7,
      photoTarget: true,
      turnRate: 0.8,
      wanderRange: 35,
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
