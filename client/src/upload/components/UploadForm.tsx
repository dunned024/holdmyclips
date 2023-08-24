import React, {
  ChangeEvent,
  FormEvent,
  MutableRefObject,
  ReactElement,
  useState
} from 'react';
import './UploadForm.css';
import { randomId } from '../../services/clipIdentifiers';
import { styled } from '@mui/material/styles';
import { ClipUploadData } from '../../types';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import 'react-image-crop/dist/ReactCrop.css';
import ReactPlayer from 'react-player';
import Accordion, { AccordionProps } from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Stack from '@mui/material/Stack';
import { palette } from '../../assets/themes/theme';
import { ThumbnailSetter } from './Thumbnail';

interface FormAccordianProps {
  id?: string;
  source: File;
  uploadClip: (formData: ClipUploadData) => void;
  clipDuration: number;
  username: string | undefined;
  playerRef: MutableRefObject<ReactPlayer | null>;
  TrimComponent: ReactElement;
}

const StyledAccordion = styled((props: AccordionProps) => (
  <Accordion disableGutters {...props} />
))(({ theme }) => ({
  backgroundColor: palette.secondary.light,
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0
  }
}));

export function FormAccordian(props: FormAccordianProps) {
  const [expanded, setExpanded] = useState<string | false>('panel1');
  const duration = `${Math.ceil(props.clipDuration).toString()}s`;

  const [title, setTitle] = useState<string>(props.source.name);
  const [description, setDescription] = useState<string | undefined>();
  const [titleError, setTitleError] = useState<string | undefined>();

  const handleTitleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setTitleError('Title cannot be empty');
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

  const handleSubmit = function (e: FormEvent) {
    e.preventDefault();

    if (!title) {
      console.log('error: must include title');
      return;
    }

    if (!props.username) {
      console.log('error: are you logged in??');
      return;
    }

    const clipUploadDetails: ClipUploadData = {
      id: randomId(),
      title,
      duration,
      uploader: props.username,
      description,
      views: '0',
      comments: '[]'
    };

    console.log(clipUploadDetails);
    props.uploadClip(clipUploadDetails);
  };

  return (
    <div id={props.id}>
      <Stack id='form-container'>
        <StyledAccordion
          expanded={expanded === 'panel1'}
          onChange={handlePanelChange('panel1')}
          defaultExpanded={true}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Details
          </AccordionSummary>
          <AccordionDetails sx={{ flexGrow: 1 }}>
            <Grid id='form-grid' container spacing={2}>
              <Grid xs={12} className='field'>
                <TextField
                  label='Title'
                  color='primary'
                  fullWidth
                  type='text'
                  InputLabelProps={{ shrink: true }}
                  value={title}
                  onChange={handleTitleInputChange}
                  error={titleError !== undefined}
                  helperText={titleError}
                  required
                />
              </Grid>
              <Grid xs={4} className='field'>
                <TextField
                  label='Duration'
                  color='primary'
                  disabled
                  InputLabelProps={{ shrink: true }}
                  value={duration}
                />
              </Grid>
              <Grid xs={8} className='field'>
                <TextField
                  label='Uploader'
                  fullWidth
                  color='primary'
                  type='text'
                  disabled
                  InputLabelProps={{ shrink: true }}
                  defaultValue={props.username || ''}
                />
              </Grid>
              <Grid xs={12} className='field'>
                <TextField
                  label='Description'
                  color='primary'
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
          expanded={expanded === 'panel2'}
          onChange={handlePanelChange('panel2')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Thumbnail
          </AccordionSummary>
          <AccordionDetails>
            <ThumbnailSetter playerRef={props.playerRef} />
          </AccordionDetails>
        </StyledAccordion>
        <StyledAccordion
          expanded={expanded === 'panel3'}
          onChange={handlePanelChange('panel3')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Trimming
          </AccordionSummary>
          <AccordionDetails>{props.TrimComponent}</AccordionDetails>
        </StyledAccordion>
      </Stack>
      <button id='submit-button' onClick={handleSubmit}>
        Upload!
      </button>
    </div>
  );
}
