import { FormEvent, useEffect, useRef, useState } from 'react';
import './Previewer.css'

export function Previewer(props: {source: File}) {
  const [clipDuration, setClipDuration] = useState(0);
  const videoSrc = URL.createObjectURL(props.source);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef && videoRef.current) {
      const currentVideo = (videoRef.current as HTMLMediaElement);

      currentVideo.onloadedmetadata = () => {
        setClipDuration(currentVideo.duration)
      };
    }
  }, [videoSrc]);

  const handleSubmit = function(e: FormEvent) {
    e.preventDefault()
  }

  return (
    <div className="previewer">
      <div className="video-preview-container">
        <video controls src={videoSrc} ref={videoRef} />
      </div>

      <form id="clip-details-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="clip-name-input">Name:</label> 
          <input 
            id="clip-name-input"
            className="clip-name-input"
            type="text"
            name="name"
            defaultValue={props.source.name}
            required />
        </div>
        <div className="field">
          <label htmlFor="clip-duration-preview">Duration:</label>
          <span id="clip-uploader-input" className="clip-duration-preview">{clipDuration}</span>
        </div>
        <div className="field">
          <label htmlFor="clip-uploader-input">Uploader:</label> 
          <input 
            id="clip-uploader-input"
            className="clip-uploader-input"
            type="text"
            name="uploader"
            required />
        </div>
        <div className="field">
          <label htmlFor="clip-description-input">Description:</label> 
          <textarea 
            id="clip-description-input"
            className="clip-description-input"
            name="description" />
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};
