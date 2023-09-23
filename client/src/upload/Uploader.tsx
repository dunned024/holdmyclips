import React, { useState } from 'react';
import { FileSelector } from './FileSelector';
import { Previewer } from './Previewer';
import { UploadProgress } from './UploadProgress';
import './Uploader.css';
import { ClipUploadData, TrimDirectives } from '../types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

enum Pages {
  FileSelector,
  Previewer,
  UploadProgress
}

export function Uploader() {
  const [activePage, setActivePage] = useState<Pages>(Pages.FileSelector);
  const [clipId, setClipId] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  const [uploadProgressHistory, setUploadProgressHistory] = useState<string[]>(
    []
  );
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(
    null
  );
  const [source, setSource] = useState<File>();

  async function uploadClip(
    uploadData: ClipUploadData,
    thumbnailUrl: string | null,
    trimDirectives?: TrimDirectives
  ) {
    if (!source) {
      console.log('how did you get here?');
      return;
    }

    try {
      const id = uploadData.id;
      setClipId(id);

      let currentMsg, history;
      currentMsg = `Uploading clip data - ID: ${id}`;
      setUploadProgressMsg(currentMsg);

      //---- UPLOAD CLIP DETAILS ----//
      const dataRes = await fetch('/clipdata', {
        method: 'PUT',
        body: JSON.stringify(uploadData)
      });
      console.log(dataRes);

      history = [currentMsg];
      currentMsg = 'Checking for thumbnail';
      setUploadProgressHistory(history);
      setUploadProgressMsg(currentMsg);

      //---- UPLOAD THUMBNAIL ----//
      let thumbBlob;
      if (thumbnailUrl) {
        history = [...history, currentMsg];
        currentMsg = 'Encoding thumbnail';
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        const binary = atob(thumbnailUrl.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        thumbBlob = new Blob([new Uint8Array(array)], {
          type: 'image/jpeg'
        });

        history = [...history, currentMsg];
        currentMsg = 'Uploading thumbnail';
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);
      } else {
        history = [...history, currentMsg];
        currentMsg = 'Setting default thumbnail';
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        thumbBlob = new Blob([], { type: 'image/jpeg' });
      }

      const thumbRes = await fetch(`/uploadclip?filename=${id}.png`, {
        headers: {
          'Content-Type': 'image/png'
        },
        method: 'PUT',
        body: thumbBlob
      });
      console.log(thumbRes);

      //---- UPLOAD VIDEO ----//
      // const xhr = new XMLHttpRequest();
      // xhr.open('POST', `/uploadclip?filename=${id}.mp4`, true);

      // xhr.upload.addEventListener('progress', (event) => {
      //   if (event.lengthComputable) {
      //     const percentComplete = (event.loaded / event.total) * 100;
      //     setUploadProgress(percentComplete);
      //   }
      // });

      // xhr.onreadystatechange = () => {
      //   if (xhr.readyState === XMLHttpRequest.DONE) {
      //     if (xhr.status === 200) {
      //       console.log('Image uploaded successfully.');
      //       // Handle success, e.g., update UI or store the S3 URL
      //     } else {
      //       console.error('Failed to upload image.');
      //       // Handle error
      //     }
      //   }
      // };

      // xhr.send(source);
      // const formData = new FormData();
      // formData.append('file', source);
      // xhr.send(formData);

      //---- TRIM ----//
      history = [...history, currentMsg];
      currentMsg = 'Checking for clip trimming';
      setUploadProgressHistory(history);
      setUploadProgressMsg(currentMsg);

      if (trimDirectives) {
        const ffmpeg = new FFmpeg();

        ffmpeg.on('log', ({ message }) => {
          setUploadProgressMsg(message);
        });

        history = [...history, currentMsg];
        currentMsg = 'Loading ffmpeg';
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
        await ffmpeg.load({
          coreURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.js`,
            'text/javascript'
          ),
          wasmURL: await toBlobURL(
            `${baseURL}/ffmpeg-core.wasm`,
            'application/wasm'
          )
        });

        await ffmpeg.writeFile('input.mp4', await fetchFile(source));

        history = [...history, currentMsg];
        currentMsg = 'Loading ffmpeg';
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        await ffmpeg.exec([
          '-i',
          'input.mp4',
          '-ss',
          trimDirectives.startTime,
          '-to',
          trimDirectives.endTime,
          '-c',
          'copy',
          // '-c:v',         // TODO: re-encoding the video like this takes a long
          // 'libx264',      //  time, but ensures we get exact frames, according
          // '-preset',
          // 'ultrafast',    //  (cheatsheet: https://superuser.com/a/490691)
          // '-c:a',         //  to this page: https://superuser.com/a/459488
          // 'aac',          //  Should prob offer users a choice between the two
          'output.mp4'
        ]);

        history = [...history, 'Finished trimming'];
        currentMsg = 'Encoding trimmed clip';
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        const data = await ffmpeg.readFile('output.mp4');
        const fileBlob = new Blob([data], { type: 'video/mp4' });
        const trimmedFile = new File([fileBlob], `${id}.mp4`);
        setSource(trimmedFile);

        history = [...history, currentMsg];
        currentMsg = 'Uploading clip';
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        const videoRes = await fetch(`/uploadclip?filename=${id}.mp4`, {
          headers: {
            'Content-Type': 'video/mp4'
          },
          method: 'PUT',
          body: trimmedFile
        });
        console.log(videoRes);
      } else {
        history = [...history, currentMsg];
        currentMsg = 'Uploading clip';
        setUploadProgressHistory(history);
        setUploadProgressMsg(currentMsg);

        // TODO: use variable extensions
        const videoRes = await fetch(`/uploadclip?filename=${id}.mp4`, {
          headers: {
            'Content-Type': 'video/mp4'
          },
          method: 'PUT',
          body: source
        });
        console.log(videoRes);
      }
      history = [...history, 'Done!'];
      setUploadProgressHistory(history);
      setUploadProgressMsg(null);
      setIsFinished(true);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div id='uploader'>
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
