import React, { useEffect, useRef } from 'react';
import './UploadProgress.css';
import { Stack } from '@mui/material';
import { AiFillCheckSquare } from 'react-icons/ai';
import { Ring } from '@uiball/loaders';

export function UploadProgress(props: {
  uploadProgressMsg: string | null;
  uploadProgressHistory: string[];
  isFinished: boolean;
  clipId: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [props.uploadProgressHistory]);

  return (
    <Stack id='upload-progress'>
      <div id='upload-progress-subchild'>
        <div id='info-line'>
          Uploading clip. Please do not refresh or close the page...
        </div>
        <div id='upload-log-container'>
          <div id='upload-log-lines-container'>
            {Object.entries(props.uploadProgressHistory!).map(
              ([msgId, msg]) => (
                <span key={msgId} className='upload-log-line'>
                  <AiFillCheckSquare
                    className='upload-log-line-icon'
                    size={24}
                  />{' '}
                  {msg}
                </span>
              )
            )}
            {props.uploadProgressMsg && (
              <div
                ref={messagesEndRef}
                id='upload-log-current-line'
                className='upload-log-line'
              >
                <span className='upload-log-line-icon'>
                  <Ring size={24} color='#231F20' />
                </span>
                {props.uploadProgressMsg}
              </div>
            )}
          </div>
        </div>
        <div id='wrapup-buttons'>
          <a href={`/player/${props.clipId}`} rel='noreferrer'>
            <button
              disabled={!props.isFinished}
              className='wrapup-button'
              id='go-clip'
            >
              Go to my Clip
            </button>
          </a>
          <a href='/' rel='noreferrer'>
            <button
              disabled={!props.isFinished}
              className='wrapup-button'
              id='go-home'
            >
              Go to Homepage
            </button>
          </a>
        </div>
      </div>
    </Stack>
  );
}
