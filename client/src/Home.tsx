import React, { useEffect, useState } from 'react';
import { AiFillGithub } from 'react-icons/ai';
import './Home.css';
import { Link } from 'react-router-dom';
import { Clip } from './types';

export function Home() {
  const [clips, setClips] = useState<Clip[]>([]);

  useEffect(() => {
    async function getClips() {
      const res = await fetch(`https://clips.dunned024.com/clips/clips.json`);
      const data = await res.json();

      const promises = data.map(async (id: string) => {
        const res = await fetch(`https://clips.dunned024.com/clips/${id}/${id}.json`);
        return await res.json();
      })

      Promise.all(promises).then((clipList) =>
        setClips(clipList)
      )
    }

    if (!clips.length) {
      getClips();
    }
  }, [clips]);

  return (
    <div className="app">
      <div className="app-header">
        <a className="github-link" href="https://github.com/dunned024" rel="noreferrer">
          <AiFillGithub />
          dunned024
        </a>
        <div>
          hold my clips
        </div>
      </div>
      <div className="container">
        <div className="row">
          {clips.map((clip) => <ClipCard clip={clip} />)}
        </div>
      </div>
    </div>
  );
}


function ClipCard(props: { clip: Clip }) {
  const clip = props.clip;
  const [showDetails, setShowDetails] = useState<boolean>(false);

  return (
    <div
      className="clip-card-container"
      key={clip.id}
      onMouseOver={() => setShowDetails(true)}
      onMouseOut={() => setShowDetails(false)}
    >
      <Link to={`/player/${clip.id}`} className="clip-link">
        <div className="clip-card">
          <img
            src={`https://clips.dunned024.com/clips/${clip.id}/${clip.id}.png`}
            alt={clip.title}
          />
          <div className="clip-duration">{clip.duration}</div>
          {showDetails && (
            <div className="clip-card-body">
              <div className="clip-title">{clip.title}</div>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
