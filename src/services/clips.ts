import { API_ENDPOINT } from "src/config";
import type { Clip, ClipDex } from "src/types";

export interface PaginatedClipsResponse {
  clips: Clip[];
  nextToken?: string;
  hasMore: boolean;
}

export async function getClips(): Promise<ClipDex> {
  const res = await fetch(`${API_ENDPOINT}/clips`);
  const data = await res.json();

  const clipList: ClipDex = {};
  for (const rawClip of data.clips) {
    const clip = parseClip(rawClip);
    clipList[clip.id] = clip;
  }

  return clipList;
}

export async function getClipsPaginated(
  sortIndex: string,
  order: "asc" | "desc" = "desc",
  limit = 20,
  nextToken?: string,
): Promise<PaginatedClipsResponse> {
  const params = new URLSearchParams({
    sortIndex,
    order,
    limit: limit.toString(),
  });

  if (nextToken) {
    params.append("nextToken", nextToken);
  }

  const res = await fetch(`${API_ENDPOINT}/clips?${params.toString()}`);
  const data = await res.json();

  return {
    clips: data.clips.map(parseClip),
    nextToken: data.nextToken,
    hasMore: data.hasMore,
  };
}

export async function getClipMetadata(id: string): Promise<Clip> {
  // TODO: Get this by fetching the ClipDex (maybe? still true?)
  //  Note: can't persist this info from when it's first fetched
  //  https://stackoverflow.com/a/53455443
  // This doesn't actually hit the API gateway -- it pulls from the S3 object
  const res = await fetch(`${API_ENDPOINT}/clips/${id}/${id}.json`);
  const data = await res.json();

  return parseClip(data);
}

export function parseClip(rawClip: Record<string, string>): Clip {
  return {
    id: rawClip.id,
    title: rawClip.title,
    uploader: rawClip.uploader,
    description: rawClip.description,
    duration: Number.parseInt(rawClip.duration),
    uploadedOn: Number.parseInt(rawClip.uploadedOn),
    // views: parseInt(rawClip.views),
    // comments: JSON.parse(rawClip.comments)
  };
}
