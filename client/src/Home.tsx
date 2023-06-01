import React, { useEffect, useState } from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { Clip } from './types';

export function Home() {
  const [clips, setClips] = useState<Clip[]>([]);

  useEffect(() => {
    async function getClips() {
      const res = await fetch('/clips');
      const data = await res.json();
      setClips(JSON.parse(data).clips)

      // const promises = data.Items.map(async (id: string) => {
      //   const res = await fetch(`https://clips.dunned024.com/clips/${id}/${id}.json`);
      //   return await res.json();
      // })

    }

    if (!clips.length) {
      getClips();
    }
  }, [clips]);

  return (
    <div className="home">
      <div className="upload-button-row">
        <Link to={`/upload`} className="upload-link">
          <button>Upload clip</button>
        </Link>
      </div>
      <div className="clip-rows">
        {clips.map((clip) => <ClipCard clip={clip} />)}
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
