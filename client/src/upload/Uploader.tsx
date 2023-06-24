import { DragEvent, useState } from 'react';
import { FileSelector } from './FileSelector'
import { Previewer } from './Previewer'
import './Uploader.css';
import { UploadForm } from '../types';


 export function Uploader() {
  const [source, setSource] = useState<File>();

  async function uploadClip(formData: UploadForm) {
    if (!source) {
      console.log('how did you get here?')
      return
    }

    try {
      const id = formData.get('id')
      const res = await fetch('/clips', {
        method: 'PUT',
        body: formData,
      });
      console.log(res)

      console.log(source)
      const videoRes = await fetch(`/clips/${id}/${id}.mp4`, {
        headers: {
          'Content-Type': 'video/mp4' 
        },
        method: 'PUT',
        body: source
      });
      console.log(videoRes)

    } catch (error) {
      console.log(error);
    }
  }

  const handleEvent = function(e: DragEvent) {
    // TODO: disallow dropping anywhere outside the drop zone
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="uploader" onDragEnter={handleEvent} onDragLeave={handleEvent} onDrop={handleEvent}>
      {!source && <FileSelector setSource={setSource}/>}
      {source && <Previewer source={source} uploadClip={uploadClip} />}
    </div>
  );
}
