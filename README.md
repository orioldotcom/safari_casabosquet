# Safari Cooperatiu · MVP

Primera versió web jugable del projecte familiar. L'objectiu és recórrer la
sabana, fotografiar una zebra, una girafa i un elefant, i tornar al campament
abans que s'acabin el temps o el combustible.

## Com jugar

- **Ordinador:** fletxes o `WASD` per conduir i `Espai` per fer una foto.
- **Mòbil o tauleta:** creueta tàctil i botó **FOTO**.
- Les fotografies més properes donen més punts.
- La partida es guanya quan s'han completat les tres missions i el jeep torna
  a la zona del campament.

## Posar-lo en marxa

Cal tenir Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

El joc s'obre normalment a [http://localhost:3000](http://localhost:3000).

## Comprovacions

```bash
npm run lint
npm test
```

## Estructura principal

- `app/SafariGame.tsx`: lògica del joc i dibuix del món amb Canvas.
- `app/globals.css`: disseny, adaptació a mòbil i controls tàctils.
- `app/page.tsx`: entrada de la pàgina.
- `tests/rendered-html.test.mjs`: comprovació bàsica de la versió compilada.

## Abast d'aquesta versió

Aquest primer lliurament és local i per a un jugador. Està pensat per validar
si conduir, buscar animals i completar missions fotogràfiques és divertit abans
d'afegir sales multijugador, usuaris, persistència i sincronització en temps
real.
