import React from "react";
import { createRoot } from "react-dom/client";
import AppShell from "./app-shell";
import "./ui-refresh.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>
);


