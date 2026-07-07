FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY kochbuddy-debug.apk /usr/share/nginx/html/kochbuddy-debug.apk
COPY default.conf /etc/nginx/conf.d/default.conf
COPY .htpasswd /etc/nginx/.htpasswd
EXPOSE 80
