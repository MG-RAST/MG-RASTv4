(function () {
    var widget = Retina.Widget.extend({
        about: {
            title: "Metagenome Metadata Wizard Widget",
            name: "metagenome_metazen",
            author: "Tobias Paczian",
            requires: [ "jquery.timepicker.js", "jquery.datepicker.js", "xlsx.js", "jszip.min.js" ]
        }
    });

    widget.typeaheads = [];
    widget.dates = [];
    widget.times = [];
    widget.miscParams = { "project": 1,
			  "sample": 1,
			  "shotgun": 1,
			  "amplicon": 1,
			  "metatranscriptome": 1 };
    
    widget.setup = function () {
	return [ Retina.load_renderer("tree") ];
    };
    
    widget.display = function (params) {
        var widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	if (! stm.user) {
	    content.innerHTML = "<div class='alert alert-info'>You need to be logged in to use this page</div>";
	    return;
	}

	if (! stm.DataStore.hasOwnProperty('cv')) {
	    // jQuery.getJSON("DATA/session_metazen.dump", function (data) {
	    // 	stm.DataStore = data;
	    // 	Retina.WidgetInstances.metagenome_metazen[1].display();
	    // });
	    // return;

	    content.innerHTML = "<div class='alert alert-info'><img src='Retina/images/waiting.gif' style='width: 16px; margin-right: 10px; position: relative; bottom: 2px;'> loading controlled vocabularies</div>";
	    var promise1 = jQuery.Deferred();
	    var promise2 = jQuery.Deferred();
	    var promise3 = jQuery.Deferred();
	    var promise4 = jQuery.Deferred();
	    var promises = [ promise1, promise2, promise3, promise4 ];

	    // load excel template
	    promises.push(widget.loadExcelTemplate());

	    // get the private projects this user has access to
	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		headers: stm.authHeader,
		url: RetinaConfig.mgrast_api+'/project?private=1&edit=1&verbosity=full',
		success: function (data) {
		    if (! stm.DataStore.hasOwnProperty('project')) {
			stm.DataStore.project = {};
		    }
		    var projectNames = [];
		    for (var i=0; i<data.data.length; i++) {
			stm.DataStore.project[data.data[i].id] = data.data[i];
		    }
		    promise4.resolve();
		},
		error: function (xhr) {
		    Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		}});
	    jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/cv", function (data) {
		stm.DataStore.cv = data;

		// LOAD FROM API
		if (! stm.DataStore.cv.hasOwnProperty('versions')) {
		    stm.DataStore.cv.versions = [ stm.DataStore.cv.latest_version.biome ];
		}
		// LOAD FROM API

		stm.DataStore.cv.select.timezone = [ [ '', ''], [ '-12', '(UTC-12:00) U.S. Baker Island, Howland Island'], [ '-11', '(UTC-11:00) Hawaii, American Samoa'], [ '-10', '(UTC-10:00) Cook Islands'], [ '-9:30', '(UTC-9:30) Marguesas Islands'], [ '-9', '(UTC-9:00) Gambier Islands'], [ '-8', '(UTC-8:00) U.S. & Canada Pacific Time Zone'], [ '-7', '(UTC-7:00) U.S. & Canada Mountain Time Zone'], [ '-6', '(UTC-6:00) U.S. & Canada Central Time Zone'], [ '-5', '(UTC-5:00) U.S. Eastern Time Zone'], [ '-4:30', '(UTC-4:30) Venezuela'], [ '-4', '(UTC-4:00) Canada Atlantic Time Zone'], [ '-3:30', '(UTC-3:30) Newfoundland'], [ '-3', '(UTC-3:00) French Guiana, Falkland Islands'], [ '-2', '(UTC-2:00) South Georgia and the South Sandwich Islands'], [ '-1', '(UTC-1:00) Cape Verde'], [ '0', '(UTC+0:00) Ireland, London'], [ '1', '(UTC+1:00) Amsterdam, Berlin'], [ '2', '(UTC+2:00) Athens, Cairo, Johannesburg'], [ '3', '(UTC+3:00) Baghdad, Riyadh'], [ '3:30', '(UTC+3:30) Tehran'], [ '4', '(UTC+4:00) Dubai, Moscow'], [ '4:30', '(UTC+4:30) Kabul'], [ '5', '(UTC+5:00) Pakistan'], [ '5:30', '(UTC+5:30) Delhi, Mumbai'], [ '5:45', '(UTC+5:45) Nepal'], [ '6', '(UTC+6:00) Bangladesh'], [ '6:30', '(UTC+6:30) Cocos Islands'], [ '7', '(UTC+7:00) Bangkok, Hanoi'], [ '8', '(UTC+8:00) Beijing, Singapore'], [ '8:45', '(UTC+8:45) Eucla'], [ '9', '(UTC+9:00) Seoul, Tokyo'], [ '9:30', '(UTC+9:30) Adelaide'], [ '10', '(UTC+10:00) Sydney, Melbourne'], [ '10:30', '(UTC+10:30) New South Wales'], [ '11', '(UTC+11:00) Solomon Islands'], [ '11:30', '(UTC+11:30) Norfolk Island'], [ '12', '(UTC+12:00) U.S. Wake Island'], [ '12:45', '(UTC+12:45) Chatham Islands'], [ '13', '(UTC+13:00) Samoa'], [ '14', '(UTC+14:00) Line Islands' ] ];
		jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?label=biome&version="+stm.DataStore.cv.latest_version["biome"], function (data) {
		    stm.DataStore.biome = data;
		    promise1.resolve();
		});
		jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?label=feature&version="+stm.DataStore.cv.latest_version["feature"], function (data) {
		    stm.DataStore.feature = data;
		    promise2.resolve();
		});
		jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?label=material&version="+stm.DataStore.cv.latest_version["material"], function (data) {
		    stm.DataStore.material = data;
		    promise3.resolve();
		});
	    });

	    jQuery.when.apply(this, promises).then(function() {
		Retina.WidgetInstances.metagenome_metazen[1].display();
	    });

	    return;
	}

	// help text
	sidebar.setAttribute('style', 'padding: 10px;');
	var sidehtml = '<h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/help.png">Terminology</h3><dl>';
	sidehtml += '\
<dt>project</dt><dd>a set of samples which are being analyzed together</dd>\
<dt>sample</dt><dd>a single entity that has been obtained for analysis</dd>\
<dt>library</dt><dd>a prepped collection of DNA fragments generated from a sample (also, in this case, corresponds to a sequencing run)</dd>\
<dt>environmental information</dt><dd>the characteristics which describe the environment in which your samples were obtained</dd>\
<dt>sample set</dt><dd>a group of samples sharing the same library and environmental characteristics</dd>';
	sidehtml += '</dl>';

	sidebar.innerHTML = sidehtml;

	// title
	var html = '<h3>What does MetaZen do?</h3>\
<p>Metadata (or data about the data) has become a necessity as the community generates large quantities of data sets.</p>\
<p>Using community generated questionnaires we capture this metadata. MG-RAST has implemented the use of <a target="_blank" href="http://gensc.org/gc_wiki/index.php/MIxS">Minimum Information about any (X) Sequence</a> (miXs) developed by the <a target="_blank" href="http://gensc.org">Genomic Standards Consortium</a> (GSC).</p>\
<p>The best form to capture metadata is via a simple spreadsheet with 12 mandatory terms. This tool is designed to help you fill out your metadata spreadsheet. The metadata you provide, helps us to analyze your data more accurately and helps make MG-RAST a more useful resource.</p>\
<p>This tool will help you get started on completing your metadata spreadsheet by filling in any information that is common across all of your samples and/or libraries. This tool currently only allows users to enter one environmental package for your samples and all samples must have been sequenced by the same number of sequencing technologies with the same number of replicates. This information is entered in tab #2 below. If your project deviates from this convention, you must either produce multiple separate metadata spreadsheets or generate your spreadsheet and then edit the appropriate fields manually.</p>';

	html += "<h4>Prefill Form</h4><p>To prefill the project tab with information from a previous project, enter an existing project name into the text field and click the 'prefill form' button.</p><div class='input-append'><select id='projectname' style='width: 100%;'></select><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].prefillForm();'>prefill form</button></div>";

	// start accordion
	html += "<form class='form-horizontal' onsubmit='return false;'>";
	
	html += '<div class="accordion" id="accordion" style="margin-top: 20px;">';
	
	html += widget.newAccordion({ "id": "project", "title": "1. enter project information", "content": widget.formProject() });

	html += widget.newAccordion({ "id": "sampleset", "title": "2. enter sample set information", "content": widget.formSampleSet() });

	html += widget.newAccordion({ "id": "environment", "title": "3. enter environment information", "content": widget.formEnvironment() });
	
	html += widget.newAccordion({ "id": "sample", "title": "4. enter sample information", "content": widget.formSample() });

	html += widget.newAccordion({ "id": "shotgun", "title": "5. enter shotgun metagenome information", "content": widget.formShotgun(), "hidden": true });

	html += widget.newAccordion({ "id": "metatranscriptome", "title": "6. enter meta transcriptome information", "content": widget.formMetatranscriptome(), "hidden": true });

	html += widget.newAccordion({ "id": "amplicon", "title": "7. enter amplicon metagenome (16S) information", "content": widget.formAmplicon(), "hidden": true });

	html += "</div></form>";

	html += "<button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].exportExcel();'>download excel spreadsheet</button>";

	content.innerHTML = html;

	widget.fillFormFormatting();
	widget.currentENVOversion = stm.DataStore.cv.latest_version["biome"];
	widget.showENVOversion();
    };

     // action functions
    widget.prefillForm = function () {
	var widget = this;

	var project = document.getElementById('projectname');
	if (project.selectedIndex > 0) {
	    var pdata = stm.DataStore.project[project.options[project.selectedIndex].value].metadata;
	    if (pdata.PI_email) { document.getElementById('project_PI_email').value = pdata.PI_email; document.getElementById('project_PI_email').onchange(); }
	    if (pdata.PI_firstname) { document.getElementById('project_PI_firstname').value = pdata.PI_firstname; document.getElementById('project_PI_firstname').onchange(); }
	    if (pdata.PI_lastname) { document.getElementById('project_PI_lastname').value = pdata.PI_lastname; document.getElementById('project_PI_lastname').onchange(); }
	    if (pdata.PI_organization) { document.getElementById('project_PI_organization').value = pdata.PI_organization; document.getElementById('project_PI_organization').onchange(); }
	    if (pdata.PI_organization_address) { document.getElementById('project_PI_organization_address').value = pdata.PI_organization_address; document.getElementById('project_PI_organization_address').onchange(); }
	    if (pdata.PI_organization_country) {
		var elem = document.getElementById('project_PI_organization_country');
		for (var i=0; i<elem.options.length; i++) {
		    if (elem.options[i].value == pdata.PI_organization_country) {
			elem.selectedIndex = i;
			break;
		    }
		}
		if (elem.selectedIndex > 0) {
		    elem.parentNode.parentNode.className = "control-group success";
		}
	    }
	    if (pdata.PI_organization_url) { document.getElementById('project_PI_organization_url').value = pdata.PI_organization_url; }
	    if (pdata.project_name) { document.getElementById('project_project_name').value = pdata.project_name; document.getElementById('project_project_name').onchange(); }
	    if (pdata.project_funding) { document.getElementById('project_project_funding').value = pdata.project_funding; }
	    if (pdata.project_description) { document.getElementById('project_project_description').value = pdata.project_description; }
	    if (pdata.email) { document.getElementById('project_email').value = pdata.email; }
	    if (pdata.firstname) { document.getElementById('project_firstname').value = pdata.firstname; }
	    if (pdata.organization) { document.getElementById('project_organization').value = pdata.organization; }
	    if (pdata.organization_address) { document.getElementById('project_organization_address').value = pdata.organization_address; }
	    if (pdata.organization_country) {
		var elem = document.getElementById('project_organization_country');
		for (var i=0; i<elem.options.length; i++) {
		    if (elem.options[i].value == pdata.organization_country) {
			elem.selectedIndex = i;
			break;
		    }
		}
	    }
	    if (pdata.organization_url) { document.getElementById('project_organization_url').value = pdata.organization_url; }
	    if (pdata.greengenes_id) { document.getElementById('project_greengenes_id').value = pdata.greengenes_id; }
	    if (pdata.mgrast_id) { document.getElementById('project_mgrast_id').value = pdata.mgrast_id; }
	    if (pdata.ncbi_id) { document.getElementById('project_ncbi_id').value = pdata.ncbi_id; }
	    if (pdata.vamps_id) { document.getElementById('project_vamps_id').value = pdata.vamps_id; }
	    if (pdata.qiime_id) { document.getElementById('project_qiime_id').value = pdata.qiime_id; }
	    var p = 1;
	    while (pdata["misc_param_"+p]) {
		document.getElementById('project_misc_param_'+p).value = pdata["misc_param_"+p];
		widget.addMiscParam('project');
		p++;
	    }
	}
    };

    widget.addMiscParam = function (which) {
	var widget = this;

	widget.miscParams[which]++;
	var div = document.createElement('div');
	div.innerHTML = '<div class="control-group"><label for="'+which+'_misc_param_'+widget.miscParams[which]+'" class="control-label">Miscellaneous Param '+widget.miscParams[which]+'<sup onmouseout="$(this).popover(\'hide\');" onmouseover="$(this).popover(\'show\');" data-content="any other measurement performed or parameter collected, that is not otherwise listed" style="cursor: help;">[?]</sup></label><div class="controls"><input type="text" id="'+which+'_misc_param_'+widget.miscParams[which]+'"></div></div>'
	document.getElementById('misc_params_'+which).appendChild(div);
    };

    widget.selectSampleSet = function () {
	parseInt(document.getElementById('numShotgun').value) ? document.getElementById('shotgunAccordion').style.display = "" : document.getElementById('shotgunAccordion').style.display = "none";
	parseInt(document.getElementById('numMetatranscriptome').value) ? document.getElementById('metatranscriptomeAccordion').style.display = "" : document.getElementById('metatranscriptomeAccordion').style.display = "none";
	parseInt(document.getElementById('numAmplicon').value) ? document.getElementById('ampliconAccordion').style.display = "" : document.getElementById('ampliconAccordion').style.display = "none";
    };
    
    // constructor helper functions
    widget.newAccordion = function (params) {
	var widget = this;

	var html = "<div class='accordion-group' style='border: none;"+(params.hidden ? " display: none;" : "")+"' id='"+params.id+"Accordion'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#"+params.id+"' id='"+params.id+"Header'>"+params.title+"</a></div><div id='"+params.id+"' class='accordion-body collapse'>"+params.content+"<div style='margin-bottom: 20px;'></div></div></div>";

	return html;
    };

    widget.newSection = function (params) {
	var widget = this;

	var html = "<div class='span"+(params.wide ? "12" : "5")+"'>";
	html += "<h5>"+params.title+"</h5>";
	if (params.hasOwnProperty('description')) {
	    html += "<p>"+params.description+"</p>";
	}
	for (var i=0; i< params.fields.length; i++) {
	    html += widget.inputField(params.fields[i]);
	}
	html += "</div>";

	return html;
    };

    widget.inputField = function (params) {
	var widget = this;

	var html = '\
<div class="control-group'+(params.mandatory ? " error" : (params.className ? " "+params.className : ""))+'">\
  <label class="control-label" for="'+params.id+'">'+params.label+'<sup style="cursor: help;" data-content="'+params.help+'" data-container="body" onmouseover="$(this).popover(\'show\');" onmouseout="$(this).popover(\'hide\');">[?]</sup></label>\
<div class="controls">';

	var validation = "";
	if (params.mandatory) {
	    validation = " onchange='if(this.value.length==0){this.parentNode.parentNode"+(params.unit ? ".parentNode" : "")+".className=\"control-group error\";}else{this.parentNode.parentNode"+(params.unit ? ".parentNode" : "")+".className=\"control-group success\";};'";
	}

	if (params.unit) {
	    html += "<div class='input-append date'>";
	} else if (params.type == 'time') {
	    html += "<div class='input-append bootstrap-timepicker-component'>";
	} else if (params.type == 'date') {
	    html += "<div class='input-append'>";
	}

	if (params.type == 'cv' && stm.DataStore.cv.select.hasOwnProperty(params.cv)) {
	    if (typeof stm.DataStore.cv.select[params.cv][0] == "object") {
		var opts = [];
		for (var i=0; i<stm.DataStore.cv.select[params.cv].length; i++) {
		    opts.push("<option value='"+stm.DataStore.cv.select[params.cv][i][0]+"'>"+stm.DataStore.cv.select[params.cv][i][1]+"</option>");
		}
		html += '<select id="'+params.id+'">'+opts.join("")+'</select>';
	    } else {
		html += '<select id="'+params.id+'"><option></option><option>'+stm.DataStore.cv.select[params.cv].join("</option><option>")+'</option></select>';
	    }
	} else if (params.type == 'longtext') {
	    html += '<textarea id="'+params.id+'" style="height: 180px;"></textarea>';
	} else {
	    var vstring = "";
	    var validation_alert = "";
	    if (params.type == 'email') {
		vstring = '\\@';
		validation_alert = "you must enter a valid email address";
	    } else if (params.type == 'url') {
		vstring = '^http(s?)\\:\\/\\/';
		validation_alert = "you must enter a valid url";
	    }
	    if (params.validation) {
		vstring = params.validation;
		validation_alert = params.validationAlert;
	    }
	    if (vstring.length) {
		validation = " onchange='if(! this.value.match(/"+vstring+"/)){this.parentNode.parentNode"+(params.unit ? ".parentNode" : "")+".className=\"control-group error\";alert(\""+validation_alert+"\");}else{this.parentNode.parentNode"+(params.unit ? ".parentNode" : "")+".className=\"control-group success\";};'";
	    }
	    html += '<input type="text" id="'+params.id+'"'+validation+''+(params.unit ? ' class="span10"' : '')+'>';
	    if (params.type == 'typeahead') {
		widget.typeaheads.push({id: params.id, data: stm.DataStore.cv.select[params.cv]});
	    } else if (params.type == 'date') {
		widget.dates.push(params.id);
	    } else if (params.type == 'time') {
		widget.times.push(params.id);
	    }
	}

	if (params.unit) {
	    html += "<span class='add-on'>"+params.unit+"</span></div>";
	} else if (params.type == 'time') {
	    html += '<span class="add-on"><i class="icon-time"></i></span></div>';
	} else if (params.type == 'date') {
	    html += '<span class="add-on"><i class="icon-th"></i></span></div>';
	}

	html += '  </div>\
</div>';

	return html;
    };

    // fill data functions that require the DOM element to exist
    widget.fillFormFormatting = function () {
	var widget = this;

	// project options
	var projectOptions = [ "<option></option>" ];
	for (var i in stm.DataStore.project) {
	    if (stm.DataStore.project.hasOwnProperty(i)) {
		projectOptions.push("<option value='"+i+"'>"+stm.DataStore.project[i].name+"</option>");
	    }
	}
	document.getElementById('projectname').innerHTML = projectOptions.join("");

	// ontology trees
	var biome = widget.biome = Retina.Renderer.create('tree', { target: document.getElementById('tree_biome'), data: stm.DataStore.biome, width: 0 }).render();	
	var feature = widget.feature = Retina.Renderer.create('tree', { target: document.getElementById('tree_feature'), data: stm.DataStore.feature, width: 0 }).render();	
	var material = widget.material = Retina.Renderer.create('tree', { target: document.getElementById('tree_material'), data: stm.DataStore.material, width: 0 }).render();
	
	// typeaheads
	for (var i=0; i<widget.typeaheads.length; i++) {
	    jQuery("#"+widget.typeaheads[i].id).typeahead({source: widget.typeaheads[i].data});
	}

	// datepickers
	var nowTemp = new Date();
	var d = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);
	var dstring = [d.getFullYear(),
		       (d.getMonth()+1).padLeft(),
		       d.getDate().padLeft()].join('-');
	for (var i=0; i<widget.dates.length; i++) {
	    document.getElementById(widget.dates[i]).setAttribute('value', dstring);
	    jQuery("#"+widget.dates[i]).datepicker({format: 'yyyy-mm-dd'});
	}

	// timepickers
	for (var i=0; i<widget.times.length; i++) {
	    document.getElementById(widget.times[i]).setAttribute('value', "00:00:00");
	    jQuery("#"+widget.times[i]).timepicker({
		minuteStep: 1,
		defaultTime: false,
		showSeconds: true,
		showMeridian: false
	    });
	}
    };

    widget.loadExcelTemplate = function () {
	var widget = this;

	var prom = jQuery.Deferred();
	var xhr = new XMLHttpRequest();
	xhr.p = prom;
	var method = "GET";
	var base_url = "data/MGRAST_MetaData_template_1.6.xlsx";
	if ("withCredentials" in xhr) {
	    xhr.open(method, base_url, true);
	} else if (typeof XDomainRequest != "undefined") {
	    xhr = new XDomainRequest();
	    xhr.open(method, base_url);
	} else {
	    alert("your browser does not support CORS requests");
	    console.log("your browser does not support CORS requests");
	    return undefined;
	}

	xhr.responseType = 'arraybuffer';

	xhr.onload = function() {
	    // the file is loaded, create a javascript object from it
	    widget.excelWorkbook = xlsx(xhr.response);
	    this.p.resolve();
	}

	xhr.send();

	return prom;
    };

    widget.selectENVO = function (sel) {
	var widget = this;

	widget.currentENVOversion = sel.options[sel.selectedIndex].value;

	var promise1 = jQuery.Deferred();
	var promise2 = jQuery.Deferred();
	var promise3 = jQuery.Deferred();
	var promises = [ promise1, promise2, promise3 ];
	
	jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?label=biome&version="+widget.currentENVOversion, function (data) {
	    stm.DataStore.biome = data;
	    promise1.resolve();
	});
	jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?label=feature&version="+widget.currentENVOversion, function (data) {
	    stm.DataStore.feature = data;
	    promise2.resolve();
	});
	jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?label=material&version="+widget.currentENVOversion, function (data) {
	    stm.DataStore.material = data;
	    promise3.resolve();
	});

	jQuery.when.apply(this, promises).then(function() {
	    var widget = Retina.WidgetInstances.metagenome_metazen[1];
	    widget.biome.settings.data = stm.DataStore.biome;
	    widget.feature.settings.data = stm.DataStore.feature;
	    widget.material.settings.data = stm.DataStore.material;
	    widget.biome.render();
	    widget.feature.render();
	    widget.material.render();
	    widget.showENVOversion();
	});
	
	document.getElementById('envo_select_div').innerHTML = "<div class='alert alert-info'><img src='Retina/images/waiting.gif' style='width: 24px;'> loading selected ENVO version</div>";
    };

    widget.showENVOselect = function () {
	var widget = this;

	var select = document.getElementById('envo_select_div');

	var html = "<div class='input-append'><select>";
	for (var i=0; i<stm.DataStore.cv.versions.length; i++) {
	    html += "<option>"+stm.DataStore.cv.versions[i]+"</option>";
	}
	html += "</select><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].selectENVO(this.previousSibling);'>select</button></div>";
	select.innerHTML = html;

	select.style.display = "";
    };

    widget.showENVOversion = function () {
	var widget = this;

	var current = document.getElementById('envo_version_div');
	var select = document.getElementById('envo_select_div');

	current.innerHTML = widget.currentENVOversion;

	select.style.display = "none";
    };

    /*
     FORM SECTION - THIS SHOULD BE LOADED FROM THE API
    */
    widget.formProject = function () {
	var widget = this;

	var html = "<p>Please enter your contact information below. It is important that the PI and technical contact information (if different than the PI) is entered so that if a technical contact is no longer available, the PI can still gain access to their data. Note that selecting 'other' under 'Project Funding' enables an additional text field where you can type in your funding source.</p><p>Required project fields are marked in red and must be entered.</p>";

	html += widget.newSection( { "title": "Principal Investigator (PI) Information",
				    "fields": [
					{ "label": "PI e-mail", "id": "project_PI_email", "help": "Administrative contact email", "mandatory": true, "type": "email" },
					{ "label": "PI First Name", "id": "project_PI_firstname", "help": "Administrative contact first name", "mandatory": true, "type": "text" },
					{ "label": "PI Last Name", "id": "project_PI_lastname", "help": "Administrative contact last name", "mandatory": true, "type": "text" },
					{ "label": "PI Organization", "id": "project_PI_organization", "help": "Administrative contact organization", "mandatory": true, "type": "text" },
					{ "label": "PI Org Address", "id": "project_PI_organization_address", "help": "Administrative contact address", "mandatory": true, "type": "text" },
					{ "label": "PI Org Country", "id": "project_PI_organization_country", "help": "Administrative contact country. Country names should be chosen from the INSDC country list: http://insdc.org/country.html", "mandatory": true, "type": "cv", "cv": "country" },
					{ "label": "PI Org URL", "id": "project_PI_organization_url", "help": "Administrative contact organization url", "mandatory": false, "type": "url" }
				    ] } );

	html += "<div class='span1'></div>";

	html += widget.newSection( { "title": "Technical Contact Information",
				    "fields": [
					{ "label": "Contact e-mail", "id": "project_email", "help": "Technical contact email", "mandatory": false, "type": "email" },
					{ "label": "Contact First Name", "id": "project_firstname", "help": "Technical contact first name", "mandatory": false, "type": "text" },
					{ "label": "Contact Last Name", "id": "project_lastname", "help": "Technical contact last name", "mandatory": false, "type": "text" },
					{ "label": "Organization", "id": "project_organization", "help": "Technical contact organization", "mandatory": false, "type": "text" },
					{ "label": "Organization Address", "id": "project_organization_address", "help": "Technical contact address", "mandatory": false, "type": "text" },
					{ "label": "Organization Country", "id": "project_organization_country", "help": "Technical contact country. Country names should be chosen from the INSDC country list: http://insdc.org/country.html", "mandatory": false, "type": "cv", "cv": "country" },
					{ "label": "Organization URL", "id": "project_organization_url", "help": "Technical contact organization url", "mandatory": false, "type": "url" }
				    ] } );

	html += widget.newSection( { "title": "Project Information",
				     "fields": [
					 { "label": "Project Name", "id": "project_project_name", "help": "Name of the project within which the sequencing was organized", "mandatory": true, "type": "text" },
					 { "label": "Project Funding", "id": "project_project_funding", "help": "Funding source of the project", "mandatory": false, "type": "typeahead", "cv": "funding" },
					 { "label": "Project Description", "id": "project_project_description", "help": "Description of the project within which the sequencing was organized", "mandatory": false, "type": "longtext" },
				     ] } );

	html += "<div class='span1'></div>";

	html += widget.newSection( { "title": "dbXref IDs",
				     "description": "Below you can enter project ID's from different analysis tools so that your dataset can be linked across these resources.",
				     "fields": [
					 { "label": "<a target='_blank' href='http://greengenes.lbl.gov'>Greengenes</a> Project ID", "id": "project_greengenes_id", "help": "External Greengenes Study ID", "mandatory": false, "type": "text" },
					 { "label": "<a target='_blank' href='http://metagenomics.anl.gov/'>MG-RAST</a> Project ID", "id": "project_mgrast_id", "help": "MG-RAST Project ID", "mandatory": false, "type": "text" },
					 { "label": "<a target='_blank' href='http://www.ncbi.nlm.nih.gov/'>NCBI</a> Project ID", "id": "project_ncbi_id", "help": "External NCBI Project ID", "mandatory": false, "type": "text" },
					 { "label": "<a target='_blank' href='http://qiime.org/'>QIIME</a> Project ID", "id": "project_qiime_id", "help": "External QIIME Project ID", "mandatory": false, "type": "text" },
					 { "label": "<a href='http://vamps.mbl.edu/' target='_blank'>VAMPS</a> Project ID", "id": "project_vamps_id", "help": "External VAMPS Project code", "mandatory": false, "type": "text" },
				     ] } );

	html += widget.newSection( { "wide": true,
				     "title": "Other project information",
				     "description": "Below you can enter other project information about your dataset for which their may not be an input field. (e.g. contact phone number)",
				     "fields": [
					 { "label": "Miscellaneous Param 1", "id": "project_misc_param_1", "help": "any other measurement performed or parameter collected, that is not otherwise listed", "mandatory": false, "type": "text" }
				     ] } );

	html += "<div id='misc_params_project' class='span12'></div><div style='clear: both;'><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].addMiscParam(\"project\");'>add misc param</button></div>";

	return html;
    };

    widget.formSampleSet = function () {
	var widget = this;

	var html = "<p>Enter the information below about your set of samples. First, indicate the total number of samples in your set. Second, tell us which environmental package your samples belong to. Then, indicate how many times each of your samples was sequenced by each sequencing method. Note, that it is allowable to indicate here if your samples were sequenced using more than one sequencing method.</p><p>You must submit the information here before proceeding with the rest of the form. If you edit this information, please click the button below again before continuing with the rest of the form or your spreadsheet will not be filled in properly.</p>";

	html += '\
<table style="margin-top: 25px;">\
<tr style="font-weight: bold; vertical-align: top;"><td># of samples</td><td>environmental package</td><td># of shotgun metagenome libraries per sample</td><td># of meta transcriptome libraries per sample</td><td># of amplicon metagenome (16S) libraries per sample</td></tr>\
<tr><td style="padding-right: 15px;"><input type="text" style="width: 100px;" id="numSamples"></td><td style="padding-right: 15px;"><select id="envPackage"><option>'+stm.DataStore.cv.select.env_package.join("</option><option>")+'</option></select></td><td style="padding-right: 15px;"><input type="text" style="width: 100px;" id="numShotgun"></td><td style="padding-right: 15px;"><input type="text" style="width: 100px;" id="numMetatranscriptome"></td><td><input type="text" style="width: 100px;" id="numAmplicon"></td></tr>\
</table>';

	html += "<button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].selectSampleSet();' style='width: 100%; margin-top: 15px;'>show library input forms</button>";

	return html;
    };

    widget.formEnvironment = function () {
	var widget = this;

	var html = "<p>Use three different terms from controlled vocabularies for biome, environmental feature, and environmental material to classify your samples. Note that while the terms might not be perfect matches for your specific project they are primarily meant to allow use of your data by others. You can enter your detailed project description in the project tab at the top of this form.</p><p>The data shown represents ENVO version <span id='envo_version_div'></span> <button class='btn btn-mini' onclick='Retina.WidgetInstances.metagenome_metazen[1].showENVOselect();'>choose different version</button><div id='envo_select_div' style='display: none;'></div></p><table><tr><td style='font-weight: bold; padding-left: 10px;'>Biome</td><td style='font-weight: bold; padding-left: 10px;'>Environmental Feature</td><td style='font-weight: bold; padding-left: 10px;'>Environmental Material</td></tr><tr><td><div id='tree_biome'></div></td><td><div id='tree_feature'></div></td><td><div id='tree_material'></div></td></tr></table>";

	return html;
    };

    widget.formSample = function () {
	var widget = this;

	var html = "<p>Please enter only information that is consistent across all samples. This data will be pre-filled in the spreadsheet.</p><p>Required sample fields are marked in blue, because unlike required project fields, they can be entered after downloading your spreadsheet.</p>";

	html += widget.newSection({ "title": "Date/Time Information",
				    "fields": [
					{ "label": "Collection Date", "id": "sample_collection_date", "help": "The date of sampling. Use ISO8601 compliant format, ie. 2008-01-23", "mandatory": false, "type": "date", "className": "info" },
					{ "label": "Collection Time", "id": "sample_collection_time", "help": "The local time of sampling. Use ISO8601 compliant format, ie. 19:23:10", "mandatory": false, "type": "time", "className": "info" },
					{ "label": "Collection Timezone", "id": "sample_collection_timezone", "help": "The timezone of sampling. Use ISO8601 compliant format, ie. UTC-7", "mandatory": false, "type": "cv", "cv": "timezone", "className": "info" }				    ] });

	html += "<div class='span1'></div>";

	html += widget.newSection({ "title": "Location Information",
				    "description": 'You can use Google Maps <a target="_blank" href="https://maps.google.com/">here</a> and the instructions <a target="_blank" href="http://support.google.com/maps/bin/answer.py?hl=en&answer=1334236">here</a> to identify the latitude and longitude of your desired location.',
				    "fields": [
					{ "label": "Location/Address", "id": "sample_location", "help": "The geographical origin of the sample as defined by the specific local region name", "mandatory": false, "type": "text", "className": "info" },
					{ "label": "Latitude", "id": "sample_latitude", "help": "The geographical origin of the sample as defined by latitude. The value should be reported in decimal degrees and in WGS84 system", "mandatory": false, "type": "text", "className": "info", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Longitude", "id": "sample_longitude", "help": "The geographical origin of the sample as defined by longitude. The value should be reported in decimal degrees and in WGS84 system", "mandatory": false, "type": "text", "className": "info", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Country/Water body", "id": "sample_country", "help": "The geographical origin of the sample as defined by the country or sea name. Country or sea names should be chosen from the INSDC country list: http://insdc.org/country.html", "mandatory": false, "type": "typeahead", "cv": "country", "className": "info" }
				    ] });

	html += widget.newSection({ "title": "Optional Fields",
				    "fields": [
					{ "label": "Altitude", "id": "sample_altitude", "help": "The altitude of the sample is the vertical distance in meters between Earth's surface above Sea Level and the sampled position in the air.", "mandatory": false, "type": "text", "unit": "meters", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Biotic Relationship", "id": "sample_biotic_relationship", "help": "Is it free-living or in a host and if the latter what type of relationship is observed", "mandatory": false, "type": "cv", "cv": "biotic_relationship" },
					{ "label": "Continent", "id": "sample_continent", "help": "The geographical origin of the sample as defined by continent. Use one of: Africa, Antarctica, Asia, Australia, Europe, North America, South America", "mandatory": false, "type": "cv", "cv": "continent" },
					{ "label": "Depth", "id": "sample_depth", "help": "Depth is defined as the vertical distance in meters below surface, e.g. for sediment or soil samples depth is measured from sediment or soil surface, respectivly.", "mandatory": false, "type": "text", "unit": "meters", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Elevation", "id": "sample_elevation", "help": "The elevation of the sampling site in meters as measured by the vertical distance from mean sea level.", "mandatory": false, "type": "text", "unit": "meters", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "pH", "id": "sample_ph", "help": "pH measurement of the sample", "mandatory": false, "type": "text", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Rel to Oxygen", "id": "sample_rel_to_oxygen", "help": "Is this organism an aerobe, anaerobe? Please note that aerobic and anaerobic are valid descriptors for microbial environments", "mandatory": false, "type": "cv", "cv": "rel_to_oxygen" },
					{ "label": "Sample ID", "id": "sample_sample_id", "help": "Internal ID of sample", "mandatory": false, "type": "text" },
					{ "label": "Sample Collect Device", "id": "sample_samp_collect_device", "help": "The method or device employed for isolating/collecting the sample", "mandatory": false, "type": "text" },
					{ "label": "Sample Size", "id": "sample_samp_size", "help": "Amount or size of sample (volume, mass or area) that was collected, along with the unit used", "mandatory": false, "type": "text", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Temperature", "id": "sample_temperature", "help": "Temperature of the sample in celsius at time of sampling", "mandatory": false, "type": "text", "unit": "°C", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" }
				    ] });

	html += "<div class='span1'></div>";

	html += widget.newSection({ "title": "More Optional Fields",
				    "fields": [
					{ "label": "Encoded Traits", "id": "sample_encoded_traits", "help": "Should include key traits like antibiotic resistance or xenobiotic degradation phenotypes for plasmids, converting genes for phage", "mandatory": false, "type": "text" },
					{ "label": "Estimated Size", "id": "sample_estimated_size", "help": "The estimated size of the genome prior to sequencing. Of particular importance in the sequencing of (eukaryotic) genome which could remain in draft form for a long or unspecified period.", "mandatory": false, "type": "text", "unit": "bp", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Experimental Factor", "id": "sample_experimental_factor", "help": "Experimental factors are essentially the variable aspects of an experiment design which can be used to describe an experiment, or set of experiments, in an increasingly detailed manner.", "mandatory": false, "type": "text" },
					{ "label": "Extrachrom Elements", "id": "sample_extrachrom_elements", "help": "Do plasmids exist of significant phenotypic consequence (e.g. ones that determine virulence or antibiotic resistance). Megaplasmids? Other plasmids (borrelia has 15+ plasmids)", "mandatory": false, "type": "text" },
					{ "label": "Health/Disease Status", "id": "sample_health_disease_stat", "help": "Health or disease status of specific host at time of collection. This field accepts PATO (v1.269) terms, for a browser please see http://bioportal.bioontology.org/visualize/44601", "mandatory": false, "type": "text" },
					{ "label": "Host Specificity/Range", "id": "sample_host_spec_range", "help": "The NCBI taxonomy identifier of the specific host if it is known", "mandatory": false, "type": "text" },
					{ "label": "Isolation & Growth Cond", "id": "sample_isol_growth_condt", "help": "Publication reference in the form of pubmed ID (pmid), digital object identifier (doi) or url for isolation of the sample", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://metagenomics.anl.gov/">MG-RAST</a> Sample ID', "id": "sample_mgrast_id", "help": "MG-RAST Sample ID", "mandatory": false, "type": "text" },
					{ "label": "Number of Replicons", "id": "sample_num_replicons", "help": "Reports the number of replicons in a nuclear genome of eukaryotes, in the genome of a bacterium or archaea or the number of segments in a segmented virus. Always applied to the haploid chromosome count of a eukaryote", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Pathogenicity", "id": "sample_pathogenicity", "help": "To what is the entity pathogenic. ", "mandatory": false, "type": "text" },
					{ "label": "Propagation", "id": "sample_propagation", "help": "This field is specific to different taxa. For phages: lytic/lysogenic, for plasmids: incompatibility group (Note: there is the strong opinion to name phage propagation obligately lytic or temperate, therefore we also give this choice", "mandatory": false, "type": "text" },
					{ "label": "Ref Biomaterial", "id": "sample_ref_biomaterial", "help": "primary publication if isolated before genome publication; otherwise, primary genome report", "mandatory": false, "type": "text" },
					{ "label": "Sample Mat Process", "id": "sample_samp_mat_process", "help": "Any processing applied to the sample during or after retrieving the sample from environment. This field accepts OBI, for a browser of OBI (v1.0) terms please see http://bioportal.bioontology.org/visualize/40832", "mandatory": false, "type": "text" },
					{ "label": "Sample Strategy", "id": "sample_sample_strategy", "help": "e.g. enriched , screened or normalized", "mandatory": false, "type": "text" },
					{ "label": "Source Material ID", "id": "sample_source_mat_id", "help": "The name of the culture collection, holder of the voucher or an institution. Could enumerate a list of common resources, just as the American Type Culture Collection (ATCC), German Collection of Microorganisms and Cell Cultures (DSMZ) etc. Can select not deposited", "mandatory": false, "type": "text" },
					{ "label": "Specific Host", "id": "sample_specific_host", "help": "If there is a host involved, please provide its taxid (or environmental if not actually isolated from the dead or alive host - i.e. pathogen could be isolated from a swipe of a bench etc) and report whether it is a laboratory or natural host). From this we can calculate any number of groupings of hosts (e.g. animal vs plant, all fish hosts, etc)", "mandatory": false, "type": "text" },
					{ "label": "Sub Genetic Lineage", "id": "sample_subspecf_gen_lin", "help": "This should provide further information about the genetic distinctness of this lineage by recording additional information i.e biovar, serovar, serotype, biovar, or any relevant genetic typing schemes like Group I plasmid. It can also contain alternative taxonomic information", "mandatory": false, "type": "text" },
					{ "label": "Trophic Level", "id": "sample_trophic_level", "help": "Trophic levels are the feeding position in a food chain. Microbes can be a range of producers (e.g. chemolithotroph)", "mandatory": false, "type": "cv", "cv": "trophic_level" }
				    ] });
	
	
	html += widget.newSection( { "wide": true,
				     "title": "Other sample information",
				     "description": "Below you can enter other sample information about your dataset for which their may not be an input field.",
				     "fields": [
					 { "label": "Miscellaneous Param 1", "id": "sample_misc_param_1", "help": "any other measurement performed or parameter collected, that is not otherwise listed", "mandatory": false, "type": "text" }
				     ] } );

	html += "<div id='misc_params_sample' class='span12'></div><div style='clear: both;'><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].addMiscParam(\"sample\");'>add misc param</button></div>";

	return html;
    };

    widget.formShotgun = function () {
	var widget = this;

	var html = "<p>Please enter only information that is consistent across all shotgun metagenome libraries. This data will be pre-filled in the spreadsheet.</p><p>Required shotgun metagenome library fields are marked in blue, because unlike required project fields, they can be entered after downloading your spreadsheet.</p><p>The 'Metagenome Name' must be made unique after downloading your spreadsheet. Also, please include the 'File Name' if this is a new project.</p>";

	html += widget.newSection({ "title": "Required Field",
				    "wide": true,
				    "fields": [
					{ "label": "Metagenome Name", "id": "metagenome_metagenome_name", "help": "Unique name for the sequences from this library", "mandatory": false, "type": "text", "className": "info" } ] });

	html += widget.newSection({ "title": "Assembly information",
				    "description": "Note that 'Assembly Program', 'Error Rate', and 'Assembly Comments' will be combined into one field ('Assembly') in the generated spreadsheet.",
				    "fields": [
					{ "label": "Assembly Name", "id": "metagenome_assembly_name", "help": "Name/version of the assembly provided by the submitter that is used in the genome browsers and in the community", "mandatory": false, "type": "text" },
					{ "label": "Assembly Program", "id": "metagenome_assembly_program", "help": "Program used to assemble your sequences.", "mandatory": false, "type": "typeahead", "cv": "assembly" },
					{ "label": "Error Rate", "id": "metagenome_error_rate", "help": "Estimated error rate associated with the finished sequences. Error rate of 1 in 1,000bp.", "mandatory": false, "type": "text", "unit": "err/kbp" },
					{ "label": "Assembly Comments", "id": "metagenome_assembly_comments", "help": "Enter other information about the sequence assembly that was performed (e.g. method of calculation).", "mandatory": false, "type": "text" } ] });

	html += "<div class='span1'></div>";

	html += widget.newSection({ "title": "Sequencing information",
				    "fields": [
					{ "label": "Sequencing Method", "id": "metagenome_seq_meth", "help": "Sequencing method used. Use one of: sanger, pyrosequencing, abi-solid, ion torrent, 454, illumina, assembeled, other", "mandatory": false, "type": "typeahead", "cv": "seq_meth", "className": "info" },
					{ "label": "Sequencer Make", "id": "metagenome_seq_make", "help": "Make of the sequencing machine", "mandatory": false, "type": "text" },
					{ "label": "Sequencer Model", "id": "metagenome_seq_model", "help": "Model of the sequencing machine", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Chemistry", "id": "metagenome_seq_chem", "help": "Sequencing chemistry used", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Center URL", "id": "metagenome_seq_url", "help": "URL of institute sequencing was done", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Center", "id": "metagenome_seq_center", "help": "Name of institute sequencing was done", "mandatory": false, "type": "text" },
					{ "label": "Sequence Qual Check", "id": "metagenome_seq_quality_check", "help": "Indicate if the sequence has been called by automatic systems (none) or undergone a manual editing procedure (e.g. by inspecting the raw data or chromatograms).", "mandatory": false, "type": "text" } ] });

	html += widget.newSection({ "title": "Optional Fields",
				    "fields": [
					{ "label": '<a target="_blank" href="http://metagenomics.anl.gov/">MG-RAST</a> Library ID', "id": "metagenome_mgrast_id", "help": "MG-RAST Library ID", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://metagenomics.anl.gov/">MG-RAST</a> Metagenome ID', "id": "metagenome_metagenome_id", "help": "MG-RAST metagenome ID for sequences in this library", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://www.pubmed.com/">PubMed</a> ID', "id": "metagenome_pubmed_id", "help": "External GOLD ID", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://www.genomesonline.org">GOLD</a> ID', "id": "metagenome_gold_id", "help": "External GOLD ID", "mandatory": false, "type": "text" },
					{ "label": "File Name", "id": "metagenome_file_name", "help": "Name of the sequence file submitted to MG-RAST", "mandatory": false, "type": "text" },
					{ "label": "File Checksum", "id": "metagenome_file_checksum", "help": "MD5 checksum of the sequence file submitted to MG-RAST", "mandatory": false, "type": "text" },
					{ "label": "Adapters", "id": "metagenome_adapters", "help": "Adapters provide priming sequences for both amplification and sequencing of the sample-library fragments. Both adapters should be reported; in uppercase letters", "mandatory": false, "type": "text" }
				    ] });

	html += "<div class='span1'></div>";

	html += widget.newSection({ "title": "More Optional Fields",
				    "fields": [
					{ "label": "454 Gasket Type", "id": "metagenome_454_gasket_type", "help": "Type gasket used, For 454 only", "mandatory": false, "type": "text" },
					{ "label": "454 Regions", "id": "metagenome_454_regions", "help": "Number of regions used. For 454 only", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Lib Construct Method", "id": "metagenome_lib_const_meth", "help": "Library construction method used for clone libraries", "mandatory": false, "type": "text" },
					{ "label": "Lib Clones Sequenced", "id": "metagenome_lib_reads_seqd", "help": "Total number of clones sequenced from the library", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Lib Screening Method", "id": "metagenome_lib_screen", "help": "Specific enrichment or screening methods applied before and/or after creating clone libraries", "mandatory": false, "type": "text" },
					{ "label": "Lib Size", "id": "metagenome_lib_size", "help": "Total number of clones in the library prepared for the project", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Lib Size Mean", "id": "metagenome_lib_size_mean", "help": "Mean size of library clones", "mandatory": false, "type": "text", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Lib Type", "id": "metagenome_lib_type", "help": "Type of library used. For 454 only", "mandatory": false, "type": "text" },
					{ "label": "Lib Vector", "id": "metagenome_lib_vector", "help": "Cloning vector type(s) used in construction of libraries", "mandatory": false, "type": "text" },
					{ "label": "Nucleic Acid Amp", "id": "metagenome_nucl_acid_amp", "help": "Link to a literature reference, electronic resource or a standard operating procedure (SOP)", "mandatory": false, "type": "text" },
					{ "label": "Nucleic Acid Extension", "id": "metagenome_nucl_acid_ext", "help": "Link to a literature reference, electronic resource or a standard operating procedure (SOP)", "mandatory": false, "type": "text" }
				    ] } );

	html += widget.newSection( { "wide": true,
				     "title": "Other library information",
				     "description": "Below you can enter other sample information about your dataset for which their may not be an input field.",
				     "fields": [
					 { "label": "Miscellaneous Param 1", "id": "shotgun_misc_param_1", "help": "any other measurement performed or parameter collected, that is not otherwise listed", "mandatory": false, "type": "text" }
				     ] } );

	html += "<div id='misc_params_shotgun' class='span12'></div><div style='clear: both;'><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].addMiscParam(\"shotgun\");'>add misc param</button></div>";


	return html;
    };

    widget.formMetatranscriptome = function () {
	var widget = this;

	var html = "<p>Please enter only information that is consistent across all meta transcriptome libraries. This data will be pre-filled in the spreadsheet.</p>Required meta transcriptome library fields are marked in blue, because unlike required project fields, they can be entered after downloading your spreadsheet.</p><p>The 'Metagenome Name' must be made unique after downloading your spreadsheet. Also, please include the 'File Name' if this is a new project.</p>";

	html += widget.newSection({ "title": "Required Fields",
				    "fields": [
					{ "label": "Metagenome Name", "id": "metatranscriptome_metagenome_name", "help": "Unique name for the sequences from this library", "mandatory": false, "type": "text", "className": "info" },
				    	{ "label": "mRNA Percent", "id": "metatranscriptome_mrna_percent", "help": "mRNA as a percentage of total RNA after rRNA removal", "mandatory": false, "type": "text", "className": "info", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" }] });

	html += "<div class='span1'></div>";

	html += widget.newSection({ "title": "Sequencing information",
				    "fields": [
					{ "label": "Sequencing Method", "id": "metatranscriptome_seq_meth", "help": "Sequencing method used. Use one of: sanger, pyrosequencing, abi-solid, ion torrent, 454, illumina, assembeled, other", "mandatory": false, "type": "typeahead", "cv": "seq_meth", "className": "info" },
					{ "label": "Sequencer Make", "id": "metatranscriptome_seq_make", "help": "Make of the sequencing machine", "mandatory": false, "type": "text" },
					{ "label": "Sequencer Model", "id": "metatranscriptome_seq_model", "help": "Model of the sequencing machine", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Chemistry", "id": "metatranscriptome_seq_chem", "help": "Sequencing chemistry used", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Center URL", "id": "metatranscriptome_seq_url", "help": "URL of instatute sequencing was done", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Center", "id": "metatranscriptome_seq_center", "help": "Name of instatute sequencing was done", "mandatory": false, "type": "text" },
					{ "label": "Sequence Qual Check", "id": "metatranscriptome_seq_quality_check", "help": "Indicate if the sequence has been called by automatic systems (none) or undergone a manual editing procedure (e.g. by inspecting the raw data or chromatograms).", "mandatory": false, "type": "text" }
				    ] });

	html += widget.newSection({ "title": "Optional Fields",
				    "fields": [
					{ "label": '<a target="_blank" href="http://metagenomics.anl.gov/">MG-RAST</a> Library ID', "id": "metatranscriptome_mgrast_id", "help": "MG-RAST Library ID", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://metagenomics.anl.gov/">MG-RAST</a> Metagenome ID', "id": "metatranscriptome_metagenome_id", "help": "MG-RAST metagenome ID for sequences in this library", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://www.pubmed.com/">PubMed</a> ID', "id": "metatranscriptome_pubmed_id", "help": "External GOLD ID", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://www.genomesonline.org">GOLD</a> ID', "id": "metatranscriptome_gold_id", "help": "External GOLD ID", "mandatory": false, "type": "text" },
					{ "label": "File Name", "id": "metatranscriptome_file_name", "help": "Name of the sequence file submitted to MG-RAST", "mandatory": false, "type": "text" },
					{ "label": "File Checksum", "id": "metatranscriptome_file_checksum", "help": "MD5 checksum of the sequence file submitted to MG-RAST", "mandatory": false, "type": "text" },
					{ "label": "cDNA Amp Meth", "id": "metatranscriptome_cdna_ampf_meth", "help": "Link to a literature reference, electronic resource or a standard operating procedure (SOP) describing the method for amplifying the cDNA to boost the amount of material available for sequencing", "mandatory": false, "type": "text" },
					{ "label": "cDNA Purification Meth", "id": "metatranscriptome_cdna_purif_meth", "help": "Link to a literature reference, electronic resource or a standard operating procedure (SOP) describing the method for removal of trace RNA contaminants from cDNA", "mandatory": false, "type": "text" },
					{ "label": "Rev Transcript Meth", "id": "metatranscriptome_rev_trans_meth", "help": "Link to a literature reference, electronic resource or a standard operating procedure (SOP) describing the method for reverse transcription, including the enzyme name, method and details of primers", "mandatory": false, "type": "text" },
					{ "label": "rRNA Removal Method", "id": "metatranscriptome_rrna_removal_meth", "help": "Link to a literature reference, electronic resource or a standard operating procedure (SOP) describing the method for removal of rRNA from total RNA", "mandatory": false, "type": "text" },
					{ "label": "Sample Isolation Time", "id": "metatranscriptome_samp_isol_dur", "help": "The length of time taken to isolate the physical sample, for example time between obtaining the sample, filtration steps and finally snap freezing", "mandatory": false, "type": "text", "unit": "sec", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" }
				    ] } );

	html += "<div class='span1'></div>";

	html += widget.newSection({ "title": "More Optional Fields",
				    "fields": [
					{ "label": "454 Gasket Type", "id": "metatranscriptome_454_gasket_type", "help": "Type gasket used, For 454 only", "mandatory": false, "type": "text" },
					{ "label": "454 Regions", "id": "metatranscriptome_454_regions", "help": "Number of regions used. For 454 only", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Lib Construct Method", "id": "metatranscriptome_lib_const_meth", "help": "Library construction method used for clone libraries", "mandatory": false, "type": "text" },
					{ "label": "Lib Clones Sequenced", "id": "metatranscriptome_lib_reads_seqd", "help": "Total number of clones sequenced from the library", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Lib Screening Method", "id": "metatranscriptome_lib_screen", "help": "Specific enrichment or screening methods applied before and/or after creating clone libraries", "mandatory": false, "type": "text" },
					{ "label": "Lib Size", "id": "metatranscriptome_lib_size", "help": "Total number of clones in the library prepared for the project", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Lib Size Mean", "id": "metatranscriptome_lib_size_mean", "help": "Mean size of library clones", "mandatory": false, "type": "text", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Lib Type", "id": "metatranscriptome_lib_type", "help": "Type of library used. For 454 only", "mandatory": false, "type": "text" },
					{ "label": "Lib Vector", "id": "metatranscriptome_lib_vector", "help": "Cloning vector type(s) used in construction of libraries", "mandatory": false, "type": "text" }
				    ] } );

	html += widget.newSection( { "wide": true,
				     "title": "Other sample information",
				     "description": "Below you can enter other library information about your dataset for which their may not be an input field.",
				     "fields": [
					 { "label": "Miscellaneous Param 1", "id": "metatranscriptome_misc_param_1", "help": "any other measurement performed or parameter collected, that is not otherwise listed", "mandatory": false, "type": "text" }
				     ] } );

	html += "<div id='misc_params_metatranscriptome' class='span12'></div><div style='clear: both;'><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].addMiscParam(\"metatranscriptome\");'>add misc param</button></div>";

	return html;
    };

    widget.formAmplicon = function () {
	var widget = this;

	var html = "<p>Please enter only information that is consistent across all amplicon metagenome (16S) libraries. This data will be pre-filled in the spreadsheet.</p><p>Required amplicon metagenome (16S) library fields are marked in blue, because unlike required project fields, they can be entered after downloading your spreadsheet.</p><p>The 'Metagenome Name' must be made unique after downloading your spreadsheet. Also, please include the 'File Name' if this is a new project.</p>";

	html += widget.newSection({ "title": "Required Fields",
				    "fields": [
					{ "label": "Metagenome Name", "id": "mimarks-survey_metagenome_name", "help": "Unique name for the sequences from this library", "mandatory": false, "type": "text", "className": "info" },
				    	{ "label": "Target Gene", "id": "mimarks-survey_target_gene", "help": "Targeted gene or locus name for marker gene studies; e.g. 16S rRNA, 18S rRNA, nif, amoA, rpo", "mandatory": false, "type": "text", "className": "info" }] });

	html += "<div class='span1'></div>";

	html += widget.newSection({ "title": "Sequencing information",
				    "fields": [
					{ "label": "Sequencing Method", "id": "mimarks-survey_seq_meth", "help": "Sequencing method used. Use one of: sanger, pyrosequencing, abi-solid, ion torrent, 454, illumina, assembeled, other", "mandatory": false, "type": "typeahead", "cv": "seq_meth", "className": "info" },
					{ "label": "Sequencer Make", "id": "mimarks-survey_seq_make", "help": "Make of the sequencing machine", "mandatory": false, "type": "text" },
					{ "label": "Sequencer Model", "id": "mimarks-survey_seq_model", "help": "Model of the sequencing machine", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Chemistry", "id": "mimarks-survey_seq_chem", "help": "Sequencing chemistry used", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Center URL", "id": "mimarks-survey_seq_url", "help": "URL of instatute sequencing was done", "mandatory": false, "type": "url" },
					{ "label": "Sequencing Center", "id": "mimarks-survey_seq_center", "help": "Name of instatute sequencing was done", "mandatory": false, "type": "text" },
					{ "label": "Sequence Qual Check", "id": "mimarks-survey_seq_quality_check", "help": "Indicate if the sequence has been called by automatic systems (none) or undergone a manual editing procedure (e.g. by inspecting the raw data or chromatograms).", "mandatory": false, "type": "text" },
					{ "label": "Sequencing Direction", "id": "mimarks-survey_seq_direction", "help": "Sequencing direction, valid terms are forward, reverse, both - requied by VAMPS", "mandatory": false, "type": "cv", "cv": "seq_direction" }
				    ] });

		html += widget.newSection({ "title": "Optional Fields",
				    "fields": [
					{ "label": '<a target="_blank" href="http://metagenomics.anl.gov/">MG-RAST</a> Library ID', "id": "mimarks-survey_mgrast_id", "help": "MG-RAST Library ID", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://metagenomics.anl.gov/">MG-RAST</a> Metagenome ID', "id": "mimarks-survey_metagenome_id", "help": "MG-RAST metagenome ID for sequences in this library", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://www.pubmed.com/">PubMed</a> ID', "id": "mimarks-survey_pubmed_id", "help": "External GOLD ID", "mandatory": false, "type": "text" },
					{ "label": '<a target="_blank" href="http://www.genomesonline.org">GOLD</a> ID', "id": "mimarks-survey_gold_id", "help": "External GOLD ID", "mandatory": false, "type": "text" },
					{ "label": "File Name", "id": "mimarks-survey_file_name", "help": "Name of the sequence file submitted to MG-RAST", "mandatory": false, "type": "text" },
					{ "label": "File Checksum", "id": "mimarks-survey_file_checksum", "help": "MD5 checksum of the sequence file submitted to MG-RAST", "mandatory": false, "type": "text" },
					{ "label": "Adapters", "id": "mimarks-survey_adapters", "help": "Adapters provide priming sequences for both amplification and sequencing of the sample-library fragments. Both adapters should be reported in uppercase letters", "mandatory": false, "type": "text" },
					{ "label": "Amp Polymerase", "id": "mimarks-survey_amp_polymerase", "help": "The polymerase used for amplification. Compare to tail_polymerase. Also could be RT PCR if rRNA was isolated from specimen.", "mandatory": false, "type": "text" },
					{ "label": "Denaturation Time (Init)", "id": "mimarks-survey_denaturation_duration_initial", "help": "Initial denaturation time in seconds", "mandatory": false, "type": "text", "unit": "sec", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Denaturation Temp (Init)", "id": "mimarks-survey_denaturation_temp_initial", "help": "Initial denaturation temperature in celsius", "mandatory": false, "type": "text", "unit": "°C", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Cycle Annealing Time", "id": "mimarks-survey_cycle_annealing_duration", "help": "Cycle annealing time in seconds", "mandatory": false, "type": "text", "unit": "sec", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Cycle Annealing Method", "id": "mimarks-survey_cycle_annealing_method", "help": "Cycle annealing method. Use one of: static, touchdown, gradient, other", "mandatory": false, "type": "cv", "cv": "cycle_annealing_method" },
					{ "label": "Cycle Annealing Temp", "id": "mimarks-survey_cycle_annealing_temp", "help": "Cycle annealing temperature in celsius. May be one or more values", "mandatory": false, "type": "text", "unit": "°C", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Cycle Count", "id": "mimarks-survey_cycle_count", "help": "Number of thermocycles", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Cycle Denaturation Time", "id": "mimarks-survey_cycle_denaturation_duration", "help": "Cycle denaturation time in seconds", "mandatory": false, "type": "text", "unit": "sec", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Cycle Denaturation Temp", "id": "mimarks-survey_cycle_denaturation_temp", "help": "Cycle denaturation temperature in celsius", "mandatory": false, "type": "text", "unit": "°C", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Cycle Extension Time", "id": "mimarks-survey_cycle_extension_duration", "help": "Cycle extension time in seconds", "mandatory": false, "type": "text", "unit": "sec", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Cycle Extension Temp", "id": "mimarks-survey_cycle_extension_temp", "help": "Cycle extension temperature in celsius", "mandatory": false, "type": "text", "unit": "°C", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Extension Time (Final)", "id": "mimarks-survey_extension_duration_final", "help": "Final extension time in seconds", "mandatory": false, "type": "text", "unit": "sec", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Extension Temp (Final)", "id": "mimarks-survey_extension_temp_final", "help": "Final extension temperature in celsius", "mandatory": false, "type": "text", "unit": "°C", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Fwd Primers", "id": "mimarks-survey_reverse_primers", "help": "List of forward PCR primers that were used to amplify the sequence of the targeted gene, locus or subfragment", "mandatory": false, "type": "text" },
					{ "label": "Fwd Primer Final Conc", "id": "mimarks-survey_forward_primer_final_conc", "help": "Forward primer fina", "mandatory": false, "type": "text", "unit": "micromolar", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Fwd Barcodes", "id": "mimarks-survey_forward_barcodes", "help": "List of barcodes attached to forward primers", "mandatory": false, "type": "text" },
					{ "label": "Rev Primers", "id": "mimarks-survey_reverse_primers", "help": "List of reverse PCR primers that were used to amplify the sequence of the targeted gene, locus or subfragment", "mandatory": false, "type": "text" },
					{ "label": "Rev Primer Final Conc", "id": "mimarks-survey_reverse_primer_final_conc", "help": "Reverse primer final concentration in micromolar", "mandatory": false, "type": "text", "unit": "micromolar", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Rev Barcodes", "id": "mimarks-survey_reverse_barcodes", "help": "List of barcodes attached to reverse primers", "mandatory": false, "type": "text" },
					{ "label": "PCR Buffer pH", "id": "mimarks-survey_pcr_buffer_pH", "help": "pH of PCR buffer", "mandatory": false, "type": "text", "unit": "pH", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "PCR Clean Up Kits", "id": "mimarks-survey_pcr_clean_up_kits", "help": "One or more can be listed, but should be in corresponding order with clean_up_methods. Ex: MoBio UltraClean PCR Clean-Up Kit", "mandatory": false, "type": "text" },
					{ "label": "PCR Clean Up Methods", "id": "mimarks-survey_pcr_clean_up_methods", "help": "One or more can be listed. Ex: column, gel, precipitation, size exclusion filtration", "mandatory": false, "type": "text" },
					{ "label": "PCR Notes", "id": "mimarks-survey_pcr_notes", "help": "Additional notes/information about PCR", "mandatory": false, "type": "text" },
					{ "label": "PCR Replicates", "id": "mimarks-survey_pcr_replicates", "help": "Replicate PCR reactiond that are pooled", "mandatory": false, "type": "text" },
					{ "label": "PCR Volume", "id": "mimarks-survey_pcr_volume", "help": "PCR buffer volume expressed in microliters", "mandatory": false, "type": "text", "unit": "µl", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Target Subfragment", "id": "mimarks-survey_target_subfragment", "help": "Name of subfragment of a gene or locus; e.g. V6, V9, ITS", "mandatory": false, "type": "text" },
					{ "label": "Thermocycler", "id": "mimarks-survey_thermocycler", "help": "Thermocycler make and model", "mandatory": false, "type": "text" }
				    ] } );

	html += "<div class='span1'></div>";

	html += widget.newSection({ "title": "More Optional Fields",
				    "fields": [
					{ "label": "BSA Final Conc", "id": "mimarks-survey_BSA_final_conc", "help": "Final BSA concentration expressed in milligram / milliliter", "mandatory": false, "type": "text", "unit": "mg/ml", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "KCl Final Conc", "id": "mimarks-survey_KCl_final_conc", "help": "KCl final concentration expressed in millimolar", "mandatory": false, "type": "text", "unit": "µl" },
					{ "label": "MgCl2 Final Conc", "id": "mimarks-survey_MgCl2_final_conc", "help": "MgCl2 final concentration expressed in millimolar", "mandatory": false, "type": "text", "unit": "µl", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "NAP Volume", "id": "mimarks-survey_NAP_volume", "help": "A list of volumes of nucleic acid preps used for PCR in this batch. Expressed in microliters", "mandatory": false, "type": "text", "unit": "µl", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Tris HCl Final Conc", "id": "mimarks-survey_Tris_HCl_final_conc", "help": "Tris-HCl final concentration expressed in millimolar", "mandatory": false, "type": "text", "unit": "micromolar", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Cloning Kit", "id": "mimarks-survey_cloning_kit", "help": "Cloning kit make and model", "mandatory": false, "type": "text" },
					{ "label": "dATP Final Conc", "id": "mimarks-survey_dATP_final_conc", "help": "dATP final concentration in micromolar", "mandatory": false, "type": "text", "unit": "micromolar", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "dCTP Final Conc", "id": "mimarks-survey_dCTP_final_conc", "help": "dATP final concentration in micromolar", "mandatory": false, "type": "text", "unit": "micromolar", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "dGTP Final Conc", "id": "mimarks-survey_dGTP_final_conc", "help": "dATP final concentration in micromolar", "mandatory": false, "type": "text", "unit": "micromolar", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "dTTP Final Conc", "id": "mimarks-survey_dTTP_final_conc", "help": "dATP final concentration in micromolar", "mandatory": false, "type": "text", "unit": "micromolar", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Domain", "id": "mimarks-survey_domain", "help": "Archaea , Bacteria , Eukarya - requiered by VAMPS", "mandatory": false, "type": "cv", "cv": "domain" },
					{ "label": "Gelatin Final Conc", "id": "mimarks-survey_gelatin_final_conc", "help": "Gelatin final concentration expressed in percent", "mandatory": false, "type": "text", "unit": "%", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Host Cells", "id": "mimarks-survey_host_cells", "help": "Component cells make and model", "mandatory": false, "type": "text" },
					{ "label": "Lib Construct Method", "id": "mimarks-survey_lib_const_meth", "help": "Library construction method used for clone libraries", "mandatory": false, "type": "text" },
					{ "label": "Lib Clones Sequenced", "id": "mimarks-survey_lib_reads_seqd", "help": "Total number of clones sequenced from the library", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Lib Screening Method", "id": "mimarks-survey_lib_screen", "help": "Specific enrichment or screening methods applied before and/or after creating clone libraries", "mandatory": false, "type": "text" },
					{ "label": "Lib Size", "id": "mimarks-survey_lib_size", "help": "Total number of clones in the library prepared for the project", "mandatory": false, "type": "text", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Lib Vector", "id": "mimarks-survey_lib_vector", "help": "Cloning vector type(s) used in construction of libraries", "mandatory": false, "type": "text" },
					{ "label": "Lib Institute", "id": "mimarks-survey_library_institute", "help": "Name of institute creating the library", "mandatory": false, "type": "text" },
					{ "label": "Lib Notes", "id": "mimarks-survey_library_notes", "help": "Additional notes/information about the library", "mandatory": false, "type": "text" },
					{ "label": "Local NAP IDs", "id": "mimarks-survey_local_NAP_ids", "help": "A list of nucleic acid prep ids processed in this batch. This is the ID attached to the tube containing the purified nucleic acids", "mandatory": false, "type": "text" },
					{ "label": "Nucleic Acid Amp", "id": "mimarks-survey_nucl_acid_amp", "help": "Link to a literature reference, electronic resource or a standard operating procedure (SOP)", "mandatory": false, "type": "text" },
					{ "label": "Nucleic Acid Extension", "id": "mimarks-survey_nucl_acid_ext", "help": "Link to a literature reference, electronic resource or a standard operating procedure (SOP)", "mandatory": false, "type": "text" },
					{ "label": "Other Additives", "id": "mimarks-survey_other_additives", "help": "Any other PCR additive that is not listed here", "mandatory": false, "type": "text" },
					{ "label": "Polymerase Units", "id": "mimarks-survey_polymerase_units", "help": "Enzymatic units per tube", "mandatory": false, "type": "text", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" },
					{ "label": "Run Number", "id": "mimarks-survey_run_number", "help": "Samples were sequenced in multiple pools with non-unique barcodes", "mandatory": false, "type": "text" },
					{ "label": "Tailing Reaction Time", "id": "mimarks-survey_tail_duration", "help": "Incubation time for tailing reaction in seconds", "mandatory": false, "type": "text", "unit": "sec", "validation": "^\\d+$", "validationAlert": "Please enter an integer value" },
					{ "label": "Tailing Reaction Poly", "id": "mimarks-survey_tail_polymerase", "help": "The polymerase used in tailing reaction", "mandatory": false, "type": "text" },
					{ "label": "Tailing Reaction Temp", "id": "mimarks-survey_tail_temp", "help": "Incubation temperature for tailing reaction in celsius", "mandatory": false, "type": "text", "unit": "°C", "validation": "^\\d+(\\.\\d+)?$", "validationAlert": "Please enter a decimal value" }
				    ] } );

	html += widget.newSection( { "wide": true,
				     "title": "Other library information",
				     "description": "Below you can enter other library information about your dataset for which their may not be an input field.",
				     "fields": [
					 { "label": "Miscellaneous Param 1", "id": "amplicon_misc_param_1", "help": "any other measurement performed or parameter collected, that is not otherwise listed", "mandatory": false, "type": "text" }
				     ] } );

	html += "<div id='misc_params_amplicon' class='span12'></div><div style='clear: both;'><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].addMiscParam(\"amplicon\");'>add misc param</button></div>";

	return html;
    };

    widget.exportExcel = function () {
	var widget = this;

	var wb = jQuery.extend(true, {}, widget.excelWorkbook);
	var inputs = document.getElementsByTagName('input');
	var selects = document.getElementsByTagName('select');
	var areas = document.getElementsByTagName('textarea');
	var fields = [];
	for (var i=0; i<inputs.length; i++) {
	    fields.push(inputs[i]);
	}
	for (var i=0; i<selects.length; i++) {
	    selects[i].value = selects[i].options[selects[i].selectedIndex].value;
	    fields.push(selects[i]);
	}
	for (var i=0; i<areas.length; i++) {
	    fields.push(areas[i]);
	}
	var data = { "project": {},
		     "sample": {},
		     "metagenome": {},
		     "metatranscriptome": {},
		     "mimarks-survey": {}
		   };

	for (var i=0; i<fields.length; i++) {
	    if (fields[i].value.length) {
		var id = fields[i].id;
		for (var h in data) {
		    if (data.hasOwnProperty(h)) {
			var re = new RegExp("^"+h+"_");
			if (id.match(re)) {
			    var fieldname = id.replace(re, "");
			    data[h][fieldname] = fields[i].value;
			    break;
			}
		    }
		}
	    }
	}
	data.sample.biome = document.getElementById('tree_search_input_1').value;
	data.sample.feature = document.getElementById('tree_search_input_2').value;
	data.sample.material = document.getElementById('tree_search_input_3').value;
	data.project.ENVO_version = widget.currentENVOversion;

	// fill in the project sheet
	for (var i=0; i<wb.worksheets[1].maxCol; i++) {
	    if (data.project.hasOwnProperty(wb.worksheets[1].data[0][i].value)) {
		wb.setCell(1, i, 2, data.project[wb.worksheets[1].data[0][i].value]);
	    }
	}
	for (var i in data.project) {
	    if (data.project.hasOwnProperty(i) && i.match(/^misc_param_\d+/)) {
		wb.setCell(1, wb.worksheets[1].maxCol, 0, i);
		wb.setCell(1, wb.worksheets[1].maxCol - 1, 2, data.project[i]);
	    }
	}

	// fill in the sample sheet
	var numSamples = document.getElementById('numSamples').value || 1;
	numSamples = parseInt(numSamples);
	for (var i=0; i<numSamples; i++) {
	    wb.setCell(2,0,i+2,"Sample"+(i+1));
	    for (var h=0; h<wb.worksheets[2].maxCol; h++) {
		if (data.sample.hasOwnProperty(wb.worksheets[2].data[0][h].value)) {
		    wb.setCell(2, h, 2, data.sample[wb.worksheets[2].data[0][h].value]);
		}
	    }
	}
	
	// check env package
	var ep = document.getElementById('envPackage').options[document.getElementById('envPackage').selectedIndex].value;
	for (var i=0; i<wb.worksheets.length; i++) {
	    if (wb.worksheets[i].name.match(/^ep /)) {
		if (wb.worksheets[i].name == "ep "+ep) {
		    for (var h=0; h<numSamples; h++) {
			wb.setCell(i, 0, h+2, "Sample"+(h+1));
		    }
		} else {
		    wb.removeWorksheet(i);
		    i--;
		}
	    }
	}

	// remove non required sheets and fill in the required ones
	for (var i=0; i<wb.worksheets.length; i++) {
	    if (wb.worksheets[i].name == "library metagenome") {
		if (! document.getElementById('numShotgun').value || document.getElementById('numShotgun').value == "0") {
		    wb.removeWorksheet(i);
		    i--;
		} else {
		    var numLibs = parseInt(document.getElementById('numShotgun').value) * numSamples;
		    for (var h=0; h<numLibs; h++) {
			var sampnum = h+1;
			while (sampnum > numSamples) {
			    sampnum -= numSamples;
			}
			wb.setCell(i,0,h+2,"Sample"+sampnum);
			for (var j=0; j<wb.worksheets[i].maxCol; j++) {
			    if (data.metagenome.hasOwnProperty(wb.worksheets[i].data[0][j].value)) {
				wb.setCell(i, j, h+2, data.metagenome[wb.worksheets[i].data[0][j].value]);
			    }
			}
		    }
		}
	    }
	    if (wb.worksheets[i].name == "library metatranscriptome") {
		if (! document.getElementById('numMetatranscriptome').value || document.getElementById('numMetatranscriptome').value == "0") {
		    wb.removeWorksheet(i);
		    i--;
		} else {
		    var numLibs = parseInt(document.getElementById('numMetatranscriptome').value) * numSamples;
		    for (var h=0; h<numLibs; h++) {
			var sampnum = h+1;
			while (sampnum > numSamples) {
			    sampnum -= numSamples;
			}
			wb.setCell(i,0,h+2,"Sample"+sampnum);
			for (var j=0; j<wb.worksheets[i].maxCol; j++) {
			    if (data.metatranscriptome.hasOwnProperty(wb.worksheets[i].data[0][j].value)) {
				wb.setCell(i, j, h+2, data.metatranscriptome[wb.worksheets[i].data[0][j].value]);
			    }
			}
		    }
		}
	    }
	    if (wb.worksheets[i].name == "library mimarks-survey") {
		if (! document.getElementById('numAmplicon').value || document.getElementById('numAmplicon').value == "0") {
		    wb.removeWorksheet(i);
		    i--;
		} else {
		    var numLibs = parseInt(document.getElementById('numAmplicon').value) * numSamples;
		    for (var h=0; h<numLibs; h++) {
			var sampnum = h+1;
			while (sampnum > numSamples) {
			    sampnum -= numSamples;
			}
			wb.setCell(i,0,h+2,"Sample"+sampnum);
			for (var j=0; j<wb.worksheets[i].maxCol; j++) {
			    if (data['mimarks-survey'].hasOwnProperty(wb.worksheets[i].data[0][j].value)) {
				wb.setCell(i, j, h+2, data['mimarks-survey'][wb.worksheets[i].data[0][j].value]);
			    }
			}
		    }
		}
	    }
	}

	stm.saveAs(xlsx(wb).base64, "metadata.xlsx", true, "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,");
	
    };
})();