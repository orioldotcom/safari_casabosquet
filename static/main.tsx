import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SafariGame } from "../app/SafariGame";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("No s'ha trobat l'arrel del joc.");
}

createRoot(root).render(
  <StrictMode>
    <SafariGame />
  </StrictMode>,
);
