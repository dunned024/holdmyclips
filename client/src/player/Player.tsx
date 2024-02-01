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
import * as CommentService from '../services/comments';
import { FaGear } from 'react-icons/fa6';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdOutlineClose } from 'react-icons/md';

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

      const clipComments = await CommentService.getComments(id);
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
      CommentService.sendComment({
        id: clipId,
        user: username,
        commentText
      });

      let newId = 1;
      if (comments.length > 0) {
        newId = Math.max(...comments.map((comment) => comment.id)) + 1;
      }
      // update comments array
      const newComment = {
        id: newId,
        author: username,
        commentText,
        postedAt: readableTimestamp(new Date()),
        likes: 0
      };

      setComments([...comments, newComment]);
    }
  }

  async function deleteComment(commentId: number) {
    console.log(username);
    if (username && clipId) {
      // delete comment via comments service
      CommentService.deleteComment({
        id: clipId,
        user: username,
        commentId
      });

      setComments([...comments.filter((comment) => comment.id == commentId)]);
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
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  username={username}
                  deleteComment={deleteComment}
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
  username?: string;
  deleteComment: (id: number) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const comment = props.comment;
  const isOwnedByUser = props.username === comment.author;

  return (
    <Stack
      className='comment'
      key={comment.id}
      sx={{
        backgroundColor: palette.secondary.dark,
        borderBottom: `2px solid ${palette.primary.light}`
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowOptions(false);
      }}
    >
      <Grid className='header' container textAlign='left' spacing={0}>
        <Grid className='author' item xs={6}>
          {comment.author}
        </Grid>
        {isHovering && isOwnedByUser && (
          <Grid className='options' item xs={6} justifyContent='right'>
            {!showOptions && (
              <button className='gear' onClick={() => setShowOptions(true)}>
                <FaGear />
              </button>
            )}
            {showOptions && (
              <Stack className='options-buttons'>
                <button
                  className='delete'
                  onClick={() => props.deleteComment(comment.id)}
                >
                  <FaRegTrashAlt />
                </button>
                <button className='close' onClick={() => setShowOptions(false)}>
                  <MdOutlineClose />
                </button>
              </Stack>
            )}
          </Grid>
        )}

        <Grid className='posted-at' item xs={12}>
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
