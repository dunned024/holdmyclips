import { Stack } from "@mui/material";
import { AiFillGithub } from "react-icons/ai";
import { palette } from "src/assets/themes/theme";
import { useAuthContext } from "src/context/AuthContext";
import "src/NavBar.css";

export const NavBar = () => {
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
        <a className="link" href="/">
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
