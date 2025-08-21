FROM node:18-alpine

WORKDIR /app

# Install bash for wait-for-it.sh
RUN apk add --no-cache bash

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "start"]