/**
 * Ponto de entrada da aplicação React.
 * Responsável por inicializar a aplicação
 * e renderizar o componente principal.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import "./global.css";

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <App />
  </StrictMode>
);