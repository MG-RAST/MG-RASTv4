MG-RASTv4
=========

A rich Java script frontend for the v4 version of MG-RAST.


## Installation with Docker ##

To build this image:

make sure you have cloned the required repositories (including git submodules)

git clone --recursive <this repo>

cd into that directory 


To build the image either download the Docker file into an empty directory of provide the url to Dockerfile as in this example:

```bash
docker build -t <some_name> .
```

Example for manual invocation:
```bash
docker run -t -p80:80 -i <some_name>
```

### Other notes ###


location of html pages: /usr/share/nginx/html/

The dockerfile allows building a slim container with alpline base or a fatter one with nginx (debian base). Just look at the Dockerfile

