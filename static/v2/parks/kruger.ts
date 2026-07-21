import type { ParkConfig } from "../types";

export const kruger: ParkConfig = {
  id: "kruger",
  name: "Kruger",
  country: "Sud-àfrica",
  description: "Boscos baixos, pistes de terra i els Big Five.",
  briefingTitle: "A la recerca de la zebra",
  briefingDescription:
    "Condueix pel parc amb més vegetació. Localitza una zebra, centra-la al visor i fotografia-la.",
  available: false,
  skyColor: 0x8ab3c2,
  fogColor: 0x8ab3c2,
  fogNear: 65,
  fogFar: 220,
  ground: {
    width: 360,
    depth: 280,
    color: 0x9e8c4a,
  },
  bounds: {
    halfWidth: 165,
    halfDepth: 130,
  },
  sun: {
    color: 0xfff0c4,
    intensity: 2.9,
    position: [-50, 90, 60],
    shadowSize: 180,
  },
  vegetation: {
    treeCount: 90,
    treeSeed: 2,
    treeScaleBase: 0.85,
    treeScaleVar: 0.18,
    patchCount: 24,
  },
  rocks: {
    count: 28,
    borderInset: 8,
  },
  camp: {
    position: [0, 3, 125],
    rotation: Math.PI / 6,
  },
  playerStart: {
    x: 0,
    z: 116,
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
        [-55, -30],
        [72, 22],
        [-110, 55],
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
