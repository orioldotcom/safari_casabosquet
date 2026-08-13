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
  fogNear: 160,
  fogFar: 1150,
  ground: {
    width: 1350,
    depth: 1080,
    color: 0xbda05a,
    texture: "serengeti-map.png",
  },
  bounds: {
    halfWidth: 675,
    halfDepth: 540,
  },
  sun: {
    color: 0xffefc4,
    intensity: 3.2,
    position: [-270, 170, 200],
    shadowSize: 720,
  },
  vegetation: {
    treeCount: 750,
    treeSeed: 1,
    treeScaleBase: 0.55,
    treeScaleVar: 0.1,
    bushCount: 1300,
    bushSeed: 7,
    bushScaleBase: 0.65,
    bushScaleVar: 0.15,
    patchCount: 60,
  },
  rocks: {
    count: 80,
    borderInset: 60,
  },
  camp: {
    position: [-478.125, 3, 205.3125],
    rotation: Math.PI / 4,
  },
  paths: [
    // Eix est-oest principal
    { x: 0, z: 0, width: 13, length: 1215, rotation: Math.PI / 2 },
    // Eix nord-sud principal
    { x: 0, z: 0, width: 13, length: 1035, rotation: 0 },
    // Connexió des del camp base a l’eix est-oest
    { x: -478.125, z: 101.25, width: 12, length: 202.5, rotation: 0 },
    // Branca nord-est
    { x: 225, z: 270, width: 11, length: 585, rotation: Math.PI / 2 },
    // Branca sud-oest
    { x: -315, z: -180, width: 11, length: 360, rotation: 0 },
    // Branca sud-est
    { x: 337.5, z: -157.5, width: 11, length: 315, rotation: 0 },
    // Branca nord-oest
    { x: -180, z: 360, width: 11, length: 315, rotation: 0 },
    // Accés secundari a l’est
    { x: 450, z: 0, width: 11, length: 405, rotation: 0 },
    // Anell nord
    { x: 0, z: 405, width: 11, length: 855, rotation: Math.PI / 2 },
    // Anell sud
    { x: 0, z: -405, width: 11, length: 855, rotation: Math.PI / 2 },
    // Anell oest
    { x: -405, z: 0, width: 11, length: 810, rotation: 0 },
    // Anell est
    { x: 405, z: 0, width: 11, length: 810, rotation: 0 },
    // Diagonal nord-oest a sud-est
    { x: 0, z: 0, width: 10, length: 990, rotation: Math.PI / 4 },
    // Diagonal sud-oest a nord-est
    { x: 0, z: 0, width: 10, length: 990, rotation: -Math.PI / 4 },
    // Branca interna nord-est
    { x: 202.5, z: 202.5, width: 10, length: 405, rotation: Math.PI / 2 },
    // Branca interna sud-oest
    { x: -202.5, z: -202.5, width: 10, length: 405, rotation: Math.PI / 2 },
  ],
  bridges: [
    { x: 157.5, z: 0, width: 18, length: 117, rotation: Math.PI / 2 },
    { x: 0, z: 112.5, width: 18, length: 117, rotation: 0 },
    { x: 270, z: 270, width: 18, length: 117, rotation: Math.PI / 2 },
    { x: 405, z: 135, width: 18, length: 117, rotation: 0 },
  ],
  terrain: {
    landPolygon: [
      [-635.625, -95.625],
      [-624.375, -292.5],
      [-410.625, -435.9375],
      [-101.25, -419.0625],
      [213.75, -371.25],
      [545.625, -300.9375],
      [638.4375, -151.875],
      [590.625, 168.75],
      [303.75, 382.5],
      [16.875, 416.25],
      [-382.5, 343.125],
      [-587.8125, 202.5],
    ],
    riverPolygon: [
      [357.1875, -320.625],
      [410.625, -188.4375],
      [382.5, -45],
      [289.6875, 112.5],
      [168.75, 275.625],
      [45, 390.9375],
    ],
    mountain: { x: -433.125, z: -303.75, rx: 194.0625, rz: 143.4375 },
    pond: { x: -292.5, z: -61.875, rx: 106.875, rz: 59.0625 },
  },
  playerStart: {
    x: -478.125,
    z: 205.3125,
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
        [-306.5625, 112.5],
        [-84.375, 11.25],
        [-213.75, 180],
      ],
      speed: 1.6,
      fleeSpeed: 7,
      photoTarget: true,
      turnRate: 0.8,
      wanderRange: 55,
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
