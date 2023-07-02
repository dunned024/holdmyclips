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

function App() {
  return (
    <div>
      <div className="app-header">
        <div className="site-name">
          <a className="link" href="/" rel="noreferrer">
            hold my clips
          </a>
        </div>
        <a className="link" id="github-link" href="https://github.com/dunned024" rel="noreferrer">
          <AiFillGithub />
          dunned024
        </a>
      </div>
      <div className="app">
        <Router>
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/player/:clipId" element={<Player />}></Route>
            <Route path="/upload" element={<Uploader />}></Route>
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App
