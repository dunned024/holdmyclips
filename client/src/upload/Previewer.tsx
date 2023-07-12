import React, { ChangeEvent, FormEvent, MutableRefObject, SyntheticEvent, useEffect, useRef, useState } from 'react';
import './Previewer.css'
import { randomId } from '../services/clipIdentifiers'
import { styled } from '@mui/material/styles';
import { UploadForm } from '../types';
// import * as defaultThumbnail from '../assets/default_thumbnail.jpg';
import Grid from '@mui/material/Unstable_Grid2'; 
import TextField from '@mui/material/TextField'; 
import Slider, { SliderThumb } from '@mui/material/Slider';
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import ReactPlayer from 'react-player'
import Accordion, { AccordionProps } from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';


// const defaultThumbnailBlob = new Blob([ defaultThumbnail ], { type: 'image/jpg' });

export function Previewer(props: {source: File, sourceUrl: string, uploadClip: (clipForm: UploadForm) => void}) {
  const [clipDuration, setClipDuration] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);
  const [currentSeek, setCurrentSeek] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trimmedStartEnd, setTrimmedStartEnd] = useState([0, clipDuration]);
  const [sliderPips, setSliderPips] = useState([0, 0, clipDuration]);
  const [isTrimming, setIsTrimming] = useState(false);
  const minDistance = 1000

  useEffect(() => {
    if (currentSeek / 1000 === playerRef.current?.getDuration()) {
      setIsPlaying(false)
    }
  }, [currentSeek])

  const _loadClipDuration = function(d: number) {
    setClipDuration(d)
    setTrimmedStartEnd([0, d * 1000])
    setSliderPips([0, 0, d * 1000])
  }

  const handleOnProgress = function(e: any) {
    setCurrentSeek(e.playedSeconds * 1000)
  }

  const handleSeekChange = function(e: any) {
    setCurrentSeek(e.target.value)
    playerRef.current?.seekTo(e.target.value / 1000)
  }

  const handlePlayPause = function() {
    setIsPlaying(!isPlaying)
  }
  
  const handleTrim = (
    event: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    console.log(newValue);
    if (!Array.isArray(newValue)) {
      return;
    }

    if (activeThumb === 0) {
      setTrimmedStartEnd([Math.min(newValue[0], trimmedStartEnd[1] - minDistance), trimmedStartEnd[1]]);
    } else {
      setTrimmedStartEnd([trimmedStartEnd[0], Math.max(newValue[1], trimmedStartEnd[0] + minDistance)]);
    }
  };

  const handleSliderChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    // I think no matter what, I want clicking on the track to move the currentSeek, even while trimming
    console.log(newValue);
    if (!Array.isArray(newValue)) {
      return;
    }

    console.log({
      newValue: newValue,
      activeThumb: activeThumb
    });
    // TODO: this works, but the alternate thumbs are highlighted if active -- maybe there's a way to only allow one active thumb?
    if (isTrimming) {
      if (activeThumb === 0) {
        setSliderPips([Math.min(newValue[0],  sliderPips[1], sliderPips[2] - minDistance), sliderPips[2]]);
      } else if (activeThumb === 2) {
        setSliderPips([sliderPips[0], sliderPips[1], Math.max(newValue[2], sliderPips[0] + minDistance)]);
      } else {
        newValue.forEach(value => {
          if (!sliderPips.includes(value)) {
            setSliderPips([sliderPips[0], value, sliderPips[2]])
            setCurrentSeek(value)
            playerRef.current?.seekTo(value / 1000)
          }
        });
      }
    } else {
      newValue.forEach(value => {
        if (!sliderPips.includes(value)) {
          setSliderPips([sliderPips[0], value, sliderPips[2]])
          setCurrentSeek(value)
          playerRef.current?.seekTo(value / 1000)
        }
      });
    }
  };

  return (
    <div id="previewer">
      <div id="video-preview-container">
        <ReactPlayer
          id="video"
          controls
          width="100%"
          height="100%"
          url={props.sourceUrl}
          ref={playerRef}
          playing={isPlaying}
          onDuration={_loadClipDuration}
          progressInterval={100}
          onProgress={handleOnProgress}
        />
        <div id="trimmer-container">
          <VideoController isPlaying={isPlaying} sliderPips={sliderPips} duration={clipDuration * 1000} handleSliderChange={handleSliderChange} handlePlayPause={handlePlayPause}/>
          {/* <Controller isPlaying={isPlaying} currentSeek={currentSeek} trimmedStartEnd={trimmedStartEnd} handleSeekChange={handleSeekChange} handlePlayPause={handlePlayPause}/> */}
          <TrimController duration={clipDuration * 1000} trimmedStartEnd={trimmedStartEnd} handleTrim={handleTrim} />
        </div>
      </div>
      <FormAccordian source={props.source} uploadClip={props.uploadClip} clipDuration={clipDuration} playerRef={playerRef}/>
    </div>
  );
};


