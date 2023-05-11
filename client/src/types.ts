
export interface Clip {
  id: string,
  title: string,
  uploader: string,
  // uploadedAt: Date
  description: string,
  duration: number,
  views: number,
  comments: Comment[]
}

export interface Comment {
  author: string,
  text: string,
  postedAt: Date
}
