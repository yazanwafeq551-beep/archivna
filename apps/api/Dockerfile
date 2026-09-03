FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN npm install --workspace=apps/api

COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
