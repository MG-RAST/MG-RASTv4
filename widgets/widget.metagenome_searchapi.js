(function() {
    widget = Retina.Widget.extend({
        about: {
            title: "Metagenome search API Widget",
            name: "metagenome_searchapi",
            author: "Tobias Paczian",
            requires: []
        }
    });

    widget.setup = function() {
        return [];
    };

    widget.examples = [{
        "text": "10 marine samples, salt water",
        "direction": "asc",
        "limit": "10",
        "order": "created_on",
        "public": "yes",
        "filters": [{
            "field": "biome",
            "text": "marine"
        }, {
            "field": "material",
            "text": "saline"
        }]
    }, {
        "text": "5 marine samples from the U.S.",
        "direction": "asc",
        "limit": "5",
        "order": "created_on",
        "public": "yes",
        "filters": [{
            "field": "country",
            "text": "usa"
        }, {
            "field": "biome",
            "text": "marine"
        }]
    }, {
        "text": "10 human microbiome samples",
        "direction": "asc",
        "limit": "10",
        "order": "created_on",
        "public": "yes",
        "filters": [{
            "field": "project_name",
            "text": "hmp"
        }]
    }, {
        "text": "10 human microbiome samples over 1GB sorted by size",
        "direction": "asc",
        "limit": "10",
        "order": "size",
        "public": "yes",
        "filters": [{
            "field": "project_name",
            "text": "hmp"
        }, {
            "field": "bp_count_raw",
            "text": "[1000000000 TO *]"
        }]
    }, {
        "text": "10 meta-transcriptomes from uk, france, italy, germany and spain",
        "direction": "asc",
        "limit": "10",
        "order": "created_on",
        "public": "yes",
        "filters": [{
            "field": "sequence_type",
            "text": "mt"
        }, {
            "field": "country",
            "text": "uk OR france OR italy OR germany OR spain"
        }]
    }, {
        "text": "10 samples from animal gut",
        "direction": "asc",
        "limit": "10",
        "order": "created_on",
        "public": "yes",
        "filters": [{
            "field": "all",
            "text": "gut"
        }, {
            "field": "biome",
            "text": "animal"
        }]
    }, {
        "text": "Get samples from a city (e.g. Chicago)",
        "direction": "asc",
        "limit": "5",
        "order": "created_on",
        "public": "yes",
        "filters": [{
            "field": "location",
            "text": "chicago"
        }]
    }, {
        "text": "Get samples from a PI (e.g. Noah Fierer)",
        "direction": "asc",
        "limit": "5",
        "order": "created_on",
        "public": "yes",
        "filters": [{
            "field": "PI_firstname",
            "text": "noah"
        }, {
            "field": "PI_lastname",
            "text": "fierer"
        }]
    }, {
        "text": "Get all samples from a specific class e.g. building",
        "direction": "asc",
        "limit": "25",
        "order": "created_on",
        "public": "yes",
        "filters": [{
            "field": "feature",
            "text": "building"
        }]
    }];

    widget.filters = [];

    widget.display = function(params) {
        widget = this;
        var index = widget.index;

        if (params && params.main) {
            widget.main = params.main;
            widget.sidebar = params.sidebar;
        }
        var content = widget.main;
        var sidebar = widget.sidebar;

        sidebar.parentNode.style.display = "none";
        document.getElementById("pageTitle").innerHTML = "search API explorer";

        var html = [];
        content.className = "";

        html.push("<div class='span8' style='margin-left: 70px;'><h1 style='font-weight: 300;'>MG-RAST search API explorer</h1><p>The MG-RAST search API provides access to all public and all private datasets you have permissions for. It contains metadata about studies and datasets including the required identifiers to access data products through the <a href='mgmain.html?mgpage=api'>other API resources</a>. This page will guide you through some common use-cases to better understand how to utilize the programmatic interface to our search data.</p><p>The complete set of functions is also available on the <a href='mgmain.html?mgpage=search'>search page</a>.</p>");

        if (stm.user) {
            html.push('<p>You are logged in and your webkey is appended to each query automatically. This is needed to access your private data. To access your current webkey type "webkey" into the search box in the header and press enter. You can disable the authentication by unchecking the box below. Data returned will only include public records then.</p><p style="text-align: center;"><input style="margin: 0px;" type="checkbox" id="useAuth" checked=checked onclick="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();"> use authentication in requests</p>');
        } else {
            html.push('<p>You are not logged in and do not have access to private data. Use the <b>login</b> button at the top right of the page to log in.</p><p>If you do not yet have an account, obtain one by clicking the <b>register</b> button next to the login button.</p>');
        }

        html.push('<h3>Try it!</h3><p>Adjust the <b>options</b> and <b>filter fields</b> below to see how the HTML and cURL queries change. Click the <b>search</b> button to view the API results.</p>');

        html.push('<h4 style="margin-top: 25px;">HTML query</h4><div style="margin-top: 25px;"><pre id="searchtext"></pre></div>');

        html.push('<h4 style="margin-top: 25px;">cURL query</h4><div style="margin-top: 25px; margin-bottom: 25px;"><pre id="curltext"></pre></div>');

        // options
        html.push('<div style="margin-top: 25px;"><h4>options</h4>');
        html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">maximum number of datasets</span><input type="text" value="5" id="limit" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();" style="width: 60px;"></div>');
        html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">sort direction</span><select id="direction" style="width: 80px;" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();"><option>asc</option><option>desc</option></select></div>');
        html.push('<div class="input-prepend"><span class="add-on">order field</span><select id="order" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();">' + widget.fieldOptions(true) + '</select></div>');
        html.push('</div>');

        // taxonomy
        html.push('<div style="margin-top: 25px;"><h4>taxonomy</h4>');
        html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">name</span><input type="text" value="" id="taxaname" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();" style="width: 80px;"></div>');
        html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">&percnt; abundance of</span><select id="taxaper" style="width: 60px;" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();>' + widget.annotationOptions('taxonomy') + '</select></div>');
        html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">level</span><select id="taxalevel" style="width: 60px;" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();>' + widget.annotationOptions('levels') + '</select></div>');
        html.push('</div>');
        
        // function
        html.push('<div style="margin-top: 25px;"><h4>function</h4>');
        html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">name</span><input type="text" value="" id="funcname" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();" style="width: 80px;"></div>');
        html.push('<div class="input-prepend" style="margin-right: 20px;"><span class="add-on">&percnt; abundance of</span><select id="funcper" style="width: 60px;" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();>' + widget.annotationOptions('function') + '</select></div>');
        html.push('</div>');

        // filter fields
        html.push('<div style="margin-top: 25px;"><h4>metadata fields</h4>');
        html.push('<div class="input-prepend input-append pull-left" style="margin-right: 20px;"><select id="filter">' + widget.fieldOptions(false) + '</select><input type="text" id="filtertext"><button class="btn" onclick="Retina.WidgetInstances.metagenome_searchapi[1].addFilter();">add</button></div>');
        // toggle public
        if (stm.user) {
            html.push('<div class="input-prepend"><span class="add-on" style="margin-right: 5px;">search public data</span><select id="public" style="width: 80px;" onchange="Retina.WidgetInstances.metagenome_searchapi[1].updateTexts();"><option>yes</option><option>no</option></select></div>');
        }
        html.push('<div style="clear: both;"></div><div id="activeFilters"></div>');
        html.push('</div>');

        html.push('<div style="text-align: center; margin-top: 25px;"><button class="btn btn-large btn-success" onclick="Retina.WidgetInstances.metagenome_searchapi[1].executeSearch();">search</button></div>');

        html.push('<div style="clear: both;"></div><h4 style=" margin-top: 25px;">result from API</h4>');

        html.push('<div><pre id="searchresult" style="border-color: green;">- no request sent -</pre></div></div>');

        // sidebar
        html.push("<div class='span3' style='border: 1px solid rgba(0,0,0,0.15); padding: 10px; border-radius: 5px; margin-left: 50px; box-shadow: 5px 5px 10px;'>");

        // help text
        html.push('<h4 style="margin-top: 0px;">advanced filters</h4><p>You can search for multiple terms by just space separating them, or for optional terms by using \'OR\' inbetween.<pre>clock (house OR mouse)</pre></p><p>To search for an exact match, put it in quotes. To exclude a term, prepend a -.<pre>"mickey mouse" -goofy</pre></p><p>You can search for ranges like this:<pre>[abc TO def]</pre></p><p>use * for an open range, e.g. to search for everything greater than 10 do this:<pre>[10 TO *]</pre></p>');

        // examples
        html.push("<h4 style='margin-top: 30px;'>examples <sup title='click to view' style='cursor: help;'>[?]</sup></h4><table class='table table-hover table-condensed'>");
        for (var i = 0; i < widget.examples.length; i++) {
            html.push('<tr><td onclick="Retina.WidgetInstances.metagenome_searchapi[1].example(' + i + ');" style="cursor: pointer;' + (i == 0 ? ' border-top: none;' : '') + '">' + widget.examples[i].text + '</td></tr>');
        }
        html.push('</table>');

        html.push('</div>');

        content.innerHTML = html.join('');

        widget.updateTexts();
    };

    widget.updateTexts = function() {
        var widget = this;

        var temp = RetinaConfig.mgrast_api + "/search";
        var url = temp.replace('-ui', '');
        var authHeader = '';
        var getpublic = 'true';
        if (stm.user && document.getElementById('useAuth').checked) {
            authHeader = '-H "Authorization: mgrast ' + stm.user.token + '"';
            getpublic = document.getElementById('public').options[document.getElementById('public').selectedIndex].value;
        }
        var limit = document.getElementById('limit').value;
        var direction = document.getElementById('direction').options[document.getElementById('direction').selectedIndex].value;
        var order = document.getElementById('order').options[document.getElementById('order').selectedIndex].value;
        
        var queries = [];
        var taxaname = document.getElementById('taxaname').value;
        if (taxaname != '') {
            queries.push(['taxonomy', taxaname]);
            var taxaper = document.getElementById('taxaper').options[document.getElementById('taxaper').selectedIndex].value;
            var taxalevel = document.getElementById('taxalevel').options[document.getElementById('taxalevel').selectedIndex].value;
            if (taxaper != 'none') {
                queries.push(['taxa_per', taxaper]);
                queries.push(['taxa_level', taxalevel]);
            }
        }
        var funcname = document.getElementById('funcname').value;
        if (funcname != '') {
            queries.push(['function', funcname]);
            var funcper = document.getElementById('funcper').options[document.getElementById('funcper').selectedIndex].value;
            if (funcper != 'none') {
                queries.push(['func_per', funcper]);
            }
        }
        
        widget.searchtext = url + '?limit=' + limit + '&order=' + order + '&direction=' + direction + '&public=' + getpublic;
        widget.curltext = 'curl ' + authHeader + ' -F "limit=' + limit + '"' + ' -F "order=' + order + '"' + ' -F "direction=' + direction + '"' + ' -F "public=' + getpublic + '" ';

        for (var i = 0; i < queries.length; i++) {
            widget.searchtext += "&" + widget.filters[i].field + "=" + widget.filters[i].text;
            widget.curltext += '-F "' + widget.filters[i].field + '=' + widget.filters[i].text + '" ';
        }
        for (var i = 0; i < widget.filters.length; i++) {
            widget.searchtext += "&" + queries[i][0] + "=" + queries[i][1];
            widget.curltext += '-F "' + queries[i][0] + '=' + queries[i][1] + '" ';
        }

        widget.curltext += '"' + url + '"';

        document.getElementById('searchtext').innerHTML = widget.searchtext;
        document.getElementById('curltext').innerHTML = widget.curltext;
    };

    widget.executeSearch = function() {
        var widget = this;
        var thisheader = (stm.user && document.getElementById('useAuth').checked) ? stm.authHeader : {};
        document.getElementById('searchresult').innerHTML = '<div style="text-align: center;"><img src="Retina/images/waiting.gif" style="width: 24px;"></div>';

        jQuery.ajax({
            dataType: "json",
            url: widget.searchtext,
            headers: thisheader,
            success: function(d) {
                var widget = Retina.WidgetInstances.metagenome_searchapi[1];
                document.getElementById('searchresult').innerHTML = JSON.stringify(d, null, 2);
            },
            error: function(error, xhr) {
                var widget = Retina.WidgetInstances.metagenome_searchapi[1];
                document.getElementById('searchresult').innerHTML = "You search could not be completed due to a server error.";
            }
        });
    };

    widget.example = function(index) {
        var widget = this;

        var ex = widget.examples[index];
        console.log(ex);
        var limit = document.getElementById('limit');
        limit.value = ex.limit

        var direction = document.getElementById('direction');
        for (var i = 0; i < direction.options.length; i++) {
            if (direction.options[i].value == ex.direction) {
                direction.selectedIndex = i;
                break;
            }
        }
        var order = document.getElementById('order');
        for (var i = 0; i < order.options.length; i++) {
            if (order.options[i].value == ex.order) {
                order.selectedIndex = i;
                break;
            }
        }
        if (stm.user) {
            var getpublic = document.getElementById('public');
            for (var i = 0; i < getpublic.options.length; i++) {
                if (getpublic.options[i].value == ex.public) {
                    getpublic.selectedIndex = i;
                    break;
                }
            }
        }
        
        widget.clearAnnotations();

        widget.filters = jQuery.extend(true, [], ex.filters);

        widget.updateFilters();
        widget.executeSearch();
    };

    widget.addFilter = function() {
        var widget = this;

        widget.filters.push({
            "field": document.getElementById('filter').options[document.getElementById('filter').selectedIndex].value,
            "text": document.getElementById('filtertext').value
        });

        widget.updateFilters();
    };

    widget.removeFilter = function(index) {
        var widget = this;

        widget.filters.splice(index, 1);

        widget.updateFilters();
    };

    widget.updateFilters = function() {
        var widget = this;

        var html = [];

        for (var i = 0; i < widget.filters.length; i++) {
            var f = widget.filters[i];
            html.push('<div style="padding: 5px; border: 1px solid gray; border-radius: 5px; cursor: pointer; margin-bottom: 3px; margin-right: 5px; float: left;" title="click to remove" onclick="Retina.WidgetInstances.metagenome_searchapi[1].removeFilter(' + i + ');">' + f.field + ' - ' + f.text + ' &times;</div>');
        }

        document.getElementById('activeFilters').innerHTML = html.join('');

        widget.updateTexts();
    };
    
    widget.clearAnnotations = function() {
        document.getElementById('taxaname').value = '';
        document.getElementById('funcname').value = '';
        document.getElementById('taxaper').selectedIndex = 0;
        document.getElementById('taxalevel').selectedIndex = 0;
        document.getElementById('funcper').selectedIndex = 0;
    }
    
    widget.annotationOptions = function(type) {
        var widget = this;
        var retval = (type eq 'levels') ? [] : ['<option value="none">none</option>'];
        for (var i = 0; i < widget.annotationInfo[type].length; i++) {
            retval.push('<option value="' + widget.annotationInfo[type][i] + '">' + widget.annotationInfo[type][i] + '</option>');
        }
        return retval.join('');
    }

    widget.fieldOptions = function(isorder) {
        var widget = this;
        var retval = [];
        for (var i = 0; i < widget.keylist.length; i++) {
            retval.push('<optgroup label="' + widget.keylist[i].name + '">');
            for (var h = 0; h < widget.keylist[i].items.length; h++) {
                if (isorder && widget.keylist[i].items[h].name.startsWith("all")) {
                    continue;
                }
                retval.push('<option value="' + widget.keylist[i].items[h].name + '">' + widget.keylist[i].items[h].value + '</option>');
            }
            retval.push('</optgroup>');
        }
        return retval.join('');
    };
    
    widget.annotationInfo = {
        "levels" : [
            "domain",
            "phylum",
            "class",
            "order",
            "family",
            "genus"
        ],
        "taxonomy" : [
	        "1",
	        "5",
	        "10",
	        "15",
	        "20",
	        "25"
        ],
        "function" : [
            "1",
            "3",
	        "5",
	        "10"
        ]
    };

    widget.keylist = [{
        "name": "Project",
        "items": [{
            "name": "created_on",
            "value": "created date",
            "selected": true
        }, {
            "name": "all",
            "value": "any field"
        }, {
            "name": "all_project",
            "value": "any project field"
        }, {
            "name": "PI_firstname",
            "value": "PI firstname"
        }, {
            "name": "PI_lastname",
            "value": "PI lastname"
        }, {
            "name": "PI_organization",
            "value": "PI organization"
        }, {
            "name": "PI_organization_country",
            "value": "PI org country"
        }, {
            "name": "firstname",
            "value": "submitter firstname"
        }, {
            "name": "lastname",
            "value": "submitter lastname"
        }, {
            "name": "organization",
            "value": "submitter organization"
        }, {
            "name": "organization_country",
            "value": "submitter org country"
        }, {
            "name": "project_funding",
            "value": "funding"
        }, {
            "name": "project_name",
            "value": "study name",
            "selected": true
        }, {
            "name": "sample_name",
            "value": "sample name"
        }, {
            "name": "env_package_name",
            "value": "env package name"
        }, {
            "name": "library_name",
            "value": "library name"
        }, {
            "name": "name",
            "value": "dataset name",
            "selected": true
        }, {
            "name": "sequence_type",
            "value": "sequence type",
            "selected": true
        }, {
            "name": "public",
            "value": "public"
        }, {
            "name": "mixs_compliant",
            "value": "MiXS"
        }, ]
    }, {
        "name": "Environment",
        "items": [{
            "name": "all_sample",
            "value": "any sample field"
        }, {
            "name": "all_env_package",
            "value": "any env package field"
        }, {
            "name": "all_library",
            "value": "any library field"
        }, {
            "name": "biome",
            "value": "biome",
            "selected": true
        }, {
            "name": "feature",
            "value": "feature"
        }, {
            "name": "material",
            "value": "material"
        }, {
            "name": "envo_label",
            "value": "envo label"
        }, {
            "name": "env_package",
            "value": "env package"
        }, {
            "name": "env_package_type",
            "value": "env package type"
        }, {
            "name": "investigation_type",
            "value": "library investigation type"
        }, {
            "name": "seq_meth",
            "value": "sequence method"
        }, {
            "name": "target_gene",
            "value": "target gene"
        }, {
            "name": "mrna_percent",
            "value": "mrna percent"
        }, {
            "name": "latitude",
            "value": "latitude"
        }, {
            "name": "longitude",
            "value": "longitude"
        }, {
            "name": "depth",
            "value": "depth"
        }, {
            "name": "elevation",
            "value": "elevation"
        }, {
            "name": "altitude",
            "value": "altitude"
        }, {
            "name": "temperature",
            "value": "temperature"
        }, {
            "name": "country",
            "value": "country",
            "selected": true
        }, {
            "name": "continent",
            "value": "continent"
        }, {
            "name": "location",
            "value": "location",
            "selected": true
        }, {
            "name": "collection_date",
            "value": "collection date"
        }, {
            "name": "ncbi_taxonomy_scientific_name",
            "value": "ncbi taxonomy scientific name"
        }, ]
    }, {
        "name": "IDs",
        "items": [{
            "name": "metagenome_id",
            "value": "metagenome id"
        }, {
            "name": "project_id",
            "value": "project id"
        }, {
            "name": "sample_id",
            "value": "sample id"
        }, {
            "name": "env_package_id",
            "value": "env package id"
        }, {
            "name": "library_id",
            "value": "library id"
        }, {
            "name": "job_id",
            "value": "job id"
        }, {
            "name": "biome_id",
            "value": "biome id"
        }, {
            "name": "feature_id",
            "value": "feature id"
        }, {
            "name": "material_id",
            "value": "material id"
        }, {
            "name": "envo_id",
            "value": "sample envo id"
        }, {
            "name": "ncbi_taxonomy_id",
            "value": "ncbi taxonomy id"
        }, {
            "name": "metagenome_taxonomy_id",
            "value": "metagenome taxonomy id"
        }, {
            "name": "ncbi_id",
            "value": "project ncbi id"
        }, {
            "name": "project_ebi_id",
            "value": "project ebi id"
        }, {
            "name": "sample_ebi_id",
            "value": "sample ebi id"
        }, {
            "name": "library_ebi_id",
            "value": "library ebi id"
        }, {
            "name": "pubmed_id",
            "value": "pubmed id"
        }, {
            "name": "gold_id",
            "value": "gold id"
        }, {
            "name": "greengenes_id",
            "value": "greengenes id"
        }, {
            "name": "version",
            "value": "version"
        }]
    }, {
        "name": "Statistics",
        "items": [{
            "name": "sequence_count_raw",
            "value": "sequence count"
        }, {
            "name": "drisee_score_raw",
            "value": "drisee score"
        }, {
            "name": "bp_count_raw",
            "value": "bp count"
        }, {
            "name": "average_gc_ratio_raw",
            "value": "gc ratio"
        }, {
            "name": "alpha_diversity_shannon",
            "value": "alpha diversity"
        }, {
            "name": "average_length_raw",
            "value": "average length"
        }]
    }, {
        "name": "Pipeline Parameters",
        "items": [{
            "name": "fgs_type",
            "value": "fgs type"
        }, {
            "name": "m5nr_sims_version",
            "value": "m5nr sims version"
        }, {
            "name": "rna_pid",
            "value": "rna pid"
        }, {
            "name": "m5rna_annotation_version",
            "value": "m5rna annotation version"
        }, {
            "name": "pipeline_version",
            "value": "pipeline version"
        }, {
            "name": "file_type",
            "value": "file type"
        }, {
            "name": "aa_pid",
            "value": "aa pid"
        }, {
            "name": "priority",
            "value": "priority"
        }, {
            "name": "dereplicate",
            "value": "dereplicate"
        }, {
            "name": "bowtie",
            "value": "bowtie"
        }, {
            "name": "filter_ln",
            "value": "filter ln"
        }, {
            "name": "filter_ln_mult",
            "value": "filter ln mult"
        }, {
            "name": "screen_indexes",
            "value": "screen indexes"
        }, {
            "name": "assembled",
            "value": "assembled"
        }, {
            "name": "m5rna_sims_version",
            "value": "m5rna sims version"
        }, {
            "name": "filter_ambig",
            "value": "filter ambig"
        }, {
            "name": "max_ambig",
            "value": "max ambig"
        }, {
            "name": "m5nr_annotation_version",
            "value": "m5nr annotation version"
        }, {
            "name": "prefix_length",
            "value": "prefix length"
        }]
    }];
})();
