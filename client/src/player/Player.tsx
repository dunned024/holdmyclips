import React, { useEffect, useState } from 'react';
import { Clip, Comment, parseClip } from '../types';
import './Player.css';
import { useParams } from 'react-router-dom';
import { Stack } from '@mui/material';
import ReactPlayer from 'react-player';
import { VideoController } from './VideoController';

export function Player() {
  const { clipId } = useParams();

  const [clip, setClip] = useState<Clip>();

  useEffect(() => {
    async function getClip(id: string) {
      try {
        const res = await fetch(
          `https://clips.dunned024.com/clips/${id}/${id}.json`
        );
        const data = await res.json();
        setClip(parseClip(data));
      } catch (error) {
        console.log(error);
      }
    }

    if (!clip && clipId) {
      getClip(clipId);
    }
  }, [clipId, clip]);

  return (
    <div className='player'>
      {/* <Stack id='video-preview-container'>
        <div id='player-box'>
          <ReactPlayer
            id='video'
            width='100%'
            height='100%'
            volume={volume}
            url={props.sourceUrl}
            ref={playerRef}
            playing={isPlaying}
            onDuration={loadClipDuration}
            progressInterval={100}
            onProgress={handleOnProgress}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
        <VideoController
          isPlaying={isPlaying}
          currentSeek={currentSeek}
          clipDuration={maxDuration * 1000}
          volume={volume}
          handleSeekChange={handleSeekChange}
          handlePlayPause={handlePlayPause}
          handleVolumeChange={handleVolumeChange}
        />
      </Stack> */}
      <div className='clip-container'>
        <div className='video-container'>
          <video autoPlay controls>
            <source
              src={`https://clips.dunned024.com/clips/${clipId}/${clipId}.mp4`}
              type='video/mp4'
            />
          </video>
        </div>
        <h1 className='title'>{clip?.title}</h1>
        <div className='details-container'>
          <div className='description'>{clip?.description}</div>
          <div className='stats-container'>
            <div className='uploader'>Uploader: {clip?.uploader}</div>
            {/* <div className="duration">Duration: { clip?.duration }</div> */}
            {/* <div className="views">Views: { clip?.views }</div> */}
          </div>
        </div>
      </div>
      <div className='comments-container'>
        Comments
        {clip?.comments.map((comment, index) => (
          <CommentCard comment={comment} id={index} key={index} />
        ))}
      </div>
    </div>
  );
}

function CommentCard(props: { comment: Comment; id: number }) {
  const comment = props.comment;
  return (
    <div className='comment' key={props.id}>
      <div className='comment-header'>
        <div className='author'>{comment.author}</div>
        <div className='posted-at'>{comment.postedAt.toISOString()}</div>
      </div>
      <div className='text'>{comment.text}</div>
    </div>
  );
}
