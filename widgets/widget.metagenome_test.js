(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 Test Widget",
                name: "metagenome_test",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [];
    };
 
    widget.display = function (params) {
	var widget = this;
	var target = params.main;
	
	var html = "<div style='margin-top: 50px; text-align: center;'><img src='Retina/images/waiting.gif'></div>";

	
	if (! stm.user) {
	    html = "<div class='alert alert-info'>You need to be logged in to submit</div>";
	} else {
	    var promises = [];
	    var p1 = jQuery.Deferred();
	    promises.push(p1);
	    var p2 = jQuery.Deferred();
	    promises.push(p2);
	    jQuery.ajax( { url: 'data/tool.cwl',
			   p: p1,
			   complete: function (xhr) {
			       Retina.WidgetInstances.metagenome_test[1].wfdata = JSON.parse(xhr.responseText.replace(/"null"/g, "null"))['$graph'];
			       this.p.resolve();
			   }
			 });
	    jQuery.ajax(RetinaConfig.mgrast_api+"/inbox", {
		p: p2,
		success: function(data){
		    Retina.WidgetInstances.metagenome_test[1].inboxData = data.files;
		    this.p.resolve();
		},
		error: function(jqXHR, error){
		    Retina.WidgetInstances.metagenome_test[1].showError("unable to get inbox data");
		},
		crossDomain: true,
		headers: stm.authHeader,
		type: "GET"
	    });

	    jQuery.when.apply(this, promises).then(function() {
		var widget = Retina.WidgetInstances.metagenome_test[1];
		widget.showWorkflow(widget.wfdata);
	    });
	}
	
	target.innerHTML = html;

	widget.sidebar.innerHTML = '<h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/info2.png">submission information</h3><ul class="helplist"><li>all submitted data will stay private until the owner makes it public or shares it with another user.</li><li>providing metadata is required to make your data public and will increase your priority in the queue.</li><li>the sooner you choose to make your data public, the higher your priority in the queue will be</li></ul>';
	widget.sidebar.style = "padding: 10px;";

	
	return widget;
    };

    widget.displayInput = function (input, isArray, isOptional) {
	var widget = this;
	
	var html = [];

	var isFile = false;
	if (! input.hasOwnProperty('id')) {
	    input.id = input.name.substr(input.name.lastIndexOf('/')+1);
	}
	var label = input.hasOwnProperty('label') ? input.label : input.id.substr(input.id.lastIndexOf('/')+1);
	var desc = input.hasOwnProperty('doc') ? input.doc : "";
	html.push('<div class="control-group"><label class="control-label" for="'+label+'FormField">'+label+'</label><div class="controls">');
	
	switch (input.type) {
	case 'string':
	    if (isArray) {
		html.push('<textarea name="'+label.replace(/ /g, "_")+'" id="'+label+'FormField">'+(input.hasOwnProperty('default') ? input['default']+'"' : '')+'</textarea>');
	    } else {
		html.push('<input type="text" name="'+label.replace(/ /g, "_")+'" id="'+label+'FormField"'+(input.hasOwnProperty('default') ? ' value="'+input['default']+'"' : '')+'>');
	    }
	    break;
	case 'boolean':
	    html.push('<input type="checkbox" name="'+label.replace(/ /g, "_")+'" id="'+label+'FormField"'+(input.hasOwnProperty('default') && input['default'] ? ' checked=checked' : '')+'>');
	    break;
	case ('int' || 'long' || 'float' || 'double'):
	    if (isArray) {
		html.push('<textarea name="'+label.replace(/ /g, "_")+'" id="'+label+'FormField">'+(input.hasOwnProperty('default') ? input['default']+'"' : '')+'</textarea>');
	    } else {
		html.push('<input type="text" name="'+label.replace(/ /g, "_")+'" id="'+label+'FormField"'+(input.hasOwnProperty('default') ? ' value="'+input['default']+'"' : '')+' onkeypress="Retina.WidgetInstances.metagenome_test[1].check'+input.type+';">');
	    }
	    break;
	case 'File':
	    isFile = true;
	    html.push('<select name="'+label.replace(/ /g, "_")+'" id="'+label+'FormField" length=10'+(isArray ? ' multiple' : '')+'>');
	    for (var i=0; i<widget.inboxData.length; i++) {
		var f = widget.inboxData[i];
		if (! input.hasOwnProperty('format') || (input.hasOwnProperty('format') && f.hasOwnProperty('stats_info') && f.stats_info.type == input.format)) {
		    html.push('<option value="'+f.id+'" title="'+f.filesize.byteSize()+' '+f.timestamp+'">'+f.filename+'</option>');
		}
	    }
	    html.push('</select>');
	    break;
	case 'Directory':
	    break;
	default:
	    if (widget.cvs.hasOwnProperty(input.type)) {
		html.push('<select '+(isArray ? 'multiple length=10 ': '')+'name="'+label.replace(/ /g, "_")+'" id="'+label+'FormField">');
		for (var x=0; x<widget.cvs[input.type].length; x++) {   
		    html.push('<option>'+widget.cvs[input.type][x]+'</option>');
		}
		html.push('</select>');
	    } else {
		console.log('unknown type');
		console.log(input);
	    }
	    break;
	}

	html.push('<span class="help-inline">'+desc+'</span></div></div>');
	return [isFile, html.join('')];
    };

    widget.checkint = function (event) {
	var widget = this;

    };

    widget.checklong = function (event) {
	var widget = this;
	
    };

    widget.checkfloat = function (event) {
	var widget = this;

    };

    widget.checkdouble = function (event) {
	var widget = this;

    };

    widget.showError = function (error) {
	alert(error);
    };

    widget.showWorkflow = function (d) {
	var widget = this;

	// parse cvs
	var cvs = widget.cvs = {};
	var types = widget.types = {};
	var workflow = widget.workflow;
	for (var i=0; i<d.length; i++) {
	    if (d[i]['class'] == "Workflow" && d[i].id == '#main') {
		workflow = jQuery.extend(true, {}, d[i]);
	    }
	    var data = d[i];
	    if (data.hasOwnProperty('requirements')) {
		for (var l=0; l<data.requirements.length; l++) {
		    if (data.requirements[l]['class'] == 'SchemaDefRequirement') {
			for (var h=0; h<data.requirements[l].types.length; h++) {
			    var c = data.requirements[l].types[h];
			    if (c.hasOwnProperty('symbols')) {
				if (! cvs.hasOwnProperty(c.name)) {
				    cvs[c.name] = [];
				    for (var j=0; j<c.symbols.length; j++) {
					cvs[c.name].push(c.symbols[j].substr(c.symbols[j].lastIndexOf('/')+1));
				    }
				}
			    } else if (c.hasOwnProperty('type') && c.type == 'record') {
				types[c.name] = c;
				for (var j=0; j<c.fields.length; j++) {
				    if (typeof c.fields[j].type == 'object' && c.fields[j].type.type == 'enum') {
					if (! cvs.hasOwnProperty(c.fields[j].type.name)) {
					    cvs[c.fields[j].type.name] = [];
					    for (var k=0; k<c.fields[j].type.symbols.length; k++) {
						cvs[c.fields[j].type.name].push(c.fields[j].type.symbols[k].substr(c.fields[j].type.symbols[k].lastIndexOf('/')+1));
					    }
					}
				    }
				}
			    }
			}
			break;
		    }
		}
	    }
	}
	
	// parse data inputs
	var inputFiles = [];
	var mandatories = [];
	var optionals = [];
	var groups = [];

	for (var i=0; i<workflow.inputs.length; i++) {
	    var inp = data.inputs[i];
	    // string
	    if (typeof inp.type == 'string') {
		// check for a reference
		if (types.hasOwnProperty(inp.type)) {
		    groups.push(jQuery.extend(true, {}, types[inp.type]));
		} else {
		    var ret = widget.displayInput(inp);
		    if (ret[0]) {
			inputFiles.push(ret[1]);
		    } else {
			mandatories.push(ret[1]);
		    }
		}
	    }
	    // array
	    else if (inp.length) {

		// test if this is optional
		var isOptional = false;
		for (var h=0; h<inp.type.length; h++) {
		    if (inp.type[h] == null) {
			isOptional = true;
		    }
		}

		// test what the elements are
		for (var h=0; h<inp.type.length; h++) {
		    // check if this is a reference
		    if (types.hasOwnProperty(inp.type[h])) {
			groups.push(jQuery.extend(true, { 'optional': isOptional }, types[inp.type[h]]));
		    }

		    // this is a cv or a base type
		    else {
			var ret = widget.displayInput(inp, true, isOptional);
			if (isOptional) {
			    if (ret[0]) {
				inputFiles.push(ret[1]);
			    } else {
				optionals.push(ret[1]);
			    }
			} else {
			    if (ret[0]) {
				inputFiles.push(ret[1]);
			    } else {
				mandatories.push(ret[1]);
			    }
			}
			if (! ret[0]) {
			    inputFiles.push(ret[1]);
			}
		    }
		}
	    } else if (inp.type.type == 'array') {
		
		// check if this is a reference
		if (types.hasOwnProperty(inp.type.items)) {
		    groups.push(jQuery.extend(true, { 'optional': isOptional }, types[inp.type.items]));
		}
		
		// this is a cv or a base type
		else {
		    var input = jQuery.extend(true, {}, inp);
		    input.type = inp.type.items;
		    var ret = widget.displayInput(input, true, isOptional);
		    if (isOptional) {
			if (ret[0]) {
			    inputFiles.push(ret[1]);
			} else {
			    optionals.push(ret[1]);
			}
		    } else {
			if (ret[0]) {
			    inputFiles.push(ret[1]);
			} else {
			    mandatories.push(ret[1]);
			}
		    }
		}
	    } else {
		groups.push(jQuery.extend(true, {}, inp.type));
	    }
	}

	// parse the groups
	for (var i=0; i<groups.length; i++) {
	    
	    var fields = [];

	    for (var h=0; h<groups[i].fields.length; h++) {
		var inp = groups[i].fields[h];
		
		// string
		if (typeof inp.type == 'string') {
		    fields.push(widget.displayInput(inp)[1]);
		}
		// array
		else if (inp.length) {
		    // test if this is optional
		    var isOptional = false;
		    for (var h=0; h<inp.type.length; h++) {
			if (inp.type[h] == null) {
			    isOptional = true;
			}
		    }
		    
		    // test what the elements are
		    for (var h=0; h<inp.type.length; h++) {
			fields.push(widget.displayInput(inp, true, isOptional)[1]);
		    }
		} else if (inp.type.type == 'array') {
		    var input = jQuery.extend(true, {}, inp);
		    input.type = inp.type.items;
		    fields.push(widget.displayInput(input, true, isOptional)[1]);
		}
	    }
	    
	    groups[i].fields = fields;
	}
	
	// output HTML
	var html = [];

	var numIndex = 1;

	html.push('<div class="wizard span12"><div><li></li><a href="?mgpage=upload">upload<img src="Retina/images/cloud-upload.png"></a></div><div class="separator">›</div><div><li class="active"></li><a href="#" class="active">submit<img src="images/forward.png"></a></div><div class="separator">›</div><div><li></li><a href="?mgpage=pipeline">progress<img src="Retina/images/settings3.png"></a></div></div>');

	html.push('<div style="clear: both; height: 10px;"></div>');

	html.push('<h3>'+data.label+'</h3>');
	html.push('<p>'+data.doc+'</p><form class="form-horizontal" onsubmit="return false;">');

	if (inputFiles.length) {
	    // inputs
	    html.push('<div class="accordion" id="accordion"><div class="accordion-group" style="border: none;"><div class="accordion-heading stage"><a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href="#input" id="inputHeader">'+numIndex+'. select input files</a></div><div id="input" class="accordion-body collapse in">');
	    
	    html.push(inputFiles.join('<br>'));
	    
	    html.push('<div style="height: 20px; clear: both;"></div></div></div>');
	    numIndex++;
	}

	if (mandatories.length) {
	    // mandatory params
	    html.push('<div class="accordion" id="accordion"><div class="accordion-group" style="border: none;"><div class="accordion-heading stage"><a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href="#mandatory" id="mandatoryHeader">'+numIndex+'. select mandatory parameters</a></div><div id="input" class="accordion-body collapse in">');
	    
	    html.push(mandatories.join('<br>'));
	    
	    html.push('<div style="height: 20px; clear: both;"></div></div></div>');
	    numIndex++;
	}

	if (optionals.length) {
	    // optional params
	    html.push('<div class="accordion" id="accordion"><div class="accordion-group" style="border: none;"><div class="accordion-heading stage"><a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href="#optional" id="optionalHeader">'+numIndex+'. select optional parameters</a></div><div id="input" class="accordion-body collapse in">');
	    
	    html.push(optionals.join('<br>'));
	    
	    html.push('<div style="height: 20px; clear: both;"></div></div></div>');
	    numIndex++;
	}

	// custom groups
	for (var i=0; i<groups.length; i++) {
	    var label = groups[i].label || groups[i].name.substr(groups[i].name.lastIndexOf('/')+1).replace(/_/g, " ");
	    html.push('<div class="accordion" id="accordion"><div class="accordion-group" style="border: none;"><div class="accordion-heading stage"><a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href="#optional" id="optionalHeader">'+numIndex+'. '+label+'</a></div><div id="input" class="accordion-body collapse in">');

	    if (groups[i].hasOwnProperty('doc')) {
		html.push('<p>'+groups[i].doc+'</p>');
	    }

	    html.push(groups[i].fields.join('<br>'));

	    html.push('<div style="height: 20px; clear: both;"></div></div></div>');
	    numIndex++;
	}
	
	// submission
	html.push('<div class="accordion" id="accordion"><div class="accordion-group" style="border: none;"><div class="accordion-heading stage"><a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion" href="#submit" id="submitHeader">'+numIndex+'. submit</a></div><div id="input" class="accordion-body collapse in">');

	html.push('<button class="btn">submit</button>');

	html.push('<div style="height: 20px; clear: both;"></div></div></div>');
	
	html.push('</form>');

	widget.main.innerHTML = html.join('');

	return widget;
    };

})();
