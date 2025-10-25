import { API_ENDPOINT } from "src/config";
import type { Comment } from "src/types";

export async function getComments(id: string): Promise<Comment[]> {
  const res = await fetch(`${API_ENDPOINT}/clips/${id}/${id}.comments.json`);
  const data = await res.json();

  return data.comments.map((c: Record<string, any>) => {
    c.commentId = Number.parseInt(c.commentId);
    c.postedAt = Number.parseInt(c.postedAt);
    return c;
  });
}

export async function sendComment(props: {
  clipId: string;
  author: string;
  commentText: string;
  postedAt: number;
}) {
  const res = await fetch(`${API_ENDPOINT}/clipcomments`, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    method: "POST",
    body: JSON.stringify({
      clipId: props.clipId,
      author: props.author,
      commentText: props.commentText,
      postedAt: props.postedAt,
    }),
  });
  console.log(res);
}

export async function deleteComment(props: {
  clipId: string;
  author: string;
  commentId: number;
}) {
  const res = await fetch(`${API_ENDPOINT}/clipcomments`, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    method: "DELETE",
    body: JSON.stringify({
      clipId: props.clipId,
      author: props.author,
      commentId: props.commentId,
    }),
  });
  console.log(res);
}
