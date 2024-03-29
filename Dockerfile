FROM node:15

WORKDIR /usr/src/app/
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . ./

EXPOSE 4000

CMD [ "npm", "run", "local:dev" ]