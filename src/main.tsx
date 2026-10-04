import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";
import "@fontsource/source-code-pro/400.css";
import "@fontsource/source-code-pro/600.css";
import "@fontsource/source-code-pro/700.css";
import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
