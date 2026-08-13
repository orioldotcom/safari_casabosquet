import * as THREE from "three";
import type { AnimalConfig, AnimalSpecies, ParkConfig } from "../types";
import { isPlayableLand, isSolidGround } from "./terrain";

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 9283.17 + salt * 137.31) * 43758.5453;
  return value - Math.floor(value);
}

function makeTree(x: number, z: number, scale: number, variant: number) {
  const group = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6d4a28, roughness: 1 });
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2 * scale, 0.42 * scale, 3.0 * scale, 7),
    trunkMaterial,
  );
  trunk.position.y = 1.5 * scale;
  trunk.castShadow = true;
  group.add(trunk);

  const branch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09 * scale, 0.16 * scale, 1.7 * scale, 6),
    trunkMaterial,
  );
  branch.position.set(0.55 * scale, 2.3 * scale, 0);
  branch.rotation.z = -0.6;
  branch.castShadow = true;
  group.add(branch);

  const greens = [0x2f5a2a, 0x3f7038, 0x527c3a];
  for (let i = 0; i < 3; i += 1) {
    const radius = (2.0 - i * 0.35) * scale;
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 10, 7),
      new THREE.MeshStandardMaterial({ color: greens[(variant + i) % greens.length], roughness: 0.95 }),
    );
    crown.scale.y = 0.5;
    crown.position.set(
      (seeded(variant + i, 91) - 0.5) * 1.9 * scale,
      (3.1 + i * 0.55) * scale,
      (seeded(variant + i, 92) - 0.5) * 1.9 * scale,
    );
    crown.castShadow = true;
    group.add(crown);
  }
  group.position.set(x, 0, z);
  return group;
}

let sharedPathTexture: THREE.CanvasTexture | null = null;
function getPathTexture() {
  if (sharedPathTexture) return sharedPathTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#8f6e42";
  ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle =
      Math.random() > 0.5 ? "rgba(60,40,20,0.09)" : "rgba(230,205,160,0.09)";
    ctx.beginPath();
    ctx.arc(Math.random() * 128, Math.random() * 256, 1 + Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Marques de pneumàtic (dues bandes longitudinals)
  ctx.fillStyle = "rgba(50,32,14,0.30)";
  ctx.fillRect(34, 0, 13, 256);
  ctx.fillRect(81, 0, 13, 256);
  // Vores més fosques
  const edge = ctx.createLinearGradient(0, 0, 128, 0);
  edge.addColorStop(0, "rgba(40,26,12,0.6)");
  edge.addColorStop(0.16, "rgba(40,26,12,0)");
  edge.addColorStop(0.84, "rgba(40,26,12,0)");
  edge.addColorStop(1, "rgba(40,26,12,0.6)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 128, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapT = THREE.RepeatWrapping;
  sharedPathTexture = texture;
  return texture;
}

function makeDirtPath(x: number, z: number, width: number, length: number, rotation: number) {
  const texture = getPathTexture().clone();
  texture.repeat.set(1, Math.max(1, length / 28));
  texture.needsUpdate = true;
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(width, length),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }),
  );
  path.rotation.x = -Math.PI / 2;
  path.rotation.z = rotation;
  path.position.set(x, 0.02, z);
  path.receiveShadow = true;
  return path;
}

function makeBush(x: number, z: number, scale: number, variant: number) {
  const group = new THREE.Group();
  const greens = [0x355c2c, 0x466b33, 0x2c4a26];
  for (let i = 0; i < 4; i += 1) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry((0.45 + i * 0.14) * scale, 8, 6),
      new THREE.MeshStandardMaterial({ color: greens[(variant + i) % greens.length], roughness: 1 }),
    );
    sphere.position.set(
      (seeded(variant + i, 95) - 0.5) * 0.95 * scale,
      (0.35 + seeded(variant + i, 96) * 0.45) * scale,
      (seeded(variant + i, 97) - 0.5) * 0.95 * scale,
    );
    sphere.castShadow = true;
    group.add(sphere);
  }
  group.position.set(x, 0, z);
  return group;
}

