import * as THREE from "three";
import type { AnimalSpecies, ParkConfig } from "../types";
import { isPlayableLand, isSolidGround } from "./terrain";

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 9283.17 + salt * 137.31) * 43758.5453;
  return value - Math.floor(value);
}

function makeTree(x: number, z: number, scale: number) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22 * scale, 0.34 * scale, 2.8 * scale, 7),
    new THREE.MeshStandardMaterial({ color: 0x73502c, roughness: 1 }),
  );
  trunk.position.y = 1.4 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(2.5 * scale, 10, 7),
    new THREE.MeshStandardMaterial({ color: 0x355c31, roughness: 0.95 }),
  );
  crown.scale.y = 0.38;
  crown.position.y = 3.3 * scale;
  crown.castShadow = true;
  group.add(crown);
  group.position.set(x, 0, z);
  return group;
}

function makeDirtPath(x: number, z: number, width: number, length: number, rotation: number) {
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({ color: 0x8f6e42, roughness: 1 }),
  );
  path.rotation.x = -Math.PI / 2;
  path.rotation.z = rotation;
  path.position.set(x, 0.02, z);
  path.receiveShadow = true;
  return path;
}

function makeBush(x: number, z: number, scale: number) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x3a5c2d, roughness: 1 });
  for (let i = 0; i < 3; i += 1) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry((0.5 + i * 0.15) * scale, 7, 5),
      material,
    );
    sphere.position.set(
      (Math.random() - 0.5) * 0.6 * scale,
      (0.4 + Math.random() * 0.3) * scale,
      (Math.random() - 0.5) * 0.6 * scale,
    );
    sphere.castShadow = true;
    group.add(sphere);
  }
  group.position.set(x, 0, z);
  return group;
}

function makeBridge(x: number, z: number, width: number, length: number, rotation: number) {
  const group = new THREE.Group();
  const deckMaterial = new THREE.MeshStandardMaterial({ color: 0x8f6e42, roughness: 1 });
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1 });

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.25, length),
    deckMaterial,
  );
  deck.position.y = 0.12;
  deck.receiveShadow = true;
  deck.castShadow = true;
  group.add(deck);

  const railHeight = 0.45;
  const railThick = 0.12;
  for (const offset of [-width / 2 + 0.1, width / 2 - 0.1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(railThick, railHeight, length),
      railMaterial,
    );
    rail.position.set(offset, railHeight / 2 + 0.12, 0);
    rail.castShadow = true;
    group.add(rail);
  }

  for (let i = 0; i < 5; i += 1) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.2, 0.08, railThick),
      railMaterial,
    );
    post.position.set(0, railHeight + 0.12, -length / 2 + i * (length / 4));
    group.add(post);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  return group;
}

export type AnimalInstance = {
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  species: AnimalSpecies;
  x: number;
  z: number;
  angle: number;
  speed: number;
  state: "idle" | "fleeing";
  config: AnimalConfig;
  home: { x: number; z: number };
};

export type BuiltScene = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  player: { x: number; z: number; yaw: number; speed: number; cameraYaw: number; cameraPitch: number };
  photoTargets: THREE.Mesh[];
  animals: AnimalInstance[];
  isBlocked: (x: number, z: number) => boolean;
  isBlockedForAnimals: (x: number, z: number) => boolean;
  cleanup: () => void;
};

