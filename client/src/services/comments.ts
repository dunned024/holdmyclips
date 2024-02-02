import { ENDPOINT } from '../config';
import { Comment } from '../types';

export async function getComments(id: string): Promise<Comment[]> {
  const res = await fetch(`${ENDPOINT}/clips/${id}/${id}.comments.json`);
  const data = await res.json();

  return data['comments'].map((c: Record<string, any>) => {
    c.postedAt = parseInt(c.postedAt);
    return c;
  });
}

export async function sendComment(props: {
  clipId: string;
  author: string;
  commentText: string;
  postedAt: number;
}) {
  const res = await fetch(`/clipcomments`, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    method: 'POST',
    body: JSON.stringify({
      clipId: props.clipId,
      author: props.author,
      commentText: props.commentText,
      postedAt: props.postedAt
    })
  });
  console.log(res);
}

export async function deleteComment(props: {
  clipId: string;
  author: string;
  commentId: number;
}) {
  const res = await fetch(`/clipcomments`, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    method: 'DELETE',
    body: JSON.stringify({
      clipId: props.clipId,
      author: props.author,
      commentId: props.commentId
    })
  });
  console.log(res);
}
