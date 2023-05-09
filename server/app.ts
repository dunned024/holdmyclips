import express from 'express';
import path from 'path';
import fs from 'fs';
import thumbsupply from 'thumbsupply';

const app = express();
const port = 4000;

const videos = [
  {
      id: 0,
      poster: '/video/0/poster',
      duration: '3 mins',
      name: 'Sample 1'
  },
  {
      id: 1,
      poster: '/video/1/poster',
      duration: '4 mins',
      name: 'Sample 2'
  },
  {
      id: 2,
      poster: '/video/2/poster',
      duration: '2 mins',
      name: 'Sample 3'
  },
];

app.get('/', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.send('Hello World!');
});

app.get('/videos', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.json(videos)
});

app.get('/video/:id/poster', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  thumbsupply.generateThumbnail(path.resolve(__dirname, `../assets/${req.params.id}.mp4`))
  .then(thumb => res.sendFile(thumb));
});

app.get('/video/:id/data', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  const id = parseInt(req.params.id, 10);
  res.json(videos[id]);
});

app.get('/video/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
  const resolvedPath = path.resolve(__dirname, `../assets/${req.params.id}.mp4`);
  const stat = fs.statSync(resolvedPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1]
          ? parseInt(parts[1], 10)
          : fileSize-1;
      const chunksize = (end-start) + 1;
      const file = fs.createReadStream(resolvedPath, {start, end});
      const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
  } else {
      const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(resolvedPath).pipe(res);
  }
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

