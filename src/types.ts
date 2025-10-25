export interface ClipDex {
  [index: string]: Clip;
}

export interface Clip {
  id: string;
  title: string;
  uploader: string;
  uploadedOn: number;
  description: string;
  duration: number;
  fileExtension?: "mp4" | "mov" | "webm";
  views?: number;
  comments?: Comment[];
}

export interface Comment {
  commentId: number;
  author: string;
  commentText: string;
  postedAt: number;
  likes: number;
}

export interface ClipUploadData {
  id: string;
  title: string;
  duration: string; // TODO: use proper types. Mapping this to string while I figure out DynamoDB typing
  uploader: string;
  uploadedOn: number;
  fileExtension: "mp4" | "mov" | "webm";
  description?: string;
  views?: number;
  comments?: string;
}

export interface TrimDirectives {
  startTime: string;
  endTime: string;
}
