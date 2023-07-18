import React, { ChangeEvent, FormEvent, MutableRefObject, SyntheticEvent, useRef, useState } from 'react';
import './Previewer.css'
import { randomId } from '../services/clipIdentifiers'
import { styled } from '@mui/material/styles';
import { UploadForm } from '../types';
// import * as defaultThumbnail from '../assets/default_thumbnail.jpg';
import Grid from '@mui/material/Unstable_Grid2'; 
import TextField from '@mui/material/TextField'; 
import Slider from '@mui/material/Slider';
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import ReactPlayer from 'react-player'
import Accordion, { AccordionProps } from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';


// const defaultThumbnailBlob = new Blob([ defaultThumbnail ], { type: 'image/jpg' });

export function Previewer(props: {source: File, sourceUrl: string, uploadClip: (clipForm: UploadForm) => void}) {
  const [clipDuration, setClipDuration] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeek, setCurrentSeek] = useState(0);
  const [trimPips, setTrimPips] = useState([0, clipDuration]);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimStartError, setTrimStartError] = useState('')
  const [trimEndError, setTrimEndError] = useState('')

  const [volume, setVolume] = useState(1);
  const minDistance = 5000

  const loadClipDuration = function(d: number) {
    setClipDuration(d)
    setMaxDuration(d)
    setTrimPips([0, d * 1000])
  }

  const handleOnProgress = function(e: any) {
    // Because ReactPlayer updates every 100ms, playedSeconds may exceed
    // trimPips[1], i.e. the trimmed end of the clip, so we re-set it
    // back to the "allowed maximum"
    if (e.playedSeconds * 1000 >= trimPips[1]) {
      playerRef.current?.seekTo(trimPips[1] / 1000, 'seconds')
      setIsPlaying(false)
    } else {
      setCurrentSeek(e.playedSeconds * 1000)
    }
  }

  const handlePlayPause = function() {
    if (!playerRef.current) {
      return
    }
    const currentTime = playerRef.current?.getCurrentTime() * 1000
    
    if (currentTime >= trimPips[1]) {
      playerRef.current?.seekTo(trimPips[0] / 1000)
      setCurrentSeek(trimPips[0])
    }
    setIsPlaying(!isPlaying)
  }
  
  const handleSeekChange = (
    event: Event,
    newValue: number | number[],
  ) => {
    if (Array.isArray(newValue)) {
      return;
    }

    if (trimPips[0] <= newValue && newValue <= trimPips[1]) {
      playerRef.current?.seekTo(newValue / 1000, 'seconds')
      setCurrentSeek(newValue)
    }
  }

  const handleTrimChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number,
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }
    
    if (activeThumb === 0) {
      const value = Math.min(newValue[0], trimPips[1] - minDistance, currentSeek)
      setTrimPips([value, trimPips[1]]);
      setClipDuration((trimPips[1] - value) / 1000)
    } else {
      const value = Math.max(newValue[1], trimPips[0] + minDistance, currentSeek)
      setTrimPips([trimPips[0], value]);
      setClipDuration((value - trimPips[0]) / 1000)
    }
  }

  const handleTrimStartInput = (e: ChangeEvent<HTMLInputElement>) => {
    const value = +e.target.value * 1000
    if (value < 0) {
      setTrimStartError('Start must be greater than 0')
      setTrimPips([0, trimPips[1]])
    } else if (value > trimPips[1] - minDistance) {
      setTrimStartError(`Clip must be at least ${minDistance / 1000}s long`)
    } else if (value > currentSeek) {
      setCurrentSeek(value)
      setTrimPips([value, trimPips[1]])
      playerRef.current?.seekTo(value / 1000)
      setTrimStartError('')
    } else {
      setTrimPips([value, trimPips[1]])
      setTrimStartError('')
    }
  }

  const handleTrimEndInput = (e: ChangeEvent<HTMLInputElement>) => {
    const value = +e.target.value * 1000
    if (value > maxDuration * 1000) {
      setTrimEndError('Cannot exceed max clip length')
      setTrimPips([trimPips[0], Math.trunc(maxDuration * 100) * 10])
    } else if (value < trimPips[0] + minDistance) {
      setTrimEndError(`Clip must be at least ${minDistance / 1000}s long`)
    } else if (value < currentSeek) {
      setCurrentSeek(value)
      setTrimPips([trimPips[0], value])
      playerRef.current?.seekTo(value / 1000)
      setTrimEndError('')
    } else {
      setTrimPips([trimPips[0], value])
      setTrimEndError('')
    }
  }

  const handleVolumeChange = (
    event: Event,
    newValue: number | number[],
  ) => {
    if (Array.isArray(newValue)) {
      return;
    }
    setVolume(newValue)
  }

  return (
    <div id="previewer">
      <div id="video-preview-container">
        <div id="player-box">
          <ReactPlayer
            id="video"
            // controls={false}
            width="100%"
            height="100%"
            volume={volume}
            url={props.sourceUrl}
            ref={playerRef}
            playing={isPlaying}
            onDuration={loadClipDuration}
            progressInterval={100}
            onProgress={handleOnProgress}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
        <VideoController
          isPlaying={isPlaying}
          isTrimming={isTrimming}
          currentSeek={currentSeek}
          trimPips={trimPips}
          maxDuration={maxDuration * 1000}
          volume={volume}
          handleSeekChange={handleSeekChange}
          handleTrimChange={handleTrimChange}
          handlePlayPause={handlePlayPause}
          setIsTrimming={setIsTrimming}
          handleVolumeChange={handleVolumeChange}
        />
        <Stack id="trim-inputs-container" direction="row" spacing={2}>
          <button id="trim-clip-button" onClick={() => setIsTrimming(!isTrimming)} style={isTrimming ? {backgroundColor: "#7774a1"} : {}}>Trim clip</button>
          
          <TextField
            id="trim-start-field"
            label="Start"
            type="number"
            color="secondary"
            size="small"
            error={trimStartError !== ''}
            helperText={trimStartError}
            InputLabelProps={{ shrink: true }} 
            onChange={handleTrimStartInput}
            onBlur={(e) => {
              e.target.value = (trimPips[0] / 1000).toString()
              setTrimStartError('')
            }}
          />

          <TextField
            id="trim-end-field"
            label="End"
            type="number"
            color="secondary"
            size="small"
            error={trimEndError !== ''}
            helperText={trimEndError}
            InputLabelProps={{ shrink: true }} 
            onChange={handleTrimEndInput}
            onBlur={(e) => {
              e.target.value = (trimPips[1] / 1000).toString()
              setTrimEndError('')
            }}
          />

        </Stack>
      </div>
      <FormAccordian source={props.source} uploadClip={props.uploadClip} clipDuration={clipDuration} playerRef={playerRef}/>
    </div>
  );
};

