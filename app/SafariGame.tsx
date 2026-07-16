"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GameStatus = "ready" | "playing" | "won" | "lost";
type Species = "Zebra" | "Girafa" | "Elefant" | "Lleó" | "Gasela";

type Animal = {
  id: number;
  species: Species;
  x: number;
  y: number;
  angle: number;
  speed: number;
  turnIn: number;
};

type GameModel = {
  status: GameStatus;
  vehicle: { x: number; y: number; angle: number; speed: number };
  animals: Animal[];
  fuel: number;
  timeLeft: number;
  money: number;
  photographed: Set<Species>;
};

type HudState = {
  fuel: number;
  timeLeft: number;
  money: number;
  speed: number;
  photographed: Species[];
  status: GameStatus;
};

const WORLD = { width: 2400, height: 1920 };
const BASE = { x: 350, y: 1325 };
const TARGETS: Species[] = ["Zebra", "Girafa", "Elefant"];
const SPECIES: Species[] = ["Zebra", "Girafa", "Elefant", "Lleó", "Gasela"];
const MAX_TIME = 210;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const distance = (ax: number, ay: number, bx: number, by: number) =>
  Math.hypot(ax - bx, ay - by);

const normalAngle = (angle: number) =>
  Math.atan2(Math.sin(angle), Math.cos(angle));

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 9283.17 + salt * 137.31) * 43758.5453;
  return value - Math.floor(value);
}

const LAND_SHAPE: [number, number][] = [
  [70, 790], [90, 440], [470, 185], [1020, 215], [1580, 300], [2170, 425],
  [2335, 690], [2250, 1260], [1740, 1640], [1230, 1700], [520, 1570], [155, 1320],
];

const RIVER: [number, number][] = [
  [1835, 390], [1930, 625], [1880, 880], [1715, 1160], [1500, 1450], [1280, 1655],
];

function pointInPolygon(x: number, y: number, polygon: [number, number][]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceToSegment(
  x: number,
  y: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
  const t = lengthSquared === 0
    ? 0
    : clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / lengthSquared, 0, 1);
  return distance(x, y, ax + t * (bx - ax), ay + t * (by - ay));
}

function isPlayableLand(x: number, y: number) {
  if (!pointInPolygon(x, y, LAND_SHAPE)) return false;
  const onMountain = ((x - 430) / 345) ** 2 + ((y - 420) / 255) ** 2 < 1;
  const inPond = ((x - 680) / 190) ** 2 + ((y - 850) / 105) ** 2 < 1;
  if (onMountain || inPond) return false;

  for (let index = 1; index < RIVER.length; index += 1) {
    const [ax, ay] = RIVER[index - 1];
    const [bx, by] = RIVER[index];
    if (distanceToSegment(x, y, ax, ay, bx, by) < 62) return false;
  }
  return true;
}

function createAnimals(): Animal[] {
  const positions: [number, number][] = [
    [655, 1160], [1050, 980], [820, 1280], [1040, 515], [560, 1050],
    [1010, 670], [1290, 610], [1430, 1080], [1510, 620], [1170, 1270],
    [760, 1010], [1140, 830], [480, 930], [930, 540], [1510, 440],
    [1710, 520], [1580, 780], [1950, 1170], [2020, 620], [2000, 990],
  ];
  return positions.map(([x, y], index) => {
    const species = SPECIES[index % SPECIES.length];
    return {
      id: index,
      species,
      x,
      y,
      angle: seeded(index, 9) * Math.PI * 2,
      speed: species === "Gasela" ? 38 : species === "Lleó" ? 16 : 24,
      turnIn: 1 + seeded(index, 10) * 4,
    };
  });
}

function createModel(): GameModel {
  return {
    status: "ready",
    vehicle: { x: BASE.x, y: BASE.y, angle: 0, speed: 0 },
    animals: createAnimals(),
    fuel: 100,
    timeLeft: MAX_TIME,
    money: 0,
    photographed: new Set<Species>(),
  };
}

