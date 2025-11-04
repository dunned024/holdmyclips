import CloseIcon from "@mui/icons-material/Close";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Unstable_Grid2";
import {
  type ChangeEvent,
  type MutableRefObject,
  useRef,
  useState,
} from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import type ReactPlayer from "react-player";
import { palette } from "src/assets/themes/theme";
import "src/pages/upload/components/Thumbnail.css";

// const defaultThumbnailBlob = new Blob([ defaultThumbnail ], { type: 'image/jpg' });

export function ThumbnailSetter(props: {
  playerRef: MutableRefObject<ReactPlayer | null>;
  setThumbnailUrl: (thumbnailUrl: string | null) => void;
}) {
  const [canClear, setCanClear] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [thumbnailFilename, setThumbnailFilename] = useState<string>("");

  const [cropping, setCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [acceptedCrop, setAcceptedCrop] = useState<Crop | null>(null);
  const [fixedAspect, setFixedAspect] = useState<boolean>(true);

  const video =
    props.playerRef.current?.getInternalPlayer() as HTMLVideoElement;
  const inputRef = useRef(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const croppingCanvasRef = useRef<HTMLCanvasElement>(null);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    setUploadedImage(null);
    setThumbnailFilename("");
    setCrop(null);
    setAcceptedCrop(null);
    setCanClear(false);
    props.setThumbnailUrl(null);
    if (inputRef.current) {
      (inputRef.current as HTMLInputElement).value = "";
    }
  };

  const handleToggleAspectClick = () => {
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

  const centerCrop = () => {
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return;
    }
    const { width, height } = croppingCanvas.getBoundingClientRect();
    const scale = Math.min.apply(Math, [width, height, 800]);
    const dx = (width - scale) / 2;
    const dy = (height - scale) / 2;

    setCrop({ unit: "px", x: dx, y: dy, width: scale, height: scale });
  };

  const acceptCrop = () => {
    const thumbnailCanvas = canvasRef.current;
    const croppingCanvas = croppingCanvasRef.current;
    if (!thumbnailCanvas || !croppingCanvas || !crop) {
      return;
    }
    const thumbnailContext = thumbnailCanvas.getContext("2d");
    if (thumbnailContext === null) {
      return;
    }

    // There are a series of transformations that need to occur here to
    // get the correct scaling. First, we need to find the transformation
    // from the "visual" dimensions of the cropping canvas (i.e. what's on
    // screen) to the "actual" dimensions of the croppings canvas (defined
    // in the element declaration below -- probably 1920 x 1080)
    const cropCanvasBoundRect = new Rect(
      domRectToRect(croppingCanvas.getBoundingClientRect()),
    );
    const cropCanvasRect = new Rect(getDimensions(croppingCanvas));
    const cropScaling = cropCanvasBoundRect.getScaleValues(cropCanvasRect);

    // That ratio is applied to the size of the crop box, as well as its
    // <x, y> coordinates to get the true image we want to transpose from
    // the cropping canvas
    const cropRect = new Rect(cropToRect(crop), true);
    const scaledCropRect = cropRect.scaleTo(cropScaling);

    // Once we have the true cropped image, we want to scale it down to the
    // thumbnailCanvas. Thankfully, this canvas has a fixed size, so we
    // don't need any more calculations
    const thumbRect = new Rect(getDimensions(thumbnailCanvas));
    thumbnailContext.drawImage(
      croppingCanvas,
      scaledCropRect.x,
      scaledCropRect.y,
      scaledCropRect.width,
      scaledCropRect.height,
      thumbRect.x,
      thumbRect.y,
      thumbRect.width,
      thumbRect.height,
    );
    setAcceptedCrop(crop);
    setCropping(false);
    setCanClear(true);
    props.setThumbnailUrl(thumbnailCanvas.toDataURL("image/png"));
  };

  const acceptAndFitCrop = () => {
    const thumbnailCanvas = canvasRef.current;
    const croppingCanvas = croppingCanvasRef.current;
    if (!thumbnailCanvas || !croppingCanvas || !crop) {
      return;
    }
    const thumbnailContext = thumbnailCanvas.getContext("2d");
    if (thumbnailContext === null) {
      return;
    }

    // Find "visual" to "actual" canvas scaling values
    const cropCanvasBoundRect = new Rect(
      domRectToRect(croppingCanvas.getBoundingClientRect()),
    );
    const cropCanvasRect = new Rect(getDimensions(croppingCanvas));
    const cropScaling = cropCanvasBoundRect.getScaleValues(cropCanvasRect);

    // Apply scaling values to cropped selection
    const cropRect = new Rect(cropToRect(crop), true);
    const scaledCropRect = cropRect.scaleTo(cropScaling);

    // Scale the scaled, cropped selection to the thumbnail canvas
    const thumbRect = new Rect(getDimensions(thumbnailCanvas));
    const destRect = scaledCropRect.fitTo(thumbRect);

    // Fill empty space with black and draw the final image on the thumbnail canvas
    thumbnailContext.fillStyle = "black";
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
      destRect.height,
    );
    setAcceptedCrop(crop);
    setCropping(false);
    setCanClear(true);
    props.setThumbnailUrl(thumbnailCanvas.toDataURL("image/png"));
  };

  const closeCrop = () => {
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

  const openCropOverlay = (
    sourceImage: HTMLImageElement | HTMLVideoElement,
  ) => {
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

    const sourceRect = new Rect(getDimensions(sourceImage));
    const canvasRect = new Rect(getDimensions(croppingCanvas));
    const destRect = sourceRect.fitTo(canvasRect);

    const context = croppingCanvas.getContext("2d");
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
      destRect.height,
    );
    setCropping(true);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const thumbnailCanvas = canvasRef.current;
        if (!thumbnailCanvas) {
          return;
        }
        const context = thumbnailCanvas.getContext("2d");
        if (!context) {
          return;
        }
        const videoRect = new Rect(getDimensions(img));
        const canvasRect = new Rect(getDimensions(thumbnailCanvas));
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
          destRect.height,
        );
        setUploadedImage(img);
        setCanClear(true);
        props.setThumbnailUrl(thumbnailCanvas.toDataURL("image/png"));
      };
      if (reader.result) {
        img.src = reader.result as string;
      }
    };
    if (event.target.files?.[0]) {
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
      id="thumbnail-container"
      sx={{ backgroundColor: palette.secondary.dark }}
    >
      <div
        id="cropping-overlay"
        style={{ display: cropping ? "block" : "none" }}
      >
        <div id="cropping-overlay-element-container">
          <button id="cropping-close-button" onClick={closeCrop} type="button">
            <CloseIcon />
          </button>
          <div id="cropping-button-grid-container">
            <Grid id="cropping-button-grid" container spacing={1}>
              <Grid xs={6}>
                <button
                  id="cropping-toggle-aspect"
                  onClick={handleToggleAspectClick}
                  type="button"
                >
                  Toggle 1:1 aspect ratio {fixedAspect ? "off" : "on"}
                </button>
              </Grid>
              <Grid xs={6}>
                <button
                  id="cropping-center-selection"
                  onClick={centerCrop}
                  type="button"
                >
                  Center
                </button>
              </Grid>
              <Grid xs={6}>
                <button id="cropping-accept" onClick={acceptCrop} type="button">
                  Accept
                </button>
              </Grid>
              <Grid xs={6}>
                <button
                  id="cropping-accept-fit"
                  onClick={acceptAndFitCrop}
                  type="button"
                >
                  Accept & Fit
                </button>
              </Grid>
            </Grid>
          </div>
          <ReactCrop
            crop={crop ?? undefined}
            onChange={(c) => setCrop(c)}
            aspect={Number(fixedAspect)}
            className="react-crop"
            maxHeight={croppingCanvasRef.current?.height}
          >
            {!crop && (
              <div id="crop-instruct">Click and drag to crop image</div>
            )}
            <canvas id="cropping-canvas" ref={croppingCanvasRef} />
          </ReactCrop>
          <div id="cropping-dimensions">
            Dimensions: {crop?.width || 0}px {"\u00d7"} {crop?.height || 0}px
          </div>
        </div>
      </div>
      <canvas id="thumbnail-canvas" width="400" height="400" ref={canvasRef} />
      <Stack id="thumbnail-button-container" direction="column" spacing={1}>
        <Grid container spacing={1}>
          <Grid xs={6}>
            <button
              id="capture-frame-button"
              type="button"
              onClick={handleCaptureFrame}
            >
              Capture frame
            </button>
          </Grid>
          <Grid xs={6}>
            <Stack id="file-crop-button-container" direction="column">
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.png"
                id="file-selector-input"
                multiple={false}
                onChange={handleUpload}
              />
              <button type="button" onClick={onButtonClick}>
                Upload from file...
              </button>
              <TextField
                id="thumbnail-filename-field"
                size="small"
                style={{ margin: 0 }}
                fullWidth
                hiddenLabel
                color="primary"
                type="text"
                disabled
                InputLabelProps={{ shrink: true }}
                placeholder="Filename"
                value={thumbnailFilename}
              />
              <button
                type="button"
                disabled={!uploadedImage}
                onClick={handleCropUploadedImage}
              >
                Crop uploaded image
              </button>
            </Stack>
          </Grid>
        </Grid>
        <button type="button" disabled={!canClear} onClick={clear}>
          Clear
        </button>
      </Stack>
    </Stack>
  );
}

