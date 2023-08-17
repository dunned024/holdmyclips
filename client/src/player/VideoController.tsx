import React, { ReactElement } from 'react';
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

const SeekSlider = styled(Slider)(({ theme }) => ({
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

export interface VideoControllerProps {
  isPlaying: boolean;
  currentSeek: number;
  volume: number;
  handleSeekChange: (e: Event, newValue: number | number[]) => void;
  handleVolumeChange: (e: Event, newValue: number | number[]) => void;
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
