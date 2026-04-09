FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx sequelize-cli db:migrate && npm run start:dev"]
