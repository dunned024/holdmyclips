import React, {
  Route,
  BrowserRouter as Router,
  Routes
} from 'react-router-dom';
import { AiFillGithub } from 'react-icons/ai';
import './App.css';
import { Home } from './Home';
import { Player } from './player/Player';
import { Uploader } from './upload/Uploader';
import { Stack, ThemeProvider } from '@mui/material';
import { THEME, palette } from './assets/themes/theme';
import { getUsername } from './services/cognito';
import { useEffect, useState } from 'react';
import { Clip, ClipDex } from './types';

function App() {
  const username = getUsername();
  const [clips, setClips] = useState<ClipDex>({});

  useEffect(() => {
    async function getClips() {
      let endpoint = '';
      if (process.env.NODE_ENV === 'development') {
        endpoint = 'http://localhost:3001';
      }

      const res = await fetch(`${endpoint}/clips`);
      const data = await res.json();

      const clipList: ClipDex = {};
      // I think S3 serves the data as a string, so we need JSON.parse somewhere in here
      // TODO: see if I can reconcile the two approaches
      data.clips.forEach((clip: Clip) => {
        clipList[clip.id] = clip;
      });

      setClips(clipList);
    }

    if (!clips.length) {
      getClips();
    }
  }, []);

  return (
    <div>
      <ThemeProvider theme={THEME}>
        <Stack
          className='app-header'
          direction='row'
          sx={{ backgroundColor: palette.primary.dark }}
        >
          <div className='header-container' id='header-container-ghlink'>
            <a
              className='link'
              id='github-link'
              href='https://github.com/dunned024'
              rel='noreferrer'
            >
              <AiFillGithub />
              dunned024
            </a>
          </div>
          <div className='header-container' id='header-container-homelink'>
            <a className='link' href='/' rel='noreferrer'>
              hold my clips
            </a>
          </div>
          <div className='header-container' id='header-container-user'>
            {username ? (
              <Stack id='username-container' direction='row'>
                Signed in as: {username} |&nbsp;
                <a className='link' href='/auth/sign-out' rel='noreferrer'>
                  Sign out
                </a>
              </Stack>
            ) : (
              <a className='link' href='/signedin' rel='noreferrer'>
                Sign in
              </a>
            )}
          </div>
          <span id='stretch'></span>
        </Stack>
        <Stack
          className='app'
          sx={{
            background: `linear-gradient(180deg, ${palette.primary.main} 0%, ${palette.primary.main} 75%, ${palette.primary.dark} 100%)`
          }}
        >
          <Router>
            <Routes>
              <Route
                path='/'
                element={<Home clips={clips} username={username} />}
              ></Route>
              <Route
                path='/player/:clipId'
                element={<Player clips={clips} />}
              ></Route>
              <Route path='/upload' element={<Uploader />}></Route>
            </Routes>
          </Router>
        </Stack>
      </ThemeProvider>
    </div>
  );
}

export default App;
