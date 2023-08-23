import React, { ReactElement, RefObject, useRef, useState } from 'react';
import './VideoController.css';
import { styled } from '@mui/material/styles';
import Slider from '@mui/material/Slider';
import 'react-image-crop/dist/ReactCrop.css';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';
import { palette } from '../assets/themes/theme';
import { formatTime } from '../services/time';
import ReactPlayer from 'react-player';
import { OnProgressProps } from 'react-player/base';
import { TrimProps } from '../upload/components/Trimmer';

interface VideoComponentProps {
  sourceUrl: string;
  maxDuration: number;
  loadClipDuration: (d: number) => void;
  trimProps?: TrimProps;
  playerRef?: RefObject<ReactPlayer>;
}

export function VideoComponent(props: VideoComponentProps) {
  const playerRef = props.playerRef ?? useRef<ReactPlayer>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeek, setCurrentSeek] = useState(0);

  const [volume, setVolume] = useState(1);

  let startTime: number = 0;
  let endTime: number = props.maxDuration * 1000;
  if (props.trimProps) {
    startTime = props.trimProps.startTime;
    endTime = props.trimProps.endTime;

    if (startTime > currentSeek) {
      setCurrentSeek(startTime);
      playerRef.current?.seekTo(startTime / 1000);
    } else if (endTime < currentSeek) {
      setCurrentSeek(endTime);
      playerRef.current?.seekTo(endTime / 1000);
    }
  }

  const handleOnProgress = function (e: OnProgressProps) {
    // Because ReactPlayer updates every 100ms, playedSeconds may exceed
    // endTime], i.e. the trimmed end of the clip, so we re-set it
    // back to the "allowed maximum"
    if (e.playedSeconds * 1000 >= endTime) {
      playerRef.current?.seekTo(endTime / 1000, 'seconds');
      setIsPlaying(false);
    } else {
      setCurrentSeek(e.playedSeconds * 1000);
    }
  };

  const handlePlayPause = function () {
    if (!playerRef.current) {
      return;
    }
    const currentTime = playerRef.current?.getCurrentTime() * 1000;

    if (currentTime >= endTime) {
      playerRef.current?.seekTo(startTime / 1000);
      setCurrentSeek(startTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeekChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      return;
    }

    if (startTime <= newValue && newValue <= endTime) {
      playerRef.current?.seekTo(newValue / 1000, 'seconds');
      setCurrentSeek(newValue);
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      return;
    }
    setVolume(newValue);
  };

  return (
    <Stack id='video-preview-container'>
      <div id='player-box'>
        <ReactPlayer
          id='video'
          width='100%'
          height='100%'
          volume={volume}
          url={props.sourceUrl}
          ref={playerRef} // either need to pass this in as a prop or couple everything back together -- can't capture thumbnail from frame
          playing={isPlaying}
          onDuration={props.loadClipDuration}
          progressInterval={100}
          onProgress={handleOnProgress}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
      <VideoController
        isPlaying={isPlaying}
        currentSeek={currentSeek}
        clipDuration={props.maxDuration * 1000}
        volume={volume}
        handleSeekChange={handleSeekChange}
        handlePlayPause={handlePlayPause}
        handleVolumeChange={handleVolumeChange}
        TrimSlider={props.trimProps?.TrimSlider}
      />
    </Stack>
  );
}

export interface VideoControllerProps {
  currentSeek: number;
  handleSeekChange: (e: Event, newValue: number | number[]) => void;

  volume: number;
  handleVolumeChange: (e: Event, newValue: number | number[]) => void;

  isPlaying: boolean;
  handlePlayPause: () => void;

  clipDuration: number;

  TrimSlider?: ReactElement;
}

export function VideoController(props: VideoControllerProps) {
  return (
    <div
      id='controller'
      style={{
        backgroundColor: palette.secondary.light,
        color: palette.secondary.contrastText
      }}
    >
      <Stack
        id='controller-stack'
        direction='row'
        spacing={2}
        alignItems='center'
      >
        <Stack
          id='slider-stack'
          direction='row'
          spacing={2}
          alignItems='center'
        >
          <IconButton onClick={props.handlePlayPause}>
            {props.isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <div id='slider-container'>
            <SeekSlider
              id='seeker'
              max={props.clipDuration}
              value={props.currentSeek}
              onChange={props.handleSeekChange}
              valueLabelFormat={formatTime}
              valueLabelDisplay='auto'
              disableSwap
            />
            {props.TrimSlider}
          </div>

          <div>
            {formatTime(props.currentSeek)} / {formatTime(props.clipDuration)}
          </div>
        </Stack>

        <Stack direction='row' spacing={1}>
          <VolumeDown />
          <Slider
            id='volume-slider'
            size='small'
            color='secondary'
            max={1}
            step={0.05}
            value={props.volume}
            onChange={props.handleVolumeChange}
          />
          <VolumeUp />
        </Stack>
      </Stack>
    </div>
  );
}

const SeekSlider = styled(Slider)(() => ({
  color: palette.secondary.dark,
  '& .MuiSlider-track': {
    opacity: 0
  },
  '& .MuiSlider-rail': {
    opacity: 0
  },
  '& .MuiSlider-thumb': {
    'z-index': 1,
    width: 20,
    height: 20
  }
}));
