(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome search API Widget",
                name: "metagenome_searchapi",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ ];
    };

    widget.examples = [ { "text": "10 marine samples, salt water", "offset": "0", "direction": "asc", "limit": "10", "order": "created_on", "filters": [{"field":"biome","text":"marine"},{"field":"material","text":"saline"}] },
			{ "text": "5 marine samples from the U.S.", "offset": "0", "direction": "asc", "limit": "5", "order": "created_on", "filters": [{"field":"country","text":"usa"}] },
			{ "text": "10 human microbiome samples", "offset": "0", "direction": "asc", "limit": "10", "order": "created_on", "filters": [{"field":"project_name","text":"hmp"}] },
			{ "text": "10 samples from animal gut", "offset": "0", "direction": "asc", "limit": "10", "order": "created_on", "filters": [{"field":"all","text":"gut"},{"field":"biome","text":"animal"}] },
			{ "text": "Get samples from a city (e.g. Chicago)", "offset": "0", "direction": "asc", "limit": "5", "order": "created_on", "filters": [{"field":"location","text":"chicago"}] },
			{ "text": "Get samples from a PI (e.g. Noah Fierer)", "offset": "0", "direction": "asc", "limit": "5", "order": "created_on", "filters": [{"field":"PI_firstname","text":"noah"},{"field":"PI_lastname","text":"fierer"}] },
			{ "text": "Get all samples from a specific class e.g. building", "offset": "0", "direction": "asc", "limit": "25", "order": "created_on", "filters": [{"field":"feature","text":"building"}] } ];

    widget.filters = [];
    
    widget.display = function (params) {
        widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;
	
	sidebar.parentNode.style.display = "none";
	content.className = "span10 offset1";
	
	document.getElementById("pageTitle").innerHTML = "search API explorer";
		
	var html = ["<div class='pull-right' style='width: 300px; border: 1px solid gray; padding: 10px; border-radius: 5px; margin-left: 10px; box-shadow: 5px 5px 10px;'><h4 style='margin-top: 0px;'>examples</h4><table class='table table-hover table-condensed'>"];

	for (var i=0; i<widget.examples.length; i++) {
	    html.push('<tr><td onclick="Retina.WidgetInstances.metagenome_searchapi[1].example('+i+');" style="cursor: pointer;'+(i==0 ? ' border-top: none;':'')+'">'+widget.examples[i].text+'</td></tr>');
	}
	
	html.push("</table></div>");

	html.push("<h1 style='font-weight: 300;'>MG-RAST search API explorer</h1><p>The MG-RAST search API provides access to all public and all private datasets you have permissions for. It contains metadata about studies and datasets including the required identifiers to access data products through the <a href='mgmain.html?mgpage=api'>other API resources</a>. This page will guide you through some common use-cases to better understand how to utilize the programmatic interface to our search data.</p><p>All functionality here is available via a front-end on the <a href='mgmain.html?mgpage=search'>search page</a>.</p>");

	if (stm.user) {
	    html.push('<p>You are logged in and your webkey is appended to each query automatically. This is needed to access your private data. To access your current webkey type "webkey" into the search box in the header and press enter.</p>');
	} else {
	    html.push('<p>You are not logged in and do not have access to private data. Use the <b>login</b> button at the top right of the page to log in.</p><p>If you do not yet have an account, obtain one by clicking the <b>register</b> button next to the login button.</p>');
	}

	html.push('<h3>Try it!</h3><p>Adjust the <b>options</b> and <b>filter fields</b> below to see how the HTML and cURL queries change. Click the <b>search</b> button to view the result from the API.</p>');

	html.push('<div style="text-align: center; margin-top: 25px;"><button class="btn btn-large btn-success" onclick="Retina.WidgetInstances.metagenome_searchapi[1].executeSearch();">search</button></div>');

	html.push('<h4 style="margin-top: 25px;">HTML query</h4><div style="margin-top: 25px;"><pre id="searchtext"></pre></div>');

	html.push('<h4 style="margin-top: 25px;">cURL query</h4><div style="margin-top: 25px; margin-bottom: 25px;"><pre id="curltext"></pre></div>');
	
	// options
	html.push('<div style="margin-top: 25px;"><h4>options</h4>');

	// limit
	html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">maximum number of datasets</span><select id="limit" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();" style="width: 60px;"><option>1</option><option>5</option><option>10</option><option>25</option></select></div>');

	// offset
	html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">number of first dataset</span><select id="offset" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();" style="width: 60px;"><option>0</option><option>5</option><option>10</option><option>25</option></select></div>');

	// direction
	html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">sort direction</span><select id="direction" style="width: 80px;" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();"><option>asc</option><option>desc</option></select></div>');

	// order
	html.push('<div class="input-prepend"><span class="add-on">order field</span><select id="order" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();">'+widget.fieldOptions()+'</select></div>');
	
	html.push('</div>');

	// filter fields
	html.push('<div style="margin-top: 25px;"><h4>filter fields</h4>');
	html.push('<div class="input-prepend input-append"><select id="filter">'+widget.fieldOptions()+'</select><input type="text" id="filtertext"><button class="btn" onclick="Retina.WidgetInstances.metagenome_searchapi[1].addFilter();">add</button></div>');
	html.push('<div style="clear: both;"></div><div id="activeFilters"></div>');
	html.push('</div>');
	
	html.push('<div style="clear: both;"></div><h4 style=" margin-top: 25px;">result from API</h4>');
	
	html.push('<div><pre id="searchresult" style="border-color: green;">- no request sent -</pre></div>');
	
	content.innerHTML = html.join('');

	widget.updateTexts();
    };

    widget.updateTexts = function () {
	var widget = this;

	var url = "http://api.metagenomics.anl.gov/search";
	var auth = stm.user ? 'auth='+stm.user.token+'&' : '';
	var authHeader = stm.user ? '-H "Authorization: mgrast '+stm.user.token+'" ' : '';
	var offset = document.getElementById('offset').options[document.getElementById('offset').selectedIndex].value;
	var limit = document.getElementById('limit').options[document.getElementById('limit').selectedIndex].value;
	var direction = document.getElementById('direction').options[document.getElementById('direction').selectedIndex].value;
	var order = document.getElementById('order').options[document.getElementById('order').selectedIndex].value;

	widget.searchtext = url + "?" + auth + 'offset='+offset+'&limit='+limit+'&order='+order+'&direction='+direction;
	widget.curltext = 'curl '+authHeader+'-F "offset='+offset+'"'+' -F "limit='+limit+'"'+' -F "order='+order+'"'+' -F "direction='+direction+'" ';
	
	for (var i=0; i<widget.filters.length; i++) {
	    widget.searchtext += "&" + widget.filters[i].field + "=" + widget.filters[i].text;
	    widget.curltext += '-F "'+widget.filters[i].field+'='+widget.filters[i].text+'" ';
	}

	widget.curltext += '"'+url+'"';

	document.getElementById('searchtext').innerHTML = widget.searchtext;
	document.getElementById('curltext').innerHTML = widget.curltext;
    };

    widget.executeSearch = function () {
	var widget = this;

	document.getElementById('searchresult').innerHTML = '<div style="text-align: center;"><img src="Retina/images/waiting.gif" style="width: 24px;"></div>';

	jQuery.ajax({
	    dataType: "json",
	    url: widget.searchtext,
	    success: function (d) {
		var widget = Retina.WidgetInstances.metagenome_searchapi[1];
		document.getElementById('searchresult').innerHTML = JSON.stringify(d, null, 2);
	    }
	});
    };

    widget.example = function (index) {
	var widget = this;

	var ex = widget.examples[index];
	console.log(ex);
	var offset = document.getElementById('offset');
	for (var i=0; i<offset.options.length; i++) {
	    if (offset.options[i].value == ex.offset) {
		offset.selectedIndex = i;
		break;
	    }
	}
	var limit = document.getElementById('limit');
	for (var i=0; i<limit.options.length; i++) {
	    if (limit.options[i].value == ex.limit) {
		limit.selectedIndex = i;
		break;
	    }
	}
	var direction = document.getElementById('direction');
	for (var i=0; i<direction.options.length; i++) {
	    if (direction.options[i].value == ex.direction) {
		direction.selectedIndex = i;
		break;
	    }
	}
	var order = document.getElementById('order');
	for (var i=0; i<order.options.length; i++) {
	    if (order.options[i].value == ex.order) {
		order.selectedIndex = i;
		break;
	    }
	}
	
	widget.filters = jQuery.extend(true, [], ex.filters);

	widget.updateFilters();
	widget.executeSearch();
    };

    widget.addFilter = function () {
	var widget = this;

	widget.filters.push( { "field": document.getElementById('filter').options[document.getElementById('filter').selectedIndex].value, "text": document.getElementById('filtertext').value } );

	widget.updateFilters();
    };

    widget.removeFilter = function (index) {
	var widget = this;

	widget.filters.splice(index, 1);

	widget.updateFilters();
    };

    widget.updateFilters = function () {
	var widget = this;

	var html = [];

	for (var i=0; i<widget.filters.length; i++) {
	    var f = widget.filters[i];
	    html.push('<div style="padding: 5px; border: 1px solid gray; border-radius: 5px; cursor: pointer; margin-bottom: 3px; margin-right: 5px; float: left;" title="click to remove" onclick="Retina.WidgetInstances.metagenome_searchapi[1].removeFilter('+i+');">'+f.field+' - '+f.text+' &times;</div>');
	}

	document.getElementById('activeFilters').innerHTML = html.join('');

	widget.updateTexts();
    };

    widget.fieldOptions = function () {
	var widget = this;

	var retval = [];
	for (var i=0; i<widget.keylist.length; i++) {
	    retval.push('<optgroup label="'+widget.keylist[i].name+'">');
	    for (var h=0; h<widget.keylist[i].items.length; h++) {
		retval.push('<option>'+widget.keylist[i].items[h].name+'</option>');
	    }
	    retval.push('</optgroup>');
	}
	return retval.join('');
    };

    widget.keylist = [
	{ "name": "Project",
	  "items": [
	      { "name": "created_on", "value": "created", "selected": true },
	      { "name": "PI_firstname", "value": "PI firstname" },
	      { "name": "PI_lastname", "value": "PI lastname" },
	      { "name": "PI_organization", "value": "PI organization" },
	      { "name": "PI_organization_country", "value": "PI org country" },
	      { "name": "project_funding", "value": "funding" },
	      { "name": "project_name", "value": "study", "selected": true },
	      { "name": "library_name", "value": "library" },
	      { "name": "sample_name", "value": "sample" },
	      { "name": "name", "value": "dataset", "selected": true },
	      { "name": "sequence_type", "value": "seq type", "selected": true },
	      { "name": "seq_method", "value": "seq method" },
	      { "name": "public", "value": "public" },
	      { "name": "mixs_compliant", "value": "MiXS" },
	  ] },
	{ "name": "Environment",
	  "items": [
	      { "name": "feature", "value": "feature" },
	      { "name": "material", "value": "material" },
	      { "name": "biome", "value": "biome", "selected": true },
	      { "name": "env_package_name", "value": "env package name" },
	      { "name": "env_package_type", "value": "env package type" },
	      { "name": "investigation_type", "value": "investigation type" },
	      { "name": "target_gene", "value": "target gene" },
	      { "name": "mrna_percent", "value": "mrna percent" },
	      { "name": "latitude", "value": "latitude" },
	      { "name": "longitude", "value": "longitude" },
	      { "name": "depth", "value": "depth" },
	      { "name": "elevation", "value": "elevation" },
	      { "name": "altitude", "value": "altitude" },
	      { "name": "temperature", "value": "temperature" },
	      { "name": "country", "value": "country", "selected": true },
	      { "name": "continent", "value": "continent" },
	      { "name": "location", "value": "location", "selected": true },
	      { "name": "collection_date", "value": "collection date" }
	  ] },
	{ "name": "IDs",
	  "items": [
	      { "name": "job_id", "value": "job id" },
	      { "name": "project_id", "value": "project id" },
	      { "name": "sample_id", "value": "sample id" },
	      { "name": "library_id", "value": "library id" },
	      { "name": "metagenome_id", "value": "metagenome id" },
	      { "name": "pubmed_id", "value": "pubmed id" },
	      { "name": "gold_id", "value": "gold id" },
	      { "name": "ebi_id", "value": "ebi id" },
	      { "name": "ncbi_id", "value": "ncbi id" },
	      { "name": "greengenes_id", "value": "greengenes id" },	      
	      { "name": "version", "value": "version" }
	  ] },
	{ "name": "Statistics",
	  "items": [
	      { "name": "sequence_count_raw", "value": "sequence count" },
	      { "name": "drisee_score_raw", "value": "drisee score" },
	      { "name": "bp_count_raw", "value": "bp count" },
	      { "name": "average_gc_ratio_raw", "value": "gc ratio" },
	      { "name": "alpha_diversity_shannon", "value": "alpha diversity" },
	      { "name": "average_length_raw", "value": "average length" }
	  ]
	},
	{ "name": "Pipeline Parameters",
	  "items": [
	      { "name": "fgs_type", "value": "fgs type" },
	      { "name": "m5nr_sims_version", "value": "m5nr sims version" },
	      { "name": "rna_pid", "value": "rna pid" },
	      { "name": "m5rna_annotation_version", "value": "m5rna annotation version" },
	      { "name": "pipeline_version", "value": "pipeline version" },
	      { "name": "file_type", "value": "file type" },
	      { "name": "aa_pid", "value": "aa pid" },
	      { "name": "priority", "value": "priority" },
	      { "name": "dereplicate", "value": "dereplicate" },
	      { "name": "bowtie", "value": "bowtie" },
	      { "name": "filter_ln", "value": "filter ln" },
	      { "name": "filter_ln_mult", "value": "filter ln mult" },
	      { "name": "screen_indexes", "value": "screen indexes" },
	      { "name": "assembled", "value": "assembled" },
	      { "name": "m5rna_sims_version", "value": "m5rna sims version" },
	      { "name": "filter_ambig", "value": "filter ambig" },
	      { "name": "max_ambig", "value": "max ambig" },
	      { "name": "m5nr_annotation_version", "value": "m5nr annotation version" },
	      { "name": "prefix_length", "value": "prefix length" }
	  ]
	}
    ];
})();
