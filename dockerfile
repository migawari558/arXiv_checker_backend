FROM node:22
WORKDIR /usr/src/app
COPY ./package*.json .
RUN npm i
RUN npm install -g nodemon
COPY ./index.mjs .
EXPOSE 8001
CMD [ "nodemon", "index.mjs" ]