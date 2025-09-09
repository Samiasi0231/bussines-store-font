FROM node:20.18.0

WORKDIR /app

COPY package*.json ./

COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

CMD ["node","dist/main.js"]
