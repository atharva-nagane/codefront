FROM node:20-alpine

WORKDIR /app

# install docker CLI so backend can run docker commands
RUN apk add --no-cache docker-cli

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]