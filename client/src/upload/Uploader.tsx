import React, { useState } from 'react';
import { FileSelector } from './components/FileSelector';
import { Previewer } from './Previewer';
import './Uploader.css';
import { ClipUploadData } from '../types';

export function Uploader() {
  // const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [source, setSource] = useState<File>();

  async function uploadClip(
    uploadData: ClipUploadData,
    thumbnailUrl: string | null
  ) {
    setIsUploading(true);
    if (!source) {
      console.log('how did you get here?');
      setIsUploading(false);
      return;
    }

    try {
      const id = uploadData.id;
      const res = fetch('/clipdata', {
        method: 'PUT',
        body: JSON.stringify(uploadData)
      });
      console.log(res);

      //---- UPLOAD THUMBNAIL ----//
      let thumbBlob;
      if (thumbnailUrl) {
        const binary = atob(thumbnailUrl.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        thumbBlob = new Blob([new Uint8Array(array)], {
          type: 'image/jpeg'
        });
      } else {
        thumbBlob = new Blob([], { type: 'image/jpeg' });
      }
      console.log({ thumbBlob, thumbnailUrl });
      const thumbRes = fetch(`/uploadclip?filename=${id}.png`, {
        headers: {
          'Content-Type': 'image/png'
        },
        method: 'PUT',
        body: thumbBlob
      });
      console.log(thumbRes);

      console.log(source);

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

      // TODO: use variable extensions
      const videoRes = fetch(`/uploadclip?filename=${id}.mp4`, {
        headers: {
          'Content-Type': 'video/mp4'
        },
        method: 'PUT',
        body: source
      });
      console.log(videoRes);
    } catch (error) {
      console.log(error);
    }
    setIsUploading(false);
  }

  return (
    <div id='uploader'>
      {!source && <FileSelector setSource={setSource} />}
      {/* {source && isUploading && <Progress uploadProgress={uploadProgress} />} */}
      {source && !isUploading && (
        <Previewer
          source={source}
          sourceUrl={URL.createObjectURL(source)}
          uploadClip={uploadClip}
        />
      )}
    </div>
  );
}
