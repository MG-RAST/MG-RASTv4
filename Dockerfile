# MG-RASTv4 web

#FROM nginx:stable-alpine
FROM nginx
COPY . /usr/share/nginx/html/


EXPOSE 80
