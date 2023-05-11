import React, { useEffect, useState } from 'react';
import './App.css';
import { Link } from 'react-router-dom';
import { Clip } from './types';

export function Home() {
  const [clips, setClips] = useState<Clip[]>([]);

  useEffect(() => {
    async function getClips() {
      const response = await fetch('https://clips.dunned024.com/clips/clips.json');
      const data = await response.json();
      setClips(data);
    }

    if (!clips.length) {
      getClips();
    }
  }, [clips]);

  return (
    <div className="App App-header">
      Clips!
      <div className="container">
        <div className="row">
          {clips.map((clip) => {
            return (
              <div className="col-md-4" key={clip.id}>
                <Link to={`/player/${clip.id}`}>
                  <div className="card border-0">
                    <img src={`https://clips.dunned024.com/clips/${clip.id}/${clip.id}.png`} alt={clip.title} />
                    <div className="card-body">
                      <p>{clip.title}</p>
                      <p>{clip.duration}</p>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
