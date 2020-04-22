FROM node:latest
WORKDIR /app/slave
COPY package.json /app/slave
RUN npm install
COPY . /app/slave
ENV TEAM_NAME=CC_0012_0989_1110_1094
ENV WORKER=SLAVE