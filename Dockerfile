# Dockerfile para publicação do projeto React (Vite)
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# Copia o build do Vite
COPY --from=build /app/dist /usr/share/nginx/html
# Copia a configuração do Nginx para suportar React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
