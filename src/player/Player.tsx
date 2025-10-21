<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Clip } from '../types';
import './Player.css';
import { useParams } from 'react-router-dom';
import { Grid, Stack } from '@mui/material';
import { VideoComponent } from './VideoController';
import { palette } from '../assets/themes/theme';
import { readableTimestamp, secondsToMMSS } from '../services/time';
import { getClipMetadata } from '../services/clips';
import { getUsername } from '../services/cognito';
import { CommentsContainer } from './CommentsContainer';
=======
import { Grid, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { palette } from "src/assets/themes/theme";
import { VideoComponent } from "src/player/VideoController";
import { getClipMetadata } from "src/services/clips";
import { getUsername } from "src/services/cognito";
import { readableTimestamp, secondsToMMSS } from "src/services/time";
import type { Clip } from "src/types";
import "src/player/Player.css";
<<<<<<< HEAD
>>>>>>> 5c65b63 (use biome)
=======
import { CommentsContainer } from "src/player/CommentsContainer";
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))

export function Player() {
  const { clipId } = useParams();

  const [clip, setClip] = useState<Clip>();
  const [maxDuration, setMaxDuration] = useState(0);

  const username = getUsername();

  useEffect(() => {
    async function getClip(id: string) {
      const clipMetadata = await getClipMetadata(id);
      setClip(clipMetadata);
    }

    if (!clip && clipId) {
      getClip(clipId);
    }
  }, [clipId, clip]);

  if (!clipId || !clip) {
    return <span />;
  }

<<<<<<< HEAD
<<<<<<< HEAD
  return (
    <Stack id='player'>
      <Stack id='clip-container'>
        <VideoComponent
          sourceUrl={`https://clips.dunned024.com/clips/${clipId}/${clipId}.mp4`}
          maxDuration={maxDuration}
          loadClipDuration={setMaxDuration}
        />
        <h1 id='title'>{clip?.title}</h1>
=======
  async function postComment(commentText: string) {
    console.log(username);
    if (username && clipId) {
      const timestamp = Date.now();
      // send comment via comments service
      CommentService.sendComment({
        clipId,
        author: username,
        commentText,
        postedAt: timestamp,
      });

      let newId = 1;
      if (comments.length > 0) {
        newId = Math.max(...comments.map((comment) => comment.commentId)) + 1;
      }
      // update comments array
      const newComment = {
        commentId: newId,
        author: username,
        commentText,
        postedAt: timestamp,
        likes: 0,
      };

      setComments([...comments, newComment]);
    }
  }

  async function deleteComment(commentId: number) {
    if (username && clipId) {
      // delete comment via comments service
      CommentService.deleteComment({
        clipId,
        author: username,
        commentId,
      });

      setComments([
        ...comments.filter((comment) => comment.commentId !== commentId),
      ]);
    }
  }

  return (
    <div id="player-container">
      <Stack id="player" direction="row">
        <Stack id="clip-container">
          <VideoComponent
            sourceUrl={`https://clips.dunned024.com/clips/${clipId}/${clipId}.mp4`}
            maxDuration={maxDuration}
            loadClipDuration={setMaxDuration}
          />
          <h1 id="title">{clip?.title}</h1>
        </Stack>
        <Stack id="sidebar">
          <ClipDetails clip={clip} />
          <Stack
            id="comments-container"
            sx={{ backgroundColor: palette.secondary.light }}
          >
            <div>Comments</div>
            <Stack
              id="comments-box"
              sx={{
                backgroundColor: palette.secondary.main,
                border: `1px solid ${palette.primary.light}`,
                overflow: "auto",
              }}
            >
              {comments.map((comment) => (
                <CommentCard
                  key={comment.commentId}
                  comment={comment}
                  username={username}
                  deleteComment={deleteComment}
                />
              ))}
              {username !== undefined && (
                <AddCommentContainer postComment={postComment} />
              )}
            </Stack>
          </Stack>
        </Stack>
>>>>>>> 5c65b63 (use biome)
      </Stack>
      <Stack id='sidebar'>
=======
  return (
    <Stack id="player">
      <Stack id="clip-container">
        <VideoComponent
          sourceUrl={`https://clips.dunned024.com/clips/${clipId}/${clipId}.mp4`}
          maxDuration={maxDuration}
          loadClipDuration={setMaxDuration}
        />
        <h1 id="title">{clip?.title}</h1>
      </Stack>
      <Stack id="sidebar">
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
        <ClipDetails clip={clip} />
        <CommentsContainer clipId={clipId} username={username} />
      </Stack>
    </Stack>
  );
}

function ClipDetails(props: { clip: Clip }) {
  return (
    <Stack
      id="details-container"
      sx={{ backgroundColor: palette.secondary.light }}
      direction="column"
      spacing={2}
    >
      <Grid id="stats-container" container textAlign="left" spacing={1}>
        <Grid id="uploader-text" item xs={12}>
          <span>
            Uploader: <b>{props.clip.uploader}</b>
          </span>
        </Grid>
<<<<<<< HEAD
<<<<<<< HEAD
        <Grid id='uploaded-at-text' item xs={12}>
=======
        <Grid id="uploaded-at-text" item xs={12}>
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
          <span>
            Uploaded on: <b>{readableTimestamp(props.clip.uploadedOn)}</b>
          </span>
        </Grid>
<<<<<<< HEAD
        <Grid id='duration-text' item xs={6}>
=======
=======
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
        <Grid id="duration-text" item xs={6}>
>>>>>>> 5c65b63 (use biome)
          Duration: <b>{secondsToMMSS(props.clip.duration)}</b>
        </Grid>
        <Grid id="views-text" item textAlign="right" xs={6}>
          <b>{props.clip.views ?? "?"}</b> views
        </Grid>
      </Grid>
      {props.clip.description && (
        <Stack
          id="description-container"
          sx={{ backgroundColor: palette.secondary.main }}
        >
          {props.clip.description}
        </Stack>
      )}
    </Stack>
  );
}
<<<<<<< HEAD
<<<<<<< HEAD
=======

function AddCommentContainer(props: {
  postComment: (commentText: string) => void;
}) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentText, setcommentText] = useState<string | undefined>();
  const [canSubmit, setCanSubmit] = useState(false);

  const handleCommentInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value === "" || e.target.value === undefined) {
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
    if (commentText !== undefined && commentText !== "" && canSubmit) {
      props.postComment(commentText);
      setIsAddingComment(false);
      setCanSubmit(false);
      setcommentText(undefined);
    }
  };

  return (
    <Stack id="add-comment-container">
      {isAddingComment && (
        <Stack id="adding-comment-container">
          <textarea
            id="comment-box"
            onChange={handleCommentInputChange}
            autoFocus={true}
          />
          <Stack id="adding-comment-control">
            <button onClick={cancelCommentInput} type="button">
              Cancel
            </button>
            <button
              onClick={verifyAndSendComment}
              disabled={!canSubmit}
              type="button"
            >
              Submit
            </button>
          </Stack>
        </Stack>
      )}
      {!isAddingComment && (
        <button
          id="add-comment-button"
          onClick={() => setIsAddingComment(true)}
          type="button"
        >
          <FaPlusCircle id="add-comment-plus" />
        </button>
      )}
    </Stack>
  );
}

