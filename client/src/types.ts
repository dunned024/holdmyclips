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
  views?: number;
  comments?: Comment[];
}

export interface Comment {
  author: string;
  text: string;
  postedAt: string;
}

export interface ClipUploadData {
  id: string;
  title: string;
  duration: string; // TODO: use proper types. Mapping this to string while I figure out DynamoDB typing
  uploader: string;
  description?: string;
  views?: number;
  comments?: string;
}

export interface TrimDirectives {
  startTime: string;
  endTime: string;
}
