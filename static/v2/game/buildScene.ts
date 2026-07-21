import * as THREE from "three";
import type { ParkConfig } from "../types";
import { isPlayableLand } from "./terrain";

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

export type BuiltScene = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  player: { x: number; z: number; yaw: number; speed: number };
  photoTargets: THREE.Mesh[];
  isBlocked: (x: number, z: number) => boolean;
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
    if (nearCamp || !isPlayableLand(x, z, config)) continue;
    const scale = config.vegetation.treeScaleBase + (attempt % 4) * config.vegetation.treeScaleVar;
    scene.add(makeTree(x, z, scale));
    treeColliders.push({ x, z, radius: 1.6 * scale });
    placedTrees += 1;
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
    }
  }

  const isBlocked = (x: number, z: number) => {
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

  return { renderer, scene, camera, player, photoTargets, isBlocked, cleanup };
}
