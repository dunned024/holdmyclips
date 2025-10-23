import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useState } from "react";
import { useAuth } from "react-oidc-context";
import type { ClipUploadData, TrimDirectives } from "src/types";
import { FileSelector } from "src/upload/FileSelector";
import { Previewer } from "src/upload/Previewer";
import { UploadProgress } from "src/upload/UploadProgress";
import "src/upload/Uploader.css";
import { API_ENDPOINT } from "src/config";

enum Pages {
  FileSelector = 0,
  Previewer = 1,
  UploadProgress = 2,
}

export function Uploader() {
  const auth = useAuth();
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
    if (!auth.isAuthenticated || !auth.user?.access_token) {
      console.error("User not authenticated");
      alert("You must be signed in to upload clips");
      return;
    }

    // Get the access token
    const accessToken = auth.user.access_token;
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
        currentMsg = "Uploading thumbnail";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);
      } else {
        history = [currentMsg];
        currentMsg = "Setting default thumbnail";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        thumbBlob = new Blob([], { type: "image/jpeg" });
      }

      const thumbRes = await fetch(
        `${API_ENDPOINT}/uploadclip?filename=${id}.png`,
        {
          headers: {
            "Content-Type": "image/png",
            ...authHeader,
          },
          method: "PUT",
          body: thumbBlob,
        },
      );
      console.log(thumbRes);

      //---- TRIM ----//
      const clipUploadForm = new FormData();

      history = [...history, currentMsg];
      currentMsg = "Checking for clip trimming";
      setUploadProgressHistory(history);
      setUploadProgressMsg(currentMsg);

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

        await ffmpeg.writeFile("input.mp4", await fetchFile(source));

        history = [...history, currentMsg];
        currentMsg = "Loading ffmpeg";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        await ffmpeg.exec([
          "-i",
          "input.mp4",
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
          "output.mp4",
        ]);

        history = [...history, "Finished trimming"];
        currentMsg = "Encoding trimmed clip";
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        // TODO: use variable extensions
        const data = await ffmpeg.readFile("output.mp4");
        const fileBlob = new Blob([data], { type: "video/mp4" });
        const trimmedFile = new File([fileBlob], `${id}.mp4`);

        setSource(trimmedFile);
        clipUploadForm.append("file", trimmedFile);
      } else {
        clipUploadForm.append("file", source);
      }

      //---- UPLOAD VIDEO ----//
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

      xhr.open("PUT", `${API_ENDPOINT}/uploadclip?filename=${id}.mp4`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.send(clipUploadForm.get("file"));

      //---- UPLOAD CLIP DETAILS ----//
      currentMsg = `Uploading clip data - ID: ${id}`;
      setUploadProgressMsg(currentMsg);

      const dataRes = await fetch(`${API_ENDPOINT}/clipdata`, {
        method: "PUT",
        body: JSON.stringify({
          ...uploadData,
          uploadedOn: Date.now().toString(),
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
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
