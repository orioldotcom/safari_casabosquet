import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getParkConfig, PARKS } from "./v2/parks";
import { buildScene, type AnimalInstance } from "./v2/game/buildScene";
import { Minimap } from "./v2/components/Minimap";
import { VersionFooter } from "./v2/components/VersionFooter";

type Screen = "parks" | "briefing" | "playing";
type DriveControl = "forward" | "back" | "left" | "right";

export function SafariV2() {
  const [screen, setScreen] = useState<Screen>("parks");
  const [selectedParkId, setSelectedParkId] = useState<string>("serengeti");
  const [message, setMessage] = useState("Tria un parc i comença l'expedició.");
  const [photoDone, setPhotoDone] = useState(false);
  const [flash, setFlash] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<"follow" | "free">("follow");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef(new Set<string>());
  const touchRef = useRef<Record<DriveControl, boolean>>({
    forward: false,
    back: false,
    left: false,
    right: false,
  });
  const photoActionRef = useRef<(() => void) | null>(null);
  const photoDoneRef = useRef(false);
  const playerRef = useRef({ x: 0, z: 0, yaw: 0, speed: 0 });
  const animalsRef = useRef<AnimalInstance[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);
  const cockpitRigRef = useRef<HTMLDivElement>(null);
  const gpsRef = useRef<HTMLDivElement>(null);
  const wheelAngleRef = useRef(0);
  const cameraModeRef = useRef<"follow" | "free">("follow");
  const freeCameraRef = useRef({ x: 0, y: 20, z: 0, yaw: 0, pitch: -0.3 });
  const kmRef = useRef(0);
  const kmDisplayRef = useRef<HTMLDivElement>(null);

  const currentPark = getParkConfig(selectedParkId);

  const startGame = useCallback(() => {
    photoDoneRef.current = false;
    setPhotoDone(false);
    const config = getParkConfig(selectedParkId);
    const firstMission = config?.missions[0];
    setMessage(
      firstMission
        ? `Troba ${firstMission.label.toLowerCase()}. Centra'l al visor i fes la fotografia.`
        : "Explora el parc i completa la missió.",
    );
    setScreen("playing");
  }, [selectedParkId]);

  const takePhoto = useCallback(() => photoActionRef.current?.(), []);

  const setTouch = useCallback((control: DriveControl, active: boolean) => {
    touchRef.current[control] = active;
  }, []);

  useEffect(() => {
    if (screen !== "playing" || !currentPark) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let sceneData;
    try {
      sceneData = buildScene(canvas, currentPark);
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : String(error));
      return;
    }
    setRenderError(null);
    const { renderer, scene, camera, player, photoTargets, animals, isBlocked, isBlockedForAnimals, cleanup } =
      sceneData;

    playerRef.current = player;
    animalsRef.current = animals;
    freeCameraRef.current = {
      x: player.x,
      y: 35,
      z: player.z,
      yaw: player.yaw,
      pitch: -0.35,
    };
    kmRef.current = 0;
    if (kmDisplayRef.current) kmDisplayRef.current.textContent = "0.00 km";

    const isOnPath = (x: number, z: number) => {
      if (!currentPark.paths) return false;
      for (const path of currentPark.paths) {
        const dx = x - path.x;
        const dz = z - path.z;
        const localX = dx * Math.cos(-path.rotation) - dz * Math.sin(-path.rotation);
        const localZ = dx * Math.sin(-path.rotation) + dz * Math.cos(-path.rotation);
        if (Math.abs(localX) < path.length / 2 && Math.abs(localZ) < path.width / 2) {
          return true;
        }
      }
      return false;
    };

    const skidMaterial = new THREE.MeshBasicMaterial({
      color: 0x3d2e1a,
      transparent: true,
      opacity: 0.35,
    });
    const skidMarks: THREE.Mesh[] = [];
    const maxSkidMarks = 40;
    let lastSkidAt = 0;
    const addSkidMark = (x: number, z: number, yaw: number) => {
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), skidMaterial);
      mark.rotation.x = -Math.PI / 2;
      mark.rotation.z = yaw;
      mark.position.set(x, 0.025, z);
      scene.add(mark);
      skidMarks.push(mark);
      if (skidMarks.length > maxSkidMarks) {
        const old = skidMarks.shift();
        if (old) {
          scene.remove(old);
          old.geometry.dispose();
        }
      }
    };

    const raycaster = new THREE.Raycaster();
    const maxPhotoDistance = 78;

    photoActionRef.current = () => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 130);
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hit = raycaster.intersectObjects(photoTargets, false)[0];
      if (!hit || hit.distance > maxPhotoDistance) {
        setMessage("No hi ha cap animal prou centrat. Apropa't i apunta amb el visor.");
        return;
      }
      if (!photoDoneRef.current) {
        photoDoneRef.current = true;
        setPhotoDone(true);
        setMessage("Fotografia completada! Prova en primera persona superada.");
      } else {
        setMessage("Una altra bona fotografia!");
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current.add(key);
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        event.preventDefault();
      }
      if (key === " ") photoActionRef.current?.();
      if (key === "r") {
        player.x = currentPark.playerStart.x;
        player.z = currentPark.playerStart.z;
        player.yaw = currentPark.playerStart.yaw;
        player.cameraYaw = currentPark.playerStart.yaw;
        player.cameraPitch = 0;
        player.speed = 0;
        if (cameraModeRef.current === "free") {
          freeCameraRef.current.x = player.x;
          freeCameraRef.current.z = player.z;
          freeCameraRef.current.yaw = player.yaw;
        }
        setMessage("Vehicle recol·locat al camp base.");
      }
      if (key === "t") {
        player.cameraYaw = player.yaw;
        player.cameraPitch = 0;
        setMessage("Visió recentrada amb la direcció del vehicle.");
      }
      if (key === "c") {
        const next = cameraModeRef.current === "follow" ? "free" : "follow";
        cameraModeRef.current = next;
        setCameraMode(next);
        if (next === "free") {
          freeCameraRef.current = {
            x: player.x - Math.sin(player.yaw) * 25,
            y: 35,
            z: player.z + Math.cos(player.yaw) * 25,
            yaw: player.yaw,
            pitch: -0.35,
          };
          setMessage("Càmera lliure activada. WASD o fletxes per moure't, Shift per pujar/baixar, rodeta per zoom.");
        } else {
          player.cameraYaw = player.yaw;
          player.cameraPitch = 0;
          setMessage("Càmera següent el vehicle.");
        }
      }
      if (key === "escape") setScreen("parks");
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * 0.05;
      camera.fov = Math.max(15, Math.min(90, camera.fov + delta));
      camera.updateProjectionMatrix();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("wheel", onWheel, { passive: false });

    const pinchRef = { startDistance: 0, startFov: camera.fov, active: false };
    const getPinchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinchRef.active = true;
        pinchRef.startDistance = getPinchDistance(event.touches);
        pinchRef.startFov = camera.fov;
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      if (pinchRef.active && event.touches.length === 2) {
        const distance = getPinchDistance(event.touches);
        const scale = distance / pinchRef.startDistance;
        camera.fov = Math.max(20, Math.min(90, pinchRef.startFov / scale));
        camera.updateProjectionMatrix();
      }
    };
    const onTouchEnd = () => {
      pinchRef.active = false;
    };
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let previous = performance.now();
    let animationFrame = 0;
    let collisionMessageAt = 0;
    const frame = (now: number) => {
      const delta = Math.min(0.04, (now - previous) / 1000);
      previous = now;
      const keys = keysRef.current;
      const touch = touchRef.current;
      const freeMode = cameraModeRef.current === "free";
      const shift = keys.has("shift");
      const forward = !freeMode && (keys.has("w") || touch.forward);
      const back = !freeMode && (keys.has("s") || touch.back);
      const left = !freeMode && (keys.has("a") || touch.left);
      const right = !freeMode && (keys.has("d") || touch.right);

      if (forward) player.speed += 28 * delta;
      if (back) player.speed -= 18 * delta;
      player.speed *= Math.pow(0.22, delta);
      player.speed = THREE.MathUtils.clamp(player.speed, -9, 30);

      const steering = (right ? 1 : 0) - (left ? 1 : 0);
      const turnFactor = player.speed === 0 ? 1 : Math.sign(player.speed);
      player.yaw += steering * 1.22 * delta * turnFactor;

      const targetWheelAngle = steering * 0.95;
      wheelAngleRef.current += (targetWheelAngle - wheelAngleRef.current) * 8 * delta;
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateX(-50%) rotate(${wheelAngleRef.current}rad)`;
      }

      const directionX = Math.sin(player.yaw);
      const directionZ = -Math.cos(player.yaw);
      const candidateX = player.x + directionX * player.speed * delta;
      const candidateZ = player.z + directionZ * player.speed * delta;

      if (!isBlocked(candidateX, candidateZ)) {
        player.x = candidateX;
        player.z = candidateZ;
      } else {
        player.speed *= -0.16;
        if (now - collisionMessageAt > 1700) {
          collisionMessageAt = now;
          setMessage("Has arribat a una zona intransitable (riu, muntanya o límit del parc).");
        }
      }

      kmRef.current += Math.abs(player.speed) * delta / 1000;
      if (kmDisplayRef.current) {
        kmDisplayRef.current.textContent = `${kmRef.current.toFixed(2)} km`;
      }

      if (Math.abs(player.speed) > 1 && isOnPath(player.x, player.z)) {
        if (now - lastSkidAt > 180) {
          lastSkidAt = now;
          const rearX = player.x - directionX * 2.2;
          const rearZ = player.z - directionZ * 2.2;
          const leftX = -directionZ * 0.9;
          const leftZ = directionX * 0.9;
          addSkidMark(rearX + leftX, rearZ + leftZ, player.yaw);
          addSkidMark(rearX - leftX, rearZ - leftZ, player.yaw);
        }
      }

      const bob = Math.sin(now * 0.009) * Math.min(0.05, Math.abs(player.speed) * 0.004);
      if (freeMode) {
        const moveSpeed = 120 * delta;
        const turnSpeed = 1.8 * delta;
        const up = keys.has("arrowup") || keys.has("w");
        const down = keys.has("arrowdown") || keys.has("s");
        const camLeft = keys.has("arrowleft") || keys.has("a");
        const camRight = keys.has("arrowright") || keys.has("d");
        if (up) {
          freeCameraRef.current.x += Math.sin(freeCameraRef.current.yaw) * moveSpeed;
          freeCameraRef.current.z -= Math.cos(freeCameraRef.current.yaw) * moveSpeed;
        }
        if (down) {
          freeCameraRef.current.x -= Math.sin(freeCameraRef.current.yaw) * moveSpeed;
          freeCameraRef.current.z += Math.cos(freeCameraRef.current.yaw) * moveSpeed;
        }
        if (camLeft) freeCameraRef.current.yaw -= turnSpeed;
        if (camRight) freeCameraRef.current.yaw += turnSpeed;
        if (shift && up) freeCameraRef.current.y += 60 * delta;
        if (shift && down) freeCameraRef.current.y -= 60 * delta;
        freeCameraRef.current.y = THREE.MathUtils.clamp(freeCameraRef.current.y, 3, 900);

        camera.position.set(freeCameraRef.current.x, freeCameraRef.current.y, freeCameraRef.current.z);
        const lookDistance = 10;
        const lookX =
          freeCameraRef.current.x +
          Math.sin(freeCameraRef.current.yaw) * Math.cos(freeCameraRef.current.pitch) * lookDistance;
        const lookY = freeCameraRef.current.y + Math.sin(freeCameraRef.current.pitch) * lookDistance;
        const lookZ =
          freeCameraRef.current.z -
          Math.cos(freeCameraRef.current.yaw) * Math.cos(freeCameraRef.current.pitch) * lookDistance;
        camera.lookAt(lookX, lookY, lookZ);
      } else {
        const cameraYawSpeed = 2.0;
        const cameraPitchSpeed = 1.4;
        const cameraLeft = keys.has("arrowleft");
        const cameraRight = keys.has("arrowright");
        const cameraUp = keys.has("arrowup");
        const cameraDown = keys.has("arrowdown");
      if (cameraLeft) player.cameraYaw -= cameraYawSpeed * delta;
      if (cameraRight) player.cameraYaw += cameraYawSpeed * delta;
      if (cameraUp) player.cameraPitch += cameraPitchSpeed * delta;
      if (cameraDown) player.cameraPitch -= cameraPitchSpeed * delta;
      player.cameraPitch = THREE.MathUtils.clamp(player.cameraPitch, -0.75, 0.55);

      // Quan el vehicle es mou, la càmera tendeix a seguir-lo suament,
      // però l'usuari pot girar la visió amb les fletxes.
      if (!cameraLeft && !cameraRight && Math.abs(player.speed) > 0.5) {
        let yawDiff = player.yaw - player.cameraYaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        player.cameraYaw += yawDiff * 2 * delta;
      }

      camera.position.set(player.x, 3.35 + bob, player.z);
        const lookDistance = 10;
        const lookX =
          player.x + Math.sin(player.cameraYaw) * Math.cos(player.cameraPitch) * lookDistance;
        const lookY = 3.22 + bob + Math.sin(player.cameraPitch) * lookDistance;
        const lookZ =
          player.z - Math.cos(player.cameraYaw) * Math.cos(player.cameraPitch) * lookDistance;
        camera.lookAt(lookX, lookY, lookZ);
      }

      // El cockpit queda enganxat a la direcció del vehicle (player.yaw).
      // Si el conductor gira la visió (cameraYaw), el cockpit es desplaça
      // en sentit contrari, com quan gires el cap dins d'un cotxe real:
      // el volant se'n va al costat oposat del camp visual.
      const rig = cockpitRigRef.current;
      if (rig) {
        let viewOffset = player.cameraYaw - player.yaw;
        while (viewOffset > Math.PI) viewOffset -= Math.PI * 2;
        while (viewOffset < -Math.PI) viewOffset += Math.PI * 2;
        const shift = -Math.sin(viewOffset) * window.innerWidth * 0.45;
        const absOffset = Math.abs(viewOffset);
        const fadeStart = 1.5;
        const fadeEnd = 2.3;
        const opacity =
          absOffset <= fadeStart
            ? 1
            : absOffset >= fadeEnd
              ? 0
              : 1 - (absOffset - fadeStart) / (fadeEnd - fadeStart);
        rig.style.transform = `translateX(${shift.toFixed(1)}px)`;
        rig.style.opacity = opacity.toFixed(3);
      }

      const FLEE_DISTANCE = 38;
      const FLEE_ACCEL = 14;
      const IDLE_DECEL = 5;
      for (const animal of animals) {
        const dxToPlayer = animal.x - player.x;
        const dzToPlayer = animal.z - player.z;
        const distToPlayer = Math.hypot(dxToPlayer, dzToPlayer);
        const angleFromPlayer = Math.atan2(dxToPlayer, dzToPlayer);

        if (distToPlayer < FLEE_DISTANCE) {
          animal.state = "fleeing";
          animal.angle = angleFromPlayer;
          animal.speed = Math.min(
            animal.config.fleeSpeed,
            animal.speed + FLEE_ACCEL * delta,
          );
        } else {
          animal.state = "idle";
          if (animal.speed > animal.config.speed) {
            animal.speed -= IDLE_DECEL * delta;
          } else if (animal.speed < animal.config.speed) {
            animal.speed = animal.config.speed;
          }

          const wanderRange = animal.config.wanderRange ?? 30;
          const homeDist = Math.hypot(animal.x - animal.home.x, animal.z - animal.home.z);
          if (homeDist > wanderRange) {
            animal.angle = Math.atan2(animal.home.x - animal.x, animal.home.z - animal.z);
          } else if (Math.random() < 0.008) {
            animal.angle += (Math.random() - 0.5) * Math.PI;
          }
        }

        const turnRate = animal.config.turnRate ?? 1.2;
        const targetAngle =
          animal.state === "fleeing"
            ? animal.angle
            : Math.atan2(player.x - animal.x, player.z - animal.z);
        let angleDiff = targetAngle - animal.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        animal.angle += angleDiff * turnRate * delta;

        const moveX = Math.sin(animal.angle) * animal.speed * delta;
        const moveZ = Math.cos(animal.angle) * animal.speed * delta;
        const nextX = animal.x + moveX;
        const nextZ = animal.z + moveZ;

        if (!isBlockedForAnimals(nextX, nextZ)) {
          animal.x = nextX;
          animal.z = nextZ;
          animal.mesh.position.set(animal.x, animal.config.height / 2, animal.z);
          animal.shadow.position.set(animal.x, 0.06, animal.z);
        } else {
          animal.angle += Math.PI * (0.5 + Math.random() * 0.5);
          animal.speed *= 0.5;
        }

        if (animal.state === "fleeing") {
          animal.mesh.lookAt(
            animal.x + Math.sin(animal.angle),
            animal.config.height / 2,
            animal.z + Math.cos(animal.angle),
          );
        } else {
          animal.mesh.lookAt(camera.position.x, animal.config.height / 2, camera.position.z);
        }
      }

      let targetAngle = 0;
      const [campX, campY, campZ] = currentPark.camp.position;
      if (!photoDoneRef.current && animals.length > 0) {
        let nearest: AnimalInstance | null = null;
        let nearestDist = Number.POSITIVE_INFINITY;
        for (const animal of animals) {
          const dist = Math.hypot(animal.x - player.x, animal.z - player.z);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = animal;
          }
        }
        if (nearest) {
          targetAngle = Math.atan2(nearest.x - player.x, nearest.z - player.z);
        }
      } else {
        targetAngle = Math.atan2(campX - player.x, campZ - player.z);
      }
      if (gpsRef.current) {
        gpsRef.current.style.transform = `rotate(${targetAngle - player.yaw}rad)`;
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(frame);
    };
    animationFrame = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      for (const mark of skidMarks) {
        scene.remove(mark);
        mark.geometry.dispose();
      }
      skidMaterial.dispose();
      photoActionRef.current = null;
      cleanup();
    };
  }, [screen, currentPark]);

  if (screen === "parks") {
    return (
      <main className="v2-shell park-select">
        <div className="park-hero">
          <p className="v2-kicker">Safari Cooperatiu · Prototip V2</p>
          <h1>Tria la teva expedició</h1>
          <p>Cada parc tindrà paisatge, espècies i missions pròpies.</p>
        </div>
        <section className="park-grid" aria-label="Parcs disponibles">
          {PARKS.map((park) => (
            <article
              className={`park-card park-${park.id} ${park.available ? "available" : "locked"}`}
              key={park.id}
            >
              <div className="park-card-art" />
              <div className="park-card-copy">
                <span>{park.country}</span>
                <h2>{park.name}</h2>
                <p>{park.description}</p>
                <button
                  disabled={!park.available}
                  onClick={() => {
                    setSelectedParkId(park.id);
                    photoDoneRef.current = false;
                    setPhotoDone(false);
                    setScreen("briefing");
                  }}
                >
                  {park.available ? "Explorar aquest parc" : "Properament"}
                </button>
              </div>
            </article>
          ))}
        </section>
        <a className="legacy-link" href="../">Tornar a la versió aèria</a>
        <VersionFooter />
      </main>
    );
  }

  if (screen === "briefing" && currentPark) {
    return (
      <main className="v2-shell briefing-screen">
        <section className="briefing-panel">
          <button className="back-link" onClick={() => setScreen("parks")}>
            ← Parcs
          </button>
          <p className="v2-kicker">Expedició 01 · {currentPark.name}</p>
          <h1>{currentPark.briefingTitle}</h1>
          <p>{currentPark.briefingDescription}</p>
          <section className="mission-steps" aria-labelledby="mission-steps-title">
            <h2 id="mission-steps-title">La teva missió</h2>
            <ol>
              <li>
                <b>1</b>
                <span>
                  <strong>Explora</strong>Condueix pel parc sense travessar el riu.
                </span>
              </li>
              <li>
                <b>2</b>
                <span>
                  <strong>Busca</strong>Localitza l&apos;objectiu entre la vegetació.
                </span>
              </li>
              <li>
                <b>3</b>
                <span>
                  <strong>Fotografia</strong>Centra&apos;l al visor i fes la foto.
                </span>
              </li>
            </ol>
          </section>
          <section className="control-guide" aria-labelledby="control-guide-title">
            <h2 id="control-guide-title">Com es juga</h2>
            <div className="control-guide-grid">
              <div>
                <h3>Ordinador</h3>
                <p>
                  <kbd>WASD</kbd> o <kbd>Fletxes</kbd>
                  <span>Conduir</span>
                </p>
                <p>
                  <kbd>WASD</kbd>
                  <span>Conduir</span>
                </p>
                <p>
                  <kbd>Fletxes</kbd>
                  <span>Mirar a l'esquerra / dreta / amunt / avall</span>
                </p>
                <p>
                  <kbd>T</kbd>
                  <span>Recentrar la visió amb el vehicle</span>
                </p>
                <p>
                  <kbd>C</kbd>
                  <span>Mode càmera lliure (sense cotxe) / següent</span>
                </p>
                <p>
                  <kbd>Rodeta</kbd>
                  <span>Zoom</span>
                </p>
                <p>
                  <kbd>Espai</kbd>
                  <span>Fer una fotografia</span>
                </p>
                <p>
                  <kbd>R</kbd>
                  <span>Tornar al camp base</span>
                </p>
              </div>
              <div>
                <h3>Mòbil o tauleta</h3>
                <p>
                  <kbd>▲ ◀ ▼ ▶</kbd>
                  <span>Conduir</span>
                </p>
                <p>
                  <kbd>2 dits</kbd>
                  <span>Zoom</span>
                </p>
                <p>
                  <kbd>FOTO</kbd>
                  <span>Fer una fotografia</span>
                </p>
              </div>
            </div>
          </section>
          <p className="briefing-tip">
            <strong>Recorda:</strong> si arribes al límit del parc o al riu, gira i busca un altre
            camí.
          </p>
          <button className="start-v2" onClick={startGame}>
            Entès, comença el safari
          </button>
        </section>
      </main>
    );
  }

  const mission = currentPark?.missions[0];

  if (!currentPark) return null;

  return (
    <main className="v2-game">
      {renderError && (
        <div className="v2-error" role="alert">
          <strong>Error al carregar l’escena:</strong>
          <pre>{renderError}</pre>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="v2-canvas"
        aria-label={`${currentPark.name} en primera persona`}
      />
      <Minimap config={currentPark} playerRef={playerRef} animalsRef={animalsRef} />
      <header className="v2-hud">
        <button onClick={() => setScreen("parks")}>← Parcs</button>
        <div>
          <span>PARC</span>
          <strong>{currentPark?.name ?? ""}</strong>
        </div>
        <div className="hud-right">
          <span>MISSIÓ</span>
          <strong className={photoDone ? "mission-done" : ""}>
            {photoDone ? "1/1" : "0/1"} {mission?.label ?? ""}
          </strong>
        </div>
        <div className={`camera-mode-badge hud-right ${cameraMode === "free" ? "camera-mode-free" : "camera-mode-follow"}`}>
          <span>CÀMERA</span>
          <strong>{cameraMode === "free" ? "Lliure" : "Següent"}</strong>
        </div>
      </header>
      <div className="viewfinder" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <b>+</b>
      </div>
      <div className={`photo-flash ${flash ? "visible" : ""}`} />
      {cameraMode !== "free" && (
        <div className="cockpit-rig" ref={cockpitRigRef} aria-hidden="true">
          <div className="jeep-cockpit">
            <span />
            <b />
            <div className="dashboard-km">
              <span>KM</span>
              <strong ref={kmDisplayRef}>0.00</strong>
            </div>
          </div>
          <div className="steering-wheel" ref={wheelRef}>
            <span />
          </div>
          <div className="gps">
            <span>GPS</span>
            <b ref={gpsRef}>↑</b>
          </div>
        </div>
      )}
      <div className="v2-message" role="status">
        {message}
      </div>
      <button className="photo-button" onClick={takePhoto}>
        FOTO
      </button>
      <div className="v2-touch" aria-label="Controls tàctils">
        <button
          onPointerDown={() => setTouch("forward", true)}
          onPointerUp={() => setTouch("forward", false)}
          onPointerCancel={() => setTouch("forward", false)}
        >
          ▲
        </button>
        <button
          onPointerDown={() => setTouch("left", true)}
          onPointerUp={() => setTouch("left", false)}
          onPointerCancel={() => setTouch("left", false)}
        >
          ◀
        </button>
        <button
          onPointerDown={() => setTouch("back", true)}
          onPointerUp={() => setTouch("back", false)}
          onPointerCancel={() => setTouch("back", false)}
        >
          ▼
        </button>
        <button
          onPointerDown={() => setTouch("right", true)}
          onPointerUp={() => setTouch("right", false)}
          onPointerCancel={() => setTouch("right", false)}
        >
          ▶
        </button>
      </div>
      {photoDone && <div className="prototype-complete">Prova completada · Continua explorant</div>}
    </main>
  );
}
