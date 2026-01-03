FROM node:24-slim

WORKDIR /app

RUN npm install -g bun

COPY package.json ./

RUN bun install

COPY . .

EXPOSE 3000

ENTRYPOINT ["bun"]
CMD ["run", "dev"]
