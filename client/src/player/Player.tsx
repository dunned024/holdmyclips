import React, { useState } from 'react';
import { Clip, ClipDex, Comment } from '../types';
import './Player.css';
import { useParams } from 'react-router-dom';
import { Grid, Stack } from '@mui/material';
import { VideoComponent } from './VideoController';
import { palette } from '../assets/themes/theme';

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

export function Player(props: { clips: ClipDex }) {
  const { clipId } = useParams();
  if (clipId === undefined) {
    return <span />;
  }

  const clip: Clip = props.clips[clipId];
  const [maxDuration, setMaxDuration] = useState(0);

  return (
    <div id='player-container'>
      <Stack id='player' direction='row'>
        <Stack id='clip-container'>
          <VideoComponent
            sourceUrl={`https://clips.dunned024.com/clips/${clipId}/${clipId}.mp4`}
            maxDuration={maxDuration}
            loadClipDuration={setMaxDuration}
          />
          <h1 id='title'>{clip?.title}</h1>
        </Stack>
        <Stack id='sidebar'>
          <ClipDetails clip={clip} />
          <Stack
            id='comments-container'
            sx={{ backgroundColor: palette.secondary.light }}
          >
            Comments
            <Stack
              id='comments-box'
              sx={{
                backgroundColor: palette.secondary.main,
                border: `1px solid ${palette.primary.light}`
              }}
            >
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
  if (!props.clip) {
    console.log('no clip??');
    return <span />;
  }

  return (
    <Stack
      id='details-container'
      sx={{ backgroundColor: palette.secondary.light }}
    >
      <Grid id='stats-container' container textAlign='left'>
        <Grid id='uploader-text' item xs={12}>
          <span>Uploader: {props.clip.uploader}</span>
        </Grid>
        <Grid id='duration-text' item xs={6}>
          Duration: {props.clip.duration}
        </Grid>
        <Grid id='views-text' item xs={6}>
          Views: {props.clip.views}
        </Grid>
      </Grid>
      <Stack>{props.clip.description}</Stack>
    </Stack>
  );
}

function CommentCard(props: { comment: Comment; id: number }) {
  const comment = props.comment;
  return (
    <Stack
      className='comment'
      key={props.id}
      sx={{
        backgroundColor: palette.secondary.dark,
        borderBottom: `1px solid ${palette.primary.light}`
      }}
    >
      <div className='header'>
        <div className='author'>{comment.author}</div>
        <div className='posted-at'>{comment.postedAt.toISOString()}</div>
      </div>
      <div className='text'>{comment.text}</div>
    </Stack>
  );
}
