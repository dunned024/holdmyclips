import React, { useEffect, useState } from 'react';
import './App.css';
import { Link } from 'react-router-dom';
import { VideoData } from './types';

export function Home() {
  const [videos, setVideos] = useState<VideoData[]>([]);

  useEffect(() => {
    async function getVideos() {
      const response = await fetch('http://localhost:4000/videos');
      const data = await response.json();
      setVideos(data);
    }

    if (!videos.length) {
      getVideos();
    }
  }, [videos]);

  return (
    <div className="App App-header">
      Clips!
      <div className="container">
        <div className="row">
          {videos.map((video) => {
            return (
              <div className="col-md-4" key={video.id}>
                <Link to={`/player/${video.id}`}>
                  <div className="card border-0">
                    <img src={`http://localhost:4000${video.poster}`} alt={video.name} />
                    <div className="card-body">
                      <p>{video.name}</p>
                      <p>{video.duration}</p>
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