function CommentCard(props: {
  comment: Comment;
  username?: string;
  deleteComment: (commentId: number) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const comment = props.comment;
  const isOwnedByUser = props.username === comment.author;

  return (
    <Stack
      className="comment"
      key={comment.commentId}
      sx={{
        backgroundColor: palette.secondary.dark,
        borderBottom: `2px solid ${palette.primary.light}`,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowOptions(false);
      }}
    >
      <Grid className="header" container textAlign="left" spacing={0}>
        <Grid className="author" item xs={6}>
          {comment.author}
        </Grid>
        {isHovering && isOwnedByUser && (
          <Grid className="options" item xs={6} justifyContent="right">
            {!showOptions && (
              <button
                className="gear"
                onClick={() => setShowOptions(true)}
                type="button"
              >
                <FaGear />
              </button>
            )}
            {showOptions && (
              <Stack className="options-buttons">
                <button
                  className="delete"
                  onClick={() => props.deleteComment(comment.commentId)}
                  type="button"
                >
                  <FaRegTrashAlt />
                </button>
                <button
                  className="close"
                  onClick={() => setShowOptions(false)}
                  type="button"
                >
                  <MdOutlineClose />
                </button>
              </Stack>
            )}
          </Grid>
        )}

        <Grid className="posted-at" item xs={12}>
          {readableTimestamp(comment.postedAt)}
        </Grid>
      </Grid>
      <hr
        className="separator"
        style={{
          borderBottom: `1px solid ${palette.primary.light}`,
        }}
      />
      <div className="text">{comment.commentText}</div>
    </Stack>
  );
}
>>>>>>> 5c65b63 (use biome)
=======
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
