declare const __APP_COMMIT__: string | undefined;

/** Versió actual de l'aplicació. Actualitza-la quan publiquis millores. */
export const APP_VERSION = "0.5.0";

/** Hash curt del commit amb què s'ha generat aquest build ("dev" en local). */
export const APP_COMMIT: string =
  typeof __APP_COMMIT__ === "string" && __APP_COMMIT__.length > 0
    ? __APP_COMMIT__
    : "dev";

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  changes: string[];
};

/** Historial de millores visible pels usuaris. Les novetats van primer. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.5.0",
    date: "2026-08-01",
    title: "Controls de conducció i visió",
    changes: [
      "WASD condueix el vehicle; les fletxes giren la visió del conductor sense girar el vehicle.",
      "Tecla T per recentrar la visió amb la direcció del vehicle.",
      "Versió de l'app i historial de millores visible a l'inici.",
      "Publicació automàtica a GitHub Pages en cada push.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-07-21",
    title: "Parc ampliat",
    changes: [
      "Més camins de carro per explorar el Serengeti.",
      "Roques als límits del parc i més ponts per creuar el riu.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-07-21",
    title: "Mini-mapa i terreny",
    changes: [
      "Mini-mapa en directe amb la posició del vehicle, el camp i els animals.",
      "Terra del Serengeti amb el mapa original com a textura.",
      "Refactor per parcs: Serengeti disponible, Kruger properament.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-07-17",
    title: "Prototip en primera persona",
    changes: [
      "Nova versió V2 3D en primera persona amb Three.js.",
      "Primer animal fotografiable: el guepard.",
      "Instruccions abans de començar l'expedició.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-07-16",
    title: "MVP original",
    changes: [
      "Joc amb vista aèria: condueix el jeep, fotografia zebra, girafa i elefant.",
      "Temps i combustible limitats; torna al campament per guanyar.",
      "Controls tàctils per a mòbil i tauleta.",
    ],
  },
];
