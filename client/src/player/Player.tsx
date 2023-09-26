import React, { useEffect, useState } from 'react';
import { Clip, Comment, parseClip } from '../types';
import './Player.css';
import { useParams } from 'react-router-dom';
import { Grid, Stack } from '@mui/material';
import { VideoComponent } from './VideoController';
import { palette } from '../assets/themes/theme';
import { secondsToMMSS } from '../services/time';
import { ENDPOINT } from '../config';

export function Player() {
  const { clipId } = useParams();

  const [clip, setClip] = useState<Clip>();
  const [maxDuration, setMaxDuration] = useState(0);

  useEffect(() => {
    async function getClip(id: string) {
      // TODO: Get this by fetching the ClipDex
      //  Note: can't persist this info from when it's first fetched
      //  https://stackoverflow.com/a/53455443
      const res = await fetch(`${ENDPOINT}/clips/${id}/${id}.json`);
      const data = await res.json();

      // TODO: Need to call parseClip here if ClipDex only returns strings
      if (process.env.NODE_ENV === 'development') {
        setClip(data);
      } else {
        setClip(parseClip(data));
      }
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
              Comments are not yet supported...
              {/* TODO: Implement comments 
              {clip.comments.map((comment, index) => (
                <CommentCard comment={comment} id={index} key={index} />
              ))} */}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
}

function ClipDetails(props: { clip: Clip }) {
  return (
    <Stack
      id='details-container'
      sx={{ backgroundColor: palette.secondary.light }}
      direction='column'
      spacing={2}
    >
      <Grid id='stats-container' container textAlign='left' spacing={1}>
        <Grid id='uploader-text' item xs={12}>
          <span>
            Uploader: <b>{props.clip.uploader}</b>
          </span>
        </Grid>
        <Grid id='duration-text' item xs={6}>
          Duration: <b>{secondsToMMSS(props.clip.duration)}</b>
        </Grid>
        <Grid id='views-text' item textAlign='right' xs={6}>
          <b>{props.clip.views ?? '?'}</b> views
        </Grid>
      </Grid>
      {props.clip.description && (
        <Stack
          id='description-container'
          sx={{ backgroundColor: palette.secondary.main }}
        >
          {props.clip.description}
        </Stack>
      )}
    </Stack>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
