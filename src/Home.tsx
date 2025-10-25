import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClips } from "src/services/clips";
import { getTimeSinceString, secondsToMMSS } from "src/services/time";
import type { Clip, ClipDex } from "src/types";
import "src/Home.css";
import { Stack } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { SORT_KEY_MAP, SortSelect } from "src/SortSelect";
import { API_ENDPOINT } from "src/config";

export function Home() {
  const [sortKey, setSortKey] = useState<keyof typeof SORT_KEY_MAP>("Newest");
  const sortFunction = SORT_KEY_MAP[sortKey];

  const auth = useAuth();
  const [clipDex, setClipDex] = useState<ClipDex>({});

  useEffect(() => {
    async function populateClipDex() {
      const clipList = await getClips();
      setClipDex(clipList);
    }

    if (!clipDex.length) {
      populateClipDex();
    }
  }, []);

  return (
    <div id="home">
      <Stack id="home-control-bar" direction="row">
        <Stack className="control-container">
          <SortSelect sortKey={sortKey} setSortKey={setSortKey} />
        </Stack>
        <Stack className="control-container">
          {auth.isAuthenticated ? (
            <button type="button">Upload clip</button>
          ) : (
            <button type="button" onClick={() => auth.signinRedirect()}>
              Sign in
            </button>
          )}
        </Stack>
        <Stack className="control-container" />
      </Stack>
      <div className="clip-rows">
        {Object.entries(clipDex)
          .sort(sortFunction)
          .map(([clipId, clip]) => (
            <ClipCard key={clipId} clip={clip} />
          ))}
      </div>
    </div>
  );
}

function ClipCard(props: { clip: Clip }) {
  const clip = props.clip;
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(
    `${API_ENDPOINT}/clips/${clip.id}/${clip.id}.png`,
  );

  const fallback = `${API_ENDPOINT}/default_thumbnail.png`;
  const onError = () => setImgSrc(fallback);

  return (
    <div
      className="clip-card-container"
      key={clip.id}
      onMouseOver={() => setShowDetails(true)}
      onFocus={() => setShowDetails(true)}
      onMouseOut={() => setShowDetails(false)}
      onBlur={() => setShowDetails(false)}
    >
      <Link to={`/player/${clip.id}`} className="clip-link">
        <div className="clip-card">
          <img
            src={imgSrc ? imgSrc : fallback}
            onError={onError}
            alt={clip.title}
          />
          {showDetails && (
            <div className="time-since-upload">
              {getTimeSinceString(clip.uploadedOn)}
            </div>
          )}
          {showDetails && (
            <div className="clip-duration">{secondsToMMSS(clip.duration)}</div>
          )}
          {showDetails && (
            <div className="clip-card-body">
              <div className="clip-title">{clip.title}</div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
