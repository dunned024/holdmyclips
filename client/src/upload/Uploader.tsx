import { DragEvent, useState } from 'react';
import { FileSelector } from './FileSelector'
import { Previewer } from './Previewer'
import './Uploader.css';


 export function Uploader() {
  const [source, setSource] = useState<File>();

  async function uploadClip(formData: FormData) {
    if (!source) {
      console.log('how did you get here?')
      return
    }

    try {
      // TODO: create a lambda that uploads the function
      // https://aws.amazon.com/blogs/compute/patterns-for-building-an-api-to-upload-files-to-amazon-s3/
      // "The CloudFront event is set Viewer request to meaning the function is invoked in reaction to PUT events from the client"
      
      const id = formData.get('id')
      const res = await fetch(`/clips`, {
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
