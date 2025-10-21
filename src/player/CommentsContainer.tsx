<<<<<<< HEAD
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Comment } from '../types';
import './CommentsContainer.css';
import { Grid, Stack } from '@mui/material';
import { palette } from '../assets/themes/theme';
import { readableTimestamp } from '../services/time';
import { FaPlusCircle } from 'react-icons/fa';
import * as CommentService from '../services/comments';
import { FaGear } from 'react-icons/fa6';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdOutlineClose } from 'react-icons/md';
=======
import { type ChangeEvent, useEffect, useState } from "react";
import type { Comment } from "../types";
import "./CommentsContainer.css";
import { Grid, Stack } from "@mui/material";
import { FaPlusCircle } from "react-icons/fa";
import { FaRegTrashAlt } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { MdOutlineClose } from "react-icons/md";
import { palette } from "../assets/themes/theme";
import * as CommentService from "../services/comments";
import { readableTimestamp } from "../services/time";
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))

interface CommentsContainerProps {
  clipId: string;
  username?: string;
}

export function CommentsContainer(props: CommentsContainerProps) {
  const { clipId, username } = props;

  const [comments, setComments] = useState<Comment[]>([]);
  useEffect(() => {
    async function getComments(id: string) {
      const clipComments = await CommentService.getComments(id);
      setComments(clipComments);
    }

    getComments(clipId);
  }, [clipId]);

  async function postComment(commentText: string) {
    if (username && clipId) {
      const timestamp = Date.now();
      // send comment via comments service
      CommentService.sendComment({
        clipId,
        author: username,
        commentText,
<<<<<<< HEAD
        postedAt: timestamp
=======
        postedAt: timestamp,
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
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
<<<<<<< HEAD
        likes: 0
=======
        likes: 0,
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
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
<<<<<<< HEAD
        commentId
      });

      setComments([
        ...comments.filter((comment) => comment.commentId !== commentId)
=======
        commentId,
      });

      setComments([
        ...comments.filter((comment) => comment.commentId !== commentId),
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
      ]);
    }
  }

  return (
    <Stack
<<<<<<< HEAD
      id='comments-container'
=======
      id="comments-container"
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
      sx={{ backgroundColor: palette.secondary.light }}
    >
      <div>Comments</div>
      <Stack
<<<<<<< HEAD
        id='comments-box'
        sx={{
          backgroundColor: palette.secondary.main,
          border: `1px solid ${palette.primary.light}`,
          overflow: 'auto'
=======
        id="comments-box"
        sx={{
          backgroundColor: palette.secondary.main,
          border: `1px solid ${palette.primary.light}`,
          overflow: "auto",
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
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
  );
}

function AddCommentContainer(props: {
  postComment: (commentText: string) => void;
}) {
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentText, setcommentText] = useState<string | undefined>();
  const [canSubmit, setCanSubmit] = useState(false);

  const handleCommentInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
<<<<<<< HEAD
    if (e.target.value === '' || e.target.value === undefined) {
=======
    if (e.target.value === "" || e.target.value === undefined) {
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
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
<<<<<<< HEAD
    if (commentText !== undefined && commentText !== '' && canSubmit) {
=======
    if (commentText !== undefined && commentText !== "" && canSubmit) {
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
      props.postComment(commentText);
      setIsAddingComment(false);
      setCanSubmit(false);
      setcommentText(undefined);
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <Stack id="add-comment-container">
      {isAddingComment && (
        <Stack id="adding-comment-container">
          <textarea
            id="comment-box"
            onChange={handleCommentInputChange}
            autoFocus={true}
          />
          <Stack id="adding-comment-control">
            <button type="button" onClick={cancelCommentInput}>
              Cancel
            </button>
            <button
              type="button"
              onClick={verifyAndSendComment}
              disabled={!canSubmit}
            >
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
              Submit
            </button>
          </Stack>
        </Stack>
      )}
      {!isAddingComment && (
        <button
<<<<<<< HEAD
          id='add-comment-button'
          onClick={() => setIsAddingComment(true)}
        >
          <FaPlusCircle id='add-comment-plus' />
=======
          id="add-comment-button"
          onClick={() => setIsAddingComment(true)}
          type="button"
        >
          <FaPlusCircle id="add-comment-plus" />
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
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
<<<<<<< HEAD
      className='comment'
      key={comment.commentId}
      sx={{
        backgroundColor: palette.secondary.dark,
        borderBottom: `2px solid ${palette.primary.light}`
=======
      className="comment"
      key={comment.commentId}
      sx={{
        backgroundColor: palette.secondary.dark,
        borderBottom: `2px solid ${palette.primary.light}`,
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowOptions(false);
      }}
    >
<<<<<<< HEAD
      <Grid className='header' container textAlign='left' spacing={0}>
        <Grid className='author' item xs={6}>
          {comment.author}
        </Grid>
        {isHovering && isOwnedByUser && (
          <Grid className='options' item xs={6} justifyContent='right'>
            {!showOptions && (
              <button className='gear' onClick={() => setShowOptions(true)}>
=======
      <Grid className="header" container textAlign="left" spacing={0}>
        <Grid className="author" item xs={6}>
          {comment.author}
        </Grid>
        {isHovering && isOwnedByUser && (
          <Grid className="options" item xs={6} justifyContent="right">
            {!showOptions && (
              <button
                type="button"
                className="gear"
                onClick={() => setShowOptions(true)}
              >
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
                <FaGear />
              </button>
            )}
            {showOptions && (
<<<<<<< HEAD
              <Stack className='options-buttons'>
                <button
                  className='delete'
=======
              <Stack className="options-buttons">
                <button
                  type="button"
                  className="delete"
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
                  onClick={() => props.deleteComment(comment.commentId)}
                >
                  <FaRegTrashAlt />
                </button>
<<<<<<< HEAD
                <button className='close' onClick={() => setShowOptions(false)}>
=======
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowOptions(false)}
                >
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
                  <MdOutlineClose />
                </button>
              </Stack>
            )}
          </Grid>
        )}

<<<<<<< HEAD
        <Grid className='posted-at' item xs={12}>
=======
        <Grid className="posted-at" item xs={12}>
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
          {readableTimestamp(comment.postedAt)}
        </Grid>
      </Grid>
      <hr
<<<<<<< HEAD
        className='separator'
        style={{
          borderBottom: `1px solid ${palette.primary.light}`
        }}
      />
      <div className='text'>{comment.commentText}</div>
=======
        className="separator"
        style={{
          borderBottom: `1px solid ${palette.primary.light}`,
        }}
      />
      <div className="text">{comment.commentText}</div>
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
    </Stack>
  );
}
