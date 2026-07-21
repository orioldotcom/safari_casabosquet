import type { ParkConfig } from "../types";
import { kruger } from "./kruger";
import { serengeti } from "./serengeti";

export const PARKS: ParkConfig[] = [serengeti, kruger];

export function getParkConfig(id: string): ParkConfig | undefined {
  return PARKS.find((park) => park.id === id);
}
