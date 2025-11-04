import Slider, { type SliderProps } from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import type { ChangeEvent, ReactElement } from "react";
import "react-image-crop/dist/ReactCrop.css";
import { palette } from "src/assets/themes/theme";
import "src/pages/upload/components/Trimmer.css";

export interface TrimProps {
  TrimSlider: ReactElement;
  startTime: number;
  endTime: number;
}

export interface TrimSliderProps extends SliderProps {
  isTrimming: boolean;
}

export const TrimSlider = styled(Slider, {
  shouldForwardProp: (prop) => prop !== "isTrimming",
})<TrimSliderProps>(({ isTrimming }) => ({
  color: palette.secondary.main,
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
  "& .MuiSlider-thumb": {
    "pointer-events": "all !important",
    color: palette.secondary.dark,
    height: 24,
    width: 5,
    borderRadius: 0,
    display: isTrimming ? "flex" : "none",
  },
}));

export interface TrimSetterProps {
  trimPips: number[];
  isTrimming: boolean;
  setIsTrimming: (isTrimming: boolean) => void;

  trimStartError: string;
  setTrimStartError: (e: string) => void;
  handleTrimStartInput: (e: ChangeEvent<HTMLInputElement>) => void;

  trimEndError: string;
  setTrimEndError: (e: string) => void;
  handleTrimEndInput: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function TrimSetter(props: TrimSetterProps) {
  return (
    <Stack id="trim-inputs-container" spacing={2}>
      <button
        id="trim-clip-button"
        onClick={() => props.setIsTrimming(!props.isTrimming)}
        style={
          props.isTrimming ? { backgroundColor: palette.secondary.dark } : {}
        }
        type="button"
      >
        Show trim sliders
      </button>

      <TextField
        id="trim-start-field"
        label="Start"
        type="number"
        color="secondary"
        size="small"
        error={props.trimStartError !== ""}
        helperText={props.trimStartError}
        InputLabelProps={{ shrink: true }}
        onChange={props.handleTrimStartInput}
        value={props.trimPips[0] / 1000}
        onBlur={(e) => {
          e.target.value = (props.trimPips[0] / 1000).toString();
          props.setTrimStartError("");
        }}
      />

      <TextField
        id="trim-end-field"
        label="End"
        type="number"
        color="secondary"
        size="small"
        error={props.trimEndError !== ""}
        helperText={props.trimEndError}
        InputLabelProps={{ shrink: true }}
        onChange={props.handleTrimEndInput}
        value={props.trimPips[1] / 1000}
        onBlur={(e) => {
          e.target.value = (props.trimPips[1] / 1000).toString();
          props.setTrimEndError("");
        }}
      />
    </Stack>
  );
}
