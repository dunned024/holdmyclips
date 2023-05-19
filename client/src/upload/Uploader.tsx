import { DragEvent, useState } from 'react';
import { FileSelector } from './FileSelector'
import { Previewer } from './Previewer'
import './Uploader.css';


 export function Uploader() {
  const [source, setSource] = useState<File>();

  const handleEvent = function(e: DragEvent) {
    // TODO: disallow dropping anywhere outside the drop zone
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="uploader" onDragEnter={handleEvent} onDragLeave={handleEvent} onDrop={handleEvent}>
      {!source && <FileSelector setSource={setSource}/>}
      {source && <Previewer source={source} />}
    </div>
  );
}
