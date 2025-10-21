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
  // Note: can't persist this info from when it's first fetched on homepage
  //  https://stackoverflow.com/a/53455443
  // Need a state store, like https://redux.js.org/api/store
  //  https://stackoverflow.com/q/31168014
  const res = await fetch(`${ENDPOINT}/clip/${id}`);
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
  };
}
