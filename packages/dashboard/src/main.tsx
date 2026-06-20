import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { ROUTER } from "./app/router";
import { initializeTheme } from "./app/theme";
import "./styles.css";

initializeTheme();

createRoot(document.getElementById("root")!).render(<RouterProvider router={ROUTER} />);
