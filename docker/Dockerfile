# MG-RASTv4 web

FROM ubuntu:14.04

RUN apt-get update && apt-get -y upgrade && apt-get -y install apache2 git

# setup sendmail
RUN DEBIAN_FRONTEND=noninteractive apt-get -y install postfix && \
  cp /usr/share/postfix/main.cf.debian /etc/postfix/main.cf && \
  postconf -e relayhost=[smtp.mcs.anl.gov]

RUN cd /var/www && \
	git clone https://github.com/MG-RAST/MG-RASTv4 && \
	cd MG-RASTv4 && \
	git submodule init && \
	git submodule update

RUN cd /var/www && \
	mv html html_old && \
	ln -s MG-RASTv4 html

RUN cd /var/www/MG-RASTv4/js && \
    mv -fv config.js config.js.old && \
    ln -s /config/config.js

# start apache
CMD /usr/sbin/apache2ctl -D FOREGROUND

EXPOSE 80
