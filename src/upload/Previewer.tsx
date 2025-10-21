import React, { ChangeEvent, useRef, useState } from 'react';
import './Previewer.css';
import { ClipUploadData, TrimDirectives } from '../types';
import 'react-image-crop/dist/ReactCrop.css';
import ReactPlayer from 'react-player';
import Stack from '@mui/material/Stack';
import { getUsername } from '../services/cognito';
import { FormAccordian } from './components/UploadForm';
import {
  TrimProps,
  TrimSetter,
  TrimSetterProps,
  TrimSlider,
  TrimSliderProps
} from './components/Trimmer';
import { VideoComponent } from '../player/VideoController';
import { formatTime } from '../services/time';

export function Previewer(props: {
  source: File;
  sourceUrl: string;
  uploadClip: (
    clipForm: ClipUploadData,
    thumbnailUrl: string | null,
    trimDirectives?: TrimDirectives
  ) => void;
  setActivePage: (page: number) => void;
}) {
  const playerRef = useRef<ReactPlayer>(null);
  const [clipDuration, setClipDuration] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const [trimPips, setTrimPips] = useState([0, clipDuration * 1000]);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimStartError, setTrimStartError] = useState('');
  const [trimEndError, setTrimEndError] = useState('');

  const minDistance = 5000;

  const username = getUsername();

  const handleUpload = function (
    clipForm: ClipUploadData,
    thumbnailUrl: string | null
  ) {
    props.setActivePage(2);

    if (trimPips[0] !== 0 || trimPips[1] !== maxDuration * 1000) {
      const trimDirectives: TrimDirectives = {
        startTime: new Date(trimPips[0]).toISOString().slice(11, 23),
        endTime: new Date(trimPips[1]).toISOString().slice(11, 23)
      };
      props.uploadClip(clipForm, thumbnailUrl, trimDirectives);
    } else {
      props.uploadClip(clipForm, thumbnailUrl);
    }
  };

  const loadClipDuration = function (d: number) {
    setClipDuration(d);
    setMaxDuration(d);
    setTrimPips([0, d * 1000]);
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
        (playerRef.current?.getCurrentTime() ?? maxDuration) * 1000
      );
      setTrimPips([value, trimPips[1]]);
      setClipDuration((trimPips[1] - value) / 1000);
    } else {
      const value = Math.max(
        newValue[1],
        trimPips[0] + minDistance,
        (playerRef.current?.getCurrentTime() ?? maxDuration) * 1000
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
    } else {
      setTrimPips([trimPips[0], value]);
      setTrimEndError('');
    }
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

  const trimProps: TrimProps = {
    TrimSlider: <TrimSlider {...trimSliderProps} />,
    startTime: trimPips[0],
    endTime: trimPips[1]
  };

  return (
    <Stack id='previewer' direction='row'>
      <VideoComponent
        id='video-component'
        sourceUrl={props.sourceUrl}
        loadClipDuration={loadClipDuration}
        maxDuration={maxDuration}
        trimProps={trimProps}
        playerRef={playerRef}
      />
      <FormAccordian
        id='clip-details-form'
        source={props.source}
        uploadClip={handleUpload}
        username={username}
        clipDuration={clipDuration}
        playerRef={playerRef}
        TrimComponent={trimSetter}
      />
    </Stack>
  );
}
