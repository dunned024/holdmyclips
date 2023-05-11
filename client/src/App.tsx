import {
    Route,
    BrowserRouter as Router,
    Routes,
} from "react-router-dom";
import './App.css';
import { Home } from './Home';
import { Player } from './Player';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/player/:clipId" element={<Player />}></Route>
      </Routes>
    </Router>
  );
}

export default App
