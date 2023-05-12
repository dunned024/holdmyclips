import React, { useEffect, useState } from 'react';
import { Clip } from './types';
import './Player.css';
import { useParams } from 'react-router-dom';


export function Player(){
  let { clipId } = useParams();

  const [clip, setClip] = useState<Clip>();

  useEffect(() => {
    async function getClip(id: string) {
      try {
        const res = await fetch(`https://clips.dunned024.com/clips/${id}/${id}.json`);
        const data = await res.json();
        setClip(data);
      } catch (error) {
        console.log(error);
      }
    }
    
    if (!clip && clipId) {
      getClip(clipId);
    }
  }, [clipId, clip])

  return (
    <div className="App">
      <header className="App-header">
        <video controls muted autoPlay>
          <source src={`https://clips.dunned024.com/clips/${clipId}/${clipId}.mp4`} type="video/mp4" />
        </video>
        <h1>{ clip?.title }</h1>
      </header>
    </div>
  )
}
