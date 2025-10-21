import { Stack, ThemeProvider } from "@mui/material";
import { AiFillGithub } from "react-icons/ai";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { SignedIn } from "src/Auth";
import { Home } from "src/Home";
import { THEME, palette } from "src/assets/themes/theme";
import { Player } from "src/player/Player";
import { useGetUsername } from "src/services/cognito";
import { Uploader } from "src/upload/Uploader";
import "src/App.css";
import Auth2 from "src/Auth2";

function App() {
  const username = useGetUsername();

  return (
    <div>
      <ThemeProvider theme={THEME}>
        <Stack
          className="app-header"
          direction="row"
          sx={{ backgroundColor: palette.primary.dark }}
        >
          <div className="header-container" id="header-container-ghlink">
            <a
              className="link"
              id="github-link"
              href="https://github.com/dunned024"
              rel="noreferrer"
            >
              <AiFillGithub id="github-icon" />
              dunned024
            </a>
          </div>
          <div className="header-container" id="header-container-homelink">
            <a className="link" href="/" rel="noreferrer">
              hold my clips
            </a>
          </div>
          <div className="header-container" id="header-container-user">
            <Auth2 />
            {username ? (
              <Stack id="username-container" direction="row">
                Signed in as: {username} |&nbsp;
                <a className="link" href="/auth/sign-out" rel="noreferrer">
                  Sign out
                </a>
              </Stack>
            ) : (
              <a className="link" href="/signedin" rel="noreferrer">
                Sign in
              </a>
            )}
          </div>
          <span id="stretch" />
        </Stack>
        <Stack
          className="app"
          sx={{
            background: `linear-gradient(to bottom, ${palette.primary.main} 0%, ${palette.primary.main} 75%, ${palette.primary.dark} 100%)`,
          }}
        >
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/player/:clipId" element={<Player />} />
              <Route path="/upload" element={<Uploader />} />
              <Route path="/signedin" element={<SignedIn />} />
            </Routes>
          </Router>
        </Stack>
      </ThemeProvider>
    </div>
  );
}

export default App;
