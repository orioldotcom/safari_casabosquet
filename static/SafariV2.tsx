import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Screen = "parks" | "briefing" | "playing";
type DriveControl = "forward" | "back" | "left" | "right";

const PARKS = [
  {
    id: "serengeti",
    name: "Serengeti",
    country: "Tanzània",
    description: "Sabana oberta, riu estacional i grans depredadors.",
    available: true,
  },
  {
    id: "kruger",
    name: "Kruger",
    country: "Sud-àfrica",
    description: "Boscos baixos, pistes de terra i els Big Five.",
    available: false,
  },
  {
    id: "yellowstone",
    name: "Yellowstone",
    country: "Estats Units",
    description: "Praderies, boscos i fauna de muntanya.",
    available: false,
  },
];

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

export function SafariV2() {
  const [screen, setScreen] = useState<Screen>("parks");
  const [message, setMessage] = useState("Troba un guepard i fotografia'l de cara.");
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

  const startGame = useCallback(() => {
    photoDoneRef.current = false;
    setPhotoDone(false);
    setMessage("Troba un guepard. Centra'l al visor i fes la fotografia.");
    setScreen("playing");
  }, []);

  const takePhoto = useCallback(() => photoActionRef.current?.(), []);

  const setTouch = useCallback((control: DriveControl, active: boolean) => {
    touchRef.current[control] = active;
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9ac3d0);
    scene.fog = new THREE.Fog(0x9ac3d0, 72, 245);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 430);
    const player = { x: 0, z: 104, yaw: 0, speed: 0 };

    scene.add(new THREE.HemisphereLight(0xf4e4b3, 0x455431, 2.5));
    const sun = new THREE.DirectionalLight(0xffefc4, 3.2);
    sun.position.set(-60, 95, 45);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -160;
    sun.shadow.camera.right = 160;
    sun.shadow.camera.top = 130;
    sun.shadow.camera.bottom = -130;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(340, 250),
      new THREE.MeshStandardMaterial({ color: 0xbda05a, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    for (let index = 0; index < 18; index += 1) {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(7 + (index % 5) * 2.2, 18),
        new THREE.MeshStandardMaterial({
          color: index % 3 === 0 ? 0x87934b : 0x9e9650,
          roughness: 1,
        }),
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(((index * 59) % 275) - 137, 0.012, ((index * 83) % 205) - 102);
      scene.add(patch);
    }

    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 188),
      new THREE.MeshStandardMaterial({
        color: 0x397f91,
        roughness: 0.3,
        metalness: 0.08,
      }),
    );
    river.rotation.x = -Math.PI / 2;
    river.rotation.z = -0.2;
    river.position.set(44, 0.05, -5);
    scene.add(river);

    for (let index = 0; index < 54; index += 1) {
      const x = ((index * 67) % 305) - 152;
      const z = ((index * 97) % 215) - 108;
      const riverDx = x - 44;
      const riverDz = z + 5;
      const localRiverX = riverDx * Math.cos(-0.2) - riverDz * Math.sin(-0.2);
      if (Math.abs(localRiverX) < 15 || Math.hypot(x, z - 102) < 22) continue;
      scene.add(makeTree(x, z, 0.72 + (index % 4) * 0.12));
    }

    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x665d4b, roughness: 1 });
    for (let index = 0; index < 22; index += 1) {
      const rock = new THREE.Mesh(
        new THREE.ConeGeometry(8 + (index % 4) * 2, 18 + (index % 5) * 5, 7),
        rockMaterial,
      );
      const alongX = index < 11;
      rock.position.set(
        alongX ? -154 + index * 30 : index % 2 === 0 ? -164 : 164,
        7,
        alongX ? -116 : -105 + (index - 11) * 21,
      );
      rock.rotation.y = index * 0.8;
      rock.castShadow = true;
      scene.add(rock);
    }

    const cheetahs: THREE.Mesh[] = [];
    const cheetahTexture = new THREE.TextureLoader().load(
      `${import.meta.env.BASE_URL}animals/cheetah.png`,
    );
    cheetahTexture.colorSpace = THREE.SRGBColorSpace;
    const cheetahMaterial = new THREE.MeshBasicMaterial({
      map: cheetahTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const cheetahPositions: [number, number][] = [
      [-38, -46],
      [88, 34],
      [-92, 48],
    ];
    for (const [x, z] of cheetahPositions) {
      const animal = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.92), cheetahMaterial);
      animal.position.set(x, 0.96, z);
      animal.userData.photoTarget = true;
      scene.add(animal);
      cheetahs.push(animal);

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(1.35, 20),
        new THREE.MeshBasicMaterial({ color: 0x342718, transparent: true, opacity: 0.34 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.y = 0.34;
      shadow.position.set(x, 0.06, z);
      scene.add(shadow);
    }

    const camp = new THREE.Mesh(
      new THREE.ConeGeometry(4.8, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xd8bd7a, roughness: 0.9 }),
    );
    camp.position.set(0, 3, 112);
    camp.rotation.y = Math.PI / 4;
    scene.add(camp);

    const raycaster = new THREE.Raycaster();
    photoActionRef.current = () => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 130);
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hit = raycaster.intersectObjects(cheetahs, false)[0];
      if (!hit || hit.distance > 78) {
        setMessage("No hi ha cap guepard prou centrat. Apropa't i apunta amb el visor.");
        return;
      }
      if (!photoDoneRef.current) {
        photoDoneRef.current = true;
        setPhotoDone(true);
        setMessage("Guepard fotografiat! Prova en primera persona completada.");
      } else {
        setMessage("Una altra bona fotografia del guepard!");
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
        player.x = 0;
        player.z = 104;
        player.yaw = 0;
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
      if (Math.abs(player.speed) > 0.12) {
        player.yaw += steering * 1.22 * delta * Math.sign(player.speed);
      }
      const directionX = Math.sin(player.yaw);
      const directionZ = -Math.cos(player.yaw);
      const candidateX = player.x + directionX * player.speed * delta;
      const candidateZ = player.z + directionZ * player.speed * delta;
      const riverDx = candidateX - 44;
      const riverDz = candidateZ + 5;
      const riverLocalX = riverDx * Math.cos(-0.2) - riverDz * Math.sin(-0.2);
      const riverLocalZ = riverDx * Math.sin(-0.2) + riverDz * Math.cos(-0.2);
      const insideBounds = Math.abs(candidateX) < 156 && Math.abs(candidateZ) < 112;
      const inRiver = Math.abs(riverLocalX) < 10.5 && Math.abs(riverLocalZ) < 96;
      if (insideBounds && !inRiver) {
        player.x = candidateX;
        player.z = candidateZ;
      } else {
        player.speed *= -0.16;
        if (now - collisionMessageAt > 1700) {
          collisionMessageAt = now;
          setMessage(inRiver ? "El riu limita el pas. Busca una ruta pels extrems." : "Has arribat al límit del parc.");
        }
      }

      const bob = Math.sin(now * 0.009) * Math.min(0.05, Math.abs(player.speed) * 0.004);
      camera.position.set(player.x, 3.35 + bob, player.z);
      camera.lookAt(player.x + directionX * 10, 3.22 + bob, player.z + directionZ * 10);
      for (const animal of cheetahs) {
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
      renderer.dispose();
      cheetahTexture.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) material.dispose();
        }
      });
    };
  }, [screen]);

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
            <article className={`park-card park-${park.id} ${park.available ? "available" : "locked"}`} key={park.id}>
              <div className="park-card-art" />
              <div className="park-card-copy">
                <span>{park.country}</span>
                <h2>{park.name}</h2>
                <p>{park.description}</p>
                <button disabled={!park.available} onClick={() => setScreen("briefing")}>
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

  if (screen === "briefing") {
    return (
      <main className="v2-shell briefing-screen">
        <section className="briefing-panel">
          <button className="back-link" onClick={() => setScreen("parks")}>← Parcs</button>
          <p className="v2-kicker">Expedició 01 · Serengeti</p>
          <h1>A la recerca del guepard</h1>
          <p>
            Condueix lliurement des del seient del 4x4. El riu i els límits rocosos
            marquen la zona explorable. Troba un guepard, centra&apos;l al visor i fotografia&apos;l.
          </p>
          <div className="briefing-rules">
            <div><strong>WASD</strong><span>Conduir</span></div>
            <div><strong>ESPAI</strong><span>Fotografia</span></div>
            <div><strong>R</strong><span>Recol·locar</span></div>
          </div>
          <button className="start-v2" onClick={startGame}>Pujar al 4x4</button>
        </section>
      </main>
    );
  }

  return (
    <main className="v2-game">
      <canvas ref={canvasRef} className="v2-canvas" aria-label="Serengeti en primera persona" />
      <header className="v2-hud">
        <button onClick={() => setScreen("parks")}>← Parcs</button>
        <div><span>PARC</span><strong>Serengeti</strong></div>
        <div><span>MISSIÓ</span><strong className={photoDone ? "mission-done" : ""}>{photoDone ? "1/1" : "0/1"} Guepard</strong></div>
      </header>
      <div className="viewfinder" aria-hidden="true"><i /><i /><i /><i /><b>+</b></div>
      <div className={`photo-flash ${flash ? "visible" : ""}`} />
      <div className="jeep-cockpit" aria-hidden="true"><span /><b /></div>
      <div className="v2-message" role="status">{message}</div>
      <button className="photo-button" onClick={takePhoto}>FOTO</button>
      <div className="v2-touch" aria-label="Controls tàctils">
        <button onPointerDown={() => setTouch("forward", true)} onPointerUp={() => setTouch("forward", false)} onPointerCancel={() => setTouch("forward", false)}>▲</button>
        <button onPointerDown={() => setTouch("left", true)} onPointerUp={() => setTouch("left", false)} onPointerCancel={() => setTouch("left", false)}>◀</button>
        <button onPointerDown={() => setTouch("back", true)} onPointerUp={() => setTouch("back", false)} onPointerCancel={() => setTouch("back", false)}>▼</button>
        <button onPointerDown={() => setTouch("right", true)} onPointerUp={() => setTouch("right", false)} onPointerCancel={() => setTouch("right", false)}>▶</button>
      </div>
      {photoDone && <div className="prototype-complete">Prova completada · Continua explorant</div>}
    </main>
  );
}
