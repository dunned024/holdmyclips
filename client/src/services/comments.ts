import { ENDPOINT } from '../config';
import { Comment } from '../types';

export async function getComments(id: string): Promise<Comment[]> {
  const res = await fetch(`${ENDPOINT}/clips/${id}/${id}.comments.json`);
  const data = await res.json();

  return data['comments'];
}

export async function sendComment(props: {
  id: string;
  user: string;
  commentText: string;
}) {
  const res = await fetch(`/clipcomments`, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    method: 'POST',
    body: JSON.stringify({
      clipId: props.id,
      user: props.user,
      commentText: props.commentText
    })
  });
  console.log(res);
}
