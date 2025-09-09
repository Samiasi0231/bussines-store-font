# BizVantage Backend Service

## Description
BizVantage monolithic backend application built on top on Node.js/typescript using the NestJS framework.

## Prerequisites
- Install Node.j, yarn and NestJS CLI

## Running the app
```bash
# development
$ yarn build
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn build
$ yarn start:prod
```

## Test
```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## RUN docker container
Before running the following commands, ensure that docker is correctly set up correctly and that the env variables are set up properly
```bash
$ docker build -t gateway .
$ docker run -p 3000:3000 --env-file .env gateway
```
