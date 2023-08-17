import React, { ChangeEvent, useRef, useState } from 'react';
import './Previewer.css';
import { ClipUploadData } from '../types';
import 'react-image-crop/dist/ReactCrop.css';
import ReactPlayer from 'react-player';
import Stack from '@mui/material/Stack';
import { getUsername } from '../services/cognito';
import { FormAccordian } from './components/UploadForm';
import {
  TrimSetter,
  TrimSetterProps,
  TrimSlider,
  TrimSliderProps
} from './components/Trimmer';
import { VideoController } from '../player/VideoController';
import { formatTime } from '../services/time';
import { OnProgressProps } from 'react-player/base';

export function Previewer(props: {
  source: File;
  sourceUrl: string;
  uploadClip: (clipForm: ClipUploadData) => void;
}) {
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

  const username = getUsername();

  const loadClipDuration = function (d: number) {
    setClipDuration(d);
    setMaxDuration(d);
    setTrimPips([0, d * 1000]);
  };

  const handleOnProgress = function (e: OnProgressProps) {
    console.log(typeof e);
    console.log(e);
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

  const handleTrimStartInput = (e: ChangeEvent<HTMLInputElement>) => {
    const value = +e.target.value * 1000;
    if (value < 0) {
      setTrimStartError('Start must be greater than 0');
      setTrimPips([0, trimPips[1]]);
    } else if (value > trimPips[1] - minDistance) {
      setTrimStartError(`Clip must be at least ${minDistance / 1000}s long`);
    } else if (value > currentSeek) {
      setCurrentSeek(value);
      setTrimPips([value, trimPips[1]]);
      playerRef.current?.seekTo(value / 1000);
      setTrimStartError('');
    } else {
      setTrimPips([value, trimPips[1]]);
      setTrimStartError('');
    }
  };

  const handleTrimEndInput = (e: ChangeEvent<HTMLInputElement>) => {
    const value = +e.target.value * 1000;
    if (value > maxDuration * 1000) {
      setTrimEndError('Cannot exceed max clip length');
      setTrimPips([trimPips[0], Math.trunc(maxDuration * 100) * 10]);
    } else if (value < trimPips[0] + minDistance) {
      setTrimEndError(`Clip must be at least ${minDistance / 1000}s long`);
    } else if (value < currentSeek) {
      setCurrentSeek(value);
      setTrimPips([trimPips[0], value]);
      playerRef.current?.seekTo(value / 1000);
      setTrimEndError('');
    } else {
      setTrimPips([trimPips[0], value]);
      setTrimEndError('');
    }
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      return;
    }
    setVolume(newValue);
  };

  const trimSetterProps: TrimSetterProps = {
    trimPips,
    isTrimming,
    setIsTrimming,
    trimStartError,
    setTrimStartError,
    handleTrimStartInput,
    trimEndError,
    setTrimEndError,
    handleTrimEndInput
  };

  const trimSetter = <TrimSetter {...trimSetterProps} />;

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
    <Stack id='previewer' direction='row'>
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
      <FormAccordian
        source={props.source}
        uploadClip={props.uploadClip}
        username={username}
        clipDuration={clipDuration}
        playerRef={playerRef}
        TrimComponent={trimSetter}
      />
    </Stack>
  );
}
