import React, { useEffect, useState } from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { Clip, ClipDex } from './types';
import { getClips } from './services/clips';
import { getUsername } from './services/cognito';
import { secondsToMMSS } from './services/time';

export function Home() {
  const [clipDex, setClipDex] = useState<ClipDex>({});
  const username = getUsername();

  useEffect(() => {
    async function populateClipDex() {
      const clipList = await getClips();
      setClipDex(clipList);
    }

    if (!clipDex.length) {
      populateClipDex();
    }
  }, []);

  return (
    <div id='home'>
      <div className='upload-button-row'>
        {username ? (
          <a className='link' id='upload-link' href='/upload' rel='noreferrer'>
            <button>Upload clip</button>
          </a>
        ) : (
          <a
            className='link'
            id='signin-link'
            href='/signedin'
            rel='noreferrer'
          >
            <button>Sign in</button>
          </a>
        )}
      </div>
      <div className='clip-rows'>
        {Object.entries(clipDex).map(([clipId, clip]) => (
          <ClipCard key={clipId} clip={clip} />
        ))}
      </div>
    </div>
  );
}

function ClipCard(props: { clip: Clip }) {
  const clip = props.clip;
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(
    `https://clips.dunned024.com/clips/${clip.id}/${clip.id}.png`
  );

  const fallback = 'https://clips.dunned024.com/default_thumbnail.png';
  const onError = () => setImgSrc(fallback);

  return (
    <div
      className='clip-card-container'
      key={clip.id}
      onMouseOver={() => setShowDetails(true)}
      onMouseOut={() => setShowDetails(false)}
    >
      <Link to={`/player/${clip.id}`} className='clip-link'>
        <div className='clip-card'>
          <img
            src={imgSrc ? imgSrc : fallback}
            onError={onError}
            alt={clip.title}
          />
          <div className='clip-duration'>{secondsToMMSS(clip.duration)}</div>
          {showDetails && (
            <div className='clip-card-body'>
              <div className='clip-title'>{clip.title}</div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
