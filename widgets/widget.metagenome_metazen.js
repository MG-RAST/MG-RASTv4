(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Metadata Wizard Widget",
                name: "metagenome_metazen",
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

	if (! stm.user) {
	    content.innerHTML = "<div class='alert alert-info'>You need to be logged in to use this page</div>";
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
<dt>sample set</dt><dd>a group of samples sharing the same library and environmental characteristics</lidd';
	sidehtml += '</dl>';

	sidebar.innerHTML = sidehtml;

	// title
	var html = '<h3>What does MetaZen do?</h3>\
<p>Metadata (or data about the data) has become a necessity as the community generates large quantities of data sets.</p>\
<p>Using community generated questionnaires we capture this metadata. MG-RAST has implemented the use of <a target="_blank" href="http://gensc.org/gc_wiki/index.php/MIxS">Minimum Information about any (X) Sequence</a> developed by the <a target="_blank" href="http://gensc.org">Genomic Standards Consortium</a> (GSC).</p>\
<p>The best form to capture metadata is via a simple spreadsheet with 12 mandatory terms. This tool is designed to help you fill out your metadata spreadsheet. The metadata you provide, helps us to analyze your data more accurately and helps make MG-RAST a more useful resource.</p>\
<p>This tool will help you get started on completing your metadata spreadsheet by filling in any information that is common across all of your samples and/or libraries. This tool currently only allows users to enter one environmental package for your samples and all samples must have been sequenced by the same number of sequencing technologies with the same number of replicates. This information is entered in tab #2 below. If your project deviates from this convention, you must either produce multiple separate metadata spreadsheets or generate your spreadsheet and then edit the appropriate fields manually.</p>';

	html += "<h4>Prefill Form</h4><p>To prefill the project tab with information from a previous project, enter an existing project name into the text field and click the 'prefill form' button.</p><div class='input-append'><input type='text' id='projectname' style='width: 100%;'><button class='btn' onclick='Retina.WidgetInstances.metagenome_metazen[1].prefillForm();'>prefill form</button></div>";

	// start accordion
	html += "<form class='form-horizontal' onsubmit='return false;'>";
	
	html += '<div class="accordion" id="accordion" style="margin-top: 20px;">';
	
	html += widget.newAccordion({ "id": "project", "title": "1. enter project information", "content": widget.formProject() });

	html += widget.newAccordion({ "id": "sampleset", "title": "2. enter sample set information", "content": widget.formSampleSet() });

	html += widget.newAccordion({ "id": "environment", "title": "3. enter environment information", "content": widget.formEnvironment() });
	
	html += widget.newAccordion({ "id": "sample", "title": "4. enter sample information", "content": widget.formSample() });

	html += "</div></form>";

	content.innerHTML = html;

	widget.getProjects();
    };

    widget.formProject = function () {
	var widget = this;

	var html = "<p>Please enter your contact information below. It is important that the PI and technical contact information (if different than the PI) is entered so that if a technical contact is no longer available, the PI can still gain access to their data. Note that selecting 'other' under 'Project Funding' enables an additional text field where you can type in your funding source.</p><p>Required project fields are marked in red and must be entered.</p>";

	html += widget.newSection( { "title": "Principal Investigator (PI) Information",
				    "fields": [
					{ "label": "PI e-mail", "id": "project_PI_email", "help": "Administrative contact email", "mandatory": true, "type": "email" },
					{ "label": "PI First Name", "id": "project_PI_firstname", "help": "Administrative contact first name", "mandatory": true, "type": "text" },
					{ "label": "PI Last Name", "id": "project_PI_lastname", "help": "Administrative contact last name", "mandatory": true, "type": "text" },
					{ "label": "PI Organization", "id": "project_PI_organization", "help": "Administrative contact organization", "mandatory": true, "type": "text" },
					{ "label": "PI Org Address", "id": "project_PI_oragnization_address", "help": "Administrative contact address", "mandatory": true, "type": "text" },
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
					{ "label": "Organization Address", "id": "project_oragnization_address", "help": "Technical contact address", "mandatory": false, "type": "text" },
					{ "label": "Organization Country", "id": "project_organization_country", "help": "Technical contact country. Country names should be chosen from the INSDC country list: http://insdc.org/country.html", "mandatory": false, "type": "cv", "cv": "country" },
					{ "label": "Organization URL", "id": "project_organization_url", "help": "Technical contact organization url", "mandatory": false, "type": "url" }
				    ] } );

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
				     "title": "Project Information",
				     "fields": [
					 { "label": "Project Name", "id": "project_project_name", "help": "Name of the project within which the sequencing was organized", "mandatory": true, "type": "text" },
					 { "label": "Project Funding", "id": "project_project_funding", "help": "Funding source of the project", "mandatory": false, "type": "cv", "cv": "funding" },
					 { "label": "Project Description", "id": "project_project_description", "help": "Description of the project within which the sequencing was organized", "mandatory": false, "type": "longtext" },
				     ] } );

	html += widget.newSection( { "title": "Other project information",
				     "description": "Below you can enter other project information about your dataset for which their may not be an input field. (e.g. contact phone number)",
				     "fields": [
					 { "label": "Miscellaneous Param 1", "id": "project_misc_param_1", "help": "any other measurement performed or parameter collected, that is not otherwise listed", "mandatory": false, "type": "text" }
				     ] } );

	html += "<div style='clear: both;'>add misc param</div>";

	return html;
    };

    widget.formSampleSet = function () {
	var widget = this;

	var html = "<p></p>";

	return html;
    };

    widget.formEnvironment = function () {
	var widget = this;

	var html = "<p></p>";

	return html;
    };

    widget.formSample = function () {
	var widget = this;

	var html = "<p></p>";

	return html;
    };

    widget.prefillForm = function () {
	var widget = this;
    };
    
    widget.newAccordion = function (params) {
	var widget = this;

	var html = "<div class='accordion-group' style='border: none;'><div class='accordion-heading stage'><a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion' href='#"+params.id+"' id='"+params.id+"Header'>"+params.title+"</a></div><div id='"+params.id+"' class='accordion-body collapse'>"+params.content+"<div style='margin-bottom: 20px;'></div></div></div>";

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
<div class="control-group'+(params.mandatory ? " error" : "")+'">\
  <label class="control-label" for="'+params.id+'">'+params.label+'<sup style="cursor: help;" data-content="'+params.help+'" onmouseover="$(this).popover(\'show\');" onmouseout="$(this).popover(\'hide\');">[?]</sup></label>\
  <div class="controls">\
<input type="text" id="'+params.id+'">\
  </div>\
</div>';

	return html;
    };

    widget.getProjects = function() {
	var widget = this;

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
})();