function makeSky() {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#3d74a6");
  gradient.addColorStop(0.45, "#7fb2c9");
  gradient.addColorStop(0.72, "#cfd8b6");
  gradient.addColorStop(0.88, "#f2c98a");
  gradient.addColorStop(1, "#e8a76b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 8, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1500, 24, 16),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sky.renderOrder = -10;
  return sky;
}

function makeCloud(x: number, y: number, z: number, scale: number, seedValue: number) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    fog: false,
    depthWrite: false,
    toneMapped: false,
  });
  const puffCount = 4 + Math.floor(seeded(seedValue, 77) * 3);
  for (let i = 0; i < puffCount; i += 1) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry((6 + seeded(seedValue + i, 78) * 6) * scale, 10, 7),
      material,
    );
    puff.position.set(
      (seeded(seedValue + i, 79) - 0.5) * 26 * scale,
      (seeded(seedValue + i, 80) - 0.5) * 4 * scale,
      (seeded(seedValue + i, 81) - 0.5) * 10 * scale,
    );
    puff.scale.y = 0.32;
    group.add(puff);
  }
  group.position.set(x, y, z);
  return group;
}

function makeNoiseTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 128 + (Math.random() - 0.5) * 90;
    image.data[i] = value;
    image.data[i + 1] = value;
    image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 18);
  return texture;
}

