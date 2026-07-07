FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY kochbuddy-debug.apk /usr/share/nginx/html/kochbuddy-debug.apk
COPY default.conf /etc/nginx/conf.d/default.conf
COPY 40-write-htpasswd.sh /docker-entrypoint.d/40-write-htpasswd.sh
RUN chmod +x /docker-entrypoint.d/40-write-htpasswd.sh
EXPOSE 80

