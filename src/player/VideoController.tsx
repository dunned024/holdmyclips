import FullscreenIcon from "@mui/icons-material/Fullscreen";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import { type RefObject, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import type { OnProgressProps } from "react-player/base";
import screenfull from "screenfull";
import "react-image-crop/dist/ReactCrop.css";
import { palette } from "src/assets/themes/theme";
import { formatTime } from "src/services/time";
import type { TrimProps } from "src/upload/components/Trimmer";
import "src/player/VideoController.css";

interface VideoComponentProps {
  id?: string;
  sourceUrl: string;
  maxDuration: number;
  loadClipDuration: (d: number) => void;
  trimProps?: TrimProps;
  playerRef?: RefObject<ReactPlayer>;
}

export function VideoComponent(props: VideoComponentProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeek, setCurrentSeek] = useState(0);
  const nullPlayerRef = useRef<ReactPlayer>(null);
  const playerRef = props.playerRef ?? nullPlayerRef;

  const [volume, setVolume] = useState<number>(1);

  const controllerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load stored volume preference from localStorage
    const storedVolume = localStorage.getItem("videoVolume");
    if (storedVolume !== null) {
      setVolume(Number.parseFloat(storedVolume));
    }
  }, []);

  const clipDuration = props.maxDuration * 1000;

  let startTime = 0;
  let endTime: number = props.maxDuration * 1000;
  if (props.trimProps) {
    startTime = props.trimProps.startTime;
    endTime = props.trimProps.endTime;

    if (startTime > currentSeek) {
      setCurrentSeek(startTime);
      playerRef.current?.seekTo(startTime / 1000, "seconds");
    } else if (endTime < currentSeek) {
      setCurrentSeek(endTime);
      playerRef.current?.seekTo(endTime / 1000, "seconds");
    }
  }

  const handleOnProgress = (e: OnProgressProps) => {
    // Because ReactPlayer updates every 100ms, playedSeconds may exceed
    // endTime], i.e. the trimmed end of the clip, so we re-set it
    // back to the "allowed maximum"
    if (e.playedSeconds * 1000 >= endTime) {
      playerRef.current?.seekTo(endTime / 1000, "seconds");
      setIsPlaying(false);
    } else {
      setCurrentSeek(e.playedSeconds * 1000);
    }
  };

  const handlePlayPause = () => {
    if (!playerRef.current) {
      return;
    }
    const currentTime = playerRef.current?.getCurrentTime() * 1000;

    if (currentTime >= endTime) {
      playerRef.current?.seekTo(startTime / 1000, "seconds");
      setCurrentSeek(startTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeekChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      return;
    }

    if (startTime <= newValue && newValue <= endTime) {
      playerRef.current?.seekTo(newValue / 1000, "seconds");
      setCurrentSeek(newValue);
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      return;
    }
    setVolume(newValue);
    localStorage.setItem("videoVolume", newValue.toString());
  };

  const handleFullscreen = () => {
    if (screenfull.isEnabled) {
      if (controllerRef.current) {
        screenfull.request(controllerRef.current);
      }
    }
  };

  return (
    <Stack id={props.id} ref={controllerRef}>
      <div
        id="aspect-ratio-wrapper"
        onClick={handlePlayPause}
        onKeyDown={handlePlayPause}
        onKeyUp={handlePlayPause}
        onKeyPress={handlePlayPause}
      >
        {!isPlaying && (
          <span id="paused-button">
            <PlayArrowIcon fontSize="inherit" />
          </span>
        )}
        <ReactPlayer
          id="video"
          width="100%" // Using the 'responsive player' trick for fixed aspect ratio
          height="100%" // https://github.com/cookpete/react-player#responsive-player
          volume={volume}
          url={props.sourceUrl}
          ref={playerRef}
          playing={isPlaying}
          onDuration={props.loadClipDuration}
          progressInterval={100}
          onProgress={handleOnProgress}
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      <Stack
        id="controller"
        style={{
          backgroundColor: palette.secondary.light,
          color: palette.secondary.contrastText,
        }}
      >
        <Stack
          id="controller-stack"
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Stack
            id="slider-stack"
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <IconButton onClick={handlePlayPause}>
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>

            <Stack id="slider-container">
              <SeekSlider
                id="seeker"
                max={clipDuration}
                value={currentSeek}
                onChange={handleSeekChange}
                valueLabelFormat={formatTime}
                valueLabelDisplay="auto"
                hideTrack={props.trimProps !== undefined}
                disableSwap
              />
              {props.trimProps?.TrimSlider}
            </Stack>

            <Stack>
              {formatTime(currentSeek)} / {formatTime(clipDuration)}
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1}>
            <VolumeDown />
            <Slider
              id="volume-slider"
              size="small"
              color="secondary"
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
            />
            <VolumeUp />
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={handleFullscreen}>
              <FullscreenIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}

const SeekSlider = styled(Slider, {
  shouldForwardProp: (prop) => prop !== "hideTrack",
})<{ hideTrack: boolean }>(({ hideTrack }) => ({
  color: hideTrack ? palette.secondary.dark : palette.secondary.main,
  "& .MuiSlider-track": hideTrack
    ? {
        opacity: 0,
      }
    : {
        height: 10,
        borderRadius: 0,
      },
  "& .MuiSlider-rail": hideTrack
    ? {
        opacity: 0,
      }
    : {
        height: 10,
        borderRadius: 0,
      },
  "& .MuiSlider-thumb": {
    color: palette.secondary.dark,
    "z-index": 1,
    width: 20,
    height: 20,
  },
}));
