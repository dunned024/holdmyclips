import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

class Rect {
  public readonly x: number;
  public readonly y: number;
  public readonly width: number;
  public readonly height: number;

  constructor(s: any, keepCoords: boolean = false){
    [this.width, this.height] = s instanceof HTMLVideoElement ? [s.videoWidth, s.videoHeight] : [s.width, s.height];
    [this.x, this.y] = keepCoords && s.hasOwnProperty('x') ? [s.x, s.y] : [0, 0];
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
  
  scaleTo(dest: Rect | {wRatio: number, hRatio: number}): Rect {
    const {wRatio, hRatio} = dest instanceof Rect ? this.getScaleValues(dest, false) : dest
    return new Rect({
      width: this.width * wRatio,
      height: this.height * hRatio,
      x: this.x * wRatio,
      y: this.y * hRatio
    }, true)
  }

  fitTo(dest: Rect): Rect {
    const ratio = Math.min(dest.width / this.width, dest.height / this.height)
    return new Rect({
      width: this.width * ratio,
      height: this.height * ratio,
      x:  ( dest.width - this.width * ratio ) / 2,
      y:( dest.height - this.height * ratio ) / 2,
    }, true)
  }
}


function ThumbnailSetter(props: {videoRef: React.MutableRefObject<HTMLVideoElement | null>}) {
  const [canClear, setCanClear] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);

  const [cropping, setCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop | null>(null)
  const [acceptedCrop, setAcceptedCrop] = useState<Crop | null>(null);
  const [fixedAspect, setFixedAspect] = useState<boolean>(true)

  const inputRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const croppingCanvasRef = useRef<HTMLCanvasElement>(null)

  // let croppingCanvasWidth, croppingCanvasHeight;
  // if (uploadedImage) {
  //   croppingCanvasWidth = uploadedImage.width;
  //   croppingCanvasHeight = uploadedImage.height;
  // } else {
  //   if (props.videoRef.current !== null) {
  //     croppingCanvasWidth = props.videoRef.current.videoWidth;
  //     croppingCanvasHeight = props.videoRef.current.videoHeight;
  //   }
  // }
  // const croppingCanvasDims = useMemo(
  //   () => {
  //     if (uploadedImage) {
  //       return [uploadedImage.width, uploadedImage.height]
  //     } else {
  //       if (props.videoRef.current !== null) {
  //         return [props.videoRef.current.videoWidth, props.videoRef.current.videoHeight]
  //       }
  //     }
  //   },
  //   [uploadedImage, props.videoRef.current]
  // );

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
    setUploadedImage(null);
    setCrop(null);
    setAcceptedCrop(null);
    setCanClear(false);
    if (inputRef.current) {
      (inputRef.current as HTMLInputElement).value = "";
    }
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

    setCrop({unit: 'px', x: dx, y: dy, width: 800, height: 800})
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
    const cropCanvasBoundRect = new Rect(croppingCanvas.getBoundingClientRect())
    const cropCanvasRect = new Rect(croppingCanvas)
    const cropScaling = cropCanvasBoundRect.getScaleValues(cropCanvasRect)

    // That ratio is applied to the size of the crop box, as well as its
    // <x, y> coordinates That to get the true image we want to transpose
    // from the cropping canvas
    const cropRect = new Rect(crop, true)
    const scaledCropRect = cropRect.scaleTo(cropScaling)

    // Once we have the true cropped image, we want to scale it down to the
    // thumbnailCanvas. Thankfully, this canvas has a fixed size, so we
    // don't need any more calculations
    const thumbRect = new Rect(thumbnailCanvas)
    thumbnailContext.drawImage(croppingCanvas, scaledCropRect.x, scaledCropRect.y, scaledCropRect.width, scaledCropRect.height, thumbRect.x, thumbRect.y, thumbRect.width, thumbRect.height);
    setAcceptedCrop(crop)
    setCropping(false)
    setCanClear(true)
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

    // Find "visual" to "actual" canvas scaling values
    const cropCanvasBoundRect = new Rect(croppingCanvas.getBoundingClientRect())
    const cropCanvasRect = new Rect(croppingCanvas)
    const cropScaling = cropCanvasBoundRect.getScaleValues(cropCanvasRect)

    // Apply scaling values to cropped selection
    const cropRect = new Rect(crop, true)
    const scaledCropRect = cropRect.scaleTo(cropScaling)

    // Scale the scaled, cropped selection to the thumbnail canvas
    const thumbRect = new Rect(thumbnailCanvas)
    const destRect = scaledCropRect.fitTo(thumbRect)
    
    // Fill empty space with black and draw the final image on the thumbnail canvas
    thumbnailContext.fillStyle = "black";
    thumbnailContext.fillRect(0, 0, thumbRect.width, thumbRect.height);
    thumbnailContext.drawImage(croppingCanvas, scaledCropRect.x, scaledCropRect.y, scaledCropRect.width, scaledCropRect.height, destRect.x, destRect.y, destRect.width, destRect.height);
    setAcceptedCrop(crop)
    setCropping(false)
    setCanClear(true)
  }

