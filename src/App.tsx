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
import { SignedIn } from './Auth';

function App() {
  const username = getUsername();

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
              <AiFillGithub id='github-icon' />
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
            background: `linear-gradient(to bottom, ${palette.primary.main} 0%, ${palette.primary.main} 75%, ${palette.primary.dark} 100%)`
          }}
        >
          <Router>
            <Routes>
              <Route path='/' element={<Home />}></Route>
              <Route path='/player/:clipId' element={<Player />}></Route>
              <Route path='/upload' element={<Uploader />}></Route>
              <Route path='/signedin' element={<SignedIn />}></Route>
            </Routes>
          </Router>
        </Stack>
      </ThemeProvider>
    </div>
  );
}

export default App;
