import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useState } from "react";
import { FileSelector } from "src/pages/upload/components/FileSelector";
import { Previewer } from "src/pages/upload/components/Previewer";
import { UploadProgress } from "src/pages/upload/components/UploadProgress";
import type { ClipUploadData, TrimDirectives } from "src/types";
import "src/pages/upload/Uploader.css";
import { API_ENDPOINT } from "src/config";
import { useAuthContext } from "src/context/AuthContext";

enum Pages {
  FileSelector = 0,
  Previewer = 1,
  UploadProgress = 2,
}

export function Uploader() {
  const { isAuthenticated, accessToken } = useAuthContext();
  const [activePage, setActivePage] = useState<Pages>(Pages.FileSelector);
  const [clipId, setClipId] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const [uploadProgressHistory, setUploadProgressHistory] = useState<string[]>(
    [],
  );
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(
    null,
  );
  const [source, setSource] = useState<File>();

  async function uploadClip(
    uploadData: ClipUploadData,
    thumbnailUrl: string | null,
    trimDirectives?: TrimDirectives,
  ) {
    if (!source) {
      console.log("how did you get here?");
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !accessToken) {
      console.error("User not authenticated");
      alert("You must be signed in to upload clips");
      return;
    }

    const authHeader = { Authorization: `Bearer ${accessToken}` };

    try {
      const id = uploadData.id;
      setClipId(id);

      //---- UPLOAD THUMBNAIL ----//
      let currentMsg: string;
      let history: string[] = [];
      currentMsg = "Checking for thumbnail";
      setUploadProgressMsg(currentMsg);

      let thumbBlob: Blob;
      if (thumbnailUrl) {
        history = [currentMsg];
        currentMsg = "Encoding thumbnail";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        const binary = atob(thumbnailUrl.split(",")[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        thumbBlob = new Blob([new Uint8Array(array)], {
          type: "image/jpeg",
        });

        history = [...history, currentMsg];
        currentMsg = "Requesting presigned URL for thumbnail";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);
      } else {
        history = [currentMsg];
        currentMsg = "Setting default thumbnail";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        thumbBlob = new Blob([], { type: "image/jpeg" });
      }

      // Get presigned URL for thumbnail
      history = [...history, currentMsg];
      currentMsg = "Uploading thumbnail";
      setUploadProgressHistory(history);
      setUploadProgressMsg(currentMsg);

      const thumbPresignRes = await fetch(`${API_ENDPOINT}/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          clipId: id,
          filename: `${id}.png`,
          contentType: "image/png",
        }),
      });

      if (!thumbPresignRes.ok) {
        throw new Error("Failed to get presigned URL for thumbnail");
      }

      const { presignedUrl: thumbPresignedUrl } = await thumbPresignRes.json();

      // Upload thumbnail directly to S3
      const thumbUploadRes = await fetch(thumbPresignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "image/png",
        },
        body: thumbBlob,
      });

      if (!thumbUploadRes.ok) {
        throw new Error("Failed to upload thumbnail");
      }

      console.log("Thumbnail uploaded successfully");

      //---- TRIM ----//
      history = [...history, currentMsg];
      currentMsg = "Checking for clip trimming";
      setUploadProgressHistory(history);
      setUploadProgressMsg(currentMsg);

      let fileToUpload: File = source;
      const videoExtension = source.name.split(".").pop() || "mp4";
      const videoMimeType = source.type || "video/mp4";

      if (trimDirectives) {
        const ffmpeg = new FFmpeg();

        ffmpeg.on("log", ({ message }) => {
          setUploadProgressMsg(message);
        });

        history = [...history, currentMsg];
        currentMsg = "Loading ffmpeg";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            "text/javascript",
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            "application/wasm",
          ),
        });

        // Use original extension for ffmpeg processing
        const inputFile = `input.${videoExtension}`;
        const outputFile = `output.${videoExtension}`;

        await ffmpeg.writeFile(inputFile, await fetchFile(source));

        history = [...history, currentMsg];
        currentMsg = "Trimming clip";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        await ffmpeg.exec([
          "-i",
          inputFile,
          "-ss",
          trimDirectives.startTime,
          "-to",
          trimDirectives.endTime,
          "-c",
          "copy",
          // '-c:v',         // TODO: re-encoding the video like this takes a long
          // 'libx264',      //  time, but ensures we get exact frames, according
          // '-preset',
          // 'ultrafast',    //  (cheatsheet: https://superuser.com/a/490691)
          // '-c:a',         //  to this page: https://superuser.com/a/459488
          // 'aac',          //  Should prob offer users a choice between the two
          outputFile,
        ]);

        history = [...history, "Finished trimming"];
        currentMsg = "Encoding trimmed clip";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        const data = await ffmpeg.readFile(outputFile);
        const fileBlob = new Blob([data as BlobPart], { type: videoMimeType });
        const trimmedFile = new File([fileBlob], `${id}.${videoExtension}`);

        setSource(trimmedFile);
        fileToUpload = trimmedFile;
      }

      //---- UPLOAD VIDEO ----//
      history = [...history, currentMsg];
      currentMsg = "Requesting presigned URL for video";
      setUploadProgressHistory(history);
      setUploadProgressMsg(currentMsg);

      // Get presigned URL for video upload
      const videoPresignRes = await fetch(`${API_ENDPOINT}/presign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          clipId: id,
          filename: `${id}.${videoExtension}`,
          contentType: videoMimeType,
        }),
      });

      if (!videoPresignRes.ok) {
        throw new Error("Failed to get presigned URL for video");
      }

      const { presignedUrl: videoPresignedUrl } = await videoPresignRes.json();

      history = [...history, currentMsg];
      currentMsg = "Uploading video";
      setUploadProgressHistory(history);
      setUploadProgressMsg(currentMsg);

      // Upload video directly to S3 with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.ceil((event.loaded / event.total) * 100);
          setUploadProgressMsg(`Uploading clip: ${percentComplete}%`);
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          console.log({ xhr });
          if (xhr.status === 200) {
            console.log("Clip uploaded successfully!");
            history = [...history, "Clip uploaded successfully!"];
            setUploadProgressHistory(history);
            setUploadProgressMsg(null);
          } else {
            console.error("Failed to upload clip.");
            const currentTime = new Date().toISOString();
            history = [
              ...history,
              `Failed to upload clip. Contact Dennis with the following information: {ID: ${id} | time: ${currentTime}}`,
            ];
            setUploadProgressHistory(history);
            setUploadProgressMsg(null);
          }
          setIsFinished(true);
        }
      };

      xhr.open("PUT", videoPresignedUrl, true);
      xhr.setRequestHeader("Content-Type", videoMimeType);
      xhr.send(fileToUpload);

      //---- UPLOAD CLIP DETAILS ----//
      currentMsg = `Uploading clip data - ID: ${id}`;
      setUploadProgressMsg(currentMsg);

      const dataRes = await fetch(`${API_ENDPOINT}/clipdata`, {
        method: "PUT",
        body: JSON.stringify({
          ...uploadData,
          fileExtension: videoExtension,
          uploadedOn: Date.now().toString(),
        }),
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      console.log(dataRes);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div id="uploader">
      {activePage === Pages.FileSelector && (
        <FileSelector setSource={setSource} setActivePage={setActivePage} />
      )}
      {activePage === Pages.Previewer && source && (
        <Previewer
          source={source}
          uploadClip={uploadClip}
          sourceUrl={URL.createObjectURL(source)}
          setActivePage={setActivePage}
        />
      )}
      {activePage === Pages.UploadProgress && source && (
        <UploadProgress
          uploadProgressMsg={uploadProgressMsg}
          uploadProgressHistory={uploadProgressHistory}
          isFinished={isFinished}
          clipId={clipId}
        />
      )}
    </div>
  );
}
