import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SafariV2 } from "./SafariV2";
import "./v2.css";

const root = document.getElementById("root");

if (!root) throw new Error("No s'ha trobat l'arrel del prototip.");

createRoot(root).render(
  <StrictMode>
    <SafariV2 />
  </StrictMode>,
);