function drawAnimal(context: CanvasRenderingContext2D, animal: Animal) {
  context.save();
  context.translate(animal.x, animal.y);
  context.rotate(animal.angle);
  context.fillStyle = "rgba(226, 244, 137, .3)";
  context.strokeStyle = "rgba(245, 255, 196, .85)";
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(0, 8, 42, 25, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.shadowColor = "rgba(34, 24, 11, .26)";
  context.shadowBlur = 10;
  context.shadowOffsetY = 6;

  const palette: Record<Species, string> = {
    Zebra: "#f3ead7",
    Girafa: "#d69a35",
    Elefant: "#77827e",
    Lleó: "#c17b2f",
    Gasela: "#a76b38",
  };

  context.fillStyle = palette[animal.species];
  context.beginPath();
  context.ellipse(0, 0, animal.species === "Elefant" ? 31 : 25, 15, 0, 0, Math.PI * 2);
  context.fill();
  context.shadowColor = "transparent";

  context.fillStyle = palette[animal.species];
  if (animal.species === "Girafa") {
    context.fillRect(15, -8, 22, 7);
    context.beginPath();
    context.arc(40, -5, 8, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#785128";
    for (const spot of [-12, 0, 12]) {
      context.beginPath();
      context.arc(spot, spot % 2 ? -5 : 5, 3, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    context.beginPath();
    context.arc(animal.species === "Elefant" ? 28 : 23, -2, animal.species === "Elefant" ? 14 : 10, 0, Math.PI * 2);
    context.fill();
  }

  if (animal.species === "Zebra") {
    context.strokeStyle = "#25241f";
    context.lineWidth = 3;
    for (const stripe of [-14, -5, 5, 14]) {
      context.beginPath();
      context.moveTo(stripe, -11);
      context.lineTo(stripe + 4, 11);
      context.stroke();
    }
  }

  if (animal.species === "Lleó") {
    context.fillStyle = "#70411f";
    context.beginPath();
    context.arc(24, -2, 14, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#c17b2f";
    context.beginPath();
    context.arc(25, -2, 8, 0, Math.PI * 2);
    context.fill();
  }

  if (animal.species === "Elefant") {
    context.strokeStyle = "#77827e";
    context.lineWidth = 7;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(36, 2);
    context.quadraticCurveTo(48, 10, 45, 20);
    context.stroke();
  }

  context.fillStyle = "#2d2318";
  context.fillRect(-17, 10, 5, 14);
  context.fillRect(12, 10, 5, 14);
  context.restore();
}

function drawVehicle(context: CanvasRenderingContext2D, model: GameModel) {
  const { x, y, angle } = model.vehicle;
  context.save();
  context.translate(x, y);
  context.rotate(angle);

  context.fillStyle = "rgba(20, 15, 7, .22)";
  context.fillRect(-25, -17, 58, 42);
  context.fillStyle = "#332a22";
  context.fillRect(-22, -24, 12, 8);
  context.fillRect(13, -24, 12, 8);
  context.fillRect(-22, 16, 12, 8);
  context.fillRect(13, 16, 12, 8);
  context.fillStyle = "#d9bd78";
  context.fillRect(-28, -18, 58, 36);
  context.fillStyle = "#806c47";
  context.fillRect(-8, -14, 22, 28);
  context.fillStyle = "#9ad2d3";
  context.fillRect(16, -13, 10, 26);
  context.fillStyle = "#fff3c2";
  context.fillRect(27, -12, 5, 8);
  context.fillRect(27, 4, 5, 8);
  context.restore();
}

function drawWorld(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  model: GameModel,
  flash: number,
  mapImage: HTMLImageElement,
) {
  const viewportWidth = canvas.clientWidth;
  const viewportHeight = canvas.clientHeight;
  const pixelRatio = canvas.width / Math.max(1, viewportWidth);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, viewportWidth, viewportHeight);

  const scale = Math.max(0.58, Math.min(1.02, viewportWidth / 1200));
  const cameraX = clamp(
    model.vehicle.x - viewportWidth / scale / 2,
    0,
    Math.max(0, WORLD.width - viewportWidth / scale),
  );
  const cameraY = clamp(
    model.vehicle.y - viewportHeight / scale / 2,
    0,
    Math.max(0, WORLD.height - viewportHeight / scale),
  );

  context.save();
  context.scale(scale, scale);
  context.translate(-cameraX, -cameraY);
  context.fillStyle = "#8a8887";
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  if (mapImage.complete && mapImage.naturalWidth > 0) {
    context.drawImage(mapImage, 0, 0, WORLD.width, WORLD.height);
  }

  context.fillStyle = "rgba(29, 55, 34, .18)";
  context.strokeStyle = "#e9f59f";
  context.lineWidth = 5;
  context.beginPath();
  context.arc(BASE.x, BASE.y, 92, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "rgba(24, 43, 27, .88)";
  context.fillRect(BASE.x - 76, BASE.y - 112, 152, 42);
  context.fillStyle = "#fff8df";
  context.font = "700 18px sans-serif";
  context.textAlign = "center";
  context.fillText("CAMP BASE", BASE.x, BASE.y - 84);
  context.textAlign = "start";
  context.fillStyle = "#e5d49e";
  context.beginPath();
  context.moveTo(BASE.x - 42, BASE.y + 22);
  context.lineTo(BASE.x, BASE.y - 40);
  context.lineTo(BASE.x + 42, BASE.y + 22);
  context.closePath();
  context.fill();
  context.strokeStyle = "#654728";
  context.lineWidth = 5;
  context.stroke();

  for (const animal of model.animals) drawAnimal(context, animal);

  const coneLength = 350;
  context.save();
  context.translate(model.vehicle.x, model.vehicle.y);
  context.rotate(model.vehicle.angle);
  const cone = context.createLinearGradient(20, 0, coneLength, 0);
  cone.addColorStop(0, "rgba(255, 240, 174, .13)");
  cone.addColorStop(1, "rgba(255, 240, 174, 0)");
  context.fillStyle = cone;
  context.beginPath();
  context.moveTo(30, 0);
  context.lineTo(coneLength, -115);
  context.lineTo(coneLength, 115);
  context.closePath();
  context.fill();
  context.restore();

  drawVehicle(context, model);
  context.restore();

  if (flash > 0) {
    context.fillStyle = `rgba(255,255,245,${flash * 0.65})`;
    context.fillRect(0, 0, viewportWidth, viewportHeight);
  }
}

export function SafariGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const modelRef = useRef<GameModel>(createModel());
  const keysRef = useRef(new Set<string>());
  const touchRef = useRef({ forward: false, back: false, left: false, right: false });
  const lastRef = useRef(0);
  const hudClockRef = useRef(0);
  const flashRef = useRef(0);
  const [message, setMessage] = useState("Fotografia els animals que volen veure els turistes.");
  const [hud, setHud] = useState<HudState>({
    fuel: 100,
    timeLeft: MAX_TIME,
    money: 0,
    speed: 0,
    photographed: [],
    status: "ready",
  });

  const syncHud = useCallback(() => {
    const model = modelRef.current;
    setHud({
      fuel: model.fuel,
      timeLeft: model.timeLeft,
      money: model.money,
      speed: Math.abs(model.vehicle.speed),
      photographed: Array.from(model.photographed),
      status: model.status,
    });
  }, []);

  const resetGame = useCallback(() => {
    modelRef.current = createModel();
    setMessage("Fotografia els animals que volen veure els turistes.");
    syncHud();
  }, [syncHud]);

  const startGame = useCallback(() => {
    if (modelRef.current.status !== "ready") resetGame();
    modelRef.current.status = "playing";
    setMessage("Safari iniciat. Explora el mapa i vigila amb la muntanya, l'estany i el riu!");
    syncHud();
  }, [resetGame, syncHud]);

  const takePhoto = useCallback(() => {
    const model = modelRef.current;
    if (model.status !== "playing") return;
    const { x, y, angle } = model.vehicle;
    let candidate: Animal | null = null;
    let candidateDistance = Number.POSITIVE_INFINITY;

    for (const animal of model.animals) {
      const animalDistance = distance(x, y, animal.x, animal.y);
      const animalAngle = Math.atan2(animal.y - y, animal.x - x);
      const inFrame = Math.abs(normalAngle(animalAngle - angle)) < 0.38;
      if (inFrame && animalDistance < 520 && animalDistance < candidateDistance) {
        candidate = animal;
        candidateDistance = animalDistance;
      }
    }

    flashRef.current = 1;
    if (!candidate) {
      setMessage("La foto ha quedat buida. Alinea el frontal del 4x4 amb un animal.");
      return;
    }

    const wasNew = !model.photographed.has(candidate.species);
    model.photographed.add(candidate.species);
    const reward = candidateDistance < 170 ? 100 : candidateDistance < 300 ? 75 : 50;
    model.money += wasNew ? reward : Math.round(reward * 0.2);
    const isTarget = TARGETS.includes(candidate.species);
    setMessage(
      `${candidate.species} fotografiat${wasNew ? "" : " de nou"}! ${isTarget ? "Objectiu completat." : "Foto extra."} +${wasNew ? reward : Math.round(reward * 0.2)}€`,
    );
    syncHud();
  }, [syncHud]);

  const setTouch = useCallback(
    (control: keyof typeof touchRef.current, active: boolean) => {
      touchRef.current[control] = active;
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
      }
      keysRef.current.add(event.key.toLowerCase());
      if (event.key === " ") takePhoto();
      if (event.key === "Enter" && modelRef.current.status !== "playing") startGame();
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startGame, takePhoto]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const mapImage = new Image();
    mapImage.src = "/serengeti-map.png";

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const tick = (now: number) => {
      const delta = Math.min(0.035, Math.max(0.001, (now - (lastRef.current || now)) / 1000));
      lastRef.current = now;
      const model = modelRef.current;

      if (model.status === "playing") {
        const keys = keysRef.current;
        const touch = touchRef.current;
        const forward = keys.has("w") || keys.has("arrowup") || touch.forward;
        const back = keys.has("s") || keys.has("arrowdown") || touch.back;
        const left = keys.has("a") || keys.has("arrowleft") || touch.left;
        const right = keys.has("d") || keys.has("arrowright") || touch.right;

        if (forward && model.fuel > 0) model.vehicle.speed += 86 * delta;
        if (back && model.fuel > 0) model.vehicle.speed -= 70 * delta;
        model.vehicle.speed *= Math.pow(0.36, delta);
        model.vehicle.speed = clamp(model.vehicle.speed, -60, 150);
        const steering = (right ? 1 : 0) - (left ? 1 : 0);
        if (Math.abs(model.vehicle.speed) > 3) {
          model.vehicle.angle += steering * 1.7 * delta * Math.sign(model.vehicle.speed);
        }
        const nextVehicleX = model.vehicle.x + Math.cos(model.vehicle.angle) * model.vehicle.speed * delta;
        const nextVehicleY = model.vehicle.y + Math.sin(model.vehicle.angle) * model.vehicle.speed * delta;
        if (isPlayableLand(nextVehicleX, nextVehicleY)) {
          model.vehicle.x = nextVehicleX;
          model.vehicle.y = nextVehicleY;
        } else {
          model.vehicle.speed *= -0.18;
        }
        model.fuel = Math.max(0, model.fuel - Math.abs(model.vehicle.speed) * delta * 0.0023);
        model.timeLeft = Math.max(0, model.timeLeft - delta);

        for (const animal of model.animals) {
          const proximity = distance(animal.x, animal.y, model.vehicle.x, model.vehicle.y);
          if (proximity < 175) {
            animal.angle = Math.atan2(
              animal.y - model.vehicle.y,
              animal.x - model.vehicle.x,
            );
            animal.speed = animal.species === "Lleó" ? 45 : 75;
          } else {
            animal.turnIn -= delta;
            if (animal.turnIn <= 0) {
              animal.angle += (seeded(animal.id, Math.floor(now / 1000)) - 0.5) * 1.8;
              animal.turnIn = 1.8 + seeded(animal.id, Math.floor(now / 800)) * 4;
              animal.speed += (24 - animal.speed) * 0.6;
            }
          }
          const nextAnimalX = animal.x + Math.cos(animal.angle) * animal.speed * delta;
          const nextAnimalY = animal.y + Math.sin(animal.angle) * animal.speed * delta;
          if (isPlayableLand(nextAnimalX, nextAnimalY)) {
            animal.x = nextAnimalX;
            animal.y = nextAnimalY;
          } else {
            animal.angle += Math.PI * (0.72 + seeded(animal.id, Math.floor(now / 500)) * 0.56);
          }
        }

        const allTargets = TARGETS.every((target) => model.photographed.has(target));
        const atBase = distance(model.vehicle.x, model.vehicle.y, BASE.x, BASE.y) < 150;
        if (allTargets && atBase) {
          model.status = "won";
          model.vehicle.speed = 0;
          setMessage("Safari completat! Tots els turistes tornen contents al camp base.");
          syncHud();
        } else if (model.timeLeft <= 0) {
          model.status = "lost";
          model.vehicle.speed = 0;
          setMessage("S’ha fet de nit. Cal tornar-ho a intentar amb una ruta millor.");
          syncHud();
        }
      }

      flashRef.current = Math.max(0, flashRef.current - delta * 4.6);
      drawWorld(context, canvas, model, flashRef.current, mapImage);
      hudClockRef.current += delta;
      if (hudClockRef.current > 0.15) {
        hudClockRef.current = 0;
        syncHud();
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [syncHud]);

  const minutes = Math.floor(hud.timeLeft / 60);
  const seconds = Math.floor(hud.timeLeft % 60);
  const objectivesDone = TARGETS.filter((target) => hud.photographed.includes(target)).length;

  return (
    <main className="game-shell">
      <header className="game-header">
        <div className="brand-block">
          <span className="brand-mark">S</span>
          <div>
            <p className="eyebrow">Serengeti · Expedició 01</p>
            <h1>Safari Cooperatiu</h1>
          </div>
        </div>
        <div className="top-stats" aria-label="Estat de la partida">
          <div className="stat">
            <span>Temps</span>
            <strong>{minutes}:{seconds.toString().padStart(2, "0")}</strong>
          </div>
          <div className="stat fuel-stat">
            <span>Combustible</span>
            <strong>{Math.round(hud.fuel)}%</strong>
            <i style={{ width: `${hud.fuel}%` }} />
          </div>
          <div className="stat">
            <span>Caixa</span>
            <strong>{hud.money}€</strong>
          </div>
        </div>
      </header>

      <section className="game-stage">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          aria-label="Mapa jugable del safari del Serengeti"
        />

        <aside className="mission-card" aria-label="Objectius de la missió">
          <div className="mission-heading">
            <span>MISSIÓ</span>
            <strong>{objectivesDone}/{TARGETS.length}</strong>
          </div>
          <h2>La llista dels turistes</h2>
          <p>Troba i fotografia aquestes espècies.</p>
          <ul>
            {TARGETS.map((target) => {
              const done = hud.photographed.includes(target);
              return (
                <li className={done ? "done" : ""} key={target}>
                  <span>{done ? "✓" : "○"}</span>
                  {target}
                </li>
              );
            })}
          </ul>
          {objectivesDone === TARGETS.length && (
            <div className="return-note">Objectius complets. Torna al camp base!</div>
          )}
        </aside>

        <div className="message-bar" role="status">
          <span className="radio-dot" />
          <p>{message}</p>
        </div>

        {hud.status !== "playing" && (
          <div className="start-overlay">
            <div className="start-card">
              <p className="eyebrow">{hud.status === "ready" ? "BRIEFING DE MISSIÓ" : "FINAL DE L’EXPEDICIÓ"}</p>
              <h2>
                {hud.status === "ready" && "Els turistes ja són al 4x4"}
                {hud.status === "won" && "Safari completat!"}
                {hud.status === "lost" && "La nit ens ha guanyat"}
              </h2>
              <p>
                {hud.status === "ready"
                  ? "Conduïu per la sabana, alineeu el frontal del vehicle amb cada animal i feu la fotografia. Després torneu a l’entrada."
                  : message}
              </p>
              <div className="instruction-grid">
                <div><kbd>WASD</kbd><span>Conduir</span></div>
                <div><kbd>ESPAI</kbd><span>Fer foto</span></div>
                <div><kbd>3</kbd><span>Objectius</span></div>
              </div>
              <button className="primary-button" onClick={startGame}>
                {hud.status === "ready" ? "Començar el safari" : "Tornar-ho a intentar"}
              </button>
            </div>
          </div>
        )}

        <div className="touch-controls" aria-label="Controls tàctils">
          <div className="drive-pad">
            <button
              aria-label="Accelerar"
              onPointerDown={() => setTouch("forward", true)}
              onPointerUp={() => setTouch("forward", false)}
              onPointerLeave={() => setTouch("forward", false)}
            >↑</button>
            <div>
              <button
                aria-label="Girar a l’esquerra"
                onPointerDown={() => setTouch("left", true)}
                onPointerUp={() => setTouch("left", false)}
                onPointerLeave={() => setTouch("left", false)}
              >←</button>
              <button
                aria-label="Frenar"
                onPointerDown={() => setTouch("back", true)}
                onPointerUp={() => setTouch("back", false)}
                onPointerLeave={() => setTouch("back", false)}
              >↓</button>
              <button
                aria-label="Girar a la dreta"
                onPointerDown={() => setTouch("right", true)}
                onPointerUp={() => setTouch("right", false)}
                onPointerLeave={() => setTouch("right", false)}
              >→</button>
            </div>
          </div>
          <button className="camera-button" aria-label="Fer fotografia" onClick={takePhoto}>
            <span>●</span>
            FOTO
          </button>
        </div>
      </section>

      <footer className="game-footer">
        <p><strong>{Math.round(hud.speed)}</strong> km/h</p>
        <p>Prototype familiar · MVP 0.1</p>
        <button onClick={resetGame}>Reiniciar partida</button>
      </footer>
    </main>
  );
}
