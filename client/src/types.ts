export interface ClipDex {
  [index: string]: Clip;
}

export interface Clip {
  id: string;
  title: string;
  uploader: string;
  // uploadedAt: Date
  description: string;
  duration: number;
  views: number;
  comments: Comment[];
}

export interface Comment {
  author: string;
  text: string;
  postedAt: Date;
}

export function parseClip(rawClip: Record<string, string>): Clip {
  return {
    id: rawClip.id,
    title: rawClip.title,
    uploader: rawClip.uploader,
    description: rawClip.description,
    duration: parseInt(rawClip.duration),
    views: parseInt(rawClip.views),
    comments: JSON.parse(rawClip.comments)
  };
}

export interface ClipUploadData {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  description?: string;
  views: number;
  comments: string;
}
