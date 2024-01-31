import React, { ChangeEvent, useEffect, useState } from 'react';
import { Clip, Comment } from '../types';
import './Player.css';
import { useParams } from 'react-router-dom';
import { Grid, Stack } from '@mui/material';
import { VideoComponent } from './VideoController';
import { palette } from '../assets/themes/theme';
import { readableTimestamp, secondsToMMSS } from '../services/time';
import { getClipMetadata } from '../services/clips';
import { FaPlusCircle } from 'react-icons/fa';
import { getUsername } from '../services/cognito';
import { getComments, sendComment } from '../services/comments';
import { FaGear } from 'react-icons/fa6';

export function Player() {
  const { clipId } = useParams();

  const [clip, setClip] = useState<Clip>();
  const [maxDuration, setMaxDuration] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);

  const username = getUsername();

  useEffect(() => {
    async function getClip(id: string) {
      const clipMetadata = await getClipMetadata(id);
      setClip(clipMetadata);

      const clipComments = await getComments(id);
      setComments(clipComments);
    }

    if (!clip && clipId) {
      getClip(clipId);
    }
  }, [clipId, clip]);

  if (!clipId || !clip) {
    return <span />;
  }

  async function postComment(commentText: string) {
    console.log(username);
    if (username && clipId) {
      // send comment via comments service
      sendComment({
        id: clipId,
        user: username,
        commentText
      });

      // update comments array
      const newComment = {
        author: username,
        commentText,
        postedAt: readableTimestamp(new Date()),
        likes: 0
      };

      setComments([...comments, newComment]);
    }
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
            <div>Comments</div>
            <Stack
              id='comments-box'
              sx={{
                backgroundColor: palette.secondary.main,
                border: `1px solid ${palette.primary.light}`,
                overflow: 'auto'
              }}
            >
              {comments.map((comment, index) => (
                <CommentCard
                  comment={comment}
                  id={index}
                  key={index}
                  username={username}
                />
              ))}
              <AddCommentContainer postComment={postComment} />
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

function AddCommentContainer(props: {
  postComment: (commentText: string) => void;
}) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentText, setcommentText] = useState<string | undefined>();
  const [canSubmit, setCanSubmit] = useState(false);

  const handleCommentInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value === '' || e.target.value === undefined) {
      setCanSubmit(false);
      return;
    }
    setcommentText(e.target.value);
    setCanSubmit(true);
  };

  const cancelCommentInput = () => {
    setIsAddingComment(false);
    setcommentText(undefined);
    setCanSubmit(false);
  };

  const verifyAndSendComment = () => {
    console.log(commentText);
    if (commentText !== undefined && commentText !== '' && canSubmit) {
      props.postComment(commentText);
      setIsAddingComment(false);
      setCanSubmit(false);
      setcommentText(undefined);
    }
  };

  return (
    <Stack id='add-comment-container'>
      {isAddingComment && (
        <Stack id='adding-comment-container'>
          <textarea
            id='comment-box'
            onChange={handleCommentInputChange}
            autoFocus={true}
          />
          <Stack id='adding-comment-control'>
            <button onClick={cancelCommentInput}>Cancel</button>
            <button onClick={verifyAndSendComment} disabled={!canSubmit}>
              Submit
            </button>
          </Stack>
        </Stack>
      )}
      {!isAddingComment && (
        <button
          id='add-comment-button'
          onClick={() => setIsAddingComment(true)}
        >
          <FaPlusCircle id='add-comment-plus' />
        </button>
      )}
    </Stack>
  );
}

function CommentCard(props: {
  comment: Comment;
  id: number;
  username?: string;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const comment = props.comment;
  const isOwnedByUser = props.username === comment.author;

  return (
    <Stack
      className='comment'
      key={props.id}
      sx={{
        backgroundColor: palette.secondary.dark,
        borderBottom: `2px solid ${palette.primary.light}`
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Grid className='header' container textAlign='left' spacing={0}>
        <Grid id='author' item xs={6}>
          {comment.author}
        </Grid>
        {isHovering && isOwnedByUser && (
          <Grid id='author' item xs={6} textAlign='right'>
            <div className='options'>
              <button className='options-button'>
                <FaGear />
              </button>
            </div>
          </Grid>
        )}

        <Grid
          id='posted-at'
          item
          xs={12}
          sx={{ marginLeft: '10px', fontWeight: 200 }}
        >
          {comment.postedAt}
        </Grid>
      </Grid>
      <hr
        className='separator'
        style={{
          borderBottom: `1px solid ${palette.primary.light}`
        }}
      />
      <div className='text'>{comment.commentText}</div>
    </Stack>
  );
}
