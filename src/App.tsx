import { Stack } from "@mui/material";
import { AiFillGithub } from "react-icons/ai";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "src/Home";
import { palette } from "src/assets/themes/theme";
import { Player } from "src/player/Player";
import { Uploader } from "src/upload/Uploader";
import "src/App.css";
import { useAuthContext } from "src/context/AuthContext";

const App = () => {
  return (
    <>
      <NavBar />
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
          </Routes>
        </Router>
      </Stack>
    </>
  );
};

const NavBar = () => {
  const { username, signIn, signOut } = useAuthContext();

  return (
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
        {username ? (
          <Stack id="username-container" direction="row">
            Signed in as: {username} |&nbsp;{" "}
            <button onClick={signOut} type="button">
              Sign out
            </button>
          </Stack>
        ) : (
          <button onClick={signIn} type="button">
            Sign in
          </button>
        )}
      </div>
      <span id="stretch" />
    </Stack>
  );
};

export default App;
