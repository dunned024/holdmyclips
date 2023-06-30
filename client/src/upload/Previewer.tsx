import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import './Previewer.css'
import { randomId } from '../services/clipIdentifiers'
import { UploadForm } from '../types';
// import * as defaultThumbnail from '../assets/default_thumbnail.jpg';
import Grid from '@mui/material/Unstable_Grid2'; 
import TextField from '@mui/material/TextField'; 
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

// const defaultThumbnailBlob = new Blob([ defaultThumbnail ], { type: 'image/jpg' });

export function Previewer(props: {source: File, uploadClip: (clipForm: UploadForm) => void}) {
  const [clipDuration, setClipDuration] = useState("");
  const [crop, setCrop] = useState<Crop>()
  const [cropping, setCropping] = useState<boolean>(false);
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
    e.preventDefault()
    console.log('here')

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
  x: number;
  y: number;
  width: number;
  height: number;
}

class Rect {
  public readonly width: number;
  public readonly height: number;
  public readonly x: number;
  public readonly y: number;

  public static fromCanvas(canvas: HTMLCanvasElement): Rect {
    return new this({width: canvas.width, height: canvas.height, x: 0, y: 0});
  }

  public static fromImage(image: HTMLImageElement): Rect {
    return new this({width: image.width, height: image.height, x: 0, y: 0});
  }

  public static fromVideo(video: HTMLVideoElement): Rect {
    return new this({width: video.videoWidth, height: video.videoHeight, x: 0, y: 0});
  }

  public static fromDomRect(domRect: DOMRect): Rect {
    return new this({width: domRect.width, height: domRect.height, x: 0, y: 0});
  }

  public static fromCrop(crop: Crop): Rect {
    return new this({width: crop.width, height: crop.height, x: crop.x, y: crop.y});
  }

  constructor(dimensions: Dimensions){
    this.x = dimensions.x;
    this.y = dimensions.y;
    this.width = dimensions.width;
    this.height = dimensions.height;
  }

  get dimensions(): Dimensions {
    return {x: this.x, y: this.y, width: this.width, height: this.height};
  }

  getScaleValues(dest: Rect, keepAspect: boolean = false): {wRatio: number, hRatio: number} {
    let wRatio = dest.width / this.width
    let hRatio = dest.height / this.height
  
    // If we want the aspect ratio to stay the same, scale by smallest side
    if (keepAspect) {
      const ratio = Math.min(wRatio, hRatio)
      wRatio = ratio
      hRatio = ratio
    }

    return {wRatio, hRatio}
  }
  
  getScaledRect(dest: Rect | {wRatio: number, hRatio: number}, keepAspect: boolean = false): Rect {
    const {wRatio, hRatio} = dest instanceof Rect ? this.getScaleValues(dest, keepAspect) : dest
    return new Rect({
      width: this.width * wRatio,
      height: this.height * hRatio,
      x: this.x * wRatio,
      y: this.y * hRatio
    })
  }
}

function getScaledRect(source: DOMRect, dest: DOMRect, keepAspect: boolean = false): DOMRect {
  let wRatio = dest.width / source.width
  let hRatio = dest.height / source.height

  // If we want the aspect ratio to stay the same, scale by smallest side
  if (keepAspect) {
    const ratio = Math.min(wRatio, hRatio)
    wRatio = ratio
    hRatio = ratio
  }

  return DOMRect.fromRect({
    width: source.width * wRatio,
    height: source.height * hRatio,
    x: source.x * wRatio,
    y: source.y * hRatio
  })
}

// function getScaledRect(rect: Rect, source: {width: number, height: number}, dest: {width: number, height: number}, keepAspect: boolean = false): Rect {
//   // Get scales between source canvas and destination canvas
//   let wRatio = dest.width / source.width
//   let hRatio = dest.height / source.height

//   // If we want the aspect ratio to stay the same, scale by smallest side
//   if (keepAspect) {
//     const ratio = Math.min(wRatio, hRatio)
//     wRatio = ratio
//     hRatio = ratio
//   }

