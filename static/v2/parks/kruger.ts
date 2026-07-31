import type { ParkConfig } from "../types";

export const kruger: ParkConfig = {
  id: "kruger",
  name: "Kruger",
  country: "Sud-àfrica",
  description: "Boscos baixos, pistes de terra i els Big Five.",
  briefingTitle: "A la recerca de la zebra",
  briefingDescription:
    "Condueix pel parc ampliat amb més vegetació. Localitza una zebra, centra-la al visor i fotografia-la.",
  available: false,
  skyColor: 0x8ab3c2,
  fogColor: 0x8ab3c2,
  fogNear: 150,
  fogFar: 800,
  ground: {
    width: 1080,
    depth: 840,
    color: 0x9e8c4a,
  },
  bounds: {
    halfWidth: 495,
    halfDepth: 390,
  },
  terrain: {
    landPolygon: [
      [-495, -390],
      [495, -390],
      [495, 390],
      [-495, 390],
    ],
  },
  sun: {
    color: 0xfff0c4,
    intensity: 2.9,
    position: [-150, 120, 180],
    shadowSize: 480,
  },
  vegetation: {
    treeCount: 220,
    treeSeed: 2,
    treeScaleBase: 0.85,
    treeScaleVar: 0.18,
    bushCount: 180,
    bushSeed: 3,
    bushScaleBase: 0.65,
    bushScaleVar: 0.15,
    patchCount: 24,
  },
  rocks: {
    count: 60,
    borderInset: 24,
  },
  camp: {
    position: [0, 3, 375],
    rotation: Math.PI / 6,
  },
  playerStart: {
    x: 0,
    z: 348,
    yaw: 0,
  },
  animals: [
    {
      species: "zebra",
      texture: "animals/zebra.png",
      width: 2.6,
      height: 2,
      scale: 1,
      positions: [
        [-165, -90],
        [216, 66],
        [-330, 165],
      ],
      speed: 0,
      fleeSpeed: 0,
      photoTarget: true,
    },
  ],
  missions: [
    {
      id: "zebra-photo",
      species: "zebra",
      count: 1,
      label: "Zebra",
    },
  ],
};
