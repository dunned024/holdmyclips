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


enum ImageFit {
  FIT,
  FILL,
  CROP,
}

interface Dimensions {
  xOffset: number;
  yOffset: number;
  width: number;
  height: number;
}

// class ThumbnailSource {
//   public readonly width: number;
//   public readonly height: number;

//   constructor(source: HTMLVideoElement | HTMLImageElement | string) {
//     if (typeof source === "string") {
//       const s = new Image()
//       s.src = source
//     }
//     this.width = s.tagName === "VIDEO" ? (source as HTMLVideoElement).videoWidth : source.width
//     this.height = source.tagName === "VIDEO" ? (source as HTMLVideoElement).videoHeight : source.height
//   }

//   public getDestinationDimensions(canvas: HTMLCanvasElement, fit: ImageFit): Dimensions {
//     const wRatio = canvas.width / this.width
//     const hRatio = canvas.height / this.height
    
//     let dWidth, dHeight;
//     if (fit === ImageFit.FILL) {
//       dWidth = this.width * wRatio
//       dHeight = this.height * hRatio
//     }
//     else if (fit === ImageFit.FIT) {
//       const ratio = Math.min(wRatio, hRatio)
//       dWidth = this.width * ratio
//       dHeight = this.height * ratio
//     }
//     else if (fit === ImageFit.CROP) {
//       const ratio = Math.max(wRatio, hRatio)
//       dWidth = this.width * ratio
//       dHeight = this.height * ratio
//     }
//     else {
//       dWidth = this.width * wRatio
//       dHeight = this.height * hRatio
//     }

//     const dx = ( canvas.width - dWidth ) / 2;
//     const dy = ( canvas.height - dHeight ) / 2;

//     return {
//       xOffset: dx,
//       yOffset: dy,
//       width: dWidth,
//       height: dHeight
//     }
//   }
// }

function ThumbnailSetter(props: {videoRef: React.MutableRefObject<HTMLVideoElement | null>}) {
  const [source, setSource] = useState<Blob | null>(null);
  const [sourceDims, setSourceDims] = useState({width: 1920, height: 1080});
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null)

  const clear = function(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    if (context === null) {
      return
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setThumbnailBlob(null)
    setSource(null)
  }


  const capture2 = function() {
    const video = props.videoRef.current
    if (video === null) {
      return
    }
    const width = video.videoWidth
    const height = video.videoHeight
    setSourceDims({width, height})

    const hiddenCanvas = hiddenCanvasRef.current;
    if (hiddenCanvas === undefined || hiddenCanvas === null) {
      return null
    }
    const context = hiddenCanvas.getContext('2d')
    if (context === null) {
      return null
    }
    context.drawImage(video, 0, 0);
    hiddenCanvas.toBlob((blob: Blob | null) => {
      if (!blob) {
        return
      }
      setSource(blob)
      translate(ImageFit.FILL, blob)
    });
    
    // TODO: This resets the thumbnail if the user seeks a different time in the video
    // Best bet is to: draw image onto canvas and save as image? Try toDataUrl()
    //  https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
    //  Then https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Using_images#embedding_an_image_via_data_url
    // Although, I don't want to reset the source image every time i resize/translate...
    // I think I need a hidden canvas with 1:1 video ratio. When I capture, I draw the
    // video frame onto this hidden canvas, then store the dataUrl as the image source
    // Similarly, when uploading, I simply store the dataUrl as the image source
    //  https://stackoverflow.com/questions/43007634/javascript-how-to-extract-frame-from-video
  }

  const translate = function(fit: ImageFit, newSource?: Blob) {
    const canvas = canvasRef.current;
    if (canvas === undefined || canvas === null) {
      return
    }
    const context = canvas.getContext('2d')
    if (context === null) {
      return
    }
  
    const sourceImage = new Image();
    sourceImage.onload = function(){
      const width = sourceImage.naturalWidth
      const height = sourceImage.naturalHeight
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

      context.fillStyle = "black";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(sourceImage, 0, 0, width, height, dx, dy, dWidth, dHeight);
    }
    if (source !== null) {
      sourceImage.src = URL.createObjectURL(source);
    } else if (newSource !== undefined) {
      sourceImage.src = URL.createObjectURL(newSource);
    } else {return}
    canvas.toBlob((blob: Blob | null) => setThumbnailBlob(blob));
  }

  
  const parseRefs = function(func: (canvas: HTMLCanvasElement, video: HTMLVideoElement) => void ) {
    const canvas = canvasRef.current
    const video = props.videoRef.current
    if (canvas === null || video === null) {
      return
    }
    func(canvas, video)
  }

  // const handleUpload = function(canvas: HTMLCanvasElement, video: HTMLVideoElement){
  //   const context = canvas.getContext('2d')
  //   if (context === null) {
  //     return
  //   }
  //   const reader = new FileReader();
  //   reader.onload = function(event){
  //       var img = new Image();
  //       img.onload = () => fillSource(canvas)
  //       img.src = event.target?.result ?? ""
  //   }
  //   reader.readAsDataURL(e.target.files[0]);     
  // }

  return (
    <div id="thumbnail-container">
      <canvas id="hiddenCanvas" ref={hiddenCanvasRef} width={sourceDims.width} height={sourceDims.height} style={{overflow: 'hidden', display: 'none'}}/>
      <div>Thumbnail:</div>
      <canvas id="canvas" width="400" height="400" ref={canvasRef} />
      <Grid id="thumbnail-button-grid" container spacing={0}>
        {/* <Grid xs={12}>
          <button type="button" onClick={() => parseRefs((x, y) => capture(x, y, ImageFit.FILL))}>Capture frame</button>
        </Grid> */}
        <Grid xs={12}>
          <button type="button" onClick={() => capture2()}>Capture frame</button>
        </Grid>
        <Grid xs={12}>
          <button type="button" onClick={() => capture2()}>Upload from file...</button>
        </Grid>
        <Grid xs={4}>
          <button type="button" disabled={!source} onClick={() => translate(ImageFit.FILL)}>Fill</button>
        </Grid>
        <Grid xs={4}>
          <button type="button" disabled={!source} onClick={() => translate(ImageFit.FIT)}>Fit</button>
        </Grid>
        <Grid xs={4}>
          <button type="button" disabled={!source} onClick={() => translate(ImageFit.CROP)}>Crop</button>
        </Grid>
        <Grid xs={12}>
          <button type="button" disabled={!source} onClick={() => parseRefs(clear)}>Clear</button>
        </Grid>
      </Grid>
    </div>
  )
}
