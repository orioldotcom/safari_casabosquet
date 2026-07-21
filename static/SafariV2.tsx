import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getParkConfig, PARKS } from "./v2/parks";
import { buildScene } from "./v2/game/buildScene";
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

    const { renderer, scene, camera, player, photoTargets, isBlocked, cleanup } =
      buildScene(canvas, currentPark);

    playerRef.current = player;

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
        player.speed = 0;
        setMessage("Vehicle recol·locat al camp base.");
      }
      if (key === "escape") setScreen("parks");
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

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
      const forward = keys.has("w") || keys.has("arrowup") || touch.forward;
      const back = keys.has("s") || keys.has("arrowdown") || touch.back;
      const left = keys.has("a") || keys.has("arrowleft") || touch.left;
      const right = keys.has("d") || keys.has("arrowright") || touch.right;

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

      const bob = Math.sin(now * 0.009) * Math.min(0.05, Math.abs(player.speed) * 0.004);
      camera.position.set(player.x, 3.35 + bob, player.z);
      camera.lookAt(player.x + directionX * 10, 3.22 + bob, player.z + directionZ * 10);
      for (const animal of photoTargets) {
        animal.lookAt(camera.position.x, animal.position.y, camera.position.z);
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
                  <kbd>WASD</kbd> o <kbd>Fletxes</kbd>
                  <span>Conduir</span>
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
      <Minimap config={currentPark} playerRef={playerRef} />
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
