import React, { useEffect, useState } from 'react';
import { VideoData } from './types';
import { useParams } from 'react-router-dom';


export function Player(){
  let { videoId } = useParams();

  const [videoData, setVideoData] = useState<VideoData>();

  useEffect(() => {
    async function getVideoData(id: string) {
      try {
        const res = await fetch(`http://localhost:4000/video/${id}/data`);
        const data = await res.json();
        setVideoData(data);
      } catch (error) {
        console.log(error);
      }
    }

    if (!videoData && videoId) {
      getVideoData(videoId);
    }
  }, [videoId, videoData])

  return (
    <div className="App">
      <header className="App-header">
        <video controls muted autoPlay>
          <source src={`http://localhost:4000/video/${videoId}`} type="video/mp4" />
        </video>
        <h1>{ videoData?.name }</h1>
      </header>
    </div>
  )
}
