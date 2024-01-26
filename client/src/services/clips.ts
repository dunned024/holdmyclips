import { ENDPOINT } from '../config';
import { Clip, ClipDex } from '../types';

export async function getClips(): Promise<ClipDex> {
  const res = await fetch(`${ENDPOINT}/clips`);
  const data = await res.json();

  const clipList: ClipDex = {};
  data.clips.forEach((clip: Clip) => {
    clipList[clip.id] = clip;
  });

  return clipList;
}
