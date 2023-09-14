import React, { useState } from 'react';
import { FileSelector } from './components/FileSelector';
import { Previewer } from './Previewer';
import './Uploader.css';
import { ClipUploadData } from '../types';

export function Uploader() {
  const [source, setSource] = useState<File>();

  async function uploadClip(uploadData: ClipUploadData) {
    if (!source) {
      console.log('how did you get here?');
      return;
    }

    try {
      const id = uploadData.id;
      const res = await fetch('/clips', {
        method: 'PUT',
        body: id
      });
      console.log(res);

      console.log(source);
      // TODO: send video via PUT to /uploadclip?filename={id}.{ext}
      //  e.g. /uploadclip?filename=able-continent.mp4
      const videoRes = await fetch(`/clips/${id}/${id}.mp4`, {
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
  }

  return (
    <div id='uploader'>
      {!source && <FileSelector setSource={setSource} />}
      {source && (
        <Previewer
          source={source}
          sourceUrl={URL.createObjectURL(source)}
          uploadClip={uploadClip}
        />
      )}
    </div>
  );
}
