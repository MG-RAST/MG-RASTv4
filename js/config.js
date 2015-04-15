var RetinaConfig = {
    "authResources": { "default": "MG-RAST",
		       "MG-RAST": { "icon": "MGRAST_favicon.ico",
		       		    "prefix": "mggo4711",
		       		    "keyword": "Authorization",
		       		    "url": "http://dunkirk.mcs.anl.gov/~paczian/MG-RAST/site/CGI/api.cgi?verbosity=verbose",//"http://api.metagenomics.anl.gov?verbosity=verbose",
		       		    "useHeader": true,
				    "loginField": "login" }
		     },
    "mgrast_ftp": "ftp://ftp.metagenomics.anl.gov",
    "mgrast_api": "http://dunkirk.mcs.anl.gov/~paczian/MG-RAST/site/CGI/api.cgi", //"http://api.metagenomics.anl.gov",
    "shock_url": "http://shock.metagenomics.anl.gov",
    "awe_url": "http://140.221.67.236:8000",
    "m5nr_solr_url": "http://140.221.67.212:8983/solr/",
    "metagenome_solr_url": "http://140.221.67.239:8983/solr/",
    "authentication": true
};
