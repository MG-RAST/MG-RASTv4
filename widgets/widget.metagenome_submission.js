(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Submission Widget",
                name: "metagenome_submission",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [];
    };
    
    widget.validSteps = { metadata: false,
			  project: false,
			  files: false,
			  options: false };

    widget.display = function (params) {
        var widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	document.getElementById("pageTitle").innerHTML = "submission";
	
	// help text
	sidebar.setAttribute('style', 'padding: 10px;');
	var sidehtml = '<h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/info2.png">submission information</h3><ul class="helplist"><li>all submitted data will stay private until the owner makes it public or shares it with another user.</li><li>providing metadata is required to make your data public and will increase your priority in the queue.</li><li>the sooner you choose to make your data public, the higher your priority in the queue will be</li></ul>';

	sidebar.innerHTML = sidehtml;

	if (! stm.user) {
	    content.innerHTML = "<div class='alert alert-info' style='width: 500px;'>You must be logged in to submit to the pipeline.</div>";
	    return;
	}

	//Retina.WidgetInstances.login[1].verifyAuthentication(RetinaConfig.mgrast_api+"/user/authenticate", stm.authHeader);

	if (! widget.inboxData) {
	    content.innerHTML = "<div style='width: 100%; text-align: center; margin-top: 150px;'><img src='Retina/images/waiting.gif' style='width: 25px;'></div>";
	    widget.checkInbox();

	} else {
	    
	    // title
	    var html = "<div class='btn-group' data-toggle='buttons-checkbox' style='margin-bottom: 20px;'><a href='?mgpage=upload' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/cloud-upload.png'>upload data</a><a href='?mgpage=submission' class='btn btn-large active' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>perform submission</a><a href='?mgpage=pipeline' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a></div>";

	    // new title
	    html = '<div class="wizard span12">\
	  <div>\
	    <li></li>\
	    <a href="?mgpage=upload">upload<img src="Retina/images/cloud-upload.png"></a>\
	  </div>\
	  <div class="separator">›</div>\
	  <div>\
	    <li class="active"></li>\
	    <a href="#" class="active">submit<img src="images/forward.png"></a>\
	  </div>\
	  <div class="separator">›</div>\
	  <div>\
	    <li></li>\
	    <a href="?mgpage=pipeline">progress<img src="Retina/images/settings3.png"></a>\
	  </div>\
	</div><div style="clear: both; height: 20px;"></div>';
	    
	    // create a new project
	    html += "<form class='form-horizontal' onsubmit='return false;'>";
	    
	    html += '<div class="accordion" id="accordion">';
	    
	    html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#metadata' id='metadataHeader'>1. select metadata file</a></div><div id='metadata' class='accordion-body collapse in'></div></div>";
	    
	    html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#project' id='projectHeader'>2. select project</a></div><div id='project' class='accordion-body collapse'></div></div>";
	    
	    html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#files' id='filesHeader'>3. select sequence file(s)</a></div><div id='files' class='accordion-body collapse'></div></div>";
	    
	    html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#options' id='optionsHeader'>4. choose pipeline options</a></div><div id='options' class='accordion-body collapse'></div></div>";
	    
	    html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#submit' id='submitHeader'>5. submit</a></div><div id='submit' class='accordion-body collapse'></div></div>";
	    
	    html += "</div></form>";
	    
	    content.innerHTML = html;
	    
	    widget.displayProjectSelect();
	    widget.displayMetadataSelect();
	    widget.displayFileSelect();
	    widget.displayOptions('fastq');
	    widget.displaySubmit();
	}
    };

    // DATA QUERY METHODS
    widget.checkInbox = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	var url = RetinaConfig.mgrast_api + "/inbox";
	if (stm.user) {
	    jQuery.ajax(url, {
		success: function(data){
		    Retina.WidgetInstances.metagenome_submission[1].inboxData = data.files;
		    Retina.WidgetInstances.metagenome_submission[1].display();
		},
		error: function(jqXHR, error){
		    Retina.WidgetInstances.metagenome_submission[1].showError("unable to get inbox data");
		    console.log(error);
		    console.log(jqXHR);
		},
		crossDomain: true,
		headers: stm.authHeader,
		type: "GET"
	    });
	}
    };

    widget.showError = function (error) {
	Retina.WidgetInstances.metagenome_submission[1].main.innerHTML = "<div class='alert alert-error' style='width: 500px;'>"+error+"</div>";
    };

    // DISPLAY METHODS FOR THE STEPS
    widget.displayProjectSelect = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	var target = document.getElementById('project');

	var html = "<p>You have to specify a project to upload a job to MG-RAST. If you have a metadata file, the project must be specified in that file. If you choose to not use a metadata file, you can select a project here. You can either select an existing project or you can choose a new project.</p>";

	html += "<div class='input-append' style='margin-left: 20%; margin-top: 15px; margin-bottom: 15px;'><input type='text' name='projectname' placeholder='enter project name' autocomplete='off' id='projectname' style='width: 400px;'><button class='btn' onclick='Retina.WidgetInstances.metagenome_submission[1].selectProject();'>select</button></div>";

	html += "<p><b>Note:</b> <i>The projects listed are those that you have write access to. The owners of other projects can provide you with write access if you do not have it.</i></p>";

	html += "<div style='height: 20px;'></div>";

	target.innerHTML = html;

	// get the private projects this user has access to
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project?private=1&edit=1',
	    success: function (data) {
		if (! stm.DataStore.hasOwnProperty('project')) {
		    stm.DataStore.project = {};
		}
		var projectNames = [];
		for (var i=0; i<data.data.length; i++) {
		    stm.DataStore.project[data.data[i].id] = data.data[i];
		    projectNames.push(data.data[i].name);
		}
		jQuery('#projectname').typeahead({ source: projectNames });
	    }});
    };

    widget.selectProject = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];

	var project = document.getElementById('projectname').value;
	if (! project) {
	    alert('you must select a project');
	    widget.validSteps.project = false;
	} else {
	    var ps = Retina.keys(stm.DataStore.project);
	    widget.selectedProject = { id: null, name: project };
	    for (var i=0; i<ps.length; i++) {
		if (stm.DataStore.project[ps[i]].name == project) {
		    widget.selectedProject.id = ps[i];
		    break;
		}
	    }
	    widget.validSteps.project = true;
	    document.getElementById('filesHeader').click();
	}
	widget.checkSubmittable();
    };

    widget.displayMetadataSelect = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	var target = document.getElementById('metadata');

	var md_file_opts = [];
	for (var i=0; i<widget.inboxData.length; i++) {
	    if (widget.inboxData[i].hasOwnProperty('data_type') && widget.inboxData[i].data_type == 'metadata' && widget.inboxData[i].filename.match(/\.xls/)) {
		md_file_opts.push("<option value='"+widget.inboxData[i].id+"'>"+widget.inboxData[i].filename+"</option>");
	    }
	}
	var md_file_text = "";
	if (md_file_opts.length) {
	    md_file_opts = '<select style="width: 420px; height: 200px;" multiple="" id="metadata_file_select">'+md_file_opts.join("\n")+"</select>";
	    md_file_text = '<div style="float: left; width: 50%;"><p>Select a spreadsheet with metadata for the project you want to submit.</p><p>In order to map sequence files to metadata libraries, the names of the sequence files must exactly match the library <i>file_name</i> fields or match the library <i>metagenome_name</i> fields minus the file extension.</p><p><b>Note: While metadata is not required at submission, the priority for processing data without metadata is lower.</b></p></div>';
	} else {
	    md_file_opts = '<p>You do not have any metadata files available. Metadata can be uploaded on the <a href="?mgpage=upload">upload page</a>.</p><p>If you have uploaded metadata and it is not displayed here, it might be invalid. Click on the metadata file in your inbox on the <a href="?mgpage=upload">upload page</a> to receive more information.</p><p>Submission of multiple files, sharing of data or data publication require metadata. You can use <a href="ftp://ftp.metagenomics.anl.gov/data/misc/metadata/MGRAST_MetaData_template_1.7.xlsx">this Excel template</a> and/or <a href="?mgpage=metazen2" target="_blank">the MetaZen tool</a> to fill out the metadata spreadsheet for a study.</p><p>More information about metadata can be found in the <a href="ftp://ftp.metagenomics.anl.gov/data/manual/mg-rast-manual.pdf#page=28" target=_blank>MG-RAST manual, section 2.7</a>.</p>';
	}

	var html = '<div style="float: left;"><table><tbody><tr><td>'+md_file_opts+'<br><p><input type="checkbox" onclick="if(this.checked){document.getElementById(\'metadata_file_select\').selectedIndex=-1;alert(\'INFO\\nNot submitting metadata will severely lower your priority in the computation queue.\\nYou will also not be able to make your data public until you provide metadata for it.\');}" id="no_metadata" name="no_metadata" value="no_metadata"> <span style="font-size: 12px; position: relative; top: 2px;">I do not want to supply metadata</span></p> <input type="button" onclick="Retina.WidgetInstances.metagenome_submission[1].selectMetadata();" value="select" class="btn"></td><td><p style="margin-left: 20px;" id="metadata_file_info"></p></td></tr></tbody></table></div>'+md_file_text;

	html += "<div style='height: 20px; clear: both;'></div>";

	target.innerHTML = html;
    };

    widget.selectMetadata = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];

	var metadata = document.getElementById('no_metadata').checked ? "none" : (document.getElementById('metadata_file_select').selectedIndex > -1 ? document.getElementById('metadata_file_select').options[document.getElementById('metadata_file_select').selectedIndex].value : null);
	if (! metadata) {
	    alert('if you do not want to provide metadata, please check the checkbox');
	    widget.validSteps.metadata = false;
	} else {
	    widget.selectedMetadata = metadata;
	    widget.validSteps.metadata = true;
	    document.getElementById('projectHeader').click();
	}
	widget.checkSubmittable();
    };

    widget.displayFileSelect = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	var target = document.getElementById('files');

	var seq_file_opts = [];
	for (var i=0; i<widget.inboxData.length; i++) {
	    if (widget.inboxData[i].hasOwnProperty('data_type') && widget.inboxData[i].data_type == 'sequence') {
		seq_file_opts.push("<option value='"+widget.inboxData[i].id+"'>"+widget.inboxData[i].filename+"</option>");
	    }
	}
	seq_file_opts = seq_file_opts.join("\n");

	var html = "<p>Sequence files from your inbox will appear here. Please note, there is a delay between upload completion and appearing in this table due to sequence statistics calculations. This may be on the order of seconds to hours depending on file size.</p>";

	html += "<div id='fileSelect'><select name='inputfiles' id='inputfiles' multiple style='margin-left: 50px; width: 500px; height: 200px;'>"+seq_file_opts+"</select><button class='btn' onclick='Retina.WidgetInstances.metagenome_submission[1].selectFiles();' style='margin-left: 20px;'>select</button></div>";

	html += "<div id='selectedFiles' style='display: none;'><div></div><button class='btn' onclick='Retina.WidgetInstances.metagenome_submission[1].unselectFiles();'>unselect</button></div>";

	html += "<div style='height: 20px;'></div>";

	target.innerHTML = html;
    };

    widget.selectFiles = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];

	var files = [];
	var sel = document.getElementById('inputfiles');
	for (var i=0; i<sel.options.length; i++) {
	    if (sel.options[i].selected) {
		files.push({ id: sel.options[i].value, name: sel.options[i].label });
	    }
	}
	if (! files.length) {
	    widget.validSteps.files = false;
	    alert('you did not select any files');
	} else {
	    widget.selectedSequenceFiles = files;
	    var types = { fasta: 0, fastq: 0 };
	    for (var i=0; i<files.length; i++) {
		if (files[i].name.match(/(\.fasta|\.fa|\.fna|\.faa)$/)) {
		    types.fasta++;
		} else {
		    types.fastq++;
		}
	    }
	    if (types.fasta > 0 && types.fastq > 0) {
		widget.validSteps.files = false;
		alert('you cannot submit both fasta and fastq at the same time');
	    } else if (types.fasta > 0) {
		widget.displayOptions('fasta');
		widget.validSteps.files = true;
	    } else {
		widget.displayOptions('fastq');
		widget.validSteps.files = true;	
	    }
	    if (widget.validSteps.files) {
		var html = "<p><b>You have selected the following sequence files:</b></p><ul>";
		for (var i=0; i<files.length; i++) {
		    html += "<li>"+files[i].name+"</li>";
		}
		html += "</ul>";
		document.getElementById('selectedFiles').firstChild.innerHTML = html;
		document.getElementById('fileSelect').style.display = "none";
		document.getElementById('selectedFiles').style.display = "";
		document.getElementById('optionsHeader').click();
	    }
	}
	widget.checkSubmittable();
    };

    widget.unselectFiles = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];

	var inp = document.getElementById('inputfiles');
	for (var i=0; i<inp.options.length; i++) {
	    inp.options[i].selected = false;
	}
	inp.selectedIndex = null;
	widget.selectedSequenceFiles = [];
	widget.validSteps.files = false;

	document.getElementById('fileSelect').style.display = "";
	document.getElementById('selectedFiles').style.display = "none";

	widget.checkSubmittable();
    };

    widget.displayOptions = function (option) {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	var target = document.getElementById('options');
	var html = '<div class="control-group">';

	var options = { "fastq": [ { "name": "assembled",
				     "fields": [ {
					 "id": "assembled",
					 "name": "assembled",
					 "value": "assembled",
					 "class": "checkbox",
					 "checked": false,
					 "text": 'Select this option if your input sequence file(s) contain assembled data and include the coverage information within each sequence header as described <a target="blank" href="ftp://ftp.metagenomics.anl.gov/data/manual/mg-rast-manual.pdf#98">here</a>.' } ] },
				   { "name": "dereplication",
				     "fields": [
					 { "id": "dereplication",
					   "name": "dereplication",
					   "value": "dereplication",
					   "checked": true,
					   "class": "checkbox",
					   "text": 'Remove artificial replicate sequences produced by sequencing artifacts <a target="blank" href="http://www.nature.com/ismej/journal/v3/n11/full/ismej200972a.html">Gomez-Alvarez, et al, The ISME Journal (2009)</a>' }
				     ] },
				   { "name": "screening", 
				     "fields": [
					 { "id": "screening",
					   "name": "screening",
					   "class": "select",
					   "text": 'Remove any host specific species sequences (e.g. plant, human or mouse) using DNA level matching with bowtie <a target="blank" href="http://genomebiology.com/2009/10/3/R25">Langmead et al., Genome Biol. 2009, Vol 10, issue 3</a>',
					   "options": [ { "value": "h_sapiens", "text": "H. sapiens, NCBI v36", "selected": true },
							{ "value": "m_musculus", "text": "M. musculus, NCBI v37" },
							{ "value": "r_norvegicus", "text": "R. norvegicus, UCSC rn4" },
							{ "value": "b_taurus", "text": "B. taurus, UMD v3.0" },
							{ "value": "d_melanogaster", "text": "D. melanogaster, Flybase, r5.22" },
							{ "value": "a_thaliana", "text": "A. thaliana, TAIR, TAIR9" },
							{ "value": "e_coli", "text": "E. coli, NCBI, st. 536" },
							{ "value": "s_scrofa", "text": "Sus scrofa, NCBI v10.2" },
							{ "value": "none", "text": "none" } ] }
				     ] },
				   { "name": "dynamic trimming",
				     "fields": [
					 { "id": "dynamic_trim",
					   "name": "dynamic_trim",
					   "class": "checkbox",
					   "value": "dynamic_trim",
					   "checked": true,
					   "text": 'Remove low quality sequences using a modified DynamicTrim <a target="blank" href="http://www.biomedcentral.com/1471-2105/11/485">Cox et al., (BMC Bioinformatics, 2011, Vol. 11, 485)</a>.' },
					 { "id": "min_qual",
					   "name": "min_qual",
					   "class": "text",
					   "value": "15",
					   "width": "span1",
					   "text": 'Specify the lowest phred score that will be counted as a high-quality base.' },
					 { "id": "max_lqb",
					   "name": "max_lqb",
					   "class": "text",
					   "value": "5",
					   "width": "span1",
					   "text": 'Sequences will be trimmed to contain at most this many bases below the above-specified quality.' }
				     ] }
				 ],
			"fasta":  [ { "name": "assembled",
				     "fields": [ {
					 "id": "assembled",
					 "name": "assembled",
					 "value": "assembled",
					 "class": "checkbox",
					 "checked": false,
					 "text": 'Select this option if your input sequence file(s) contain assembled data and include the coverage information within each sequence header as described <a target="blank" href="http://blog.metagenomics.anl.gov/mg-rast-v3-2-faq/#assembled_pipeline">here</a>.' } ] },
				   { "name": "dereplication",
				     "fields": [
					 { "id": "dereplication",
					   "name": "dereplication",
					   "value": "dereplication",
					   "checked": true,
					   "class": "checkbox",
					   "text": 'Remove artificial replicate sequences produced by sequencing artifacts <a target="blank" href="http://www.nature.com/ismej/journal/v3/n11/full/ismej200972a.html">Gomez-Alvarez, et al, The ISME Journal (2009)</a>' }
				     ] },
				   { "name": "screening", 
				     "fields": [
					 { "id": "screening",
					   "name": "screening",
					   "class": "select",
					   "text": 'Remove any host specific species sequences (e.g. plant, human or mouse) using DNA level matching with bowtie <a target="blank" href="http://genomebiology.com/2009/10/3/R25">Langmead et al., Genome Biol. 2009, Vol 10, issue 3</a>',
					   "options": [ { "value": "h_sapiens", "text": "H. sapiens, NCBI v36", "selected": true },
							{ "value": "m_musculus", "text": "M. musculus, NCBI v37" },
							{ "value": "r_norvegicus", "text": "R. norvegicus, UCSC rn4" },
							{ "value": "b_taurus", "text": "B. taurus, UMD v3.0" },
							{ "value": "d_melanogaster", "text": "D. melanogaster, Flybase, r5.22" },
							{ "value": "a_thaliana", "text": "A. thaliana, TAIR, TAIR9" },
							{ "value": "e_coli", "text": "E. coli, NCBI, st. 536" },
							{ "value": "s_scrofa", "text": "Sus scrofa, NCBI v10.2" },
							{ "value": "none", "text": "none" } ] }
				     ] },
				   { "name": "length filtering",
				     "fields": [
					 { "id": "filter_ln",
					   "name": "filter_ln",
					   "class": "checkbox",
					   "value": "filter_ln",
					   "checked": true,
					   "text": 'Filter based on sequence length when no quality score information is available.' },
					 { "id": "deviation",
					   "name": "deviation",
					   "class": "text",
					   "value": "2.0",
					   "width": "span1",
					   "text": 'Specify the multiplicator of standard deviation for length cutoff.' }
				     ] },
				    { "name": "ambiguous base filtering",
				     "fields": [
					 { "id": "filter_ambig",
					   "name": "filter_ambig",
					   "class": "checkbox",
					   "value": "filter_ambig",
					   "checked": true,
					   "text": 'Filter based on sequence ambiguity base (non-ACGT) count when no quality score information is available.' },
					 { "id": "max_ambig",
					   "name": "max_ambig",
					   "class": "text",
					   "value": "5",
					   "width": "span1",
					   "text": 'Specify the maximum allowed number of ambiguous basepairs. ' }
				     ] }
				  ] };
	
	for (var i=0; i<options[option].length; i++) {
	    var group = options[option][i];
	    html += '<label class="control-label" for="'+group.fields[0].id+'"><b>'+group.name+'</b>'+(group.name2 ? '<br>' + group.name2 : '')+'</label><div class="controls">';

	    for (var j=0; j<group.fields.length; j++) {
		var opt = group.fields[j];
		switch (opt['class']) {
		case "checkbox":
		    html += '<label class="checkbox"><input id="'+opt.id+'" type="checkbox" name="'+opt.name+'" value="'+opt.value+'"'+(opt.checked ? ' checked' : '')+'>'+opt.text+'</label>';
		    break;
		case "text":
		    html += '<label class="text"><input id="'+opt.id+'" type="text" name="'+opt.name+'" value="'+opt.value+'" style="margin-right: 10px;"'+(opt.width ? ' class="'+opt.width+'"' : '')+'>'+opt.text+'</label>';
		    break;
		case "select":
		    html += '<label class="select"><select id="'+opt.id+'" name="'+opt.name+'" >';
		    for (var h=0; h<opt.options.length; h++) {
			html += '<option value="'+opt.options[h].value+'"'+(opt.options[h].selected ? ' selected' : '')+'>'+opt.options[h].text+'</option>';
		    }
		    html += '</select><br>'+opt.text+'</label>';
		}
	    }
	    html += '</div>';
	}

	html += '</div>';

	html += "<button class='btn' onclick='Retina.WidgetInstances.metagenome_submission[1].selectOptions();'>select</button>";
	
	html += "<div style='height: 20px;'></div>";

	target.innerHTML = html;
    };

    widget.selectOptions = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];

	widget.validSteps.options = true;
	widget.checkSubmittable();
    };

    widget.checkSubmittable = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];

	var valid = true;
	for (var i in widget.validSteps) {
	    if (widget.validSteps.hasOwnProperty(i)) {
		if (widget.validSteps[i]) {
		    document.getElementById(i+'Header').parentNode.className = "accordion-heading stage completedstage";
		} else {
		    document.getElementById(i+'Header').parentNode.className = "accordion-heading stage";
		    valid = false;
		}
	    }
	}
	
	if (valid) {
	    document.getElementById('submitHeader').click();
	    document.getElementById('submit_job_button').removeAttribute('disabled');
	} else {
	    document.getElementById('submitHeader').parentNode.className = "accordion-heading stage";
	    document.getElementById('submit_job_button').setAttribute('disabled', 'disabled');
	}
    };

    widget.displaySubmit = function () {
	var html = '<p>Data will be private (only visible to the submitter) unless you choose to share it with other users or make it public. If you decide to make data public your data will be given priority for the computational queue.</p>\
\
<div class="control-group">\
<div class="controls">\
<label class="radio"><input type="radio" name="priorityOption" value="immediately" id="priorityOption1">Data will be publicly accessible <b> immediately </b> after processing completion - Highest Priority</label>\
<label class="radio"><input type="radio" name="priorityOption" value="3months" id="priorityOption2">Data will be publicly accessible <b>after 3 months</b> - High Priority</label>\
<label class="radio"><input type="radio" name="priorityOption" value="6months" id="priorityOption3">Data will be publicly accessible <b>after 6 months</b> - Medium Priority</label>\
<label class="radio"><input type="radio" name="priorityOption" value="date" id="priorityOption4">Data will be publicly accessible <b>eventually</b> - Lower Priority</label>\
<label class="radio"><input type="radio" name="priorityOption" value="never" checked="" id="priorityOption5"><b>Data will stay private </b> (DEFAULT) - Lowest Priority</label>\
</div>\
</div>\
<p>Please note that only private data can be deleted.</p>\
<div style="height:10px;" class="clear"></div>';
	html += '\
<div style="height:10px;" class="clear"></div>\
<div style="margin-bottom: 20px; text-align: center;"><img src="Retina/images/waiting.gif" style="display: none; width: 24px;" id="submit_job_waiting"><input type="button" id="submit_job_button" disabled="" onclick="Retina.WidgetInstances.metagenome_submission[1].submit_job();" value="submit job" class="btn"><span style="margin-left: 20px;"><b>Note: You must complete all previous steps to enable submission.</b></span></div>\
<p>Upon successful submission, MG-RAST IDs ("Accession numbers") will be automatically assigned to your datasets and data files will be removed from your inbox.</p>';
	
	    
	html += "<div style='height: 20px;'></div>";

	document.getElementById('submit').innerHTML = html;
    };

    widget.submit_job = function (metadata_consistent) {
	var widget = this;

	// if metadata is selected, check file consistency
	if (widget.selectedMetadata != "none" && ! metadata_consistent) {
	    document.getElementById('submit_job_waiting').style.display = "";
	    document.getElementById('submit_job_button').style.display = "none";
	    var url = RetinaConfig.mgrast_api+'/metadata/validate';
	    jQuery.ajax(url, {
		data: JSON.stringify({ "node_id": widget.selectedMetadata }),
		success: function(data){
		    var widget = Retina.WidgetInstances.metagenome_submission[1];
		    var errors = [];
		    
            var libfiles = {};
            var libnames = {};
            var numlibs  = 0;
            
            // get files from metadata
            for (var i=0; i<data.metadata.samples.length; i++) {
                for (var h=0; h<data.metadata.samples[i].libraries.length; h++) {
                    numlibs++;
                    if (data.metadata.samples[i].libraries[h].data.hasOwnProperty('file_name')) {
                        libfiles[ data.metadata.samples[i].libraries[h].data.file_name.value ] = true;
                    }
                    if (data.metadata.samples[i].libraries[h].data.hasOwnProperty('metagenome_name')) {
                        libnames[ data.metadata.samples[i].libraries[h].data.metagenome_name.value ] = true;
                    }
                }
            }
            
            // check files
            for (var i=0; i<widget.selectedSequenceFiles.length; i++) {
                var has_file = false;
                var f = widget.selectedSequenceFiles[i].name;
                if (libfiles[f]) {
                    has_file = true;
                }
                if (libnames[f.substr(0, f.lastIndexOf("."))]) {
                    has_file = true;
                }
                if (has_file == false) {
                    errors.push('No library matching sequence file '+f);
                }
            }

		    if (errors.length) {
			    errors.push("You need to verify that either the metagenome_name field matches the sequence filename without the suffix or the file_name field is identical to the file name of the selected sequence file.\n");
		    }

		    if (widget.selectedSequenceFiles.length > numlibs) {
			    errors.push('There are more files selected than entries in the metadata spreadsheet.');
		    }

		    // check project name
		    if (widget.selectedProject.name !== data.metadata.data.project_name.value) {
			    errors.push("The project name in the metadata is "+data.metadata.data.project_name.value+" and the one selected in section 2 is "+widget.selectedProject.name);
		    }
		    
		    if (errors.length) {
			    alert("There were inconsistencies in your metadata:\n\n"+errors.join("\n")+"\n\nYou must correct these errors before you can perform the submission.");
			    document.getElementById('submit_job_waiting').style.display = "none";
			    document.getElementById('submit_job_button').style.display = "";
		    } else {
		        if (widget.selectedSequenceFiles.length < numlibs) {
    			    var response = confirm('Warning:\nThere are fewer files selected than entries in the metadata spreadsheet.\nThe exta metadata entries will be ignored.\nPress OK to continue with submission.');
    			    if (response == true) {
    			        widget.submit_job(true);
    			    }
    		    } else {
			        widget.submit_job(true);
		        }
		    }
		},
		error: function(jqXHR, error){
		    alert('could not validate metadata');
		    document.getElementById('submit_job_waiting').style.display = "none";
		    document.getElementById('submit_job_button').style.display = "";
		},
		crossDomain: true,
		headers: stm.authHeader,
		type: "POST"
	    });
	    return;
	}
	document.getElementById('submit_job_waiting').style.display = "none";
	document.getElementById('submit_job_button').style.display = "";

	// get all the parameters
	var files = [];
	for (var i=0; i<widget.selectedSequenceFiles.length; i++) {
	    files.push(widget.selectedSequenceFiles[i].id);
	}
	var priority = "never";
	if (document.getElementById('priorityOption1').checked) {
	    priority = "immediately";
	} else if (document.getElementById('priorityOption2').checked) {
	    priority = "3months";
	} else if (document.getElementById('priorityOption3').checked) {
	    priority = "6months";
	} else if (document.getElementById('priorityOption4').checked) {
	    priority = "date";
	}
	var screen = document.getElementById('screening');
	screen = screen.options[screen.selectedIndex].value == "none" ? null : screen.options[screen.selectedIndex].value;

	// do the post request
	var url = RetinaConfig.mgrast_api + "/submission/submit";
	var data = { "priority": priority,
		    "seq_files": files,
		    "metadata_file": widget.selectedMetadata == "none" ? null : widget.selectedMetadata,
		    "project_name": widget.selectedProject.name,
		    "project_id": widget.selectedProject.id,
		    "assembled": document.getElementById('assembled').checked ? 1 : 0,
		    "bowtie": screen == null ? 0 : 1,
		    "screen_indexes": screen,
		    "dereplicate": document.getElementById('dereplication').checked ? 1 : 0,

		    // fastq
		    "dynamic_trim": document.getElementById('dynamic_trim') ? (document.getElementById('dynamic_trim').checked ? 1 : 0) : null,
		    "min_qual": document.getElementById('min_qual') ? document.getElementById('min_qual').value : null,
		    "max_lqb": document.getElementById('max_lqb') ? document.getElementById('max_lqb').value : null,

		    // fasta
		    "filter_ln": document.getElementById('filter_ln') ? (document.getElementById('filter_ln').checked ? 1 : 0) : null,
		    "filter_ln_mult": document.getElementById('deviation') ? document.getElementById('deviation').value : null,
		    "filter_ambig": document.getElementById('filter_ambig') ? (document.getElementById('filter_ambig').checked ? 1 : 0) : null,
		    "max_ambig": document.getElementById('max_ambig') ? document.getElementById('max_ambig').value : null,
		   };
	document.getElementById('submit_job_button').setAttribute('disabled', 'disabled');
	jQuery.ajax(url, {
	    data: JSON.stringify(data),
	    success: function(data){
		    document.getElementById('submit_job_button').removeAttribute('disabled');	
		    if (data.hasOwnProperty('info')) {
		        alert('Your job was submitted successfully. You are being forwarded to the status page that allows you to monitor it\'s progress.');
		        window.location = "?mgpage=pipeline";
		    } else {
		        alert("There was an error with your submission:\n"+data.ERROR);
		    }
	    },
	    error: function(jqXHR, error){
	        var response = jQuery.parseJSON(jqXHR.responseText);
	        if (response.hasOwnProperty('ERROR')) {
	            alert("There was an error with your submission:\n"+response.ERROR);
            } else {
		        alert('There was a technichal error with you submission');
	        }
		    console.log(error);
		    console.log(jqXHR);
	    },
	    crossDomain: true,
	    headers: stm.authHeader,
	    type: "POST"
	});
    };
})();