const SeekSlider = styled(Slider)(({ theme }) => ({
  color: "#175f63",
  "& .MuiSlider-track": {
    opacity : 0,
  },
  "& .MuiSlider-rail": {
    opacity : 0,
  },
  '& .MuiSlider-thumb': {
    "z-index": 1,
    width: 20,
    height: 20,
  }
}));

interface TrimSliderProps {
  isTrimming: boolean
}

const TrimSlider = styled(Slider,
  {
    shouldForwardProp: (prop) => prop !== "isTrimming"
  })<TrimSliderProps>(({ isTrimming }) => ({
  color: "#3a8589",
  padding: "13px 0",
  "pointer-events": "none !important",
  "& .MuiSlider-track": {
    height: 10,
    borderRadius: 0,
  },
  "& .MuiSlider-rail": {
    height: 10,
    borderRadius: 0,
  },
  '& .MuiSlider-thumb': {
    "pointer-events": "all !important",
    color: "#175f63",
    height: 24,
    width: 5,
    borderRadius: 0,
    display: isTrimming ? "flex" : "none",
  }
}));

interface VideoControllerProps {
  isPlaying: boolean,
  isTrimming: boolean,
  currentSeek: number,
  trimPips: number[],
  maxDuration: number,
  volume: number,
  handleSeekChange: (e: Event, newValue: number | number[]) => void,
  handleTrimChange: (e: Event, newValue: number | number[], activeThumb: number) => void,
  handleVolumeChange: (e: Event, newValue: number | number[]) => void,
  handlePlayPause: () => void,
  setIsTrimming: (isTrimming: boolean) => void,
}

function VideoController(props: VideoControllerProps) {
  function formatTime(value: number) {
    return new Date(value).toISOString().slice(14, 19);
  }

  return (
    <div id="controller">
      <Stack id="controller-stack" direction="row" spacing={2} alignItems="center">
        <Stack id="slider-stack" direction="row" spacing={2} alignItems="center">
          <IconButton onClick={props.handlePlayPause} >
            {props.isPlaying ? <PauseIcon/> : <PlayArrowIcon/>}
          </IconButton>
          <div id="slider-container">
            <SeekSlider
              id="seeker"
              max={props.maxDuration}
              value={props.currentSeek}
              onChange={props.handleSeekChange}
              valueLabelFormat={formatTime}
              valueLabelDisplay="auto"
              disableSwap
            />
            <TrimSlider
              id="trimmer"
              max={props.maxDuration}
              value={props.trimPips}
              onChange={props.handleTrimChange}
              valueLabelFormat={formatTime}
              valueLabelDisplay="auto"
              disableSwap
              isTrimming={props.isTrimming}
            />
          </div>
          
          <div>{formatTime(props.currentSeek)} / {formatTime(props.maxDuration)}</div>
        </Stack>

        <Stack direction="row" spacing={1}>
          <VolumeDown />
          <Slider
            id="volume-slider"
            size="small"
            color="secondary"
            max={1}
            step={0.05}
            value={props.volume}
            onChange={props.handleVolumeChange}
          />
          <VolumeUp />
        </Stack>
      </Stack>
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
      <Stack id="thumbnail-button-container" direction="column" spacing={1}>
        <Grid container spacing={1}>
          <Grid xs={6}>
            <button id="capture-frame-button" type="button" onClick={handleCaptureFrame}>Capture frame</button>
          </Grid>
          <Grid xs={6}>
            <Stack id="file-crop-button-container" direction="column">
              <input ref={inputRef} type="file" accept=".jpg,.png" id="file-selector-input" multiple={false} onChange={handleUpload} />
              <button type="button" onClick={onButtonClick}>Upload from file...</button>
              <TextField
                id="thumbnail-filename-field"
                size="small"
                style={{margin: 0}}
                fullWidth
                hiddenLabel
                color="primary"
                type="text"
                disabled
                InputLabelProps={{ shrink: true }}
                placeholder="Filename"
                value={thumbnailFilename}
              />
              <button type="button" disabled={!uploadedImage} onClick={handleCropUploadedImage}>Crop uploaded image</button>
            </Stack>
          </Grid>
        </Grid>
        <button type="button" disabled={!canClear} onClick={clear}>Clear</button>
      </Stack>
    </div>
  )
}
