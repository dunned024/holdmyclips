import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

const load = async () => {
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';

  // toBlobURL is used to bypass CORS issue, urls with the same
  // domain can be used directly.
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  });
};

const transcode = async () => {
  await ffmpeg.writeFile(
    'input.webm',
    await fetchFile(
      'https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm'
    )
  );
  await ffmpeg.exec(['-i', 'input.webm', 'output.mp4']);
  const data = await ffmpeg.readFile('output.mp4');
  // videoRef.current.src = URL.createObjectURL(
  //   new Blob([data.buffer], { type: 'video/mp4' })
  // );
};
