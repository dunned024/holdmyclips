import { ENDPOINT } from '../config';
import { Clip, ClipDex } from '../types';

export async function getClips(): Promise<ClipDex> {
  const res = await fetch(`${ENDPOINT}/clips`);
  const data = await res.json();

  const clipList: ClipDex = {};
  data.clips.forEach((rawClip: Record<string, string>) => {
    const clip = parseClip(rawClip);
    clipList[clip.id] = clip;
  });

  return clipList;
}

export async function getClipMetadata(id: string): Promise<Clip> {
  // TODO: Get this by fetching the ClipDex (maybe? still true?)
  //  Note: can't persist this info from when it's first fetched
  //  https://stackoverflow.com/a/53455443
  const res = await fetch(`${ENDPOINT}/clips/${id}/${id}.json`);
  const data = await res.json();

  return parseClip(data);
}

export function parseClip(rawClip: Record<string, string>): Clip {
  return {
    id: rawClip.id,
    title: rawClip.title,
    uploader: rawClip.uploader,
    description: rawClip.description,
    duration: parseInt(rawClip.duration)
    // views: parseInt(rawClip.views),
    // comments: JSON.parse(rawClip.comments)
  };
}
