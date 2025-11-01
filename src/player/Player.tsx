import { Grid, IconButton, Stack, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { palette } from "src/assets/themes/theme";
import { VideoComponent } from "src/player/VideoController";
import { getClipMetadata } from "src/services/clips";
import { readableTimestamp, secondsToMMSS } from "src/services/time";
import type { Clip } from "src/types";
import "src/player/Player.css";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useAuth } from "react-oidc-context";
import { API_ENDPOINT } from "src/config";
import { useAuthContext } from "src/context/AuthContext";
import { CommentsContainer } from "src/player/CommentsContainer";
import {
  checkIfLiked,
  incrementView,
  likeClip,
  unlikeClip,
} from "src/services/interactions";

export function Player() {
  const { clipId } = useParams();

  const [clip, setClip] = useState<Clip>();
  const [maxDuration, setMaxDuration] = useState(0);

  const { username } = useAuthContext();

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
          onFirstPlay={() => incrementView(clipId)}
        />
        <h1 id="title">{clip?.title}</h1>
      </Stack>
      <Stack id="sidebar">
        <ClipDetails clip={clip} clipId={clipId} />
        <CommentsContainer clipId={clipId} username={username} />
      </Stack>
    </Stack>
  );
}

function ClipDetails(props: { clip: Clip; clipId: string }) {
  const auth = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(props.clip.likes);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if the current user has liked this clip when component mounts
  useEffect(() => {
    async function checkLikeStatus() {
      if (auth.isAuthenticated && auth.user?.access_token) {
        const liked = await checkIfLiked(props.clipId, auth.user.access_token);
        setIsLiked(liked);
      }
    }
    checkLikeStatus();
  }, [auth.isAuthenticated, auth.user?.access_token, props.clipId]);

  const handleLikeToggle = async () => {
    if (!auth.isAuthenticated || !auth.user?.access_token) {
      auth.signinRedirect();
      return;
    }

    // Optimistic update: Update UI immediately
    const previousIsLiked = isLiked;
    const previousLikes = likes;

    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
    setIsProcessing(true);

    try {
      // Send the request asynchronously
      if (previousIsLiked) {
        const result = await unlikeClip(props.clipId, auth.user.access_token);
        if (!result.success) {
          // Revert on error
          setIsLiked(previousIsLiked);
          setLikes(previousLikes);
          console.error("Failed to unlike clip:", result.error);
        } else if (result.likes !== undefined) {
          // Update with actual count from server
          setLikes(result.likes);
        }
      } else {
        const result = await likeClip(props.clipId, auth.user.access_token);
        if (!result.success) {
          // Revert on error
          setIsLiked(previousIsLiked);
          setLikes(previousLikes);
          console.error("Failed to like clip:", result.error);
        } else if (result.likes !== undefined) {
          // Update with actual count from server
          setLikes(result.likes);
        }
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
      console.error("Error toggling like:", error);
    } finally {
      setIsProcessing(false);
    }
  };

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
          <b>{props.clip.views}</b> views
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip
              title={!auth.isAuthenticated ? "Sign in to like" : ""}
              arrow
            >
              <span>
                <IconButton
                  onClick={handleLikeToggle}
                  disabled={isProcessing || !auth.isAuthenticated}
                  color="error"
                  size="small"
                  sx={{
                    opacity: !auth.isAuthenticated ? 0.4 : 1,
                  }}
                >
                  {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <span>
              <b>{likes}</b> {likes === 1 ? "like" : "likes"}
            </span>
          </Stack>
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
