MG-RASTv4
=========

next generation metagenome analysis



## Installation with Docker ##

To build the image either download the Docker file into an empty directory of provide the url to Dockerfile as in this example:

```bash
export TAG=`date +"%Y%m%d.%H%M"`
docker build --force-rm --no-cache --rm -t  mgrast/v4-web:${TAG} https://raw.githubusercontent.com/wgerlach/MG-RASTv4/master/docker/Dockerfile
```

Example for manual invocation:
```bash
docker run -p 80:80 -t -i mgrast/v4-web:${TAG} /usr/sbin/apache2ctl -D FOREGROUND
```

### Other notes ###

```bash
/usr/sbin/apache2ctl status
```
requires
```bash
apt-get install lynx
```
location of html pages: /var/www/html
