/**
 * Ponto de entrada da aplicação React.
 * Responsável por inicializar a aplicação
 * e renderizar o componente principal.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import App from "./App";

import "./global.css";

createRoot(
  document.getElementById("root")!
).render(
  <StrictMode>
    <App />
  </StrictMode>
);