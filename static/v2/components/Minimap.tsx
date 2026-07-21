import { useEffect, useRef } from "react";
import type { ParkConfig } from "../types";

type MinimapProps = {
  config: ParkConfig;
  playerRef: React.MutableRefObject<{ x: number; z: number; yaw: number; speed: number }>;
};

const WIDTH = 240;
const HEIGHT = 192;

export function Minimap({ config, playerRef }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    if (config.ground.texture) {
      const mapImage = new Image();
      mapImage.src = `${import.meta.env.BASE_URL}${config.ground.texture}`;
      mapImage.onload = () => {
        mapImageRef.current = mapImage;
      };
    }

    const scaleX = WIDTH / config.ground.width;
    const scaleY = HEIGHT / config.ground.depth;

    const worldToCanvas = (x: number, z: number) => ({
      x: (x + config.ground.width / 2) * scaleX,
      y: (z + config.ground.depth / 2) * scaleY,
    });

    let frameId = 0;
    const draw = () => {
      context.clearRect(0, 0, WIDTH, HEIGHT);

      if (mapImageRef.current) {
        context.drawImage(mapImageRef.current, 0, 0, WIDTH, HEIGHT);
      } else {
        context.fillStyle = "#bda05a";
        context.fillRect(0, 0, WIDTH, HEIGHT);
      }

      const camp = worldToCanvas(config.camp.position[0], config.camp.position[2]);
      context.fillStyle = "#d8bd7a";
      context.beginPath();
      context.moveTo(camp.x, camp.y - 6);
      context.lineTo(camp.x + 5, camp.y + 4);
      context.lineTo(camp.x - 5, camp.y + 4);
      context.closePath();
      context.fill();

      context.fillStyle = "#5aa356";
      for (const animal of config.animals) {
        for (const [x, z] of animal.positions) {
          const pos = worldToCanvas(x, z);
          context.beginPath();
          context.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
          context.fill();
        }
      }

      const player = worldToCanvas(playerRef.current.x, playerRef.current.z);
      context.save();
      context.translate(player.x, player.y);
      context.rotate(playerRef.current.yaw);
      context.fillStyle = "#e36e38";
      context.beginPath();
      context.moveTo(0, -7);
      context.lineTo(5, 6);
      context.lineTo(-5, 6);
      context.closePath();
      context.fill();
      context.restore();

      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameId);
  }, [config, playerRef]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="v2-minimap"
      aria-label="Mini-mapa de la posició del vehicle"
    />
  );
}