const TrimSlider = styled(Slider)(({ theme }) => ({
  color: "#3a8589",
  height: 3,
  padding: "13px 0",
  "& .MuiSlider-thumb": {
    height: 27,
    width: 27,
    backgroundColor: "#fff",
    border: "1px solid currentColor",
    "&.trim-end": {
      border: "2px dashed purple"
    },
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(58, 133, 137, 0.16)"
    },
    "& .airbnb-bar": {
      height: 9,
      width: 1,
      marginLeft: 1,
      marginRight: 1
    },
    "&.trim-start .airbnb-bar": {
      backgroundColor: "red"
    },
    "&.trim-end .airbnb-bar": {
      backgroundColor: "currentColor"
    }
  },
  "& .MuiSlider-track": {
    height: 3
  },
  "& .MuiSlider-rail": {
    color: theme.palette.mode === "dark" ? "#bfbfbf" : "#d8d8d8",
    opacity: theme.palette.mode === "dark" ? undefined : 1,
    height: 3
  }
}));

function TrimSliderThumbComponent(props: any) {
  const { children, className, ...other } = props;
  const thumbClassMap = ['trimmed-start', 'current-seek', 'trimmed-end']
  const extraClassName = thumbClassMap[other["data-index"]]
  return (
    <SliderThumb {...other} className={`${className} ${extraClassName}`}>
      {children}
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
    </SliderThumb>
  );
}

function VideoController(props: {isPlaying: boolean, sliderPips: number[], duration: number, handleSliderChange: (e: Event, newValue: number | number[], activeThumb: number) => void, handlePlayPause: () => void}) {
  const [trimmedStart, currentSeek, trimmedEnd] = props.sliderPips
  function valueLabelFormat(value: number) {
    const seconds = Math.trunc(value / 10) / 100
    return `${seconds}s`;
  }

  return (
    <div>
      <button onClick={props.handlePlayPause}>Play/Pause</button>
      <div>{`${Math.ceil(currentSeek / 1000).toString()}s`}</div>
      <Slider
        id="seeker"
        max={props.duration}
        value={props.sliderPips}
        onChange={props.handleSliderChange}
        valueLabelFormat={valueLabelFormat}
        valueLabelDisplay="auto"
      />
    </div>
  )

}

function Controller(props: {isPlaying: boolean, currentSeek: number, trimmedStartEnd: number[], handleSeekChange: (e: any) => void, handlePlayPause: () => void}) {
  function valueLabelFormat(value: number) {
    const seconds = Math.trunc(value / 10) / 100
    return `${seconds}s`;
  }

  console.log(props.trimmedStartEnd)
  return (
    <div>
      <button onClick={props.handlePlayPause}>Play/Pause</button>
      <div>{`${Math.ceil(props.currentSeek / 1000).toString()}s`}</div>
      <Slider
        id="seeker"
        min={props.trimmedStartEnd[0]}
        max={props.trimmedStartEnd[1]}
        value={props.currentSeek}
        onChange={props.handleSeekChange}
        valueLabelFormat={valueLabelFormat}
        valueLabelDisplay="auto"
      />
    </div>
  )

}

function TrimController(props: {duration: number, trimmedStartEnd: number[], handleTrim: (e: Event, newValue: number | number[], activeThumb: number) => void}) {
  // I think I want two sliders, one to control playback, and one to control trimming
  // If I could override the video element playback slider I'd be really happy, but I don't think that's possible
  // An array of three values representing the three timestamps we care about:
  //  sliderPips[0] = clip start (can be non-zero if user trims the clips)
  //  sliderPips[1] = current playback time
  //  sliderPips[2] = clip end
  // const [sliderPips, setSliderPips] = useState([0, props.currentSeek, props.duration]);



  // function onChange(e: any) {
  //   // It looks like the "changed value" is the value closest to the selected time
  //   // Here, I can compare the current trimmedStartEnd array to e.target.value to get the "changed value",
  //   // then set the middle value to that. The first and last value will be controlled separately.
  //   // I need to figure out what 'slots' are, and how to style the individual sliders ('thumbs'?)
  //   console.log(e.target)
  //   console.log(e.target.value[1])
  //   setSliderPips([0, e.target.value[1], props.duration])
  //   props.handleSeekChange(e)
  // }
  

  function valueLabelFormat(value: number) {
    const seconds = Math.trunc(value / 10) / 100
    return `${seconds}s`;
  }

  return (
    <div>
      <TrimSlider
        id="trim-slider"
        components={{ Thumb: TrimSliderThumbComponent }}
        max={props.duration}
        value={props.trimmedStartEnd}
        onChange={props.handleTrim}
        valueLabelFormat={valueLabelFormat}
        valueLabelDisplay="auto"
        disableSwap
      />
    </div>
  )

}

