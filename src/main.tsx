import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import App from "./App";
import QuickNote from "./QuickNote";
import { Toaster } from "@/components/ui/sonner";

const stored = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (stored === "dark" || (!stored && prefersDark)) {
  document.documentElement.classList.add("dark");
}

const isQuickNote = getCurrentWebviewWindow().label === "quicknote";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isQuickNote ? <QuickNote /> : <App />}
    <Toaster />
  </React.StrictMode>,
);
