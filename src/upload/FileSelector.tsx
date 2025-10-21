import { type ChangeEvent, type DragEvent, useRef, useState } from "react";
import "src/upload/FileSelector.css";

export function FileSelector(props: {
  setSource: (source: File) => void;
  setActivePage: (page: number) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e: DragEvent<HTMLDivElement | HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement | HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      props.setSource(e.dataTransfer.files[0]);
      props.setActivePage(1);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.target.files?.[0]) {
      props.setSource(e.target.files[0]);
      props.setActivePage(1);
    }
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      (inputRef.current as HTMLInputElement).click();
    }
  };

  // TODO: disallow dropping anywhere outside the drop zone
  return (
    <div id="file-selector">
      <form
        id="file-selector-form"
        onDragEnter={handleDrag}
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mov,.mp4"
          id="file-selector-input"
          multiple={false}
          onChange={handleChange}
        />
        <button
          id="file-selector-button"
          onClick={onButtonClick}
          type="button"
        />
        <label
          id="drag-drop-label"
          htmlFor="file-selector-input"
          className={dragActive ? "drag-active" : ""}
        >
          <div>
            <p>Drag and drop your file here</p>
            <p id="click-label">
              Or <u>click</u> to upload a file
            </p>
          </div>
        </label>
        {dragActive && (
          <div
            id="drag-file-element"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          />
        )}
      </form>
    </div>
  );
}
