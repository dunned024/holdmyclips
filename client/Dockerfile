FROM --platform=linux/amd64 node:18.13.0

WORKDIR /home/node/client
COPY package*.json ./
RUN npm i

COPY tsconfig.json .
COPY public/ public
COPY src/ src

ARG REACT_APP_SERVER_API_ENDPOINT 
RUN echo "REACT_APP_SERVER_API_ENDPOINT=${REACT_APP_SERVER_API_ENDPOINT}" >> .env

CMD ["npm", "start"]
