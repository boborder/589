FROM node:24-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 build-essential
RUN npm install -g bun

COPY package.json ./

RUN bun install

COPY . .

EXPOSE 3000

ENTRYPOINT ["bun"]
CMD ["run", "dev"]
