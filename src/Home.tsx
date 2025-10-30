import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClipsPaginated } from "src/services/clips";
import { getTimeSinceString, secondsToMMSS } from "src/services/time";
import type { Clip } from "src/types";
import "src/Home.css";
import { Stack } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { type SORT_KEY_MAP, SortSelect } from "src/SortSelect";
import { API_ENDPOINT } from "src/config";

export function Home() {
  const [sortKey, setSortKey] = useState<keyof typeof SORT_KEY_MAP>("Newest");

  const auth = useAuth();
  const [clips, setClips] = useState<Clip[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load clips on mount and when sort changes
  useEffect(() => {
    async function loadClips() {
      setIsLoading(true);
      try {
        // Server-side sorting for upload date (uses GSI)
        const order =
          sortKey === "Newest" ? "desc" : sortKey === "Oldest" ? "asc" : "desc";
        const response = await getClipsPaginated(order, 20);
        setClips(response.clips);
        setNextToken(response.nextToken);
        setHasMore(response.hasMore);
      } finally {
        setIsLoading(false);
      }
    }

    loadClips();
  }, [sortKey]);

  // Load more clips (pagination)
  const loadMore = async () => {
    if (!hasMore || isLoading || !nextToken) return;

    setIsLoading(true);
    try {
      const order =
        sortKey === "Newest" ? "desc" : sortKey === "Oldest" ? "asc" : "desc";
      const response = await getClipsPaginated(order, 20, nextToken);
      setClips([...clips, ...response.clips]);
      setNextToken(response.nextToken);
      setHasMore(response.hasMore);
    } finally {
      setIsLoading(false);
    }
  };

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
        {clips.map((clip) => (
          <ClipCard key={clip.id} clip={clip} />
        ))}
      </div>
      {hasMore && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <button type="button" onClick={loadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
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
