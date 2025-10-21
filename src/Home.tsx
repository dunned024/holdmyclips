<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import { Stack } from '@mui/material';
import { Clip, ClipDex } from './types';
import { getClips } from './services/clips';
import { getUsername } from './services/cognito';
import { getTimeSinceString, secondsToMMSS } from './services/time';
import { SORT_KEY_MAP, SortSelect } from './components/SortSelect';
=======
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClips } from "src/services/clips";
import { getUsername } from "src/services/cognito";
import { getTimeSinceString, secondsToMMSS } from "src/services/time";
import type { Clip, ClipDex } from "src/types";
import "src/Home.css";
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> 5c65b63 (use biome)

export function Home() {
  const [sortKey, setSortKey] = useState<keyof typeof SORT_KEY_MAP>('Newest');
  const sortFunction = SORT_KEY_MAP[sortKey];

=======
=======
import { Stack } from "@mui/material";
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
import { useAuth } from "react-oidc-context";
import { SORT_KEY_MAP, SortSelect } from "src/SortSelect";

export function Home() {
  const [sortKey, setSortKey] = useState<keyof typeof SORT_KEY_MAP>("Newest");
  const sortFunction = SORT_KEY_MAP[sortKey];

  const auth = useAuth();
>>>>>>> ef4f069 (start switching auth)
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
<<<<<<< HEAD
    <div id='home'>
      <Stack id='home-control-bar' direction='row'>
        <Stack className='control-container'>
          <SortSelect sortKey={sortKey} setSortKey={setSortKey} />
        </Stack>
        <Stack className='control-container'>
          {username ? (
            <a
              className='link'
              id='upload-link'
              href='/upload'
              rel='noreferrer'
            >
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
        </Stack>
        <Stack className='control-container' />
      </Stack>
      <div className='clip-rows'>
        {Object.entries(clipDex)
          .sort(sortFunction)
          .map(([clipId, clip]) => (
            <ClipCard key={clipId} clip={clip} />
          ))}
=======
    <div id="home">
      {auth.isAuthenticated && <div>hello hello hello logged in user </div>}
      <Stack id="home-control-bar" direction="row">
        <Stack className="control-container">
          <SortSelect sortKey={sortKey} setSortKey={setSortKey} />
        </Stack>
        <Stack className="control-container">
          {auth.isAuthenticated ? (
            <a
              className="link"
              id="upload-link"
              href="/upload"
              rel="noreferrer"
            >
              <button type="button">Upload clip</button>
            </a>
          ) : (
            <a
              className="link"
              id="signin-link"
              href="/signedin"
              rel="noreferrer"
            >
              <button type="button">Sign in</button>
            </a>
          )}
        </Stack>
        <Stack className="control-container" />
      </Stack>
      <div className="clip-rows">
<<<<<<< HEAD
        {Object.entries(clipDex).map(([clipId, clip]) => (
          <ClipCard key={clipId} clip={clip} />
        ))}
>>>>>>> 5c65b63 (use biome)
=======
        {Object.entries(clipDex)
          .sort(sortFunction)
          .map(([clipId, clip]) => (
            <ClipCard key={clipId} clip={clip} />
          ))}
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
      </div>
    </div>
  );
}

function ClipCard(props: { clip: Clip }) {
  const clip = props.clip;
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(
    `https://clips.dunned024.com/clips/${clip.id}/${clip.id}.png`,
  );

  const fallback = "https://clips.dunned024.com/default_thumbnail.png";
  const onError = () => setImgSrc(fallback);

  return (
    <div
      className="clip-card-container"
      key={clip.id}
      onMouseOver={() => setShowDetails(true)}
      onFocus={() => setShowDetails(true)}
      onMouseOut={() => setShowDetails(false)}
      onBlur={() => setShowDetails(false)}
    >
      <Link to={`/player/${clip.id}`} className="clip-link">
        <div className="clip-card">
          <img
            src={imgSrc ? imgSrc : fallback}
            onError={onError}
            alt={clip.title}
          />
<<<<<<< HEAD
<<<<<<< HEAD
          {showDetails && (
            <div className='time-since-upload'>
=======
          {showDetails && (
            <div className="time-since-upload">
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
              {getTimeSinceString(clip.uploadedOn)}
            </div>
          )}
          {showDetails && (
<<<<<<< HEAD
            <div className='clip-duration'>{secondsToMMSS(clip.duration)}</div>
          )}
=======
          <div className="clip-duration">{secondsToMMSS(clip.duration)}</div>
>>>>>>> 5c65b63 (use biome)
=======
            <div className="clip-duration">{secondsToMMSS(clip.duration)}</div>
          )}
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
          {showDetails && (
            <div className="clip-card-body">
              <div className="clip-title">{clip.title}</div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