  const closeCrop = function() {
    setCropping(false)
    if (acceptedCrop) {
      setCrop(acceptedCrop)
      if (acceptedCrop.width !== acceptedCrop.height && fixedAspect) {
        setFixedAspect(false)
      }
    }
  }

  const openCropOverlay = function(sourceImage: HTMLImageElement | HTMLVideoElement) {
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return
    }
    if (sourceImage instanceof HTMLVideoElement && props.videoRef.current) {
      croppingCanvas.width = props.videoRef.current.videoWidth;
      croppingCanvas.height = props.videoRef.current.videoHeight;
    } else if (uploadedImage) {
      croppingCanvas.width = uploadedImage.width;
      croppingCanvas.height = uploadedImage.height;
    } else {
      croppingCanvas.width = 1920;
      croppingCanvas.height = 1080;
    }
    
    const sourceRect = new Rect(sourceImage);
    const canvasRect = new Rect(croppingCanvas);
    const destRect = sourceRect.fitTo(canvasRect)

    const context = croppingCanvas.getContext('2d')
    if (!context) {
      return
    }
    context.drawImage(sourceImage, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height, destRect.x, destRect.y, destRect.width, destRect.height);
    setCropping(true)
  }

  const handleUpload = function(event: ChangeEvent<HTMLInputElement>){
    const reader = new FileReader();
    reader.onload = function(){
      const img = new Image()
      img.onload = () => {
        const thumbnailCanvas = canvasRef.current;
        if (!thumbnailCanvas) {
          return
        }
        const context = thumbnailCanvas.getContext('2d')
        if (!context) {
          return
        }
        const videoRect = new Rect(img);
        const canvasRect = new Rect(thumbnailCanvas);
        const destRect = videoRect.scaleTo(canvasRect)

        context.drawImage(img, videoRect.x, videoRect.y, videoRect.width, videoRect.height, destRect.x, destRect.y, destRect.width, destRect.height);
        setUploadedImage(img)
        setCanClear(true)
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
  
  const handleCaptureFrame = () => {
    const video = props.videoRef.current
    if (video !== null) {
      openCropOverlay(video);
    }
  };
  
  const handleCropUploadedImage = () => {
    if (uploadedImage !== null) {
      openCropOverlay(uploadedImage);
    }
  };
  
  return (
    <div id="thumbnail-container">
      <div id="cropping-overlay" style={{display: cropping === true ? 'block' : 'none'}}>
        <div id="cropping-overlay-element-container">
          <button id="cropping-close-button" onClick={closeCrop}>{'\u2a2f'}</button>
          <div id="cropping-button-grid-container">
            <Grid id="cropping-button-grid" container spacing={1}>
              <Grid xs={6}>
                <button id="cropping-toggle-aspect" onClick={handleToggleAspectClick}>Toggle 1:1 aspect ratio {fixedAspect ? 'off' : 'on'}</button>
              </Grid>
              <Grid xs={6}>
              <button id="cropping-center-selection" onClick={centerCrop}>Center</button>
              </Grid>
              <Grid xs={6}>
              <button id="cropping-accept" onClick={acceptCrop}>Accept</button>
              </Grid>
              <Grid xs={6}>
              <button id="cropping-accept-fit" onClick={acceptAndFitCrop}>Accept & Fit</button>
              </Grid>
            </Grid>
          </div>
          <ReactCrop crop={crop ?? undefined} onChange={c => setCrop(c)} aspect={Number(fixedAspect)} className="react-crop">
            <canvas id="cropping-canvas" ref={croppingCanvasRef} />
          </ReactCrop>
          <div id="cropping-dimensions">Dimensions: {crop?.width || 0}px {'\u00d7'} {crop?.height || 0}px</div>
        </div>
      </div>
      <div>Thumbnail:</div>
      <canvas id="thumbnail-canvas" width="400" height="400" ref={canvasRef} />
      <Grid id="thumbnail-button-grid" container direction="column" spacing={1}>
        <Grid id="thumbnail-button-grid2" container spacing={1}>
          <Grid xs={6} container direction="column">
            <Grid style={{height: "100%"}}>
              <button type="button" onClick={handleCaptureFrame}>Capture frame</button>
            </Grid>
          </Grid>
          <Grid xs={6} container direction="column" spacing={1}>
            <Grid xs>
              <input ref={inputRef} type="file" accept=".jpg,.png" id="file-selector-input" multiple={false} onChange={handleUpload} />
              <button type="button" onClick={onButtonClick}>Upload from file...</button>
            </Grid>
            <Grid xs>
              <button type="button" disabled={!uploadedImage} onClick={handleCropUploadedImage}>Crop uploaded image</button>
            </Grid>
          </Grid>
        </Grid>
        <Grid xs>
          <button type="button" disabled={!canClear} onClick={clear}>Clear</button>
        </Grid>
      </Grid>
    </div>
  )
}
