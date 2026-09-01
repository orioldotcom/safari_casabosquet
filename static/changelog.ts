declare const __APP_COMMIT__: string | undefined;

/** Versió actual de l'aplicació. Actualitza-la quan publiquis millores. */
export const APP_VERSION = "0.8.1";

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
    version: "0.8.1",
    date: "2026-08-01",
    title: "Sabana més densa i camins nets",
    changes: [
      "Més vegetació tipus sabana: 850 arbres i 1600 arbustos.",
      "Zona de seguretat més gran: cap arbre ni arbust a prop dels camins.",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-08-01",
    title: "Mapa més gran i camins més estrets",
    changes: [
      "El parc Serengeti és un 50% més gran (ara fa 1350 x 1080 metres).",
      "Camins de terra més estrets i naturals.",
      "Muntanya amb cap de neu visible a l'horitzó.",
      "60 clapes d'herba de colors repartides pel parc.",
      "Més vegetació: 750 arbres i 1300 arbustos.",
      "Riu dibuixat seguint exactament el seu curs.",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-08-01",
    title: "Gràfics millorats",
    changes: [
      "Cel amb gradient realista i núvols que deriven lentament.",
      "Llum més càlida, ombres més suaus i contrast millorat (ACES).",
      "Terra amb relleu i camins amb vores fosques i marques de pneumàtic.",
      "Arbres i arbustos amb més volum i colors variats.",
      "Riu i estany visibles amb aigua brillant.",
      "Pols darrere del vehicle quan condueixes ràpid.",
      "Capó, tauler, parabrisa i retrovisors del 4x4 visibles en 3D.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-08-01",
    title: "Cockpit fix a la direcció del vehicle",
    changes: [
      "El volant, el tauler i el GPS queden orientats amb la direcció del vehicle.",
      "En girar la visió amb les fletxes, el cap del conductor gira dins de l'habitacle sense que el vehicle sembli girar.",
      "El cockpit s'atenua quan mires gairebé cap enrere.",
    ],
  },
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
