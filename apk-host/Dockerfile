FROM nginx:alpine
COPY apk-host/index.html /usr/share/nginx/html/index.html
COPY apk-host/kochbuddy-debug.apk /usr/share/nginx/html/kochbuddy-debug.apk
COPY apk-host/default.conf /etc/nginx/conf.d/default.conf
COPY apk-host/40-write-htpasswd.sh /docker-entrypoint.d/40-write-htpasswd.sh
RUN chmod +x /docker-entrypoint.d/40-write-htpasswd.sh
EXPOSE 80

