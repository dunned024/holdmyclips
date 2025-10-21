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
  };
}
