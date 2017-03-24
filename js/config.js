var RetinaConfig = {
    // authentication
    "authentication": true,
    "authResources": { "default": "MG-RAST",
		       "MG-RAST": { "icon": "MGRAST_favicon.ico",
		       		    "prefix": "mggo4711",
		       		    "keyword": "Authorization",
		       		    "url": "https://api.metagenomics.anl.gov?verbosity=verbose",
		       		    "useHeader": true,
				    "loginField": "login" }
		     },

    // server urls
    "mgrast_ftp": "ftp://ftp.metagenomics.anl.gov",
    "mgrast_api": "http://api.metagenomics.anl.gov",
    "shock_url": "http://shock.metagenomics.anl.gov",
    "awe_url": "http://awe.metagenomics.anl.gov",
    
    // versions
    "m5nrversion": "1",
    "serverVersion": "4.0",
    "tos": "2",
    "pipelines": [ 'mgrast-prod-4.0', 'mgrast-prod-4.0.1' ]
};
