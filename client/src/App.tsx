import {
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AiFillGithub } from 'react-icons/ai';
import './App.css';
import { Home } from './Home';
import { Player } from './Player';
import { Uploader } from "./upload/Uploader";
import { Stack, ThemeProvider } from "@mui/material";
import { THEME, palette } from "./assets/themes/theme";

function App() {
  return (
    <div>
      <ThemeProvider theme={THEME}>
        <Stack className="app-header" direction="row" sx={{backgroundColor: palette.primary.dark}}>
          <div className="site-name">
            <a className="link" href="/" rel="noreferrer">
              hold my clips
            </a>
          </div>
          <a className="link" id="github-link" href="https://github.com/dunned024" rel="noreferrer">
            <Stack direction='row' spacing={2}>
              <AiFillGithub />
              dunned024
            </Stack>
          </a>
        </Stack>
        <Stack className="app" sx={{background: `linear-gradient(180deg, ${palette.primary.main} 0%, ${palette.primary.main} 75%, ${palette.primary.dark} 100%)`}}>
          <Router>
            <Routes>
              <Route path="/" element={<Home />}></Route>
              <Route path="/player/:clipId" element={<Player />}></Route>
              <Route path="/upload" element={<Uploader />}></Route>
            </Routes>
          </Router>
        </Stack>
      </ThemeProvider>
    </div>
  );
}

export default App