/**
 * Extract dimensions from various element types
 */
function getDimensions(
  element: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
): { width: number; height: number } {
  if (element instanceof HTMLVideoElement) {
    return { width: element.videoWidth, height: element.videoHeight };
  }
  return { width: element.width, height: element.height };
}

/**
 * Convert a DOMRect to a plain rect object
 */
function domRectToRect(domRect: DOMRect): {
  width: number;
  height: number;
  x: number;
  y: number;
} {
  return {
    width: domRect.width,
    height: domRect.height,
    x: domRect.x,
    y: domRect.y,
  };
}

/**
 * Convert a Crop to a plain rect object
 */
function cropToRect(crop: Crop): {
  width: number;
  height: number;
  x: number;
  y: number;
} {
  return {
    width: crop.width,
    height: crop.height,
    x: crop.x,
    y: crop.y,
  };
}

class Rect {
  public readonly x: number;
  public readonly y: number;
  public readonly width: number;
  public readonly height: number;

  constructor(
    rect: { width: number; height: number; x?: number; y?: number },
    keepCoords = false,
  ) {
    this.width = rect.width;
    this.height = rect.height;
    this.x = keepCoords && rect.x !== undefined ? rect.x : 0;
    this.y = keepCoords && rect.y !== undefined ? rect.y : 0;
  }

  getScaleValues(
    dest: Rect,
    keepAspect = false,
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
        y: this.y * hRatio,
      },
      true,
    );
  }

  fitTo(dest: Rect): Rect {
    const ratio = Math.min(dest.width / this.width, dest.height / this.height);
    return new Rect(
      {
        width: this.width * ratio,
        height: this.height * ratio,
        x: (dest.width - this.width * ratio) / 2,
        y: (dest.height - this.height * ratio) / 2,
      },
      true,
    );
  }
}
