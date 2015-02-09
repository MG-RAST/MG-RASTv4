# MG-RASTv4 web

FROM ubuntu:14.04

RUN apt-get update ; apt-get -y upgrade

RUN apt-get -y install apache2 git
EXPOSE 80

RUN cd /var/www && \ 
	git clone https://github.com/MG-RAST/MG-RASTv4 && \ 
	cd MG-RASTv4 && \ 
	git submodule init && \ 
	git submodule update

RUN cd /var/www && \ 
	mv html html_old ; \
	ln -s MG-RASTv4 html 

# start apache
CMD /usr/sbin/apache2ctl -D FOREGROUND
