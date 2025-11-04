import { Stack, ThemeProvider } from "@mui/material";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import "src/App.css";
import { THEME, palette } from "src/assets/themes/theme";
import { NavBar } from "src/components/NavBar";
import { AuthProvider } from "src/context/AuthContext";
import { Home } from "src/pages/home/Home";
import { Player } from "src/pages/player/Player";
import { Uploader } from "src/pages/upload/Uploader";

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
