import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { ResearchProvider } from "./context/ResearchContext.jsx";
import "./styles/global.css";
import "./styles/research.css";
import "./styles/collections.css";
import "./styles/timeline.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <ToastProvider>
          <AuthProvider>
            <ResearchProvider>
              <App />
            </ResearchProvider>
          </AuthProvider>
        </ToastProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);