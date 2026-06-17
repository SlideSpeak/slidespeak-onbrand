import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { ROUTER } from "./app/router";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<RouterProvider router={ROUTER} />);
