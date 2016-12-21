(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 Metadata Widget",
                name: "metagenome_metazen2",
                author: "Tobias Paczian",
                requires: [ "jquery.timepicker.js", "jquery.datepicker.js", "xlsx.js", "jszip.min.js" ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("tree") ];
    };

    widget.metadata = {};

    widget.miscParams = {};

    widget.activeTabs = { "library-metagenome": true, "library-mimarks-survey": true, "library-metatranscriptome": true };
        
    widget.display = function (wparams) {
        widget = this;

	var container = widget.container = wparams ? wparams.main : widget.container;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;
	sidebar.parentNode.style.display = 'none';
	container.className = "span10 offset1";
	document.getElementById("pageTitle").innerHTML = "metazen";

	html = '<img src="Retina/images/waiting.gif" style="width: 16px; margin-right: 10px;">loading template data ...';
	
	container.innerHTML = html;

	widget.loadData();
    };

    // load ontologies, cvs and the metadata template
    widget.loadData = function () {
	var widget = this;

	var promise1 = jQuery.Deferred();
	var promise2 = jQuery.Deferred();
	var promise3 = jQuery.Deferred();
	var promise4 = jQuery.Deferred();
	var promises = [ promise1, promise2, promise3, promise4 ];

	// load excel template
	promises.push(widget.loadExcelTemplate());

	// load controlled vocabularies
	promises.push(jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/cv", function (data) {
	    var widget = Retina.WidgetInstances.metagenome_metazen2[1];
	    stm.DataStore.cv = data;

	    // sort the versions
	    stm.DataStore.cv.versions.biome = stm.DataStore.cv.versions.biome.sort(Retina.sortDesc);
	    stm.DataStore.cv.versions.feature = stm.DataStore.cv.versions.feature.sort(Retina.sortDesc);
	    stm.DataStore.cv.versions.material = stm.DataStore.cv.versions.material.sort(Retina.sortDesc);

	    widget.currentENVOversion = stm.DataStore.cv.versions.biome[0];	    

	    stm.DataStore.cv.select.timezone = [ [ 'UTC-12:00', '(UTC-12:00) U.S. Baker Island, Howland Island'], [ 'UTC-11:00', '(UTC-11:00) Hawaii, American Samoa'], [ 'UTC-10:00', '(UTC-10:00) Cook Islands'], [ 'UTC-9:30', '(UTC-9:30) Marguesas Islands'], [ 'UTC-9:00', '(UTC-9:00) Gambier Islands'], [ 'UTC-8:00', '(UTC-8:00) U.S. & Canada Pacific Time Zone'], [ 'UTC-7:00', '(UTC-7:00) U.S. & Canada Mountain Time Zone'], [ 'UTC-6:00', '(UTC-6:00) U.S. & Canada Central Time Zone'], [ 'UTC-5:00', '(UTC-5:00) U.S. Eastern Time Zone'], [ 'UTC-4:30', '(UTC-4:30) Venezuela'], [ 'UTC-4:00', '(UTC-4:00) Canada Atlantic Time Zone'], [ 'UTC-3:30', '(UTC-3:30) Newfoundland'], [ 'UTC-3:00', '(UTC-3:00) French Guiana, Falkland Islands'], [ 'UTC-2:00', '(UTC-2:00) South Georgia and the South Sandwich Islands'], [ 'UTC-1:00', '(UTC-1:00) Cape Verde'], [ 'UTC+0:00', '(UTC+0:00) Ireland, London'], [ 'UTC+1:00', '(UTC+1:00) Amsterdam, Berlin'], [ 'UTC+2:00', '(UTC+2:00) Athens, Cairo, Johannesburg'], [ 'UTC+3:00', '(UTC+3:00) Baghdad, Riyadh'], [ 'UTC+3:30', '(UTC+3:30) Tehran'], [ 'UTC+4:00', '(UTC+4:00) Dubai, Moscow'], [ 'UTC+4:30', '(UTC+4:30) Kabul'], [ 'UTC+5:00', '(UTC+5:00) Pakistan'], [ 'UTC+5:30', '(UTC+5:30) Delhi, Mumbai'], [ 'UTC+5:45', '(UTC+5:45) Nepal'], [ 'UTC+6:00', '(UTC+6:00) Bangladesh'], [ 'UTC+6:30', '(UTC+6:30) Cocos Islands'], [ 'UTC+7:00', '(UTC+7:00) Bangkok, Hanoi'], [ 'UTC+8:00', '(UTC+8:00) Beijing, Singapore'], [ 'UTC+8:45', '(UTC+8:45) Eucla'], [ 'UTC+9:00', '(UTC+9:00) Seoul, Tokyo'], [ 'UTC+9:30', '(UTC+9:30) Adelaide'], [ 'UTC+10:00', '(UTC+10:00) Sydney, Melbourne'], [ 'UTC+10:30', '(UTC+10:30) New South Wales'], [ 'UTC+11:00', '(UTC+11:00) Solomon Islands'], [ 'UTC+11:30', '(UTC+11:30) Norfolk Island'], [ 'UTC+12:00', '(UTC+12:00) U.S. Wake Island'], [ 'UTC+12:45', '(UTC+12:45) Chatham Islands'], [ 'UTC+13:00', '(UTC+13:00) Samoa'], [ 'UTC+14:00', '(UTC+14:00) Line Islands' ] ];

	    stm.DataStore.cv.select['boolean'] = [ ['yes', 'yes'], [ 'no','no' ] ];
	    
	    jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?name=biome&version="+widget.currentENVOversion, function (data) {
		stm.DataStore.biome = data;
		promise1.resolve();
	    });
	    jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?name=feature&version="+widget.currentENVOversion, function (data) {
		stm.DataStore.feature = data;
		promise2.resolve();
	    });
	    jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?name=material&version="+widget.currentENVOversion, function (data) {
		stm.DataStore.material = data;
		promise3.resolve();
	    });
	}));

	// load metadata template
	jQuery.ajax( {
	    "dataType": "json",
	    "header": stm.authHeader,
	    "url": RetinaConfig.mgrast_api + '/metadata/template',
	    "success": function (data) {
		var widget = Retina.WidgetInstances.metagenome_metazen2[1];
		widget.metadataTemplate = data;
		var eps = Retina.keys(data.ep).sort();
		widget.eps = eps;
		for (var i=0; i<eps.length; i++) {
		    if (i==0) {
			widget.activeTabs["ep-"+eps[i]] = true;
		    } else {
			widget.activeTabs["ep-"+eps[i]] = false;
		    }
		}
		promise4.resolve();
	    },
	    "error": function (xhr) {
		var widget = Retina.WidgetInstances.metagenome_metazen2[1];
		widget.loadFailed();
	    }
	});
	
	jQuery.when.apply(this, promises).then(function() {
	    Retina.WidgetInstances.metagenome_metazen2[1].showMetadata();
	});
	

    };

    // error during loading of data
    widget.loadFailed = function () {
	var widget = this;

	widget.container.innerHTML = '<div class="alert alert-error" style="width: 400px;">There was an error loading the background data</div>';
    };

    // display the main view
    widget.showMetadata = function () {
	var widget = this;

	widget.getTemplateOrder();

	var html = [];

	// info box
	html.push('<div style="border-radius: 5px; border: 1px solid #ddd; padding: 8px; margin-bottom: 10px; float: left; width: 600px;" id="cellInfoBox"><h3 style="margin-top: 0px;">What does MetaZen do?</h3><p>Metadata (or data about the data) has become a necessity as the community generates large quantities of data sets.</p><p>Using community generated questionnaires we capture this metadata. MG-RAST has implemented the use of <a target="_blank" href="http://gensc.org/gc_wiki/index.php/MIxS">Minimum Information about any (X) Sequence</a> (miXs) developed by the <a target="_blank" href="http://gensc.org">Genomic Standards Consortium</a> (GSC).</p><p>The best form to capture metadata is via a simple spreadsheet with 12 mandatory terms. This tool is designed to help you fill out your metadata spreadsheet. The metadata you provide, helps us to analyze your data more accurately and helps make MG-RAST a more useful resource.</p></div>');
	
	// tab select
	html.push('<div style="border-radius: 5px; border: 1px solid #ddd; padding: 8px; margin-bottom: 10px; float: right;">');
	
	// libraries
	html.push('<div style="float: left;"><div style="font-weight: bold;">libraries</div>');
	html.push('<div style="padding-left: 15px;"><input style="position: relative; bottom: 2px;" id="library-metagenomeCheckbox" type="checkbox"'+(widget.activeTabs['library-metagenome'] ? " checked=checked" : "")+' onclick="Retina.WidgetInstances.metagenome_metazen2[1].updateTabs(this);" name="library-metagenome"> metagenome</div>');
	html.push('<div style="padding-left: 15px;"><input style="position: relative; bottom: 2px;" id="library-mimarks-surveyCheckbox" type="checkbox"'+(widget.activeTabs['library-mimarks-survey'] ? " checked=checked" : "")+' onclick="Retina.WidgetInstances.metagenome_metazen2[1].updateTabs(this);" name="library-mimarks-survey"> mimarks-survey</div>');
	html.push('<div style="padding-left: 15px;"><input style="position: relative; bottom: 2px;" id="library-metatranscriptomeCheckbox" type="checkbox"'+(widget.activeTabs['library-metatranscriptome'] ? " checked=checked" : "")+' onclick="Retina.WidgetInstances.metagenome_metazen2[1].updateTabs(this);" name="library-metatranscriptome"> metatranscriptome</div></div>');
	
	// eps
	html.push('<div style="float: left; margin-left: 20px;"><div style="font-weight: bold;">environmental packages</div><div style="float: left;">');
	for (var i=0; i<widget.eps.length; i++) {
	    html.push('<div style="padding-left: 15px;"><input style="position: relative; bottom: 2px;" id="ep-'+widget.eps[i]+'Checkbox" type="checkbox"'+(widget.activeTabs["ep-"+widget.eps[i]] ? " checked=checked" : "")+' onclick="Retina.WidgetInstances.metagenome_metazen2[1].updateTabs(this);" name="ep-'+widget.eps[i]+'"> '+widget.eps[i]+'</div>');
	    if (i % 7 == 0 && i > 0) {
		html.push('</div><div style="float: left;">');
	    }
	}
	html.push('</div></div>');

	// ENVO
	html.push('<div style="float: left; margin-left: 20px;" id="envo_select_div"></div>');

	// linebreak
	html.push('<div style="clear: both;"></div></div>');

	html.push('<div style="clear: both;"></div>');
	
	// upload / download buttons
	html.push('<div style="float: right; margin-left: 20px;">');

	html.push('<button class="btn" onclick="Retina.WidgetInstances.metagenome_metazen2[1].exportExcel(\'shock\');" id="inboxUploadButton"><img src="Retina/images/cloud-upload.png" style="width: 16px; margin-right: 5px;">upload to inbox</button>');
	if (Retina.cgiParam('project')) {
	    html.push('<button class="btn" onclick="Retina.WidgetInstances.metagenome_metazen2[1].exportExcel(\'project\');" id="projectUploadButton" style="margin-left: 20px;"><img src="Retina/images/cloud-upload.png" style="width: 16px; margin-right: 5px;">update project</button>');
	}
	html.push('<button class="btn" onclick="Retina.WidgetInstances.metagenome_metazen2[1].exportExcel(\'excel\');" style="margin-left: 20px;"><img src="Retina/images/cloud-download.png" style="width: 16px; margin-right: 5px;">download in Excel format</button>');

	html.push('<button class="btn" onclick="this.nextSibling.click();" style="margin-left: 20px;"><img src="Retina/images/disk.png" style="width: 16px; margin-right: 5px;">load from Excel file</button><input type="file" style="display: none;" onchange="Retina.WidgetInstances.metagenome_metazen2[1].loadExcelData(event);">');
	
	html.push('</div>');
	
	html.push('<div style="clear: both;"></div>');
	
	// create tabs
	html.push('<ul class="nav nav-tabs" id="metadataEdit" style="margin-bottom: 0px;">');
	html.push('<li class="active"><a href="#project" id="project-li">project</a></li>');
	html.push('<li><a href="#sample">sample</a></li>');
	html.push('<li id="library-metagenome-li"><a href="#library-metagenome">library metagenome</a></li>');
	html.push('<li id="library-mimarks-survey-li"><a href="#library-mimarks-survey">library mimarks-survey</a></li>');
	html.push('<li id="library-metatranscriptome-li"><a href="#library-metatranscriptome">library metatranscriptome</a></li>');
	for (var i=0; i<widget.eps.length; i++) {
	    var safeEP = widget.eps[i].replace(/\|/g, " ").replace(/\s/g, "-");
	    html.push('<li id="ep-'+safeEP+'-li"><a href="#ep-'+safeEP+'">'+ widget.eps[i]+'</a></li>');
	}

	// store div data
	var tables = [];
	
	// create divs
	html.push('</ul><div class="tab-content" style="border: 1px solid #ddd; border-top: none; padding-top: 20px; padding-bottom: 20px;">');
	html.push('<div class="tab-pane active" id="project">project</div>');
	tables.push( { "name": "project", "data": widget.metadataTemplate.project.project } );
	html.push('<div class="tab-pane" id="sample">sample</div>');
	tables.push( { "name": "sample", "data": widget.metadataTemplate.sample.sample } );
	html.push('<div class="tab-pane" id="library-metagenome">metagenome</div>');
	tables.push( { "name": "library-metagenome", "data": widget.metadataTemplate.library.metagenome } );
	html.push('<div class="tab-pane" id="library-mimarks-survey">mimarks-survey</div>');
	tables.push( { "name": "library-mimarks-survey", "data": widget.metadataTemplate.library["mimarks-survey"] } );
	html.push('<div class="tab-pane" id="library-metatranscriptome">metatranscriptome</div>');
	tables.push( { "name": "library-metatranscriptome", "data": widget.metadataTemplate.library.metatranscriptome } );
	for (var i=0; i<widget.eps.length; i++) {
	    var safeEP = widget.eps[i].replace(/\|/g, " ").replace(/\s/g, "-");
	    html.push('<div class="tab-pane" id="ep-'+safeEP+'">'+ widget.eps[i]+'</div>');
	    tables.push( { "name": "ep-"+widget.eps[i], "data": widget.metadataTemplate.ep[widget.eps[i]] } );
	}
	html.push('</div>');

	html.push('<div class="modal hide fade" id="feedbackModal"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h3>metadata not ready for upload</h3></div><div class="modal-body" id="feedbackContent"></div><div class="modal-footer"><a href="#" class="btn" data-dismiss="modal">Close</a></div></div>');
	
	widget.container.innerHTML = html.join('');

	jQuery('#metadataEdit a').click(function (e) {
	    e.preventDefault();
	    jQuery(this).tab('show');
	});

	for (var i=0; i<widget.eps.length; i++) {
	    if (! widget.activeTabs["ep-"+widget.eps[i]]) {
		var safeEP = widget.eps[i].replace(/\|/g, " ").replace(/\s/g, "-");
		jQuery('#ep-'+safeEP+'-li').toggle();
	    }
	}

	var hashTable = {}
	for (var i=0; i<tables.length; i++) {
	    hashTable[tables[i].name] = tables[i].data;
	    var tarray = [];
	    var k = Retina.keys(tables[i].data);
	    for (var h=0; h<k.length; h++) {
		tables[i].data[k[h]].name = k[h];
		if (! tables[i].data[k[h]].hasOwnProperty('order')) {
		    continue;
		}
		if (k[h] == 'envo_release') {
		    widget.envo_cell = tables[i].data[k[h]].order + 1;
		}
		tarray.push(tables[i].data[k[h]]);
	    }
	    tarray.sort(Retina.propSort('order'));
	    
	    var cols = [];
	    var colheaders = [];
	    for (var h=0; h<tarray.length; h++) {
		cols.push(tarray[h].name);
		colheaders.push(tarray[h].required == "1" ? "<span style='color: red;' title='required field'>"+tarray[h].name+"</span>" : tarray[h].name);
	    }
	    hashTable[tables[i].name].order = cols;
	    var empty = [];
	    for (var h=0; h<cols.length + 1; h++) {
		empty.push("");
	    }
	    empty = empty.join('</td><td class="editable viewtext">');
	    var thtml = [];
	    thtml.push('<table class="excel" onclick="Retina.WidgetInstances.metagenome_metazen2[1].tableClicked(event,\''+tables[i].name+'\');">');
	    thtml.push('<tr><th>&nbsp</th><th>'+colheaders.join('</th><th>')+'</th>');

	    // misc params
	    thtml.push('<th title="add a new column"><button class="btn btn-mini" onclick="jQuery(this).toggle();jQuery(this.nextSibling).toggle();document.getElementById(\''+tables[i].name+'\').parentNode.scrollLeft=document.getElementById(\''+tables[i].name+'\').parentNode.scrollLeftMax;">+</button><div class="input-append" style="display: none; position: relative; top: 4px;"><input type="text" style="font-size: 12px; height: 12px; width: 100px;"><button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_metazen2[1].addMDField(\''+tables[i].name+'\',this);">add</button></div></th>');
	    
	    thtml.push('</tr>');
	    for (var h=0; h<25; h++) {
		thtml.push('<tr><th>'+(h+1)+'</th><td class="editable viewtext">');
		thtml.push(empty);
		thtml.push('</td></tr>');
	    }
	    thtml.push('</table>');
	    var safeName = tables[i].name.replace(/\|/g, " ").replace(/\s/g, "-");
	    document.getElementById(safeName).innerHTML = thtml.join("");
	}
	widget.tables = hashTable;

	widget.showENVOselect();

	if (Retina.cgiParam('project')) {
	    document.getElementById('cellInfoBox').innerHTML = '<img src="Retina/images/waiting.gif" style="width: 16px; margin-right: 10px;">loading project data...';
	    widget.loadProjectData(Retina.cgiParam('project'));
	}
	else if (Retina.cgiParam('inbox')) {
	    document.getElementById('cellInfoBox').innerHTML = '<img src="Retina/images/waiting.gif" style="width: 16px; margin-right: 10px;">loading inbox data...';
	    widget.loadInboxData(Retina.cgiParam('inbox'));
	}
    };

    // cell edit helper
    widget.tableClicked = function (event, tablename) {
	var widget = this;
	event = event || window.event;
	
	var cell = event.target;
	if (cell.nodeName == 'TD') {

	    // check if there is an unhandled element
	    if (widget.currentInputElement) {
		widget.updateCell('escape');
		Retina.RendererInstances.tree = [ Retina.RendererInstances.tree[0] ];
	    }

	    // get the column metadata
	    if (document.getElementById('cellInfoBox').style.display == 'none') {
		jQuery('#cellInfoBox').toggle();
	    }
	    var fieldname = widget.tables[tablename].order[cell.cellIndex - 1];

	    if (fieldname == 'envo_release') {
		return;
	    }
	    
	    var md = widget.tables[tablename][fieldname];
	    if (! md) {
		return;
	    }
	    widget.currField = { "table": tablename, "field": fieldname, "data": md };
	    document.getElementById('cellInfoBox').innerHTML = '<p style="font-size: 18px; font-weight: bold;">'+fieldname+'</p><p>'+md.definition+'</p><table style="text-align: left;"><tr><th>MiXS term</th><td>'+(md.hasOwnProperty('mixs') && md.mixs=='1' ? 'yes' : 'no')+'</td></tr><tr><th style="padding-right: 20px;">required field</th><td>'+(md.required=='0' ? 'no' : 'yes')+'</td></tr><tr><th>unit</th><td>'+(md.unit.length ? md.unit : '-')+'</td></tr><tr><th>type</th><td>'+md.type+'</td></tr><tr><th style="vertical-align: top; width: 120px;">current value</th><td>'+cell.innerHTML+'</td></tr></table>';
	    
	    // this cell is not in input mode
	    if (! cell.innerHTML.match(/\<input/) && ! cell.innerHTML.match(/\<select/) && ! cell.innerHTML.match(/\<div/)) {
		var value = cell.innerHTML;
		cell.style.backgroundColor = "aliceblue";

		// check what type this field is
		var input;
		
		/* 
		   SELECT BOX
		*/
		if (widget.currField.data.type == 'select' || widget.currField.data.type == 'timezone' || widget.currField.data.type == 'boolean') {
		    input = document.createElement('select');
		    var options;
		    var o = [ '<option value=""></option>' ];
		    if (widget.currField.data.type == 'timezone') {
			options = stm.DataStore.cv.select.timezone;
			options.shift();
		    }
		    else if (widget.currField.data.type == 'boolean') {
			options = stm.DataStore.cv.select['boolean'];
		    }
		    else if (widget.currField.data.type == 'select') {
			var t = widget.currField.field;
			if (t.match(/country/)) {
			    t = 'country';
			}

			if (stm.DataStore.cv.select.hasOwnProperty(t)) {
			    options = stm.DataStore.cv.select[t];
			}
		    }
		    
		    // check if there is an entry in the row above
		    var preval = "";
		    if (cell.parentNode.rowIndex > 1) {
			preval = cell.parentNode.parentNode.childNodes[cell.parentNode.rowIndex - 1].childNodes[cell.cellIndex].innerHTML;
		    }

		    for (var i=0; i<options.length; i++) {
			if (typeof options[i] == 'string') {
			    options[i] = [ options[i], options[i] ];
			}
			var sel = "";
			if (preval == options[i][0]) {
			    sel = " selected=selected";
			}
			o.push('<option'+sel+' value="'+options[i][0]+'">'+options[i][1]+'</option>');
		    }
		    input.innerHTML = o.join('');
		}

		/*
		  TREE
		*/
		else if (widget.currField.data.type == "ontology") {
		    input = document.createElement('div');
		}

		/* 
		   TEXT FIELD
		*/
		else {
		    input = document.createElement('input');
		    input.setAttribute('type', 'text');
		    input.setAttribute('value', value);
		}

		// remember old data
		input.setAttribute('data-old', value);
		input.setAttribute('id', 'currInputField');

		// event listeners
		if (! (widget.currField.data.type == 'ontology' || widget.currField.data.type == 'time' || widget.currField.data.type == 'date')) {
		    
		    // keypress listener
		    input.addEventListener('keypress', function (event) {
			var widget = Retina.WidgetInstances.metagenome_metazen2[1];
			event = event || window.event;
			
			// validation
			var s = String.fromCharCode(event.charCode);
			if (s.match(/[\u0020-\u007e\u00a0-\u00ff]/)) {
			    if (widget.currField.data.type == 'float' || widget.currField.data.type == 'coordinate') {
				if (! s.match(/[\d\.-]/ ) || this.value.indexOf(".") > -1 && s == ".") {
				    event.preventDefault();
				    return false;
				}
			    } else if (widget.currField.data.type == 'int') {
				if (! s.match(/\d/)) {
				    event.preventDefault();
				    return false;
				}
			    }
			}
			
			// enter is pressed
			if (event.keyCode == '13') {
			    event.preventDefault();
			    
			    widget.updateCell('enter');
			}
			
			// escape is pressed
			else if (event.keyCode == '27') {
			    event.preventDefault();
			    
			    widget.updateCell('escape');
			}
			
			// tab is pressed
			else if (event.keyCode == '9') {
			    event.preventDefault();
			    
			    widget.updateCell('tab');
			}
		    });
		    
		    // cell loses focus
		    input.addEventListener('blur', function (event) {
			var widget = Retina.WidgetInstances.metagenome_metazen2[1];
			
			Retina.WidgetInstances.metagenome_metazen2[1].updateCell('blur');
		    });
		}

		// check for time field
		if (widget.currField.data.type == "time") {
		    var t;
		    if (cell.innerHTML.length) {
			t = cell.innerHTML;
		    } else {
			t = '00:00:00';
			if (cell.parentNode.rowIndex > 1 && cell.parentNode.parentNode.childNodes[cell.parentNode.rowIndex - 1].childNodes[cell.cellIndex].innerHTML.length) {
			    t = cell.parentNode.parentNode.childNodes[cell.parentNode.rowIndex - 1].childNodes[cell.cellIndex].innerHTML;
			}
		    }
		    cell.innerHTML = "";
		    var d = document.createElement('div');
		    d.setAttribute('class', 'input-append bootstrap-timepicker-component');
		    d.setAttribute('style','margin-bottom: 0px;');
		    d.appendChild(input);
		    cell.appendChild(d);
		    jQuery('#currInputField').timepicker({'showMeridian': false, 'minuteStep': 1, 'showSeconds': true,'defaultTime':t});
		    input.addEventListener('blur', function (event) {
			Retina.WidgetInstances.metagenome_metazen2[1].updateCell('blur');
		    });
		    input.addEventListener('keypress', function (event) {
			var widget = Retina.WidgetInstances.metagenome_metazen2[1];

			// escape
			if (event.keyCode == '27') {
			    widget.updateCell('escape');
			}

			// backspace
			else if (event.keyCode == '8') {
			    event.preventDefault();
			    widget.updateCell('clear');
			}

			// enter is pressed
			else if (event.keyCode == '13') {
			    event.preventDefault();
			    
			    widget.updateCell('enter');
			}

			// tab is pressed
			else if (event.keyCode == '9') {
			    event.preventDefault();
			    
			    widget.updateCell('tab');
			}
		    });

		} else {
		    cell.innerHTML = "";
		    cell.appendChild(input);
		}

		// focus the input
		input.focus();
		if (typeof input.select == 'function') {
		    input.select();
		}

		// check for tree
		if (widget.currField.data.type == "ontology") {
		    if (stm.DataStore.hasOwnProperty(widget.currField.field)) {
			var val = input.getAttribute('data-old');
			if (! val.length) {
			    if (cell.parentNode.rowIndex > 1 && cell.parentNode.parentNode.childNodes[cell.parentNode.rowIndex - 1].childNodes[cell.cellIndex].innerHTML.length) {
				val = cell.parentNode.parentNode.childNodes[cell.parentNode.rowIndex - 1].childNodes[cell.cellIndex].innerHTML;
			    }
			}
			Retina.Renderer.create('tree', {
			    target: document.getElementById('currInputField'),
			    data: stm.DataStore[widget.currField.field],
			    width: 0,
			    height: 0,
			    showGoButton: false,
			    showCollapseAllButton: false,
			    showExpandAllButton: false,
			}).render();
			input.setAttribute('class', '');
			cell.setAttribute('style', '');
			var inp = document.getElementById('tree_search_input_1');
			inp.setAttribute('style', 'width: 144px; height: 24px; font-size: 12px; border: 1px solid #ddd; top: 0px; padding-left: 5px;');
			inp.value = val;
			inp.addEventListener('keypress', function (event) {
			    event = event || window.event;

			    var widget = Retina.WidgetInstances.metagenome_metazen2[1];

			    // escape
			    if (event.keyCode == 27) {
				Retina.RendererInstances.tree = [ Retina.RendererInstances.tree[0] ];
				Retina.WidgetInstances.metagenome_metazen2[1].updateCell('escape');
			    }

			    // enter is pressed
			    else if (event.keyCode == 13) {
				event.preventDefault();

				widget.currentInputElement.value = this.value;
				Retina.RendererInstances.tree = [ Retina.RendererInstances.tree[0] ];
				widget.updateCell('enter');
			    }
			    
			    // tab is pressed
			    else if (event.keyCode == 9) {
				event.preventDefault();

				widget.currentInputElement.value = this.value;
				Retina.RendererInstances.tree = [ Retina.RendererInstances.tree[0] ];
				widget.updateCell('tab');
			    }
			    
			});		     
			inp.focus();
		    } else {
			alert('unknown ontology');
		    }
		}

		// check for date field
		if (widget.currField.data.type == "date") {
		    var nowTemp = new Date();
		    var d = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);
		    var dstring = [d.getFullYear(),
				   (d.getMonth()+1).padLeft(),
				   d.getDate().padLeft()].join('-');
		    if (! input.value.length && input.parentNode.parentNode.rowIndex > 1) {
			if (input.parentNode.parentNode.parentNode.childNodes[input.parentNode.parentNode.rowIndex - 1].childNodes[input.parentNode.cellIndex].innerHTML.length) {
			    input.value = input.parentNode.parentNode.parentNode.childNodes[input.parentNode.parentNode.rowIndex - 1].childNodes[input.parentNode.cellIndex].innerHTML;
			}
		    }
		    input.setAttribute('value', input.value.length ? input.value : dstring);
		    jQuery('#currInputField').datepicker({format: 'yyyy-mm-dd'}).on('changeDate', function(ev) {
			jQuery('#currInputField').datepicker('hide');
			Retina.WidgetInstances.metagenome_metazen2[1].updateCell('tab');
		    });
		    jQuery('#currInputField').datepicker('show');
		    input.addEventListener('keypress', function (event) {
			var widget = Retina.WidgetInstances.metagenome_metazen2[1];

			jQuery('#currInputField').datepicker('hide');

			// escape
			if (event.keyCode == '27') {
			    widget.updateCell('escape');
			}

			// backspace
			else if (event.keyCode == '8') {
			    event.preventDefault();
			    widget.updateCell('clear');
			}

			// enter is pressed
			else if (event.keyCode == '13') {
			    event.preventDefault();
			    
			    widget.updateCell('enter');
			}

			// tab is pressed
			else if (event.keyCode == '9') {
			    event.preventDefault();
			    
			    widget.updateCell('tab');
			}
		    });
		}

		// store a reference to the current input element
		widget.currentInputElement = input;

		jQuery(cell).toggleClass('viewtext', false);
	    }
	}
    };

    // a cell has new data
    widget.updateCell = function (action) {
	var widget = this;
	
	if (! widget.currentInputElement) {
	    return;
	}
	
	var val = widget.currentInputElement.value;
	if (action == 'clear') {
	    val = "";
	} else if (action == 'escape') {
	    val = widget.currentInputElement.getAttribute('data-old');
	}
	
	var p = widget.currentInputElement.parentNode;
	if (p.nodeName !== 'TD') {
	    p = p.parentNode;
	}

	var row = p.parentNode.rowIndex - 1;
	
	// perform validation
	var valid = true;
	var msg = "";
	if (val !== undefined && val.length) {
	    if (widget.currField.data.type == 'url' && ! val.match(/^http(s?)\:\/\//)) {
		msg = 'invalid url "'+val+'"';
		val = "";
		valid = false;
	    }
	    if (widget.currField.data.type == 'email' && ! val.match(/\@/)) {
		msg = 'invalid email "'+val+'"';
		val = "";
		valid = false;
	    }
	    if (widget.currField.data.type == 'coordinate' && Math.abs(parseFloat(val)) > 180) {
		msg = 'coordinates only range from -180 to 180 degrees';
		val = "";
		valid = false;
	    }
	    if (widget.currField.field == 'project_name' && ! val.match(/^[\w\s]+$/)) {
		msg = 'project names may only contain word characters';
		val = '';
		valid = false;
	    }
	    if (widget.currField.field == 'file_name' && val.match(/\.gz$/)) {
		msg = 'file names must be of the decompressed file';
		val = '';
		valid = false;
	    }
	} else {
	    valid = false;
	    if (widget.metadata.hasOwnProperty(widget.currField.table) && widget.metadata[widget.currField.table].hasOwnProperty(widget.currField.field)) {
		delete widget.metadata[widget.currField.table][widget.currField.field][row];
	    }
	}

	p.innerHTML = val;
	jQuery(p).toggleClass('viewtext', true);
	widget.currentInputElement = null;
	p.setAttribute('style','');
	
	if (valid) {
	    if (! widget.metadata.hasOwnProperty(widget.currField.table)) {
		widget.metadata[widget.currField.table] = {};
	    }
	    
	    if (! widget.metadata[widget.currField.table].hasOwnProperty(widget.currField.field)) {
		widget.metadata[widget.currField.table][widget.currField.field] = [];
	    }
	    
	    widget.metadata[widget.currField.table][widget.currField.field][row] = val;
	}
	else if (msg.length) {
	    action = "none";
	    alert(msg);
	}

	if (action == 'escape' || action == 'blur') {
	    if (document.getElementById('cellInfoBox').style.display == '') {
		jQuery('#cellInfoBox').toggle();
	    }
	} else if (action == 'enter') {
	    var pp = p.parentNode.parentNode.childNodes;
	    
	    // there are not enough rows, append a new one
	    if (pp.length <= p.parentNode.rowIndex + 1) {
		var cols = p.parentNode.childNodes;
		var empty = [];
		for (var h=0; h<cols.length - 1; h++) {
		    empty.push("");
		}
		empty = '<th></th><td class="editable viewtext">'+empty.join('</td><td class="editable viewtext">')+'</td>';
		var r = document.createElement('tr');
		r.innerHTML = empty;
		p.parentNode.parentNode.appendChild(r);
	    }

	    // click the cell below
	    pp[p.parentNode.rowIndex + 1].childNodes[p.cellIndex].click();

	} else if (action == 'tab') {
	    var pp = p.parentNode.childNodes;
	    
	    // check if there is a next column
	    if (pp.length > p.cellIndex) {
		pp[p.cellIndex + 1].click();
	    }
	}
    };

    // ENVO
    widget.selectENVO = function (sel) {
	var widget = this;

	widget.currentENVOversion = sel.options[sel.selectedIndex].value;

	var promise1 = jQuery.Deferred();
	var promise2 = jQuery.Deferred();
	var promise3 = jQuery.Deferred();
	var promises = [ promise1, promise2, promise3 ];
	
	jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?name=biome&version="+widget.currentENVOversion, function (data) {
	    stm.DataStore.biome = data;
	    promise1.resolve();
	});
	jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?name=feature&version="+widget.currentENVOversion, function (data) {
	    stm.DataStore.feature = data;
	    promise2.resolve();
	});
	jQuery.getJSON(RetinaConfig.mgrast_api+"/metadata/ontology?name=material&version="+widget.currentENVOversion, function (data) {
	    stm.DataStore.material = data;
	    promise3.resolve();
	});

	jQuery.when.apply(this, promises).then(function() {
	    var widget = Retina.WidgetInstances.metagenome_metazen2[1];
	    widget.showENVOselect();
	});
	
	document.getElementById('envo_select_div').innerHTML = "<div class='alert alert-info'><img src='Retina/images/waiting.gif' style='width: 24px;'> loading selected ENVO version</div>";
    };

    widget.showENVOselect = function () {
	var widget = this;

	var select = document.getElementById('envo_select_div');

	var html = "<p style='font-weight: bold;'>ENVO version</p><div class='input-append'><select style='width: 110px;'>";
	for (var i=0; i<stm.DataStore.cv.versions.biome.length; i++) {
	    var sel = "";
	    if (stm.DataStore.cv.versions.biome[i] == widget.currentENVOversion) {
		sel = " selected=selected";
	    }
	    html += "<option"+sel+">"+stm.DataStore.cv.versions.biome[i]+"</option>";
	}
	html += "</select><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen2[1].selectENVO(this.previousSibling);'>select</button></div>";
	select.innerHTML = html;

	select.style.display = "";

	document.getElementById('project').firstChild.firstChild.childNodes[1].childNodes[widget.envo_cell].innerHTML = widget.currentENVOversion;
	if (! widget.metadata.hasOwnProperty('project')) {
	    widget.metadata.project = {};
	}
	widget.metadata.project.envo_release = [ widget.currentENVOversion ];
    };

    // tab activation
    widget.updateTabs = function (checkbox) {
	var widget = this;

	var name = checkbox.getAttribute('name').replace(/\|/g, " ").replace(/\s/g, "-");
	var sel = checkbox.checked;
	
	widget.activeTabs[name] = sel;

	jQuery('#'+name+"-li").toggle();
	document.getElementById('project-li').click();
    };

    // add a new misc param
    widget.addMDField = function (tab, button) {
	var widget = this;

	var name = button.previousSibling.value;
	if (! name.length) {
	    button.parentNode.previousSibling.click();
	    return;
	}

	var group = tab;
	var subgroup = tab;
	if (group.match(/^ep-/)) {
	    subgroup = group.replace(/^ep-/, "");
	    group = "ep";
	} else if (group.match(/^library-/)) {
	    subgroup = group.replace(/^library-/, "");
	    group = "library";
	}

	// check if this tab already has misc params
	if (! widget.miscParams.hasOwnProperty(subgroup)) {
	    widget.miscParams[subgroup] = {};
	}
	
	// check if the misc params of this tab already have this field
	if (widget.miscParams[subgroup].hasOwnProperty(name)) {
	    alert("This tab already has a parameter called "+name);
	    button.previousSibling.value = "";
	    button.parentNode.previousSibling.click();
	    return;
	} else {
	    widget.miscParams[subgroup][name] = true;
	}

	// check if the template already has this field
	if (widget.metadataTemplate[group][subgroup].hasOwnProperty(name)) {
	    button.previousSibling.value = "";
	    button.parentNode.previousSibling.click();
	    alert("This tab already has a parameter called "+name);
	}

	// we have a new field
	// add it to the template
	widget.metadataTemplate[group][subgroup]._maxOrder++;
	widget.metadataTemplate[group][subgroup][name] = { "required": 0, "mixs": 0, "name": name, "type": "text", "unit": "", "aliases": [ "", "" ], "definition": "user custom  misc param", "order": widget.metadataTemplate[group][subgroup]._maxOrder };
	widget.tables[tab][name] = jQuery.extend(true, {}, widget.metadataTemplate[group][subgroup][name]);
	widget.tables[tab].order.push(name);
	
	// add the column to the sheet
	var cell = button.parentNode.parentNode;
	var row = cell.parentNode;
	var table = row.parentNode;
	var header = document.createElement('TH');
	header.innerHTML = name;
	table.rows[0].insertBefore(header, cell);
	for (var i=1; i<table.rows.length; i++) {
	    var c = table.rows[i].insertCell(cell.cellIndex);
	    c.className = "editable viewtext";
	}
	button.previousSibling.value = "";
	button.parentNode.previousSibling.click();
    };

    // load existing data from project
    widget.loadProjectData = function (project) {
	var widget = this;

	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project/'+project+'?verbosity=summary',
	    success: function (data) {
		var widget = Retina.WidgetInstances.metagenome_metazen2[1];
		widget.projectData = data;

		jQuery.ajax({
		    method: "GET",
		    dataType: "json",
		    headers: stm.authHeader,
		    url: RetinaConfig.mgrast_api+'/metadata/export/'+project,
		    success: function (data) {
			var widget = Retina.WidgetInstances.metagenome_metazen2[1];
			
			document.getElementById('cellInfoBox').innerHTML = 'project data loaded';
			widget.loadedData = data;
			widget.fillSpreadSheet();
		    },
		    error: function (xhr) {
			var error = "";
			try {
			    error = ": "+JSON.parse(xhr.responseText).ERROR;
			}
			catch (e) {
			    error = "";
			}
			alert("could not retrieve metadata for this project"+error);
		    }
		});
	    },
	    error: function (xhr) {
		var error = "";
		try {
		    error = ": "+JSON.parse(xhr.responseText).ERROR;
		}
		catch (e) {
		    error = "";
		}
		alert("could not retrieve data for this project"+error);
	    }
	});
		
    };

    // load existing excel file from inbox
    widget.loadInboxData = function (nodeid) {
	var widget = this;

	jQuery.ajax({
	    method: "GET",
	    headers: stm.authHeader,
	    beforeSend: function( xhr ) {
		xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
	    },
	    url: RetinaConfig.shock_url+'/node/'+nodeid+'?download',
	    success: function (data) {
		var zip = new JSZip();
		zip.loadAsync(data).then(function (zip) {
		    xlsx(zip).then(function (wb) {
			var widget = Retina.WidgetInstances.metagenome_metazen2[1];
			widget.clearSpreadSheet();
			widget.loadedData = wb;
			widget.fillSpreadSheet(true);
			document.getElementById('cellInfoBox').innerHTML = "inbox data loaded";
		    });
		});
	    },
	    error: function (xhr) {
		document.getElementById('cellInfoBox').innerHTML = "could not load inbox file";
		alert("could not load inbox file");
	    }
	 });
    };

    // load existing data from an Excel file
    widget.loadExcelData = function (event) {
	var widget = this;

	event = event || window.event;
	var file = event.target.files[0];
	var zip = new JSZip();
	zip.loadAsync(file).then(function(zip) {
	    xlsx(zip).then(function (wb) {
		var widget = Retina.WidgetInstances.metagenome_metazen2[1];
		widget.clearSpreadSheet();
		widget.loadedData = wb;
		widget.fillSpreadSheet(true);
	    });
	});
	
    };

    // clear the entire spreadsheet
    widget.clearSpreadSheet = function () {
	var widget = this;

	widget.metadata = {};

	var s = document.getElementById('sample').firstChild;
	for (var i=0; i<s.rows.length; i++) {
	    if (i==0) {
		s.rows[i].cells[0].innerHTML = "";
	    } else {
		s.rows[i].cells[0].innerHTML = i;
	    }
	}
	
	var tables = [];
	tables.push( { "name": "project", "data": widget.metadataTemplate.project.project } );
	tables.push( { "name": "sample", "data": widget.metadataTemplate.sample.sample } );
	tables.push( { "name": "library-metagenome", "data": widget.metadataTemplate.library.metagenome } );
	tables.push( { "name": "library-mimarks-survey", "data": widget.metadataTemplate.library["mimarks-survey"] } );
	tables.push( { "name": "library-metatranscriptome", "data": widget.metadataTemplate.library.metatranscriptome } );
	for (var i=0; i<widget.eps.length; i++) {
	    tables.push( { "name": "ep-"+widget.eps[i], "data": widget.metadataTemplate.ep[widget.eps[i]] } );
	}
	widget.tables = tables;

	for (var i=0; i<tables.length; i++) {
	    var sn = tables[i].name.replace(/\s/, "-").replace(/\|/, "-");
	    var table = document.getElementById(sn).firstChild;
	    for (var h=1; h<table.rows.length; h++) {
		for (var j=1; j<table.rows[h].cells.length; j++) {
		    table.rows[h].cells[j].innerHTML = "";
		}
	    }
	}

	var hashTable = {}
	for (var i=0; i<tables.length; i++) {
	    hashTable[tables[i].name] = tables[i].data;
	    var tarray = [];
	    var k = Retina.keys(tables[i].data);
	    for (var h=0; h<k.length; h++) {
		tables[i].data[k[h]].name = k[h];
		if (! tables[i].data[k[h]].hasOwnProperty('order')) {
		    continue;
		}
		if (k[h] == 'envo_release') {
		    widget.envo_cell = tables[i].data[k[h]].order + 1;
		}
		tarray.push(tables[i].data[k[h]]);
	    }
	    tarray.sort(Retina.propSort('order'));
	    
	    var cols = [];
	    var colheaders = [];
	    for (var h=0; h<tarray.length; h++) {
		cols.push(tarray[h].name);
	    }
	    hashTable[tables[i].name].order = cols;
	}
	widget.tables = hashTable;
    };


    // fill the spreadsheet with data loaded from an Excel sheet or from a project
    widget.fillSpreadSheet = function (excel) {
	var widget = this;
	
	// uncheck all eps and libraries
	var checkboxes = ['library-metagenome','library-mimarks-survey','library-metatranscriptome'];
	for (var i=0;i<widget.eps.length; i++) {
	    checkboxes.push('ep-'+widget.eps[i]);
	}
	for (var i=0; i<checkboxes.length; i++) {
	    var sheet = checkboxes[i];
	    if (widget.activeTabs[sheet]) {
		widget.activeTabs[sheet] = false;
		document.getElementById(sheet+"Checkbox").removeAttribute('checked');
		var name = sheet.replace(/\|/g, " ").replace(/\s/g, "-");
		jQuery('#'+name+"-li").toggle();
	    }
	}
	
	// data shortcut
	var d = widget.loadedData;

	if (excel) {
	    var ignoreCols = {"sample_id": true, "metagenome_id": true, "project_id": true };
	    for (var i=0; i<d.worksheets.length; i++) {
		if (d.worksheets[i].name == "README") {
		    continue;
		}
		var ws = d.worksheets[i];
		var sheet = ws.name.replace(/\s/, "-");
		for (var h=0; h<ws.maxCol; h++) {
		    var col = ws.data[0][h].value;
		    if (ignoreCols[col]) {
			continue;
		    }
		    for (var j=2; j<ws.maxRow; j++) {
			if (ws.data[j][h] != undefined) {
			    var val = ws.data[j][h].value;
			    if (typeof val=='number' && isNaN(val)) {
				continue;
			    }
			    widget.setCell(sheet, col, val, sheet == "project" ? 0 : undefined);
			}
		    }
		}
	    }
	    
	} else {

	    // get the metagenome ids
	    var metagenomes = [];
	    for (var i=0; i<widget.projectData.metagenomes.length; i++) {
		var mgid = widget.projectData.metagenomes[i].metagenome_id;
		if (! mgid.match(/^mgm/)) {
		    mgid = "mgm"+mgid;
		}
		metagenomes.push(mgid);
	    }
	    widget.metagenomes = metagenomes;
	    
	    // fill in project sheet
	    var fields = Retina.keys(d.data);
	    for (var i=0; i<fields.length; i++) {
		widget.setCell('project', fields[i], d.data[fields[i]].value, 0);
		if (fields[i] == 'envo_version') {
		    widget.currentENVOversion = d.data[fields[i]].value;
		    widget.showENVOselect();
		}
	    }
	    
	    // sort samples by sample name
	    d.samples = d.samples.sort(function (a,b) { return a.data.hasOwnProperty('sample_name') ? a.data.sample_name.value.localeCompare(b.data.sample_name.value) : -1 });
	    
	    // iterate over the samples
	    document.getElementById('sample').firstChild.rows[0].cells[0].innerHTML = "ID";
	    for (var h=0; h<d.samples.length; h++) {
		
		// fill in the sample sheet
		var s = d.samples[h];
		document.getElementById('sample').firstChild.rows[h + 1].cells[0].innerHTML = s.id;
		if (! widget.metadata.hasOwnProperty('sample')) {
		    widget.metadata.sample = {};
		}
		if (! widget.metadata.sample.hasOwnProperty('id')) {
		    widget.metadata.sample.id = [];
		}
		widget.metadata.sample.id.push(s.id);
		fields = Retina.keys(s.data);
		for (var i=0; i<fields.length; i++) {
		    if (fields[i] == "sample_id") {
			continue;
		    }
		    widget.setCell('sample', fields[i], s.data[fields[i]].value);
		}
		
		// fill in the env package
		var e = s.envPackage;
		var sn = "ep-"+e.type;
		fields = Retina.keys(e.data);
		for (var i=0; i<fields.length; i++) {
		    widget.setCell(sn, fields[i], e.data[fields[i]].value);
		}
		
		// iterate over the libraries
		for (var j=0; j<s.libraries.length; j++) {
		    
		    // fill in the library sheet
		    var l = s.libraries[j];		    
		    sn = "library-"+l.type;
		    fields = Retina.keys(l.data);
		    for (var i=0; i<fields.length; i++) {
			widget.setCell(sn, fields[i], l.data[fields[i]].value);
		    }
		}
	    }
	}
    };
    
    widget.setCell = function (sheet, field, value, targetrow) {
	var widget = this;

	// check if we know this sheet
	if (! document.getElementById(sheet)) {
	    console.log('unknown sheet: '+sheet);
	    return;
	}

	// check if the sheet is visible
	if (sheet.match(/^library/) || sheet.match(/^ep/)) {
	    if (! widget.activeTabs[sheet]) {
		widget.activeTabs[sheet] = true;
		document.getElementById(sheet+"Checkbox").setAttribute('checked', 'checked');
		var name = sheet.replace(/\|/g, " ").replace(/\s/g, "-");
		jQuery('#'+name+"-li").toggle();
	    }
	}

	// check if we know about this field
	var cat = sheet.indexOf('-') > -1 ? sheet.substr(0, sheet.indexOf('-')) : sheet;
	var subcat = sheet.indexOf('-') > -1 ? sheet.substr(sheet.indexOf('-') + 1) : sheet;
	var table = document.getElementById(sheet).firstChild;
	
	// this is a misc param, add the column
	if (! widget.metadataTemplate[cat][subcat].hasOwnProperty(field)) {
	    var cell = table.rows[0].cells[table.rows[0].cells.length - 1];
	    cell.firstChild.click();
	    cell.childNodes[1].firstChild.value = field;
	    cell.childNodes[1].childNodes[1].click();
	}

	// check if this field is in the sheet
	if (! widget.metadataTemplate[cat][subcat][field].hasOwnProperty('order')) {
	    return;
	}

	// add the data to the metadata in memory
	if (! widget.metadata.hasOwnProperty(sheet)) {
	    widget.metadata[sheet] = {};
	}
	
	if (! widget.metadata[sheet].hasOwnProperty(field)) {
	    widget.metadata[sheet][field] = [];
	}
	if (targetrow === undefined) {
	    widget.metadata[sheet][field].push(value);
	} else {
	    widget.metadata[sheet][field][targetrow] = value;
	}

	// find the table cell to enter the data into
	var column = widget.metadataTemplate[cat][subcat][field].order + 1;
	var row = targetrow || widget.metadata[sheet][field].length;

	// there are not enough rows, append a new one
	if (table.rows.length <= row + 1) {
	    var empty = [];
	    for (var h=0; h<table.rows[0].cells.length - 1; h++) {
		empty.push("");
	    }
	    empty = '<th>'+table.rows.length+'</th><td class="editable viewtext">'+empty.join('</td><td class="editable viewtext">')+'</td>';
	    var r = document.createElement('tr');
	    r.innerHTML = empty;
	    table.appendChild(r);
	}
	
	table.rows[row].cells[column].innerHTML = value;
	
    };

    // Excel export / import
    widget.loadExcelTemplate = function () {
	var widget = this;

	widget.excelPromise = jQuery.Deferred();
	var base_url = "data/MGRAST_MetaData_template_1.7.xlsx";

	JSZipUtils.getBinaryContent(base_url, function(err, data) {
	    if(err) {
		throw err;
	    }
	    var zip = new JSZip();
	    zip.loadAsync(data).then(function(zip) {
		xlsx(zip).then(function (workbook) {
		    Retina.WidgetInstances.metagenome_metazen2[1].excelWorkbook = workbook;
		    Retina.WidgetInstances.metagenome_metazen2[1].excelPromise.resolve();
		});
	    });
	});

	return widget.excelPromise;
    };

    widget.exportExcel = function (target) {
    	var widget = this;

    	var wb = jQuery.extend(true, {}, widget.excelWorkbook);
	var data = widget.metadata;

	if (! widget.dependencyCheck()) {

	    if (!(target == 'excel' && confirm('The validation shows missing fields or errors in your spreadsheet.\nDo you still want to export?'))) {
		return;
	    }
	}
	
	if (! (data.hasOwnProperty('project') && data.hasOwnProperty('sample'))) {
	    alert('you must fill out the project and the sample sheet');
	    return;
	}
	
	for (var h=1; h<wb.worksheets.length; h++) {
	    var dname = wb.worksheets[h].name;
	    dname = dname.replace(/\s/, "-");
	    if (data.hasOwnProperty(dname)) {
		for (var i=0; i<wb.worksheets[h].maxCol; i++) {
    		    if (data[dname].hasOwnProperty(wb.worksheets[h].data[0][i].value)) {
			var vals = data[dname][wb.worksheets[h].data[0][i].value];
			for (var j=2; j<(vals.length+2); j++) {
    			    wb.setCell(h, i, j, vals[j-2]);
			}
    		    }
    		}
		for (var i in data[dname]) {
		    var cat = dname;
		    if (dname.match(/^ep-/)) {
			cat = cat.replace(/^ep-/, "");
		    } else if (dname.match(/^library-/)) {
			cat = cat.replace(/^library-/, "");
		    }
    		    if (data[dname].hasOwnProperty(i) && widget.miscParams[cat] && widget.miscParams[cat].hasOwnProperty(i)) {
    			wb.setCell(h, wb.worksheets[h].maxCol, 0, i);
			var vals = data[dname][i];
			for (var j=2; j<(vals.length+2); j++) {
    			    wb.setCell(h, wb.worksheets[h].maxCol - 1, j, vals[j-2]);
			}
    		    }
    		}
	    } else {
		wb.removeWorksheet(h);
		h--;
	    }
	}

	// export to user inbox
	if (target == 'shock') {

	    var ulbtn = document.getElementById('inboxUploadButton');
	    ulbtn.setAttribute('disabled', 'disabled');
	    ulbtn.innerHTML = '<img src="Retina/images/waiting.gif" style="width: 16px;">';
	    
	    xlsx(wb, 'blob').then(function(data) {
		var widget = Retina.WidgetInstances.metagenome_metazen2[1];
		
		var url = RetinaConfig.shock_url+'/node';
		
		// set up the node
		var attributes = new Blob([ JSON.stringify({ "type": "inbox", "user": stm.user.login, "id": stm.user.id, "email": stm.user.email }) ], { "type" : "text\/json" });
	
		var xlsfile = data.base64;
		var form = new FormData();
		var filename = widget.metadata.project.project_name[0].replace(/\s/g, "_")+".xlsx";
		form.append('attributes', attributes);
		form.append('file_name', filename);
		form.append('upload', xlsfile);

		jQuery.ajax(url, {
	    	    contentType: false,
	    	    processData: false,
	    	    data: form,
	    	    success: function(data) {

			// add ACLs for mgrast user
			jQuery.ajax({ url: RetinaConfig.shock_url + "/node/" + data.data.id + "/acl/all?users=mgrast",
				      nodeid: data.data.id,
				      success: function(data) {

					  // data is uploaded to the inbox, issue validation call
	    				  var url = RetinaConfig.mgrast_api+'/metadata/validate';
					  jQuery.ajax(url, {
					      data: { "node_id": this.nodeid },
					      success: function(data){
						  ulbtn.removeAttribute('disabled');
						  ulbtn.innerHTML = '<img src="Retina/images/cloud-upload.png" style="width: 16px; margin-right: 5px;">upload to inbox';
						  alert('metadata successfully uploaded to inbox');
					      },
					      error: function(jqXHR){
						  ulbtn.removeAttribute('disabled');
						  ulbtn.innerHTML = '<img src="Retina/images/cloud-upload.png" style="width: 16px; margin-right: 5px;">upload to inbox';
						  alert('there was an error upload the metadata to your inbox');
					      },
					      crossDomain: true,
					      headers: stm.authHeader,
					      type: "POST"
					  });
					  
				      },
				      error: function(jqXHR) {
						  ulbtn.removeAttribute('disabled');
						  ulbtn.innerHTML = '<img src="Retina/images/cloud-upload.png" style="width: 16px; margin-right: 5px;">upload to inbox';
						  alert('there was an error upload the metadata to your inbox');					  
				      },
				      crossDomain: true,
				      headers: stm.authHeader,
				      type: "PUT"
				    });
	    	    },
	    	    error: function(jqXHR){
			ulbtn.removeAttribute('disabled');
			ulbtn.innerHTML = '<img src="Retina/images/cloud-upload.png" style="width: 16px; margin-right: 5px;">upload to inbox';
			alert('there was an error upload the metadata to your inbox');
	    	    },
	    	    crossDomain: true,
	    	    headers: stm.authHeader,
	    	    type: "POST"
		});
		
	    });
	}

	// update the project metadata
	else if (target == 'project') {
	    var id = Retina.cgiParam('project');
	    var btn = document.getElementById('projectUploadButton');
	    
	    btn.setAttribute('disabled', 'disabled');
	    btn.innerHTML = '<img src="Retina/images/waiting.gif" style="width: 16px;">';

	    xlsx(wb, 'blob').then(function(data) {
		var widget = Retina.WidgetInstances.metagenome_metazen2[1];
				
		var xlsfile = data.base64;
		var form = new FormData();
		var filename = widget.metadata.project.project_name[0].replace(/\s/g, "_")+".xlsx";
		form.append('upload', xlsfile, filename);
		form.append('project', id);
		for (var i=0; i<widget.metagenomes.length; i++) {
		    form.append('metagenome', widget.metagenomes[i]);
		}
	
		jQuery.ajax({
		    method: "POST",
		    headers: stm.authHeader,
		    data: form,
		    contentType: false,
		    processData: false,
		    url: RetinaConfig.mgrast_api+'/metadata/update',
		    complete: function(xhr) {
			var response = JSON.parse(xhr.responseText);

			if (response.hasOwnProperty('ERROR')) {
			    document.getElementById('cellInfoBox').innerHTML = '<div class="alert alert-error">'+response.ERROR.replace(/\[error\]/g,"<br>")+'</div>';
			}
			else if (response.hasOwnProperty('errors') && response.errors.length) {
			    var html = [];
			    var added = "";
			    if (response.added.length) {
				html.push('<div class="alert alert-info">The following metagenomes had metadata added:<br>' + response.added.join('<br>')+'</div>');
			    }
			    html.push('<div class="alert alert-error">' + response.errors.join('<br>')+'</div>');
			    document.getElementById('cellInfoBox').innerHTML = html.join("");
			}
			else {
			    document.getElementById('cellInfoBox').innerHTML = '<div class="alert alert-success">The metadata for this project was successfully updated.</div>';
			}
			document.getElementById('projectUploadButton').removeAttribute('disabled');
			document.getElementById('projectUploadButton').innerHTML = '<img src="Retina/images/cloud-upload.png" style="width: 16px; margin-right: 5px;">update project';
		    }
		});
	    });
	}			 
    
	// export to xlsx file
	else {
    	    xlsx(wb).then(function(data) {
    		stm.saveAs(data.base64, "metadata.xlsx", true, "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,");
    	    });
	}
    };

    widget.getTemplateOrder = function () {
	var widget = this;

	widget.metadataTemplate.sample.sample.sample_size = widget.metadataTemplate.sample.sample.samp_size;
	widget.metadataTemplate.library.metagenome.lib_construction = widget.metadataTemplate.library.metagenome.lib_const_meth;
	widget.metadataTemplate.library.metatranscriptome.lib_construction = widget.metadataTemplate.library.metatranscriptome.lib_const_meth;
	

	var wb = jQuery.extend(true, {}, widget.excelWorkbook);
	for (var h=1; h<wb.worksheets.length; h++) {
	    var ws = wb.worksheets[h];
	    var x1 = ws.name.split(/\s/)[0];
	    var x2 = ws.name.substr(ws.name.indexOf(" ") > -1 ? ws.name.indexOf(" ") + 1 : 0);
	    var order = 0;
	    for (var i=0; i<ws.maxCol; i++) {
		ws.data[0][i].value = ws.data[0][i].value.replace(/\s+/, "");
		if (ws.data[0][i].value == "sample_id" || ws.data[0][i].value == "misc_param") {
		    continue;
		}
		if (widget.metadataTemplate[x1][x2].hasOwnProperty(ws.data[0][i].value)) {
		    widget.metadataTemplate[x1][x2][ws.data[0][i].value].order = order;
		    widget.metadataTemplate[x1][x2]._maxOrder = order;
		    order++;
    		}
	    }
	}
    };

    widget.dependencyCheck = function () {
	var widget = this;

	var problems = [];

	// check mandatory project fields
	for (var i in widget.tables.project) {
	    if (widget.tables.project.hasOwnProperty(i)) {
		if (widget.tables.project[i].required == "1" && ! (widget.metadata.project[i] !== undefined && widget.metadata.project[i][0] !== undefined && widget.metadata.project[i][0].length)) {
		    problems.push({'tab': 'project', 'message': 'missing mandatory field "'+i+'"'});
		}
	    }
	}

	// check mandatory sample fields
	var sampleNames = {};
	if (! widget.metadata.hasOwnProperty('sample')) {
	    problems.push({'tab': 'sample', 'message': 'must specify at least one sample'});
	} else {
	    if (widget.metadata.sample.hasOwnProperty('sample_name')) {

		// make sure sample name is unique
		var snames = {};
		for (var h=0; h<widget.metadata.sample.sample_name.length; h++) {
		    if (widget.metadata.sample.sample_name[h] !== undefined && widget.metadata.sample.sample_name[h].length) {
			if (snames.hasOwnProperty(widget.metadata.sample.sample_name[h])) {
			    problems.push({'tab': 'sample', 'row': h, 'message': 'duplicate sample name "'+widget.metadata.sample.sample_name[h]+'"'});
			} else {
			    snames[widget.metadata.sample.sample_name[h]] = true;
			}
			for (var i in widget.tables.sample) {
			    if (widget.tables.sample.hasOwnProperty(i)) {
				if (widget.tables.sample[i].required == "1" && ! (widget.metadata.sample.hasOwnProperty(i) && widget.metadata.sample[i].hasOwnProperty(h) && widget.metadata.sample[i][h] != undefined)) {
				    problems.push({'tab': 'sample', 'row': h, 'message': 'missing mandatory field "'+i+'"'});
				}
			    }
			}
			sampleNames[widget.metadata.sample.sample_name[h]] = { "lib": null, "ep": null };
			if (widget.metadata.sample.hasOwnProperty('env_package') && widget.metadata.sample.env_package.length && widget.metadata.sample.env_package.hasOwnProperty(h) && widget.metadata.sample.env_package[h] != undefined) {
			    sampleNames[widget.metadata.sample.sample_name[h]].ep = widget.metadata.sample.env_package[h];
			    if (! widget.metadata.hasOwnProperty("ep-"+widget.metadata.sample.env_package[h])) {
				problems.push({'tab': 'sample', 'row': h, 'message': 'environmental package sheet "'+widget.metadata.sample.env_package[h]+'" referenced but not filled out'});
			    }
			} 
		    }
		}
	    } else {
		problems.push({'tab': 'sample', 'message': 'no sample names'});
	    }
	}

	// iterate over the other tabs
	var k = Retina.keys(widget.metadata);
	var hasLibrary = false;
	for (var i=0; i<k.length; i++) {

	    // environmental package and library
	    if (k[i].match(/^ep/) || k[i].match(/^library/)) {
		if (widget.metadata[k[i]].hasOwnProperty('sample_name')) {

		    var fnames = {};
		    var mgnames = {};
		    for (var h=0; h<widget.metadata[k[i]].sample_name.length; h++) {
			if (widget.metadata[k[i]].sample_name[h] !== undefined && widget.metadata[k[i]].sample_name[h].length) {
			    if (sampleNames.hasOwnProperty(widget.metadata[k[i]].sample_name[h])) {
				if (k[i].match(/^ep/) && sampleNames[widget.metadata[k[i]].sample_name[h]].ep && k[i].indexOf(sampleNames[widget.metadata[k[i]].sample_name[h]].ep) < 0) {
				    problems.push({'tab': k[i], 'row': h, 'message': 'the referenced sample "'+widget.metadata[k[i]].sample_name[h]+'" has the wrong environmental package'});
				} else {
				    sampleNames[widget.metadata[k[i]].sample_name[h]].lib = k[i];
				}
			    } else {
				problems.push({'tab': k[i], 'row': h, 'message': 'sample sheet has no row for sample name "'+widget.metadata[k[i]].sample_name[h]+'"'});
			    }
			    for (var j in widget.tables[k[i]]) {
				if (widget.tables[k[i]].hasOwnProperty(j)) {

				    // check uniqueness of filenames and metagenome names
				    if (widget.metadata[k[i]].hasOwnProperty(j) && widget.metadata[k[i]][j].hasOwnProperty(h) && widget.metadata[k[i]][j][h] != undefined) {
					if (j == "file_name") {
					    if (fnames.hasOwnProperty(widget.metadata[k[i]][j][h])) {
						problems.push({'tab': k[i], 'row': h, 'message': 'duplicate filename "'+widget.metadata[k[i]][j][h]+'"'});
					    } else {
						fnames[widget.metadata[k[i]][j][h]] = true;
					    }
					}

					if (j == "metagenome_name") {
					    if (mgnames.hasOwnProperty(widget.metadata[k[i]][j][h])) {
						problems.push({'tab': k[i], 'row': h, 'message': 'duplicate metagenome name "'+widget.metadata[k[i]][j][h]+'"'});
					    } else {
						mgnames[widget.metadata[k[i]][j][h]] = true;
					    }
					}
				    }
				    
				    if (widget.tables[k[i]][j].required == "1" && ! (widget.metadata[k[i]].hasOwnProperty(j) && widget.metadata[k[i]][j].hasOwnProperty(h) && widget.metadata[k[i]][j][h] != undefined)) {
					
					// auto fill investigation type
					if (k[i].match(/^library/) && j=='investigation_type') {
					    widget.setCell(k[i], 'investigation_type', k[i].replace(/library-/, ""), h);
					} else {
					    problems.push({'tab': k[i], 'row': h, 'message': 'missing mandatory field "'+j+'"'});
					}
				    }
				}
			    }
			}
		    }
		} else {
		    problems.push({'tab': k[i], 'message': 'no sample names'});
		}
	    }

	    // mark if any library is present
	    if (k[i].match(/^library/)) {
		hasLibrary = true;
	    }
	}

	// check if all samples have a library and an environmental package
	for (var i in sampleNames) {
	    if (sampleNames.hasOwnProperty(i)) {
		if (! sampleNames[i].ep) {
		    problems.push({'tab': 'sample', 'message': 'sample '+i+' is not referenced in an environmental package'});
		}
		if (! sampleNames[i].lib) {
		    problems.push({'tab': 'sample', 'message': 'sample '+i+' is not referenced in a library'});
		}
	    }
	}

	if (! hasLibrary) {
	    problems.push({'tab': 'library', 'message': 'you must provide at least one of library metagenome, library mimarks-survey or library transcriptome'});
	}
	
	if (problems.length) {
	    var html = [];
	    var last = "";
	    for (var i=0; i<problems.length; i++) {
		if (last != problems[i].tab) {
		    last = problems[i].tab;
		    if (i > 0) {
			html.push('</ul>');
		    }
		    html.push('<h4>'+last+'</h4><ul>');
		}
		html.push('<li>'+problems[i].message+(problems[i].hasOwnProperty('row') ? ' in row ' + (problems[i].row + 1) : "")+'</li>');
	    }
	    html.push('</ul>');
	    document.getElementById('feedbackContent').innerHTML = html.join('');
	    jQuery('#feedbackModal').modal('show');
	    return false;
	} else {
	    return true;
	}
    };
    
})();
