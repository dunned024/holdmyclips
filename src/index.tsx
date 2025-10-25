import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "src/App";
import { AuthProvider } from "src/context/AuthContext";
import "src/index.css";
import { THEME } from "src/assets/themes/theme";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider theme={THEME}>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
