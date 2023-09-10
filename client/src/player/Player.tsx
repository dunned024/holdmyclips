import React, { useEffect, useState } from 'react';
import { Clip, Comment } from '../types';
import './Player.css';
import { useParams } from 'react-router-dom';
import { Grid, Stack } from '@mui/material';
import { VideoComponent } from './VideoController';
import { palette } from '../assets/themes/theme';
import { secondsToMMSS } from '../services/time';

export function Player() {
  const { clipId } = useParams();
  console.log(clipId);

  const [clip, setClip] = useState<Clip>();
  const [maxDuration, setMaxDuration] = useState(0);

  useEffect(() => {
    async function getClip(id: string) {
      let endpoint = '';
      if (process.env.NODE_ENV === 'development') {
        endpoint = 'http://localhost:3001';
      }

      // TODO: Get this by fetching the ClipDex
      //  Note: can't persist this info from when it's first fetched
      //  https://stackoverflow.com/a/53455443
      const res = await fetch(`${endpoint}/clips/${id}/${id}.json`);
      const data = await res.json();

      // TODO: Need to call parseClip here if ClipDex only returns strings
      setClip(data);
    }

    if (!clip && clipId) {
      getClip(clipId);
    }
  }, [clipId, clip]);

  if (!clipId || !clip) {
    return <span />;
  }

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
              {clip.comments.map((comment, index) => (
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
      direction='column'
    >
      <Grid id='stats-container' container textAlign='left'>
        <Grid id='uploader-text' item xs={12}>
          <span>Uploader: {props.clip.uploader}</span>
        </Grid>
        <Grid id='duration-text' item xs={6}>
          Duration: {secondsToMMSS(props.clip.duration)}
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
        <div className='posted-at'>{comment.postedAt}</div>
      </div>
      <div className='text'>{comment.text}</div>
    </Stack>
  );
}
