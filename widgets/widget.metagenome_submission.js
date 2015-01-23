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
    
    widget.display = function (params) {
        var widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	// help text
	sidebar.setAttribute('style', 'padding: 10px;');
	var sidehtml = '<h3><span style="border: 3px solid black; margin-right: 10px; border-radius: 20px; font-size: 16px; padding-left: 8px; padding-right: 8px; position: relative; bottom: 3px;">i</span>submission information</h3><ul class="helplist"><li>all submitted data will stay private until the owner makes it public or shares it with another user.</li><li>providing metadata is required to make your data public and will increase your priority in the queue.</li><li>the sooner you choose to make your data public, the higher your priority in the queue will be</li></ul>';

	sidebar.innerHTML = sidehtml;

	// title
	var html = "<div class='btn-group' data-toggle='buttons-checkbox' style='margin-bottom: 20px;'><a href='?mgpage=upload' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/upload.png'>upload data</a><a href='?mgpage=submission' class='btn btn-large active' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>perform submission</a><a href='?mgpage=pipeline' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a></div>";

	// create a new project
	html += "<form class='form-horizontal' onsubmit='return false;'>";

	html += '<div class="accordion" id="accordion">';

	html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#metadata'>1. select metadata file</a></div><div id='metadata' class='accordion-body collapse in'></div></div>";

	html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#project'>2. select project</a></div><div id='project' class='accordion-body collapse'></div></div>";

	html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#files'>3. select sequence file(s)</a></div><div id='files' class='accordion-body collapse'></div></div>";

	html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#options'>4. choose pipeline options</a></div><div id='options' class='accordion-body collapse'></div></div>";

	html += "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#submit'>5. submit</a></div><div id='submit' class='accordion-body collapse'></div></div>";
	
	html += "</div></form>";

	html += "<button class='btn' onclick='if(this.fasta){Retina.WidgetInstances.metagenome_submission[1].displayOptions(\"fastq\");this.fasta=false;}else{Retina.WidgetInstances.metagenome_submission[1].displayOptions(\"fasta\");this.fasta=true;}'>fastq / fasta</button>";

	content.innerHTML = html;

	widget.displayProjectSelect();
	widget.displayMetadataSelect();
	widget.displayFileSelect();
	widget.displayOptions('fastq');
	widget.displaySubmit();

	widget.checkInbox();

	if (! widget.user) {
	    content.innerHTML = "<div class='alert alert-info' style='width: 500px;'>You must be logged in to submit to the pipeline.</div>";
	}
    };

    // DATA QUERY METHODS
    widget.checkInbox = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];

	if (widget.user) {
	    jQuery.ajax( { dataType: "json",
			   url: RetinaConfig['mgrast_api'] + "/project?private=1&edit=1&limit=0",
			   headers: widget.authHeader,
			   success: function(data) {
			       var plist = [];
			       for (var i=0; i<data.data.length; i++) {
				   plist.push(data.data[i].name);
			       }
			       jQuery("#projectname").typeahead({source: plist, minLength: 0});
			   },
			   error: function () {
			       alert('there was an error accessing the api');
			   }
			 } );
	}
    };

    // DISPLAY METHODS FOR THE STEPS
    widget.displayProjectSelect = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	var target = document.getElementById('project');

	var html = "<p>You have to specify a project to upload a job to MG-RAST. If you have a metadata file, the project must be specified in that file. If you choose to not use a metadata file, you can select a project here. You can either select an existing project or you can choose a new project.</p>";

	html += "<div class='input-append' style='margin-left: 20%; margin-top: 15px; margin-bottom: 15px;'><input type='text' name='projectname' placeholder='enter project name' autocomplete='off' data-provide='typeahead' data-source='[]' id='projectname' style='width: 400px;'><button class='btn'>select</button></div>";

	html += "<p>Note: The projects listed are those that you have write access to. The owners of other projects can provide you with write access if you do not have it.</p>";

	html += "<div style='height: 20px;'></div>";

	target.innerHTML = html;
    };

    widget.displayMetadataSelect = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	var target = document.getElementById('metadata');

	var html = '<div style="float: left;"><table><tbody><tr><td><select style="width: 420px; height: 200px;" multiple="" id="metadata_file_select"></select><br><p><input type="checkbox" onclick="if(this.checked){alert(\'INFO\\nNot submitting metadata will severely lower your priority in the computation queue.\\nYou will also not be able to make your data public until you provide metadata for it.\');document.getElementById(\'accept_metadata_selection\').onclick();}" id="no_metadata" name="no_metadata" value="no_metadata"> <span style="font-size: 12px; position: relative; top: 2px;">I do not want to supply metadata</span></p> <input type="button" onclick="select_metadata_file();" value="select" class="btn" id="accept_metadata_selection"></td><td><p style="margin-left: 20px;" id="metadata_file_info"></p></td></tr></tbody></table></div><div style="float: left; width: 50%;"><p>Select a spreadsheet with metadata for the project you want to submit.</p><p>In order to map sequence files to metadata libraries, the names of the sequence files must exactly match the library <i>file_name</i> fields or match the library <i>metagenome_name</i> fields minus the file extension.</p><p><b>Note: While metadata is not required at submission, the priority for processing data without metadata is lower.</b></p></div>';

	html += "<div style='height: 20px; clear: both;'></div>";

	target.innerHTML = html;
    };

    widget.displayFileSelect = function () {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	var target = document.getElementById('files');

	var html = "<p>Sequence files from your inbox will appear here. Please note, there is a delay between upload completion and appearing in this table due to sequence statistics calculations. This may be on the order of seconds to hours depending on file size.</p>";

	html += "<select name='inputfile' multiple style='margin-left: 30%;'><option>file1.fasta</option><option>file2.fasta</option><option>file3.fastq</option><option>file4.fastq</option></select>";

	html += "<div style='height: 20px;'></div>";

	target.innerHTML = html;
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
				   { "name": "dereplication",
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
	
	html += "<div style='height: 20px;'></div>";

	target.innerHTML = html;
    };

    widget.displaySubmit = function () {
	var html = '<p>Data will be private (only visible to the submitter) unless you choose to share it with other users or make it public. If you decide to make data public your data will be given priority for the computational queue.</p>\
\
<div class="control-group">\
<div class="controls">\
<label class="radio"><input type="radio" name="priorityOption" value="immediately" id="priorityOption1">Data will be publicly accessible <b> immediately </b> after processing completion - Highest Priority</label>\
<label class="radio"><input type="radio" name="priorityOption" value="3months" id="priorityOption2">Data will be publicly accessible <b>after 3 months</b> - High Priority</label>\
<label class="radio"><input type="radio" name="priorityOption" value="6months" id="priorityOption2">Data will be publicly accessible <b>after 6 months</b> - Medium Priority</label>\
<label class="radio"><input type="radio" name="priorityOption" value="date" id="priorityOption2">Data will be publicly accessible <b>eventually</b> - Lower Priority</label>\
<label class="radio"><input type="radio" name="priorityOption" value="never" checked="" id="priorityOption2"><b>Data will stay private </b> (DEFAULT) - Lowest Priority</label>\
</div>\
</div>\
<p>Please note that only private data can be deleted.</p>\
<div style="height:10px;" class="clear"></div>\
<div style="margin-bottom: 20px; text-align: center;"><input type="button" id="submit_job_button" disabled="" onclick="submit_job();" value="submit job" class="btn"><span style="margin-left: 20px;"><b>Note: You must complete all previous steps to enable submission.</b></span></div>\
<p>Upon successful submission, MG-RAST IDs ("Accession numbers") will be automatically assigned to your datasets and data files will be removed from your inbox.</p>';

	html += "<div style='height: 20px;'></div>";

	document.getElementById('submit').innerHTML = html;
    };

     // login widget sends an action (log-in or log-out)
    widget.loginAction = function (params) {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
	if (params.token) {
	    widget.user = params.user;
	    widget.authHeader = { "Auth": params.token };
	} else {
	    widget.user = null;
	    widget.authHeader = {};
	}
	widget.display();
    };
})();