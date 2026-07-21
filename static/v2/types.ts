export type AnimalSpecies = "guepard" | "zebra" | "girafa" | "elefant" | "lleó" | "gasela";

export type AnimalConfig = {
  species: AnimalSpecies;
  texture: string;
  width: number;
  height: number;
  scale: number;
  positions: [number, number][];
  speed: number;
  fleeSpeed: number;
  photoTarget: boolean;
};

export type Mission = {
  id: string;
  species: AnimalSpecies;
  count: number;
  label: string;
};

export type ParkConfig = {
  id: string;
  name: string;
  country: string;
  description: string;
  briefingTitle: string;
  briefingDescription: string;
  available: boolean;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  ground: {
    width: number;
    depth: number;
    color: number;
    texture?: string;
  };
  bounds: {
    halfWidth: number;
    halfDepth: number;
  };
  terrain: {
    landPolygon: [number, number][];
    riverPolygon?: [number, number][];
    mountain?: { x: number; z: number; rx: number; rz: number };
    pond?: { x: number; z: number; rx: number; rz: number };
  };
  sun: {
    color: number;
    intensity: number;
    position: [number, number, number];
    shadowSize: number;
  };
  river?: {
    width: number;
    length: number;
    rotation: number;
    position: [number, number, number];
    localHalfWidth: number;
    localHalfLength: number;
  };
  vegetation: {
    treeCount: number;
    treeSeed: number;
    treeScaleBase: number;
    treeScaleVar: number;
    patchCount: number;
  };
  rocks: {
    count: number;
    borderInset: number;
  };
  camp: {
    position: [number, number, number];
    rotation: number;
  };
  playerStart: {
    x: number;
    z: number;
    yaw: number;
  };
  animals: AnimalConfig[];
  missions: Mission[];
};