function makeRiverRibbon(points: [number, number][], halfWidth: number, material: THREE.Material) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const n = points.length;
  for (let i = 0; i < n; i += 1) {
    const [x, z] = points[i];
    const [px, pz] = points[Math.max(0, i - 1)];
    const [nx, nz] = points[Math.min(n - 1, i + 1)];
    let dx = nx - px;
    let dz = nz - pz;
    const length = Math.hypot(dx, dz) || 1;
    dx /= length;
    dz /= length;
    vertices.push(x - dz * halfWidth, 0, z + dx * halfWidth);
    vertices.push(x + dz * halfWidth, 0, z - dx * halfWidth);
  }
  for (let i = 0; i < n - 1; i += 1) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function makeVehicle() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a8450,
    roughness: 0.6,
    metalness: 0.25,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2b24, roughness: 0.85 });

  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.45, 2.6), bodyMaterial);
  hood.position.set(0, 1.1, -2.4);
  hood.castShadow = true;
  group.add(hood);

  const dash = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.5), darkMaterial);
  dash.position.set(0, 1.32, -1.0);
  group.add(dash);

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.12), darkMaterial);
  topBar.position.set(0, 2.4, -1.05);
  group.add(topBar);

  for (const sx of [-1.25, 1.25]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.12), darkMaterial);
    pillar.position.set(sx, 1.85, -1.05);
    pillar.rotation.x = 0.12;
    group.add(pillar);
  }
  for (const sx of [-1.48, 1.48]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.25), darkMaterial);
    mirror.position.set(sx, 1.8, -1.2);
    group.add(mirror);
  }
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
  vehicle: THREE.Group;
  update: (now: number, delta: number) => void;
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.skyColor);
  scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar);
  scene.add(makeSky());

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 1800);
  if (!config.playerStart || typeof config.playerStart.x !== "number") {
    throw new Error("Invalid playerStart config: " + JSON.stringify(config.playerStart));
  }
  const player = {
    x: config.playerStart.x,
    z: config.playerStart.z,
    yaw: config.playerStart.yaw,
    speed: 0,
    cameraYaw: config.playerStart.yaw,
    cameraPitch: 0,
  };

  scene.add(new THREE.HemisphereLight(0xcfe4f2, 0x8a7a4a, 1.5));
  const sun = new THREE.DirectionalLight(config.sun.color, config.sun.intensity * 0.85);
  sun.position.set(...config.sun.position);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  const half = config.sun.shadowSize;
  sun.shadow.camera.left = -half;
  sun.shadow.camera.right = half;
  sun.shadow.camera.top = half * 0.8;
  sun.shadow.camera.bottom = -half * 0.8;
  scene.add(sun);

  // Núvols que es mouen lentament pel cel
  const clouds: THREE.Group[] = [];
  for (let i = 0; i < 14; i += 1) {
    const angle = (i / 14) * Math.PI * 2;
    const radius = 260 + seeded(i, 55) * 520;
    const cloud = makeCloud(
      Math.cos(angle) * radius,
      110 + seeded(i, 56) * 90,
      Math.sin(angle) * radius,
      0.9 + seeded(i, 57) * 1.7,
      i * 13 + 5,
    );
    scene.add(cloud);
    clouds.push(cloud);
  }

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
  // Detall de relleu sorra/herba
  groundMaterial.bumpMap = makeNoiseTexture();
  groundMaterial.bumpScale = 0.5;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(config.ground.width, config.ground.depth),
    groundMaterial,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  if (config.paths) {
    for (const path of config.paths) {
      if (typeof path.x !== "number" || typeof path.z !== "number") {
        console.warn("Invalid path config:", path);
        continue;
      }
      scene.add(makeDirtPath(path.x, path.z, path.width, path.length, path.rotation));
    }
  }

  const bridgeColliders: { x: number; z: number; width: number; length: number; rotation: number }[] = [];
  if (config.bridges) {
    for (const bridge of config.bridges) {
      if (typeof bridge.x !== "number" || typeof bridge.z !== "number") {
        console.warn("Invalid bridge config:", bridge);
        continue;
      }
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
      const margin = 9;
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
  while (placedTrees < config.vegetation.treeCount && attempt < config.vegetation.treeCount * 40) {
    attempt += 1;
    const x = seeded(attempt, config.vegetation.treeSeed) * config.ground.width - config.ground.width / 2;
    const z = seeded(attempt, config.vegetation.treeSeed + 100) * config.ground.depth - config.ground.depth / 2;
    const nearCamp = Math.hypot(x - campX, z - campZ) < 54;
    if (nearCamp || isOnPath(x, z) || !isPlayableLand(x, z, config)) continue;
    const scale = config.vegetation.treeScaleBase + (attempt % 4) * config.vegetation.treeScaleVar;
    scene.add(makeTree(x, z, scale, attempt));
    treeColliders.push({ x, z, radius: 1.6 * scale });
    placedTrees += 1;
  }

  let placedBushes = 0;
  let bushAttempt = 0;
  while (placedBushes < config.vegetation.bushCount && bushAttempt < config.vegetation.bushCount * 50) {
    bushAttempt += 1;
    const x = seeded(bushAttempt, config.vegetation.bushSeed) * config.ground.width - config.ground.width / 2;
    const z = seeded(bushAttempt, config.vegetation.bushSeed + 100) * config.ground.depth - config.ground.depth / 2;
    if (isOnPath(x, z) || !isPlayableLand(x, z, config)) continue;
    const nearAnimal = config.animals.some((animal) =>
      animal.positions.some(([ax, az]) => Math.hypot(x - ax, z - az) < 12),
    );
    if (nearAnimal) continue;
    const scale = config.vegetation.bushScaleBase + (bushAttempt % 4) * config.vegetation.bushScaleVar;
    scene.add(makeBush(x, z, scale, bushAttempt));
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

  // Muntanya visible a l'horitzó
  if (config.terrain.mountain) {
    const m = config.terrain.mountain;
    const radius = Math.max(m.rx, m.rz);
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(radius, 120, 9),
      new THREE.MeshStandardMaterial({ color: 0x7d6a55, roughness: 1 }),
    );
    mountain.scale.set(m.rx / radius, 1, m.rz / radius);
    mountain.position.set(m.x, 60, m.z);
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    scene.add(mountain);
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.34, 34, 9),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9 }),
    );
    cap.scale.set(m.rx / radius, 1, m.rz / radius);
    cap.position.set(m.x, 103, m.z);
    scene.add(cap);
  }

  // Aigua visible: riu i estany
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x2e6f8e,
    transparent: true,
    opacity: 0.85,
    roughness: 0.15,
    metalness: 0.4,
    side: THREE.DoubleSide,
  });
  if (config.terrain.riverPolygon) {
    const river = makeRiverRibbon(config.terrain.riverPolygon, 11, waterMaterial);
    river.position.y = 0.06;
    river.receiveShadow = true;
    scene.add(river);
  }
  if (config.terrain.pond) {
    const pondGeo = new THREE.CircleGeometry(1, 48);
    pondGeo.rotateX(-Math.PI / 2);
    const pond = new THREE.Mesh(pondGeo, waterMaterial);
    pond.scale.set(config.terrain.pond.rx, 1, config.terrain.pond.rz);
    pond.position.set(config.terrain.pond.x, 0.06, config.terrain.pond.z);
    pond.receiveShadow = true;
    scene.add(pond);
  }

  // Cotxe 3D visible des del seient del conductor
  const vehicle = makeVehicle();
  vehicle.position.set(config.playerStart.x, 0, config.playerStart.z);
  vehicle.rotation.y = config.playerStart.yaw;
  scene.add(vehicle);

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

  const update = (now: number, delta: number) => {
    // Núvols que deriven lentament
    const wrap = config.bounds.halfWidth + 520;
    for (const cloud of clouds) {
      cloud.position.x += delta * 3.2;
      if (cloud.position.x > wrap) cloud.position.x = -wrap;
    }
    // Brillantor de l'aigua
    waterMaterial.opacity = 0.78 + Math.sin(now * 0.0016) * 0.07;
    waterMaterial.color.setHSL(0.55, 0.45, 0.42 + Math.sin(now * 0.0011) * 0.04);
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

  return { renderer, scene, camera, player, photoTargets, animals, vehicle, update, isBlocked, isBlockedForAnimals, cleanup };
}
