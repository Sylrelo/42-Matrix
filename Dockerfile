FROM node:16-alpine

WORKDIR /app

COPY front/package*.json ./

RUN npm install
COPY front/ .
RUN npm run build --production
RUN npm install -g serve
EXPOSE 3000
CMD serve -s build