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
    console.log(username);
    if (username && clipId) {
      const timestamp = Date.now();
      // send comment via comments service
      CommentService.sendComment({
        clipId,
        author: username,
        commentText,
        postedAt: timestamp
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
        likes: 0
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
        commentId
      });

      setComments([
        ...comments.filter((comment) => comment.commentId !== commentId)
      ]);
    }
  }

  return (
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
  deleteComment: (commentId: number) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const comment = props.comment;
  const isOwnedByUser = props.username === comment.author;

  return (
    <Stack
      className='comment'
      key={comment.commentId}
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
                  onClick={() => props.deleteComment(comment.commentId)}
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
          {readableTimestamp(comment.postedAt)}
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
