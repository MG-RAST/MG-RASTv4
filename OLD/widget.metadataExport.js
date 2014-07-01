(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "metadataExport",
            name: "metadataExport",
            author: "Tobias Paczian",
            requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.add_renderer({"name": "listselect", "resource": "renderers/",  "filename": "renderer.listselect.js" }),
		 Retina.load_renderer("listselect") ];
    };
    
    widget.template = {};
    widget.template_status = [];
    widget.data = {};
    widget.data_status = [];
    
    widget.display = function (wparams) {
        widget = this;
	
	widget.target = wparams.target || null;

	if (widget.target) {
	    
	    var html = '\
<h3>export project</h3>\
<div id="selector"></div>\
<button class="btn" onclick="Retina.WidgetInstances.metadataExport[1].mgrast2template();">export template</button>';
	    widget.target.innerHTML = html;
	    
	    var rend = Retina.Renderer.create("listselect", { target: document.getElementById('selector'),
							      multiple: false,
							      data: [],
							      filter_attribute: 'name',
							      asynch_filter_attribute: 'name',
							      asynch_limit: 100,
							      synchronous: false,
							      navigation_url: stm.Config.mgrast_api+'/project?match=all&verbosity=minimal',
							      value: "id",
							      callback: function (data) {
								  Retina.WidgetInstances.metadataExport[1].mgrast2data(data);
							      },
							      filter: ["id", "name", "pi"] });
	    rend.render();
	    rend.update_data({},1);
	    if (Retina.WidgetInstances.hasOwnProperty('login')) {
		Retina.WidgetInstances.login[1].callback = function() {
		    rend.update_data({},1);
		};
	    }
	}

	return widget;
    };

    widget.exportData = function (which) {
	if (which == "template") {
	    stm.saveAs(JSON.stringify(widget.template), "template.json");
	} else {
	    stm.saveAs(JSON.stringify(widget.data), "project.json");
	}
    };

    widget.mgrast2data = function (id) {
	return jQuery.getJSON('http://api.metagenomics.anl.gov/metadata/export/'+id, function (data) {
	    widget = Retina.WidgetInstances.metadataExport[1];

	    widget.data = { "project": { "name"    : data.name,
					 "id"      : data.id,
				         "samples" : [] } };
	    
	    // get project fields
	    for (i in data.data) {
		if (data.data.hasOwnProperty(i)) {
		    widget.data.project[i] = data.data[i].value;
		}
	    }

	    // iterate over samples
	    for (var i=0;i<data.samples.length;i++) {

		// initialize sample
		var new_sample = { "name": data.samples[i].name,
				   "id" : data.samples[i].id,
				   "libraries": [] };
		
		// add sample data
		for (var h in data.samples[i].data) {
		    if (data.samples[i].data.hasOwnProperty(h)) {
			new_sample[h] = data.samples[i].data[h].value;
		    }
		}

		// check if there is an env package
		if (data.samples[i].hasOwnProperty('envPackage')) {
		    
		    // initialize env package
		    var new_env = { "name": data.samples[i].envPackage.name,
				    "type": data.samples[i].envPackage.type,
				    "id": data.samples[i].envPackage.id };
		    
		    // add env package data
		    for (var h in data.samples[i].envPackage.data) {
			if (data.samples[i].envPackage.data.hasOwnProperty(h)) {
			    new_env[h] = data.samples[i].envPackage.data[h].value;
			}
		    }

		    var nested_new_env = {};
		    nested_new_env[new_env.type] = new_env;
		    
		    // add env package to new sample
		    new_sample.envPackage = nested_new_env;
		}

		// check if we have libraries
		if (data.samples[i].hasOwnProperty('libraries')) {

		    // iterate over the samples libraries
		    for (var h=0;h<data.samples[i].libraries.length;h++) {
			
			// initialize new library
			var new_lib = { "name": data.samples[i].libraries[h].name,
					"type": data.samples[i].libraries[h].type,
					"id": data.samples[i].libraries[h].id };
			
			// add library data
			for (var j in data.samples[i].libraries[h].data) {
			    if (data.samples[i].libraries[h].data.hasOwnProperty(j)) {
				new_lib[j] = data.samples[i].libraries[h].data[j].value;
			    }
			}

			var nested_new_lib = {};
			nested_new_lib[new_lib.type] = new_lib;
			
			// add library to sample
			new_sample.libraries.push(nested_new_lib);
		    }
		}

		widget.data.project.samples.push(new_sample);
	    }
	    
	    widget.exportData('data');
	});
    };

    widget.mgrast2template = function () {
	return jQuery.getJSON('http://api.metagenomics.anl.gov/1/metadata/template', function (data) {
	    widget.template = { "name": "mgrast",
				"label": "MG-RAST",
				"description": "MG-RAST metagenome submission metadata template",
				"cvs": {
				    "gender": { "male": true,
						"female": true }
				},
				"groups": {
				    "project": {
					"name": "project",
					"label": "project",
					"toplevel": true,
					"mandatory": true,
					"description": "project",
					"subgroups": { "sample": { "type": "list",
								   "mandatory": true,
								   "label": "samples" },
						     },
					"fields": { "name": { "description": "project name",
							      "type": "string",
							      "mandatory": 1 },
						    "id": { "description": "project id",
							    "type": "string",
							    "mandatory": 1 }
						  }
				    },
				    "sample": {
					"name": "sample",
					"label": "sample",
					"description": "sample",
					"subgroups": { "libraries": { "type": "list",
								      "mandatory": true,
								      "label": "libraries" },
						       "envPackage": { "type": "instance",
								       "mandatory": true,
								       "label": "envPackage" }
						     },
					"fields": { "name": { "description": "sample name",
							      "type": "string",
							      "mandatory": 1 },
						    "id": { "description": "sample id",
							    "type": "string",
							    "mandatory": 1 }
						  }
				    },
				    "libraries": {
					"name": "libraries",
					"label": "library",
					"description": "library",
					"subgroups": {
					    "mimarks-survey": { "type": "instance",
								"mandatory": false,
								"label": "mimarks-survey" },
					    "metagenome": { "type": "instance",
							    "mandatory": false,
							    "label": "metagenome" },
					    "metatranscriptome": { "type": "instance",
								   "mandatory": false,
								   "label": "metatranscriptome" },
					}
				    },
				    "envPackage": { "name": "envPackage",
						    "label": "envPackage",
						    "description": "envPackage",
						    "subgroups": {}
						  }
				}
			      };
	    
	    // get project fields
	    for (i in data.project.project) {
		if (data.project.project.hasOwnProperty(i)) {
		    var field = data.project.project[i];
		    widget.template.groups.project.fields[i] = {
			"description": field.definition,
			"type": field.type,
			"mandatory": field.required == 0 ? false : true
		    };
		}
	    }

	    // get sample fields
	    for (i in data.sample.sample) {
		if (data.sample.sample.hasOwnProperty(i)) {
		    var field = data.sample.sample[i];
		    widget.template.groups.sample.fields[i] = {
			"description": field.definition,
			"type": field.type,
			"mandatory": field.required == 0 ? false : true
		    };
		}
	    }

	    // get library types
	    for (i in data.library) {
		if (data.library.hasOwnProperty(i)) {
		    widget.template.groups[i] = {
			"name": i,
			"label": i,
			"description": i,
			"fields": { "name": { "description": "library name",
					      "type": "string",
					      "mandatory": 1 },
				    "id": { "description": "library id",
					    "type": "string",
					    "mandatory": 1 }
				  }
		    };
		    for (h in data.library[i]) {
			if (data.library[i].hasOwnProperty(h)) {
			    var field = data.library[i][h];
			    widget.template.groups[i].fields[h] = {
				"description": field.definition,
				"type": field.type,
				"mandatory": field.required == 0 ? false : true
			    };
			}
		    }
		}
	    }

	    // get ep types
	    for (i in data.ep) {
		if (data.ep.hasOwnProperty(i)) {
		    widget.template.groups.envPackage.subgroups[i] = { "type": "instance",
								       "mandatory": false,
								       "label": i };
		    widget.template.groups[i] = {
			"name": i,
			"label": i,
			"description": i,
			"fields": { "name": { "description": "package name",
					      "type": "string",
					      "mandatory": 1 },
				    "id": { "description": "package id",
					    "type": "string",
					    "mandatory": 1 }
				  }
		    };
		    for (h in data.ep[i]) {
			if (data.ep[i].hasOwnProperty(h)) {
			    var field = data.ep[i][h];
			    widget.template.groups[i].fields[h] = {
				"description": field.definition,
				"type": field.type,
				"mandatory": field.required == 0 ? false : true
			    };
			}
		    }
		}
	    }

	    widget.exportData('template');
	});
    };
    
})();