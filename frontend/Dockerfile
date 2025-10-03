# Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Fix openshift permission issues
RUN rm -rf /usr/share/nginx/html/* \
 && mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp \
               /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /var/run /var/log/nginx \
 && chmod -R 0777 /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 (nginx)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
