FROM node:lts-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install

COPY prisma/schema.prisma ./prisma/

RUN yarn prisma generate

COPY . .

RUN yarn build

EXPOSE 8080

CMD yarn start