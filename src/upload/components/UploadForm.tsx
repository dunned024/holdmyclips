import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion, { type AccordionProps } from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Unstable_Grid2";
import { styled } from "@mui/material/styles";
import {
  type ChangeEvent,
  type FormEvent,
  type MutableRefObject,
  type ReactElement,
  useState,
} from "react";
import type ReactPlayer from "react-player";
import "react-image-crop/dist/ReactCrop.css";
import { palette } from "src/assets/themes/theme";
import { randomId } from "src/services/clipIdentifiers";
import type { ClipUploadData } from "src/types";
import { ThumbnailSetter } from "src/upload/components/Thumbnail";
import "src/upload/components/UploadForm.css";
import { useAuthContext } from "src/context/AuthContext";

interface FormAccordianProps {
  id?: string;
  source: File;
  uploadClip: (formData: ClipUploadData, thumbnailUrl: string | null) => void;
  clipDuration: number;
  playerRef: MutableRefObject<ReactPlayer | null>;
  TrimComponent: ReactElement;
}

const StyledAccordion = styled((props: AccordionProps) => (
  <Accordion disableGutters {...props} />
))(({ theme }) => ({
  backgroundColor: palette.secondary.light,
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
}));

export function FormAccordian(props: FormAccordianProps) {
  const { username } = useAuthContext();
  const [expanded, setExpanded] = useState<string | false>("panel1");
  const duration = `${Math.ceil(props.clipDuration).toString()}s`;

  const [title, setTitle] = useState<string>(props.source.name);
  const [description, setDescription] = useState<string | undefined>();
  const [titleError, setTitleError] = useState<string | undefined>();

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const handleTitleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setTitleError("Title cannot be empty");
    } else {
      setTitleError(undefined);
    }
    setTitle(e.target.value);
  };

  const handleDescriptionInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value ?? undefined);
  };

  const handlePanelChange = (panel: string) => () => {
    setExpanded(panel);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!title) {
      console.log("error: must include title");
      return;
    }

    if (!username) {
      console.log("error: are you logged in??");
      return;
    }

    const clipUploadDetails: ClipUploadData = {
      id: randomId(),
      title,
      duration: props.clipDuration.toString(),
      uploader: username,
      uploadedOn: Date.now(),
      description,
      fileExtension: props.source.name.split(".").pop() as
        | "mp4"
        | "mov"
        | "webm",
      // views: 0,
      // comments: '[]'
    };

    console.log(clipUploadDetails);
    props.uploadClip(clipUploadDetails, thumbnailUrl);
  };

  return (
    <div id={props.id}>
      <Stack id="form-container">
        <StyledAccordion
          expanded={expanded === "panel1"}
          onChange={handlePanelChange("panel1")}
          defaultExpanded={true}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Details
          </AccordionSummary>
          <AccordionDetails sx={{ flexGrow: 1 }}>
            <Grid id="form-grid" container spacing={2}>
              <Grid xs={12} className="field">
                <TextField
                  label="Title"
                  color="primary"
                  fullWidth
                  type="text"
                  InputLabelProps={{ shrink: true }}
                  value={title}
                  onChange={handleTitleInputChange}
                  error={titleError !== undefined}
                  helperText={titleError}
                  required
                />
              </Grid>
              <Grid xs={4} className="field">
                <TextField
                  label="Duration"
                  color="primary"
                  disabled
                  InputLabelProps={{ shrink: true }}
                  value={duration}
                />
              </Grid>
              <Grid xs={8} className="field">
                <TextField
                  label="Uploader"
                  fullWidth
                  color="primary"
                  type="text"
                  disabled
                  InputLabelProps={{ shrink: true }}
                  defaultValue={username ?? ""}
                />
              </Grid>
              <Grid xs={12} className="field">
                <TextField
                  label="Description"
                  color="primary"
                  fullWidth
                  multiline
                  rows={2}
                  value={description}
                  onChange={handleDescriptionInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </StyledAccordion>
        <StyledAccordion
          expanded={expanded === "panel2"}
          onChange={handlePanelChange("panel2")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Thumbnail
          </AccordionSummary>
          <AccordionDetails>
            <ThumbnailSetter
              playerRef={props.playerRef}
              setThumbnailUrl={setThumbnailUrl}
            />
          </AccordionDetails>
        </StyledAccordion>
        <StyledAccordion
          expanded={expanded === "panel3"}
          onChange={handlePanelChange("panel3")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Trimming
          </AccordionSummary>
          <AccordionDetails>{props.TrimComponent}</AccordionDetails>
        </StyledAccordion>
      </Stack>
      <button id="submit-button" onClick={handleSubmit} type="button">
        Upload!
      </button>
    </div>
  );
}
