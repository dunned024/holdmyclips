import { FormEvent, useEffect, useRef, useState } from 'react';
import './Previewer.css'
import { randomId } from '../services/identifiers'

export function Previewer(props: {source: File, uploadClip: (clipForm: FormData) => void}) {
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
    console.log('here')
    e.preventDefault()

    const form = (e.target as HTMLFormElement);
    const formData = new FormData(form);

    const title = formData.get('title')?.toString()
    const uploader = formData.get('uploader')?.toString()
    if (!title || !uploader) {
      console.log('error: must include title, uploader')
      return
    }
    
    const id = randomId()
    formData.append('id', id)
    
    formData.append('duration', clipDuration.toString())
    formData.append('views', '0')
    formData.append('comments', '[]')
    
    props.uploadClip(formData)
  }

  return (
    <div className="previewer">
      <div className="video-preview-container">
        <video controls src={videoSrc} ref={videoRef} />
      </div>

      <form id="clip-details-form" method='put' onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="clip-title-input">title:</label> 
          <input 
            id="clip-title-input"
            className="clip-title-input"
            type="text"
            name="title"
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
