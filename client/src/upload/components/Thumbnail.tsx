import React, { ChangeEvent, MutableRefObject, useRef, useState } from 'react';
import './Thumbnail.css';
// import * as defaultThumbnail from '../assets/default_thumbnail.jpg';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ReactPlayer from 'react-player';
import CloseIcon from '@mui/icons-material/Close';
import Stack from '@mui/material/Stack';
import { palette } from '../../assets/themes/theme';

// const defaultThumbnailBlob = new Blob([ defaultThumbnail ], { type: 'image/jpg' });

export function ThumbnailSetter(props: {
  playerRef: MutableRefObject<ReactPlayer | null>;
  setThumbnailUrl: (thumbnailUrl: string | null) => void;
}) {
  const [canClear, setCanClear] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [thumbnailFilename, setThumbnailFilename] = useState<string>('');

  const [cropping, setCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [acceptedCrop, setAcceptedCrop] = useState<Crop | null>(null);
  const [fixedAspect, setFixedAspect] = useState<boolean>(true);

  const video =
    props.playerRef.current?.getInternalPlayer() as HTMLVideoElement;
  const inputRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const croppingCanvasRef = useRef<HTMLCanvasElement>(null);

  const clear = function () {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setUploadedImage(null);
    setThumbnailFilename('');
    setCrop(null);
    setAcceptedCrop(null);
    setCanClear(false);
    props.setThumbnailUrl(null);
    if (inputRef.current) {
      (inputRef.current as HTMLInputElement).value = '';
    }
  };

  const handleToggleAspectClick = function () {
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return;
    }
    if (fixedAspect) {
      setFixedAspect(false);
    } else if (croppingCanvas) {
      setFixedAspect(true);
      centerCrop();
    }
  };

  const centerCrop = function () {
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return;
    }
    const { width, height } = croppingCanvas.getBoundingClientRect();
    const scale = Math.min.apply(Math, [width, height, 800]);
    const dx = (width - scale) / 2;
    const dy = (height - scale) / 2;

    setCrop({ unit: 'px', x: dx, y: dy, width: scale, height: scale });
  };

  const acceptCrop = function () {
    const thumbnailCanvas = canvasRef.current;
    const croppingCanvas = croppingCanvasRef.current;
    if (!thumbnailCanvas || !croppingCanvas || !crop) {
      return;
    }
    const thumbnailContext = thumbnailCanvas.getContext('2d');
    if (thumbnailContext === null) {
      return;
    }

    // There are a series of transformations that need to occur here to
    // get the correct scaling. First, we need to find the transformation
    // from the "visual" dimensions of the cropping canvas (i.e. what's on
    // screen) to the "actual" dimensions of the croppings canvas (defined
    // in the element declaration below -- probably 1920 x 1080)
    const cropCanvasBoundRect = new Rect(
      croppingCanvas.getBoundingClientRect()
    );
    const cropCanvasRect = new Rect(croppingCanvas);
    const cropScaling = cropCanvasBoundRect.getScaleValues(cropCanvasRect);

    // That ratio is applied to the size of the crop box, as well as its
    // <x, y> coordinates to get the true image we want to transpose from
    // the cropping canvas
    const cropRect = new Rect(crop, true);
    const scaledCropRect = cropRect.scaleTo(cropScaling);

    // Once we have the true cropped image, we want to scale it down to the
    // thumbnailCanvas. Thankfully, this canvas has a fixed size, so we
    // don't need any more calculations
    const thumbRect = new Rect(thumbnailCanvas);
    thumbnailContext.drawImage(
      croppingCanvas,
      scaledCropRect.x,
      scaledCropRect.y,
      scaledCropRect.width,
      scaledCropRect.height,
      thumbRect.x,
      thumbRect.y,
      thumbRect.width,
      thumbRect.height
    );
    setAcceptedCrop(crop);
    setCropping(false);
    setCanClear(true);
    props.setThumbnailUrl(thumbnailCanvas.toDataURL('image/png'));
  };

  const acceptAndFitCrop = function () {
    const thumbnailCanvas = canvasRef.current;
    const croppingCanvas = croppingCanvasRef.current;
    if (!thumbnailCanvas || !croppingCanvas || !crop) {
      return;
    }
    const thumbnailContext = thumbnailCanvas.getContext('2d');
    if (thumbnailContext === null) {
      return;
    }

    // Find "visual" to "actual" canvas scaling values
    const cropCanvasBoundRect = new Rect(
      croppingCanvas.getBoundingClientRect()
    );
    const cropCanvasRect = new Rect(croppingCanvas);
    const cropScaling = cropCanvasBoundRect.getScaleValues(cropCanvasRect);

    // Apply scaling values to cropped selection
    const cropRect = new Rect(crop, true);
    const scaledCropRect = cropRect.scaleTo(cropScaling);

    // Scale the scaled, cropped selection to the thumbnail canvas
    const thumbRect = new Rect(thumbnailCanvas);
    const destRect = scaledCropRect.fitTo(thumbRect);

    // Fill empty space with black and draw the final image on the thumbnail canvas
    thumbnailContext.fillStyle = 'black';
    thumbnailContext.fillRect(0, 0, thumbRect.width, thumbRect.height);
    thumbnailContext.drawImage(
      croppingCanvas,
      scaledCropRect.x,
      scaledCropRect.y,
      scaledCropRect.width,
      scaledCropRect.height,
      destRect.x,
      destRect.y,
      destRect.width,
      destRect.height
    );
    setAcceptedCrop(crop);
    setCropping(false);
    setCanClear(true);
    props.setThumbnailUrl(thumbnailCanvas.toDataURL('image/png'));
  };

  const closeCrop = function () {
    setCropping(false);
    if (acceptedCrop) {
      setCrop(acceptedCrop);
      if (acceptedCrop.width !== acceptedCrop.height && fixedAspect) {
        setFixedAspect(false);
      }
    } else {
      setCrop(null);
    }
  };

  const openCropOverlay = function (
    sourceImage: HTMLImageElement | HTMLVideoElement
  ) {
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return;
    }
    if (sourceImage instanceof HTMLVideoElement) {
      croppingCanvas.width = sourceImage.videoWidth;
      croppingCanvas.height = sourceImage.videoHeight;
    } else if (sourceImage) {
      croppingCanvas.width = sourceImage.width;
      croppingCanvas.height = sourceImage.height;
    } else {
      croppingCanvas.width = 1920;
      croppingCanvas.height = 1080;
    }

    const sourceRect = new Rect(sourceImage);
    const canvasRect = new Rect(croppingCanvas);
    const destRect = sourceRect.fitTo(canvasRect);

    const context = croppingCanvas.getContext('2d');
    if (!context) {
      return;
    }
    context.drawImage(
      sourceImage,
      sourceRect.x,
      sourceRect.y,
      sourceRect.width,
      sourceRect.height,
      destRect.x,
      destRect.y,
      destRect.width,
      destRect.height
    );
    setCropping(true);
  };

  const handleUpload = function (event: ChangeEvent<HTMLInputElement>) {
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = () => {
        const thumbnailCanvas = canvasRef.current;
        if (!thumbnailCanvas) {
          return;
        }
        const context = thumbnailCanvas.getContext('2d');
        if (!context) {
          return;
        }
        const videoRect = new Rect(img);
        const canvasRect = new Rect(thumbnailCanvas);
        const destRect = videoRect.scaleTo(canvasRect);

        context.drawImage(
          img,
          videoRect.x,
          videoRect.y,
          videoRect.width,
          videoRect.height,
          destRect.x,
          destRect.y,
          destRect.width,
          destRect.height
        );
        setUploadedImage(img);
        setCanClear(true);
        props.setThumbnailUrl(thumbnailCanvas.toDataURL('image/png'));
      };
      if (reader.result) {
        img.src = reader.result as string;
      }
    };
    if (event.target.files && event.target.files[0]) {
      reader.readAsDataURL(event.target.files[0]);
      setThumbnailFilename(event.target.files[0].name);
    }
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      console.log(inputRef.current);
      (inputRef.current as HTMLInputElement).click();
    }
  };

  const handleCaptureFrame = () => {
    if (video) {
      openCropOverlay(video);
    }
  };

  const handleCropUploadedImage = () => {
    if (uploadedImage) {
      openCropOverlay(uploadedImage);
    }
  };

  return (
    <Stack
      id='thumbnail-container'
      sx={{ backgroundColor: palette.secondary.dark }}
    >
      <div
        id='cropping-overlay'
        style={{ display: cropping ? 'block' : 'none' }}
      >
        <div id='cropping-overlay-element-container'>
          <button id='cropping-close-button' onClick={closeCrop}>
            <CloseIcon />
          </button>
          <div id='cropping-button-grid-container'>
            <Grid id='cropping-button-grid' container spacing={1}>
              <Grid xs={6}>
                <button
                  id='cropping-toggle-aspect'
                  onClick={handleToggleAspectClick}
                >
                  Toggle 1:1 aspect ratio {fixedAspect ? 'off' : 'on'}
                </button>
              </Grid>
              <Grid xs={6}>
                <button id='cropping-center-selection' onClick={centerCrop}>
                  Center
                </button>
              </Grid>
              <Grid xs={6}>
                <button id='cropping-accept' onClick={acceptCrop}>
                  Accept
                </button>
              </Grid>
              <Grid xs={6}>
                <button id='cropping-accept-fit' onClick={acceptAndFitCrop}>
                  Accept & Fit
                </button>
              </Grid>
            </Grid>
          </div>
          <ReactCrop
            crop={crop ?? undefined}
            onChange={(c) => setCrop(c)}
            aspect={Number(fixedAspect)}
            className='react-crop'
            maxHeight={croppingCanvasRef.current?.height}
          >
            {!crop && (
              <div id='crop-instruct'>Click and drag to crop image</div>
            )}
            <canvas id='cropping-canvas' ref={croppingCanvasRef} />
          </ReactCrop>
          <div id='cropping-dimensions'>
            Dimensions: {crop?.width || 0}px {'\u00d7'} {crop?.height || 0}px
          </div>
        </div>
      </div>
      <canvas id='thumbnail-canvas' width='400' height='400' ref={canvasRef} />
      <Stack id='thumbnail-button-container' direction='column' spacing={1}>
        <Grid container spacing={1}>
          <Grid xs={6}>
            <button
              id='capture-frame-button'
              type='button'
              onClick={handleCaptureFrame}
            >
              Capture frame
            </button>
          </Grid>
          <Grid xs={6}>
            <Stack id='file-crop-button-container' direction='column'>
              <input
                ref={inputRef}
                type='file'
                accept='.jpg,.png'
                id='file-selector-input'
                multiple={false}
                onChange={handleUpload}
              />
              <button type='button' onClick={onButtonClick}>
                Upload from file...
              </button>
              <TextField
                id='thumbnail-filename-field'
                size='small'
                style={{ margin: 0 }}
                fullWidth
                hiddenLabel
                color='primary'
                type='text'
                disabled
                InputLabelProps={{ shrink: true }}
                placeholder='Filename'
                value={thumbnailFilename}
              />
              <button
                type='button'
                disabled={!uploadedImage}
                onClick={handleCropUploadedImage}
              >
                Crop uploaded image
              </button>
            </Stack>
          </Grid>
        </Grid>
        <button type='button' disabled={!canClear} onClick={clear}>
          Clear
        </button>
      </Stack>
    </Stack>
  );
}

