FROM --platform=linux/amd64 node:18.13.0 as base

WORKDIR /home/node/server
COPY package*.json ./
RUN npm i

COPY app.ts .
COPY tsconfig.json .


FROM base as production

ENV NODE_PATH=./build

RUN npm run build
