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
    "m5nr_solr_url": "http://140.221.67.212:8983/solr/",
    "metagenome_solr_url": "http://140.221.67.239:8983/solr/",

    // v3 backward compatibility
    "v3BaseLoginUrl": "https://metagenomics.anl.gov/",
    "v3CGIUrl": "http://metagenomics.anl.gov/metagenomics.cgi",
    "v3": false,
    
    // versions
    "m5nrversion": "1",
    "serverVersion": "4.0",
    "tos": "2"
};
