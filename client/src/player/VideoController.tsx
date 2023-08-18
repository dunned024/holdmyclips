import React, { ReactElement, useRef, useState } from 'react';
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
import { TrimSlider, TrimSliderProps } from '../upload/components/Trimmer';
import { OnProgressProps } from 'react-player/base';
import { getUsername } from '../services/cognito';

export function VideoComponent(props: any) {
  const playerRef = useRef<ReactPlayer>(null);
  const [clipDuration, setClipDuration] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSeek, setCurrentSeek] = useState(0);
  const [trimPips, setTrimPips] = useState([0, clipDuration]);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimStartError, setTrimStartError] = useState('');
  const [trimEndError, setTrimEndError] = useState('');

  const [volume, setVolume] = useState(1);
  const minDistance = 5000;


  const loadClipDuration = function (d: number) {
    setClipDuration(d);
    setMaxDuration(d);
    setTrimPips([0, d * 1000]);
  };

  const handleOnProgress = function (e: OnProgressProps) {
    // Because ReactPlayer updates every 100ms, playedSeconds may exceed
    // trimPips[1], i.e. the trimmed end of the clip, so we re-set it
    // back to the "allowed maximum"
    if (e.playedSeconds * 1000 >= trimPips[1]) {
      playerRef.current?.seekTo(trimPips[1] / 1000, 'seconds');
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

    if (currentTime >= trimPips[1]) {
      playerRef.current?.seekTo(trimPips[0] / 1000);
      setCurrentSeek(trimPips[0]);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeekChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      return;
    }

    if (trimPips[0] <= newValue && newValue <= trimPips[1]) {
      playerRef.current?.seekTo(newValue / 1000, 'seconds');
      setCurrentSeek(newValue);
    }
  };

  const handleTrimChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    if (activeThumb === 0) {
      const value = Math.min(
        newValue[0],
        trimPips[1] - minDistance,
        currentSeek
      );
      setTrimPips([value, trimPips[1]]);
      setClipDuration((trimPips[1] - value) / 1000);
    } else {
      const value = Math.max(
        newValue[1],
        trimPips[0] + minDistance,
        currentSeek
      );
      setTrimPips([trimPips[0], value]);
      setClipDuration((value - trimPips[0]) / 1000);
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      return;
    }
    setVolume(newValue);
  };

  const trimSliderProps: TrimSliderProps = {
    id: 'trimmer',
    max: maxDuration * 1000,
    value: trimPips,
    onChange: handleTrimChange,
    valueLabelFormat: formatTime,
    valueLabelDisplay: 'auto',
    disableSwap: true,
    isTrimming: isTrimming
  };

  const trimSlider = <TrimSlider {...trimSliderProps} />;

  return (
    <Stack id='video-preview-container'>
      <div id='player-box'>
        <ReactPlayer
          id='video'
          width='100%'
          height='100%'
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
        currentSeek={currentSeek}
        clipDuration={maxDuration * 1000}
        volume={volume}
        handleSeekChange={handleSeekChange}
        handlePlayPause={handlePlayPause}
        handleVolumeChange={handleVolumeChange}
        TrimSlider={trimSlider}
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
