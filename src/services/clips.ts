import { ENDPOINT } from "src/config";
import type { Clip, ClipDex } from "src/types";

export async function getClips(): Promise<ClipDex> {
  const res = await fetch(`${ENDPOINT}/clips`);
  const data = await res.json();

  const clipList: ClipDex = {};
  for (const rawClip of data.clips) {
    const clip = parseClip(rawClip);
    clipList[clip.id] = clip;
  }

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
<<<<<<< HEAD
    duration: parseInt(rawClip.duration),
    uploadedOn: parseInt(rawClip.uploadedOn)
=======
    duration: Number.parseInt(rawClip.duration),
<<<<<<< HEAD
>>>>>>> 5c65b63 (use biome)
=======
    uploadedOn: Number.parseInt(rawClip.uploadedOn),
>>>>>>> 9a64e6b (I made a terrible mistake (handle merge conflicts))
    // views: parseInt(rawClip.views),
    // comments: JSON.parse(rawClip.comments)
  };
}
