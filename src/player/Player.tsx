import { Grid, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { palette } from "src/assets/themes/theme";
import { VideoComponent } from "src/player/VideoController";
import { getClipMetadata } from "src/services/clips";
import { getUsername } from "src/services/cognito";
import { readableTimestamp, secondsToMMSS } from "src/services/time";
import type { Clip } from "src/types";
import "src/player/Player.css";
import { API_ENDPOINT } from "src/config";
import { CommentsContainer } from "src/player/CommentsContainer";

export function Player() {
  const { clipId } = useParams();

  const [clip, setClip] = useState<Clip>();
  const [maxDuration, setMaxDuration] = useState(0);

  const username = getUsername();

  useEffect(() => {
    async function getClip(id: string) {
      const clipMetadata = await getClipMetadata(id);
      setClip(clipMetadata);
    }

    if (!clip && clipId) {
      getClip(clipId);
    }
  }, [clipId, clip]);

  if (!clipId || !clip) {
    return <span />;
  }

  return (
    <Stack id="player">
      <Stack id="clip-container">
        <VideoComponent
          sourceUrl={`${API_ENDPOINT}/clips/${clipId}/${clipId}.${clip.fileExtension || "mp4"}`}
          maxDuration={maxDuration}
          loadClipDuration={setMaxDuration}
        />
        <h1 id="title">{clip?.title}</h1>
      </Stack>
      <Stack id="sidebar">
        <ClipDetails clip={clip} />
        <CommentsContainer clipId={clipId} username={username} />
      </Stack>
    </Stack>
  );
}

function ClipDetails(props: { clip: Clip }) {
  return (
    <Stack
      id="details-container"
      sx={{ backgroundColor: palette.secondary.light }}
      direction="column"
      spacing={2}
    >
      <Grid id="stats-container" container textAlign="left" spacing={1}>
        <Grid id="uploader-text" item xs={12}>
          <span>
            Uploader: <b>{props.clip.uploader}</b>
          </span>
        </Grid>
        <Grid id="uploaded-at-text" item xs={12}>
          <span>
            Uploaded on: <b>{readableTimestamp(props.clip.uploadedOn)}</b>
          </span>
        </Grid>
        <Grid id="duration-text" item xs={6}>
          Duration: <b>{secondsToMMSS(props.clip.duration)}</b>
        </Grid>
        <Grid id="views-text" item textAlign="right" xs={6}>
          <b>{props.clip.views ?? "?"}</b> views
        </Grid>
      </Grid>
      {props.clip.description && (
        <Stack
          id="description-container"
          sx={{ backgroundColor: palette.secondary.main }}
        >
          {props.clip.description}
        </Stack>
      )}
    </Stack>
  );
}
