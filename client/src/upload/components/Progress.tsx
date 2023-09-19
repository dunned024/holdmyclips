import React from 'react';

export function Progress(props: { uploadProgress: number }) {
  return (
    <div>
      {props.uploadProgress > 0 && (
        <div>
          <p>Upload Progress: {props.uploadProgress}%</p>
          <progress value={props.uploadProgress} max={100} />
        </div>
      )}
    </div>
  );
}
