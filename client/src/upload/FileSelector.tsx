import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import './FileSelector.css';

export function FileSelector(props: {setSource: (source: File) => void}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  
  const handleDrag = function(e: DragEvent<HTMLDivElement|HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = function(e: DragEvent<HTMLDivElement|HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      props.setSource(e.dataTransfer.files[0])
    }
  };
  
  const handleChange = function(e: ChangeEvent<HTMLInputElement> ) {
    e.preventDefault();

    if (e.target.files && e.target.files[0]) {
      props.setSource(e.target.files[0])
    }
  };
  
  const onButtonClick = () => {
    if (inputRef.current) {
      (inputRef.current as any).click();
    }
  };
  
  return (
    <div className="file-selector">
      <form className="file-selector-form" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
        <input ref={inputRef} type="file" accept=".mov,.mp4" className="file-selector-input" multiple={false} onChange={handleChange} />
        <label id="drag-drop-label" htmlFor="file-selector-input" className={dragActive ? "drag-active" : "" }>
          <div>
            <p>Drag and drop your file here</p>
            <button className="file-selector-button" onClick={onButtonClick}>Or click to upload a file</button>
          </div> 
        </label>
        { dragActive && <div className="drag-file-element" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div> }
      </form>
    </div>
  );
};
