import {
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AiFillGithub } from 'react-icons/ai';
import './App.css';
import { Home } from './Home';
import { Player } from './Player';

function App() {
  return (
    <div>
      <div className="app-header">
        <div className="site-name">
          hold my clips
        </div>
        <a className="github-link" href="https://github.com/dunned024" rel="noreferrer">
          <AiFillGithub />
          dunned024
        </a>
      </div>
      <div className="app">
        <Router>
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/player/:clipId" element={<Player />}></Route>
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App