export function buildScene(canvas: HTMLCanvasElement, config: ParkConfig): BuiltScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.skyColor);
  scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 430);
  const player = {
    x: config.playerStart.x,
    z: config.playerStart.z,
    yaw: config.playerStart.yaw,
    speed: 0,
    cameraYaw: config.playerStart.yaw,
    cameraPitch: 0,
  };

  scene.add(new THREE.HemisphereLight(0xf4e4b3, 0x455431, 2.5));
  const sun = new THREE.DirectionalLight(config.sun.color, config.sun.intensity);
  sun.position.set(...config.sun.position);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const half = config.sun.shadowSize;
  sun.shadow.camera.left = -half;
  sun.shadow.camera.right = half;
  sun.shadow.camera.top = half * 0.8;
  sun.shadow.camera.bottom = -half * 0.8;
  scene.add(sun);

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: config.ground.color,
    roughness: 1,
  });
  if (config.ground.texture) {
    const mapTexture = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}${config.ground.texture}`,
    );
    mapTexture.colorSpace = THREE.SRGBColorSpace;
    mapTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    groundMaterial.map = mapTexture;
    groundMaterial.color = new THREE.Color(0xffffff);
  }

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(config.ground.width, config.ground.depth),
    groundMaterial,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  if (config.paths) {
    for (const path of config.paths) {
      scene.add(makeDirtPath(path.x, path.z, path.width, path.length, path.rotation));
    }
  }

  const bridgeColliders: { x: number; z: number; width: number; length: number; rotation: number }[] = [];
  if (config.bridges) {
    for (const bridge of config.bridges) {
      scene.add(makeBridge(bridge.x, bridge.z, bridge.width, bridge.length, bridge.rotation));
      bridgeColliders.push(bridge);
    }
  }

  const isOnPath = (x: number, z: number) => {
    if (!config.paths) return false;
    for (const path of config.paths) {
      const dx = x - path.x;
      const dz = z - path.z;
      const localX = dx * Math.cos(-path.rotation) - dz * Math.sin(-path.rotation);
      const localZ = dx * Math.sin(-path.rotation) + dz * Math.cos(-path.rotation);
      const margin = 2;
      if (
        Math.abs(localX) < path.length / 2 + margin &&
        Math.abs(localZ) < path.width / 2 + margin
      ) {
        return true;
      }
    }
    return false;
  };

  for (let index = 0; index < config.vegetation.patchCount; index += 1) {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(7 + (index % 5) * 2.2, 18),
      new THREE.MeshStandardMaterial({
        color: index % 3 === 0 ? 0x87934b : 0x9e9650,
        roughness: 1,
      }),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(
      seeded(index, 10) * config.ground.width - config.ground.width / 2,
      0.012,
      seeded(index, 11) * config.ground.depth - config.ground.depth / 2,
    );
    scene.add(patch);
  }

  const [campX, campY, campZ] = config.camp.position;
  const treeColliders: { x: number; z: number; radius: number }[] = [];
  let placedTrees = 0;
  let attempt = 0;
  while (placedTrees < config.vegetation.treeCount && attempt < config.vegetation.treeCount * 20) {
    attempt += 1;
    const x = seeded(attempt, config.vegetation.treeSeed) * config.ground.width - config.ground.width / 2;
    const z = seeded(attempt, config.vegetation.treeSeed + 100) * config.ground.depth - config.ground.depth / 2;
    const nearCamp = Math.hypot(x - campX, z - campZ) < 18;
    if (nearCamp || isOnPath(x, z) || !isPlayableLand(x, z, config)) continue;
    const scale = config.vegetation.treeScaleBase + (attempt % 4) * config.vegetation.treeScaleVar;
    scene.add(makeTree(x, z, scale));
    treeColliders.push({ x, z, radius: 1.6 * scale });
    placedTrees += 1;
  }

  let placedBushes = 0;
  let bushAttempt = 0;
  while (placedBushes < config.vegetation.bushCount && bushAttempt < config.vegetation.bushCount * 30) {
    bushAttempt += 1;
    const x = seeded(bushAttempt, config.vegetation.bushSeed) * config.ground.width - config.ground.width / 2;
    const z = seeded(bushAttempt, config.vegetation.bushSeed + 100) * config.ground.depth - config.ground.depth / 2;
    if (isOnPath(x, z) || !isPlayableLand(x, z, config)) continue;
    const nearAnimal = config.animals.some((animal) =>
      animal.positions.some(([ax, az]) => Math.hypot(x - ax, z - az) < 4),
    );
    if (nearAnimal) continue;
    const scale = config.vegetation.bushScaleBase + (bushAttempt % 4) * config.vegetation.bushScaleVar;
    scene.add(makeBush(x, z, scale));
    placedBushes += 1;
  }

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x665d4b, roughness: 1 });
  for (let index = 0; index < config.rocks.count; index += 1) {
    const alongX = index < config.rocks.count / 2;
    const rock = new THREE.Mesh(
      new THREE.ConeGeometry(8 + (index % 4) * 2, 18 + (index % 5) * 5, 7),
      rockMaterial,
    );
    const inset = config.rocks.borderInset;
    const halfW = config.bounds.halfWidth - inset;
    const halfD = config.bounds.halfDepth - inset;
    rock.position.set(
      alongX
        ? -halfW + (index / (config.rocks.count / 2 - 1)) * halfW * 2
        : index % 2 === 0
          ? -halfW - 8
          : halfW + 8,
      7,
      alongX
        ? -halfD
        : -halfD + ((index - config.rocks.count / 2) / (config.rocks.count / 2 - 1)) * halfD * 2,
    );
    rock.rotation.y = index * 0.8;
    rock.castShadow = true;
    scene.add(rock);
  }

  const camp = new THREE.Mesh(
    new THREE.ConeGeometry(4.8, 6, 4),
    new THREE.MeshStandardMaterial({ color: 0xd8bd7a, roughness: 0.9 }),
  );
  camp.position.set(campX, campY, campZ);
  camp.rotation.y = config.camp.rotation;
  scene.add(camp);

  const photoTargets: THREE.Mesh[] = [];
  const animals: AnimalInstance[] = [];
  const textureCache = new Map<string, THREE.Texture>();
  if (config.ground.texture) {
    const mapTexture = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}${config.ground.texture}`,
    );
    mapTexture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(config.ground.texture, mapTexture);
  }
  for (const animal of config.animals) {
    let texture = textureCache.get(animal.texture);
    if (!texture) {
      texture = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}${animal.texture}`);
      texture.colorSpace = THREE.SRGBColorSpace;
      textureCache.set(animal.texture, texture);
    }
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
    });
    for (const [x, z] of animal.positions) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(animal.width, animal.height), material);
      mesh.position.set(x, animal.height / 2, z);
      mesh.userData.photoTarget = animal.photoTarget;
      scene.add(mesh);
      photoTargets.push(mesh);

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(Math.min(animal.width, animal.height) * 0.35, 20),
        new THREE.MeshBasicMaterial({ color: 0x342718, transparent: true, opacity: 0.34 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.y = 0.34;
      shadow.position.set(x, 0.06, z);
      scene.add(shadow);

      animals.push({
        mesh,
        shadow,
        species: animal.species,
        x,
        z,
        angle: Math.random() * Math.PI * 2,
        speed: 0,
        state: "idle",
        config: animal,
        home: { x, z },
      });
    }
  }

  const isOnBridge = (x: number, z: number, bridge: (typeof bridgeColliders)[number]) => {
    const dx = x - bridge.x;
    const dz = z - bridge.z;
    const localX = dx * Math.cos(-bridge.rotation) - dz * Math.sin(-bridge.rotation);
    const localZ = dx * Math.sin(-bridge.rotation) + dz * Math.cos(-bridge.rotation);
    return Math.abs(localX) < bridge.width / 2 && Math.abs(localZ) < bridge.length / 2;
  };

  const isBlocked = (x: number, z: number) => {
    const insideBounds =
      Math.abs(x) < config.bounds.halfWidth && Math.abs(z) < config.bounds.halfDepth;
    if (!insideBounds) return true;
    if (bridgeColliders.some((bridge) => isOnBridge(x, z, bridge))) return false;
    if (!isSolidGround(x, z, config)) return true;
    for (const tree of treeColliders) {
      if (Math.hypot(x - tree.x, z - tree.z) < tree.radius) return true;
    }
    return false;
  };

  const isBlockedForAnimals = (x: number, z: number) => {
    const insideBounds =
      Math.abs(x) < config.bounds.halfWidth && Math.abs(z) < config.bounds.halfDepth;
    if (!insideBounds) return true;
    if (!isPlayableLand(x, z, config)) return true;
    for (const tree of treeColliders) {
      if (Math.hypot(x - tree.x, z - tree.z) < tree.radius) return true;
    }
    return false;
  };

  const cleanup = () => {
    renderer.dispose();
    for (const texture of textureCache.values()) texture.dispose();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material.dispose();
      }
    });
  };

  return { renderer, scene, camera, player, photoTargets, animals, isBlocked, isBlockedForAnimals, cleanup };
}
