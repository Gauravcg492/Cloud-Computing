FROM node:latest
WORKDIR /app/master
COPY package.json /app/master
RUN npm install
COPY . /app/master
ENV TEAM_NAME=CC_0012_0989_1110_1094
ENV WORKER=MASTER