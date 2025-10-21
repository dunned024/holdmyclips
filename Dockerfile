FROM --platform=linux/amd64 node:18.13.0

WORKDIR /home/node/app
COPY package*.json ./
RUN npm i

COPY tsconfig.json vite.config.ts ./
COPY index.html ./
COPY public/ public
COPY src/ src

ARG VITE_SERVER_API_ENDPOINT 
RUN echo "VITE_SERVER_API_ENDPOINT=${VITE_SERVER_API_ENDPOINT}" >> .env

CMD ["npm", "start"]
