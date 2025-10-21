import { type PaletteColorOptions, createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    palette: PaletteOptions;
  }
  interface PaletteOptions {
    primary?: PaletteColorOptions;
    secondary?: PaletteColorOptions;
    tertiary?: PaletteColorOptions;
  }
}

export const palette = {
  primary: {
    light: "#6c97b2",
    main: "#46758f",
    dark: "#294e62",
    contrastText: "white",
  },
  secondary: {
    light: "#67b1a8",
    main: "#418378",
    dark: "#37635a",
    contrastText: "black",
  },
  tertiary: {
    light: "#b3908d",
    main: "#a17774",
    dark: "#8f5f5c",
    contrastText: "#eee6ed",
  },
};

export const THEME = createTheme({ palette });
