import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getClipsPaginated } from "src/services/clips";
import { getTimeSinceString, secondsToMMSS } from "src/services/time";
import type { Clip } from "src/types";
import "src/pages/home/Home.css";
import { Stack } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { API_ENDPOINT } from "src/config";
import {
  type SORT_KEY_MAP,
  SortSelect,
} from "src/pages/home/components/SortSelect";

export function Home() {
  const [sortKey, setSortKey] = useState<keyof typeof SORT_KEY_MAP>("Newest");

  const navigate = useNavigate();
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
        // Map sortKey to index name and order
        let sortIndex = "UploadDate";
        let order: "asc" | "desc" = "desc";

        if (sortKey === "Newest") {
          sortIndex = "UploadDate";
          order = "desc";
        } else if (sortKey === "Oldest") {
          sortIndex = "UploadDate";
          order = "asc";
        } else if (sortKey === "Title (A-Z)") {
          sortIndex = "Title";
          order = "asc";
        } else if (sortKey === "Title (Z-A)") {
          sortIndex = "Title";
          order = "desc";
        }

        const response = await getClipsPaginated(sortIndex, order, 20);
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
      // Map sortKey to index name and order
      let sortIndex = "UploadDate";
      let order: "asc" | "desc" = "desc";

      if (sortKey === "Newest") {
        sortIndex = "UploadDate";
        order = "desc";
      } else if (sortKey === "Oldest") {
        sortIndex = "UploadDate";
        order = "asc";
      } else if (sortKey === "Title (A-Z)") {
        sortIndex = "Title";
        order = "asc";
      } else if (sortKey === "Title (Z-A)") {
        sortIndex = "Title";
        order = "desc";
      }

      const response = await getClipsPaginated(sortIndex, order, 20, nextToken);
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
            <button type="button" onClick={() => navigate("/upload")}>
              Upload clip
            </button>
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
              <div className="clip-stats">
                {clip.views.toLocaleString()} views •{" "}
                {clip.likes.toLocaleString()} likes
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
