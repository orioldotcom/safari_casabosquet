import { useEffect, useRef } from "react";
import type { ParkConfig } from "../types";

type MinimapProps = {
  config: ParkConfig;
  playerRef: React.MutableRefObject<{ x: number; z: number; yaw: number; speed: number }>;
};

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

    let frameId = 0;
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      context.clearRect(0, 0, width, height);

      if (mapImageRef.current) {
        context.drawImage(mapImageRef.current, 0, 0, width, height);
      } else {
        context.fillStyle = "#bda05a";
        context.fillRect(0, 0, width, height);
      }

      const scaleX = width / config.ground.width;
      const scaleY = height / config.ground.depth;
      const playerX = (playerRef.current.x + config.ground.width / 2) * scaleX;
      const playerY = (playerRef.current.z + config.ground.depth / 2) * scaleY;

      context.save();
      context.translate(playerX, playerY);
      context.rotate(playerRef.current.yaw);
      context.fillStyle = "#e36e38";
      context.beginPath();
      context.moveTo(0, -5);
      context.lineTo(4, 5);
      context.lineTo(-4, 5);
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
      width={150}
      height={120}
      className="v2-minimap"
      aria-label="Mini-mapa de la posició del vehicle"
    />
  );
}
