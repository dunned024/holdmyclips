import { FormEvent, useEffect, useRef, useState } from 'react';
import './Previewer.css'
import { randomId } from '../services/clipIdentifiers'
import { UploadForm } from '../types';
// import * as defaultThumbnail from '../assets/default_thumbnail.jpg';
import Grid from '@mui/material/Unstable_Grid2'; 
import TextField from '@mui/material/TextField'; 

// const defaultThumbnailBlob = new Blob([ defaultThumbnail ], { type: 'image/jpg' });

export function Previewer(props: {source: File, uploadClip: (clipForm: UploadForm) => void}) {
  const [clipDuration, setClipDuration] = useState("");
  const videoSrc = URL.createObjectURL(props.source);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef && videoRef.current) {
      const currentVideo = (videoRef.current as HTMLMediaElement);

      currentVideo.onloadedmetadata = () => {
        setClipDuration(`${Math.ceil(currentVideo.duration).toString()}s`)
      };
    }
  }, [videoSrc]);

  const handleSubmit = function(e: FormEvent) {
    console.log('here')
    e.preventDefault()

    const form = (e.target as HTMLFormElement);
    const formData = new FormData(form) as UploadForm; // TODO: strongly type this so it throws if any fields are missing

    const title = formData.get('title')?.toString()
    const uploader = formData.get('uploader')?.toString()
    if (!title || !uploader) {
      console.log('error: must include title, uploader')
      return
    }
    
    const id = randomId()
    formData.append('id', id)
    
    formData.append('duration', clipDuration)
    formData.append('views', '0')
    formData.append('comments', '[]')
    
    props.uploadClip(formData)
  }

  return (
    <div className="previewer">
      <div className="video-preview-container">
        <video controls src={videoSrc} ref={videoRef} id="video" />
      </div>

      <form id="clip-details-form" method='put' onSubmit={handleSubmit}>
        <Grid id="form-grid" container spacing={2}>
          <Grid xs={12} className="field">
            <TextField 
              label="Title"
              color="secondary"
              fullWidth
              type="text"
              InputLabelProps={{ shrink: true }}
              defaultValue={props.source.name}
              required
            />
          </Grid>
          <Grid xs={4} className="field">
            <TextField
              label="Duration"
              color="secondary"
              disabled
              InputLabelProps={{ shrink: true }}
              value={clipDuration}
            />
          </Grid>
          <Grid xs={8} className="field">
            <TextField 
              label="Uploader"
              fullWidth
              color="secondary"
              type="text"
              disabled
              InputLabelProps={{ shrink: true }}
              defaultValue={props.source.name || ''}
            />
          </Grid>
          <Grid xs={12} className="field">
            <TextField 
              label="Description"
              color="secondary"
              fullWidth
              type="textarea"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        <button id="submit-button" type="submit">Upload!</button>
        <ThumbnailSetter videoRef={videoRef} />
      </form>
    </div>
  );
};

function ThumbnailSetter(props: {videoRef: React.MutableRefObject<HTMLVideoElement | null>}) {
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clear = function(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    if (context === null) {
      return
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setThumbnailBlob(null)
  }

  enum ImageFit {
    FIT,
    FILL,
    CROP,
  }
  
  const parseRefs = function(func: (canvas: HTMLCanvasElement, video: HTMLVideoElement) => void ) {
    const canvas = canvasRef.current
    const video = props.videoRef.current
    if (canvas === null || video === null) {
      return
    }
    func(canvas, video)
  }

  const capture = function(canvas: HTMLCanvasElement, video: HTMLVideoElement, fit: ImageFit) {
    const context = canvas.getContext('2d')
    if (context === null) {
      return
    }
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const width = video.videoWidth
    const height = video.videoHeight
    const wRatio = canvas.width / width
    const hRatio = canvas.height / height
    let dWidth, dHeight;

    if (fit === ImageFit.FILL) {
      dWidth = width * wRatio
      dHeight = height * hRatio
    }
    else if (fit === ImageFit.FIT) {
      const ratio = Math.min(wRatio, hRatio)
      dWidth = width * ratio
      dHeight = height * ratio
    }
    else if (fit === ImageFit.CROP) {
      const ratio = Math.max(wRatio, hRatio)
      dWidth = width * ratio
      dHeight = height * ratio
    }
    else {
      dWidth = width * wRatio
      dHeight = height * hRatio
    }

    const dx = ( canvas.width - dWidth ) / 2;
    const dy = ( canvas.height - dHeight ) / 2;
    context.drawImage(video, 0, 0, width, height, dx, dy, dWidth, dHeight);
    canvas.toBlob((blob: Blob | null) => setThumbnailBlob(blob));
  }
  
  return (
    <div id="thumbnail-container">
      <div>Thumbnail:</div>
      <canvas id="canvas" width="300" height="300" ref={canvasRef}></canvas>
      <Grid id="thumbnail-button-grid" container spacing={0}>
        <Grid xs={12}>
          <button type="button" onClick={() => parseRefs((x, y) => capture(x, y, ImageFit.FILL))}>Capture frame</button>
        </Grid>
        <Grid xs={12}>
          <button type="button" onClick={() => parseRefs((x, y) => capture(x, y, ImageFit.FILL))}>Upload from file...</button>
        </Grid>
        <Grid xs={4}>
          <button type="button" disabled={!thumbnailBlob} onClick={() => parseRefs((x, y) => capture(x, y, ImageFit.FILL))}>Fill</button>
        </Grid>
        <Grid xs={4}>
          <button type="button" disabled={!thumbnailBlob} onClick={() => parseRefs((x, y) => capture(x, y, ImageFit.FIT))}>Fit</button>
        </Grid>
        <Grid xs={4}>
          <button type="button" disabled={!thumbnailBlob} onClick={() => parseRefs((x, y) => capture(x, y, ImageFit.CROP))}>Crop</button>
        </Grid>
        <Grid xs={12}>
          <button type="button" disabled={!thumbnailBlob} onClick={() => parseRefs(clear)}>Clear</button>
        </Grid>
      </Grid>
    </div>
  )
}