const StyledAccordion = styled((props: AccordionProps) => (
  <Accordion disableGutters {...props} />
))(({ theme }) => ({
  'backgroundColor': '#8dc7e8',
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
}));

function FormAccordian(props: {source: File, uploadClip: (formData: UploadForm) => void, clipDuration: number, playerRef: MutableRefObject<ReactPlayer | null>}) {
  const [expanded, setExpanded] = useState<string | false>('panel1');
  const duration = `${Math.ceil(props.clipDuration).toString()}s`

  const handleChange = (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

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
    
    formData.append('duration', duration)
    formData.append('views', '0')
    formData.append('comments', '[]')
    
    props.uploadClip(formData)
  }
  return (
    <form id="clip-details-form" method='put' onSubmit={handleSubmit}>
      <div id="form-container">
        <StyledAccordion
          expanded={expanded === 'panel1'}
          onChange={handleChange('panel1')}
          defaultExpanded={true}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>Details</AccordionSummary>
          <AccordionDetails>
            <div id="form-fields-container">
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
                    value={duration}
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
                    // type="textarea"
                    multiline
                    rows={2}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </div>
          </AccordionDetails>
        </StyledAccordion>
        <StyledAccordion
          expanded={expanded === 'panel2'}
          onChange={handleChange('panel2')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>Thumbnail</AccordionSummary>
          <AccordionDetails>
            <ThumbnailSetter playerRef={props.playerRef} />
          </ AccordionDetails>
        </StyledAccordion>
      </div>
      <div id="submit-button-container">
        <button id="submit-button" type="submit">Upload!</button>
      </div>
    </form>
  )
}

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


function ThumbnailSetter(props: {playerRef: MutableRefObject<ReactPlayer | null>}) {
  const [canClear, setCanClear] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [thumbnailFilename, setThumbnailFilename] = useState<string>('');

  const [cropping, setCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<Crop | null>(null)
  const [acceptedCrop, setAcceptedCrop] = useState<Crop | null>(null);
  const [fixedAspect, setFixedAspect] = useState<boolean>(true)

  const video = (props.playerRef.current?.getInternalPlayer() as HTMLVideoElement)
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
    setUploadedImage(null);
    setThumbnailFilename('')
    setCrop(null);
    setAcceptedCrop(null);
    setCanClear(false);
    if (inputRef.current) {
      (inputRef.current as HTMLInputElement).value = "";
    }
  }

  const handleToggleAspectClick = function() {
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
    const scale = Math.min.apply(Math, [width, height, 800])
    const dx = ( width - scale ) / 2;
    const dy = ( height - scale ) / 2;

    setCrop({unit: 'px', x: dx, y: dy, width: scale, height: scale})
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
    } else {
      setCrop(null)
    }
  }

  const openCropOverlay = function(sourceImage: HTMLImageElement | HTMLVideoElement) {
    const croppingCanvas = croppingCanvasRef.current;
    if (!croppingCanvas) {
      return
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
      setThumbnailFilename(event.target.files[0].name)
    }   
  }

  const onButtonClick = () => {
    if (inputRef.current) {
      (inputRef.current as any).click();
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
    <div id="thumbnail-container">
      <div id="cropping-overlay" style={{display: cropping ? 'block' : 'none'}}>
        <div id="cropping-overlay-element-container">
          <button id="cropping-close-button" onClick={closeCrop}><CloseIcon /></button>
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
          <ReactCrop crop={crop ?? undefined} onChange={c => setCrop(c)} aspect={Number(fixedAspect)} className="react-crop" maxHeight={croppingCanvasRef.current?.height}>
            <canvas id="cropping-canvas" ref={croppingCanvasRef} />
          </ReactCrop>
          <div id="cropping-dimensions">Dimensions: {crop?.width || 0}px {'\u00d7'} {crop?.height || 0}px</div>
        </div>
      </div>
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
              <TextField
                id="thumbnail-filename-field"
                style={{height: '100%'}}
                fullWidth
                hiddenLabel
                color="primary"
                type="text"
                disabled
                // InputProps={{}}
                InputLabelProps={{ shrink: true }}
                placeholder="Filename"
                value={thumbnailFilename}
              />
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
