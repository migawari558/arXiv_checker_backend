FROM node:22
WORKDIR /usr/src/app
COPY ./index.mjs .
COPY ./package*.json .
RUN npm i
RUN npm install -g nodemon
EXPOSE 8001
CMD [ "nodemon", "index.mjs" ]