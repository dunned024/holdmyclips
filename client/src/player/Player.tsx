import React, { useEffect, useState } from 'react';
import { Clip, Comment, parseClip } from '../types';
import './Player.css';
import { useParams } from 'react-router-dom';
import { Stack } from '@mui/material';
import { VideoComponent } from './VideoController';

const fakeComments: Comment[] = [
  {
    author: 'dennis',
    text: 'this is a comment',
    postedAt: new Date()
  },
  {
    author: 'dennis 2',
    text: 'this is a comment again',
    postedAt: new Date()
  }
];

export function Player() {
  const { clipId } = useParams();

  const [clip, setClip] = useState<Clip>();
  const [maxDuration, setMaxDuration] = useState(0);

  const loadClipDuration = function (d: number) {
    setMaxDuration(d);
  };

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
    <div id='player-container'>
      <Stack id='player' direction='row'>
        <Stack id='clip-container'>
          <VideoComponent
            sourceUrl={`https://clips.dunned024.com/clips/${clipId}/${clipId}.mp4`}
            maxDuration={maxDuration}
            loadClipDuration={loadClipDuration}
          />
          <h1 id='title'>{clip?.title}</h1>
        </Stack>
        <Stack id='sidebar'>
          <ClipDetails clip={clip} />
          <Stack id='comments-container'>
            Comments
            <Stack id='comments-box'>
              {fakeComments.map((comment, index) => (
                <CommentCard comment={comment} id={index} key={index} />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
}

function ClipDetails(props: { clip?: Clip }) {
  return (
    <div id='details-container'>
      <div id='description'>{props.clip?.description}</div>
      <div id='stats-container'>
        <div id='uploader'>Uploader: {props.clip?.uploader}</div>
        {/* <div className="duration">Duration: { clip?.duration }</div> */}
        {/* <div className="views">Views: { clip?.views }</div> */}
      </div>
    </div>
  );
}

function CommentCard(props: { comment: Comment; id: number }) {
  const comment = props.comment;
  return (
    <div className='comment' key={props.id}>
      <div className='header'>
        <div className='author'>{comment.author}</div>
        <div className='posted-at'>{comment.postedAt.toISOString()}</div>
      </div>
      <div className='text'>{comment.text}</div>
    </div>
  );
}
