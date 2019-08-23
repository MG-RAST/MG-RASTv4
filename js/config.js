var RetinaConfig = {
    // authentication
    "authentication": true,
    "authResources": { "default": "MG-RAST",
		       "MG-RAST": { "icon": "MGRAST_favicon.ico",
		       		    "prefix": "mggo4711",
		       		    "keyword": "Authorization",
		       		    "url": "https://api.mg-rast.org?verbosity=verbose",
		       		    "useHeader": true,
				    "loginField": "login" }
		     },

    // server urls
    "mgrast_ftp": "ftp://ftp.mg-rast.org",
    "mgrast_api": "http://api-dev.mg-rast.org",
    "shock_url": "http://shock.mg-rast.org",
    "awe_url": "http://awe.mg-rast.org",
    
    // versions
    "m5nrversion": "1",
    "serverVersion": "4.0",
    "tos": "2",
    "pipelines": [ 'mgrast-prod-4.0', 'mgrast-prod-4.0.1', 'mgrast-prod-4.0.2', 'mgrast-prod-4.0.3' ], 

    // admin
    "showOTU": false,
    "showProfileChooser": true
};
