import React from "react";
import { createRoot } from "react-dom/client";
import { Groundwork } from "./Groundwork.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Groundwork />
  </React.StrictMode>,
);
