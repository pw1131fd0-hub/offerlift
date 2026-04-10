FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ | grep -q "<!DOCTYPE" || exit 1
