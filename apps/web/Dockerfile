FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

RUN npm install --workspace=apps/web

COPY apps/web/ ./apps/web/

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
