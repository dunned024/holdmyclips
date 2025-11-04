import { Stack, ThemeProvider } from "@mui/material";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "src/App.css";
import { Home } from "src/Home";
import { THEME, palette } from "src/assets/themes/theme";
import { AuthProvider } from "src/context/AuthContext";
import { Player } from "src/player/Player";
import { Uploader } from "src/upload/Uploader";
import { NavBar } from "./NavBar";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/player/:clipId",
    element: <Player />,
  },
  {
    path: "/upload",
    element: <Uploader />,
  },
]);

const App = () => {
  return (
    <Stack
      className="app"
      sx={{
        background: `linear-gradient(to bottom, ${palette.primary.main} 0%, ${palette.primary.main} 75%, ${palette.primary.dark} 100%)`,
      }}
    >
      <AuthProvider>
        <ThemeProvider theme={THEME}>
          <NavBar />
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </Stack>
  );
};

export default App;