//   // Apply scales to Rect to get new side lengths
//   const dWidth = rect.width * wRatio
//   const dHeight = rect.height * hRatio

//   // Find upper-left <x,y> coordinates in destination canvas
//   const dx = rect.x * wRatio
//   const dy = rect.y * hRatio

//   return {
//     width: dWidth,
//     height: dHeight,
//     x: dx,
//     y: dy
//   }
// }

function ThumbnailSetter(props: {videoRef: React.MutableRefObject<HTMLVideoElement | null>}) {
  const [crop, setCrop] = useState<Crop>()
  const [source, setSource] = useState<Blob | null>(null);
  const [cropping, setCropping] = useState<boolean>(false);
  const [acceptedCrop, setAcceptedCrop] = useState<Crop>();
  const [fixedAspect, setFixedAspect] = useState<boolean>(true)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const inputRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const croppingCanvasRef = useRef<HTMLCanvasElement>(null)

  const clear = function() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setThumbnailBlob(null)
  }

  const handleCapture = function() {
    const video = props.videoRef.current
    if (video === null) {
      return
    }
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return
    }
    const context = croppingCanvas.getContext('2d')
    if (!context) {
      return
    }
    const videoRect = Rect.fromVideo(video);
    const canvasRect = Rect.fromCanvas(croppingCanvas)
    const destRect = videoRect.getScaledRect(canvasRect)

    context.drawImage(video, 0, 0, videoRect.width, videoRect.height, destRect.x, destRect.y, destRect.width, destRect.height);
    setCropping(true)
  }

  function handleToggleAspectClick() {
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return
    }
    if (fixedAspect) {
      setFixedAspect(false)
    } else if (croppingCanvas) {
      setFixedAspect(true)
      centerCrop()
    }
  }

  const centerCrop = function() {
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return
    }
    const { width, height } = croppingCanvas.getBoundingClientRect();
    const dx = ( width - 800 ) / 2;
    const dy = ( height - 800 ) / 2;

    setCrop({
      unit: 'px',
      x: dx,
      y: dy,
      width: 800,
      height: 800
    })
  }

  const acceptCrop = function() {
    const thumbnailCanvas = canvasRef.current;
    const croppingCanvas = croppingCanvasRef.current;
    if (!thumbnailCanvas || !croppingCanvas || !crop) {
      return
    }
    const thumbnailContext = thumbnailCanvas.getContext('2d')
    if (thumbnailContext === null) {
      return
    }

    // There are a series of transformations that need to occur here to
    // get the correct scaling. First, we need to find the transformation
    // from the "visual" dimensions of the cropping canvas (i.e. what's on
    // screen) to the "actual" dimensions of the croppings canvas (defined
    // in the element declaration below -- probably 1920 x 1080)
    const cropCanvasBoundRect = Rect.fromDomRect(croppingCanvas.getBoundingClientRect())
    const cropCanvasRect = Rect.fromCanvas(croppingCanvas)
    const cropScaling = cropCanvasRect.getScaleValues(cropCanvasBoundRect)
    
    // That ratio is applied to the size of the crop box, as well as its
    // <x, y> coordinates That to get the true image we want to transpose
    // from the cropping canvas
    const cropRect = Rect.fromCrop(crop)
    const scaledCropRect = cropRect.getScaledRect(cropScaling)

    // Once we have the true cropped image, we want to scale it down to the
    // thumbnailCanvas. Thankfully, this canvas has a fixed size, so we
    // don't need any more calculations
    thumbnailContext.drawImage(croppingCanvas, scaledCropRect.x, scaledCropRect.y, scaledCropRect.width, scaledCropRect.height, 0, 0, 400, 400);
    setAcceptedCrop(crop)
    setCropping(false)
  }

  const closeCrop = function() {
    setCropping(false)
    if (acceptedCrop) {
      setCrop(acceptedCrop)
    }
  }

  const acceptAndFitCrop = function() {
    const thumbnailCanvas = canvasRef.current;
    const croppingCanvas = croppingCanvasRef.current;
    if (!thumbnailCanvas || !croppingCanvas || !crop) {
      return
    }
    const thumbnailContext = thumbnailCanvas.getContext('2d')
    if (thumbnailContext === null) {
      return
    }

    const { width: croppingCanvasVisualWidth, height: croppingCanvasVisualHeight } = croppingCanvas.getBoundingClientRect();
    const wRatio = croppingCanvas.width / croppingCanvasVisualWidth 
    const hRatio = croppingCanvas.height / croppingCanvasVisualHeight

    const sWidth = crop.width * wRatio
    const sHeight = crop.height * hRatio
    const sx = crop.x * wRatio
    const sy = crop.y * hRatio

    const thumbWidth = thumbnailCanvas.width
    const thumbHeight = thumbnailCanvas.height
    const dRatio = Math.min(thumbWidth / sWidth, thumbHeight / sHeight)
    const dWidth = sWidth * dRatio
    const dHeight = sHeight * dRatio
    const dx = ( thumbWidth - dWidth ) / 2;
    const dy = ( thumbHeight - dHeight ) / 2;

    thumbnailContext.fillStyle = "black";
    thumbnailContext.fillRect(0, 0, thumbWidth, thumbHeight);
    thumbnailContext.drawImage(croppingCanvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    setAcceptedCrop(crop)
    setCropping(false)
  }

  const handleUpload = function(event: ChangeEvent<HTMLInputElement>){
    const reader = new FileReader();
    reader.onload = function(){
      const img = new Image()
      img.onload = () => {
        const hiddenCanvas = croppingCanvasRef.current
        if (hiddenCanvas === null) {
          return
        }
        const context = hiddenCanvas.getContext('2d')
        if (context === null) {
          return
        }

        context.drawImage(img, 0, 0);
        hiddenCanvas.toBlob((blob: Blob | null) => setSource(blob));
      }
      if (reader.result) {
        img.src = reader.result as string;
      }
    }
    if (event.target.files && event.target.files[0]) {
      reader.readAsDataURL(event.target.files[0]);
    }   
  }

  const onButtonClick = () => {
    if (inputRef.current) {
      (inputRef.current as any).click();
    }
  };
  
  return (
    <div id="thumbnail-container">
      <div id="cropping-overlay" style={{display: cropping === true ? 'block' : 'none'}}>
        <button id="cropping-close-button" onClick={closeCrop}>{'\u2a2f'}</button>
        <div id="cropping-dimensions">Dimensions: {crop?.width || 0}px {'\u00d7'} {crop?.height || 0}px</div>
        <div id="cropping-element-container">
          <ReactCrop crop={crop} onChange={c => setCrop(c)} aspect={Number(fixedAspect)}>
            <canvas id="cropping-canvas" width="1920" height="1080" ref={croppingCanvasRef} />
          </ReactCrop>
        </div>
        <button id="cropping-toggle-aspect" onClick={handleToggleAspectClick}>Toggle 1:1 aspect ratio {fixedAspect ? 'off' : 'on'}</button>
        <button id="cropping-center-selection" onClick={centerCrop}>Center</button>
        <button id="cropping-accept" onClick={acceptCrop}>Accept</button>
        <button id="cropping-accept-fit" onClick={acceptAndFitCrop}>Accept & Fit</button>
      </div>
      <div>Thumbnail:</div>
      <canvas id="thumbnail-canvas" width="400" height="400" ref={canvasRef} />
      <Grid id="thumbnail-button-grid" container spacing={1}>
        <Grid xs={6}>
          <button type="button" onClick={handleCapture}>Capture frame</button>
        </Grid>
        <Grid xs={6}>
          <input ref={inputRef} type="file" accept=".jpg,.png" className="file-selector-input" multiple={false} onChange={handleUpload} />
          <button type="button" onClick={onButtonClick}>Upload from file...</button>
        </Grid>
        <Grid xs={12}>
          <button type="button" disabled={!source} onClick={clear}>Clear</button>
        </Grid>
      </Grid>
    </div>
  )
}