class Rect {
  public readonly x: number;
  public readonly y: number;
  public readonly width: number;
  public readonly height: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(s: any, keepCoords: boolean = false) {
    [this.width, this.height] =
      s instanceof HTMLVideoElement
        ? [s.videoWidth, s.videoHeight]
        : [s.width, s.height];
    [this.x, this.y] =
      // eslint-disable-next-line no-prototype-builtins
      keepCoords && s.hasOwnProperty('x') ? [s.x, s.y] : [0, 0];
  }

  getScaleValues(
    dest: Rect,
    keepAspect: boolean = false
  ): { wRatio: number; hRatio: number } {
    let wRatio = dest.width / this.width;
    let hRatio = dest.height / this.height;

    // If we want the aspect ratio to stay the same, scale by smallest side
    if (keepAspect) {
      const ratio = Math.min(wRatio, hRatio);
      wRatio = ratio;
      hRatio = ratio;
    }

    return { wRatio, hRatio };
  }

  scaleTo(dest: Rect | { wRatio: number; hRatio: number }): Rect {
    const { wRatio, hRatio } =
      dest instanceof Rect ? this.getScaleValues(dest, false) : dest;
    return new Rect(
      {
        width: this.width * wRatio,
        height: this.height * hRatio,
        x: this.x * wRatio,
        y: this.y * hRatio
      },
      true
    );
  }

  fitTo(dest: Rect): Rect {
    const ratio = Math.min(dest.width / this.width, dest.height / this.height);
    return new Rect(
      {
        width: this.width * ratio,
        height: this.height * ratio,
        x: (dest.width - this.width * ratio) / 2,
        y: (dest.height - this.height * ratio) / 2
      },
      true
    );
  }
}
