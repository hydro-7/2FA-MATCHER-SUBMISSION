import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./style.css";
import "./layout.css";
import "./home.css";
import "./wizard.css";
import "./dropdown.css";
import "./discover.css";
import "./group.css";
import "./friends.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
