import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getParkConfig, PARKS } from "./v2/parks";
import { buildScene, type AnimalInstance } from "./v2/game/buildScene";
import { Minimap } from "./v2/components/Minimap";

type Screen = "parks" | "briefing" | "playing";
type DriveControl = "forward" | "back" | "left" | "right";

export function SafariV2() {
  const [screen, setScreen] = useState<Screen>("parks");
  const [selectedParkId, setSelectedParkId] = useState<string>("serengeti");
  const [message, setMessage] = useState("Tria un parc i comença l'expedició.");
  const [photoDone, setPhotoDone] = useState(false);
  const [flash, setFlash] = useState(false);
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

    const { renderer, scene, camera, player, photoTargets, animals, isBlocked, cleanup } =
      buildScene(canvas, currentPark);

    playerRef.current = player;
    animalsRef.current = animals;

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
        setMessage("Vehicle recol·locat al camp base.");
      }
      if (key === "escape") setScreen("parks");
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

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
      const forward = keys.has("w") || touch.forward;
      const back = keys.has("s") || touch.back;
      const left = keys.has("a") || touch.left;
      const right = keys.has("d") || touch.right;

      if (forward) player.speed += 17 * delta;
      if (back) player.speed -= 12 * delta;
      player.speed *= Math.pow(0.22, delta);
      player.speed = THREE.MathUtils.clamp(player.speed, -5.5, 17);

      const steering = (right ? 1 : 0) - (left ? 1 : 0);
      const turnFactor = player.speed === 0 ? 1 : Math.sign(player.speed);
      player.yaw += steering * 1.22 * delta * turnFactor;
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

      const cameraYawSpeed = 1.1;
      const cameraPitchSpeed = 0.9;
      const cameraLeft = keys.has("arrowleft");
      const cameraRight = keys.has("arrowright");
      const cameraUp = keys.has("arrowup");
      const cameraDown = keys.has("arrowdown");
      if (cameraLeft) player.cameraYaw -= cameraYawSpeed * delta;
      if (cameraRight) player.cameraYaw += cameraYawSpeed * delta;
      if (cameraUp) player.cameraPitch += cameraPitchSpeed * delta;
      if (cameraDown) player.cameraPitch -= cameraPitchSpeed * delta;
      player.cameraPitch = THREE.MathUtils.clamp(player.cameraPitch, -0.45, 0.35);

      const bob = Math.sin(now * 0.009) * Math.min(0.05, Math.abs(player.speed) * 0.004);
      camera.position.set(player.x, 3.35 + bob, player.z);
      const lookDistance = 10;
      const lookX = player.x + Math.sin(player.cameraYaw) * Math.cos(player.cameraPitch) * lookDistance;
      const lookY = 3.22 + bob + Math.sin(player.cameraPitch) * lookDistance;
      const lookZ = player.z - Math.cos(player.cameraYaw) * Math.cos(player.cameraPitch) * lookDistance;
      camera.lookAt(lookX, lookY, lookZ);

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

        if (!isBlocked(nextX, nextZ)) {
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

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(frame);
    };
    animationFrame = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
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
                  <kbd>WASD</kbd>
                  <span>Conduir</span>
                </p>
                <p>
                  <kbd>Fletxes</kbd>
                  <span>Moure la càmera</span>
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
        <div>
          <span>MISSIÓ</span>
          <strong className={photoDone ? "mission-done" : ""}>
            {photoDone ? "1/1" : "0/1"} {mission?.label ?? ""}
          </strong>
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
      <div className="jeep-cockpit" aria-hidden="true">
        <span />
        <b />
      </div>
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
