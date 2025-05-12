FROM node:lts
WORKDIR /usr/src/app
COPY ./package*.json .
RUN npm ci
RUN npm install -g nodemon
COPY ./index.mjs .
EXPOSE 8001
CMD [ "nodemon", "index.mjs" ]