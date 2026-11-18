FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Запускаем Vite dev server, доступный извне контейнера
CMD ["npm", "run", "dev", "--", "--host"]