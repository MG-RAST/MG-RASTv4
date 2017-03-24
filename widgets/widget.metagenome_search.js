(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Search Widget",
                name: "metagenome_search",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.query = "";
    widget.sort = "created";
    widget.sortDir = "desc";
    widget.offset = 0;
    widget.limit = 20;
    widget.match = "all";
    widget.total = 0;
    widget.advancedOptions = {};
    widget.selectedMetagenomes = {};
    widget.addingMetagenomes = false;
    widget.specialKeyMapping = { "created": "creation date",
				 "name": "metagenome name",
				 "seq_method": "sequencing method",
				 "job": "job id",
				 "id": "metagenome id" };
    widget.keylist = [ { "name": "Project",
			 "items": [ { "name": "PI_firstname", "value": "PI firstname" },
				    { "name": "PI_lastname", "value": "PI lastname" },
				    { "name": "project_name", "value": "project name" },
				    { "name": "library_name", "value": "library name" },
				    { "name": "sample_name", "value": "sample name" },
				    { "name": "created", "value": "creation date" },
				    { "name": "name", "value": "metagenome name" },
				    { "name": "sequence_type", "value": "sequence type" },
				    { "name": "seq_method", "value": "sequencing method" },
				    { "name": "status", "value": "status" }] },
		       { "name": "Environment",
			 "items": [ { "name": "feature", "value": "feature" },
				    { "name": "material", "value": "material" },
				    { "name": "biome", "value": "biome" },
				    { "name": "env_package_name", "value": "env package name" },
				    { "name": "env_package_type", "value": "env package type" },
				    { "name": "latitude", "value": "latitude" },
				    { "name": "longitude", "value": "longitude" },
				    { "name": "location", "value": "location" },
				    { "name": "country", "value": "country" },
				    { "name": "collection_date", "value": "collection date" } ] },
		       { "name": "IDs",
			 "items": [ { "name": "job", "value": "job id" },
				    { "name": "project_id", "value": "project id" },
				    { "name": "sample_id", "value": "sample id" },
				    { "name": "library_id", "value": "library id" },
				    { "name": "id", "value": "metagenome id" },
				    { "name": "version", "value": "version" } ] },
		     ];
    
    widget.display = function (params) {
        var widget = Retina.WidgetInstances.metagenome_search[1];
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	jQuery.extend(widget, params);

	document.getElementById("pageTitle").innerHTML = "search";
	
	// set the output area
	// search field
	var html = "\
<div>\
  <div style='margin-top: -5px; width: 300px; float: left;'>\
    <div class='input-append'>\
      <input type='text' id='searchtext' style='border-radius: 15px 0 0 15px;' placeholder='enter search term'>\
      <button class='btn' onclick='Retina.WidgetInstances.metagenome_search[1].queryAPI();' style='border-radius: 0 15px 15px 0;'>search</button>\
    </div>\
  </div>";

  // 	// option buttons
  // 	html += "\
  // <div style='width: 175px; float: left;'>\
  //   <div class='btn-group' data-toggle='buttons-radio'>\
  //     <button class='btn btn-mini active' data-toggle='button' id='metadata_button'>metadata</button>\
  //     <button class='btn btn-mini' data-toggle='button' id='function_button'>function</button>\
  //     <button class='btn btn-mini' data-toggle='button' id='organism_button'>organism</button>\
  //   </div>\
  // </div>";

	// result text
	html += "\
  <div style='font-size: 12px; float: left;' id='result_text'></div>\
</div>";

	// result section
	html += '<div style="position: absolute; opacity: 0.7; background-color: white; display: none; text-align: center; padding-top: 20%;" id="opaq"><img src="Retina/images/waiting.gif"></div>'
	html += "<div id='result' style='clear: both; min-height: 300px;'></div>";

	content.innerHTML = html;

	document.getElementById('searchtext').addEventListener('keypress', function (event) {
	    event = event || window.event;
	    
	    if (event.keyCode == 13) {
		Retina.WidgetInstances.metagenome_search[1].queryAPI();
	    }
	});

	// create the sidebar
	var html_sidebar = '\
<style>\
  .control-label {\
  float: left;\
  position: relative;\
  top: 4px;\
  width: 50px;\
  font-weight: bold;\
  }\
</style>\
<h4 style="margin-left: 10px;">\
  <img style="height: 16px; position: relative; bottom: 3px; margin-right: 10px;" src="Retina/images/filter.png">\
  Refine Search\
</h4>\
<div id="advanced_div" style="margin-left: 10px; margin-right: 10px;">\
  <p>Add a search term for a specific metadata field to refine your search. You can use the asterisk (*) symbol as a wildcard.</p>\
  <div class="control-group">\
    <label class="control-label" for="advanced_search_key">field</label>\
    <div class="controls">\
      <select id="advanced_search_key" style="width: 270px;"></select>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="advanced_search_value">term</label>\
    <div class="controls input-append">\
      <input type="text" id="advanced_search_value" placeholder="enter searchterm">\
      <button class="btn" onclick="Retina.WidgetInstances.metagenome_search[1].refineSearch(\'add\');">add</button>\
    </div>\
  </div>\
  <div id="refine_search_terms"></div>\
</div>\
<div style="clear: both;"></div>\
<ul class="nav nav-tabs" id="searchCollectionTab">\
<li class="active"><a style="margin-left: 10px;" href="#searches_tab">\
  <img style="height: 16px; position: relative; bottom: 3px; margin-right: 10px;" src="Retina/images/search.png">\
  Searches <sup style="color: gray; cursor: help;" id="storedresults">[?]</sup>\
</a></li>\
<li><a style="margin-left: 10px;" href="#collections_tab" id="collection_tab">\
  <img style="height: 16px; position: relative; bottom: 3px; margin-right: 10px;" src="Retina/images/cart.png">\
  Collections <sup style="color: gray; cursor: help;" id="storedcollections">[?]</sup>\
</a></li></ul>\
<div class="tab-content">\
<div class="tab-pane active" id="searches_tab">\
<div id="storedresults_div" style="margin-left: 10px; margin-right: 10px;">\
'+(stm.user ? '<p>you have no searches</p>' : '<p>you must be logged in to view stored searches</p>')+'\
</div>\
<h5 style="margin-left: 10px; margin-top: 20px;">\
  <img style="height: 16px; position: relative; bottom: 3px; margin-right: 10px;" src="Retina/images/disk.png">\
  create new <sup style="color: gray; cursor: help;" id="storeresults">[?]</sup>\
</h5>\
<div id="storeresults_div" style="margin-left: 10px; margin-right: 10px;">\
  <p>Store the parameters of your search query.</p>\
  <div class="control-group">\
    <label class="control-label" for="searchresult_name">name</label>\
    <div class="controls">\
      <input type="text" id="searchresult_name" style="width: 270px;" placeholder="enter name">\
    </div>\
  </div>\
  <label><b>description</b></label>\
  <div class="control-group">\
    <div class="controls">\
      <textarea id="searchresult_description" placeholder="enter description (optional)" style="width: 270px;" rows=3></textarea>\
    </div>\
  </div>\
  <button class="btn pull-right" type="button" id="storeSearchButton" onclick="Retina.WidgetInstances.metagenome_search[1].storeSearch();">store</button>\
  <div id="search_result_overview"></div>\
</div></div>\
<div class="tab-pane" id="collections_tab">\
<div id="collections_div" style="margin-left: 10px; margin-right: 10px;">\
'+(stm.user ? '<p>you have no collections</p>' : '<p>you must be logged in to view collections</p>')+'\
</div>\
<div id="currentCollection"></div>\
<h5 style="margin-left: 10px; margin-top: 20px;">\
  <img style="height: 16px; position: relative; bottom: 3px; margin-right: 10px;" src="Retina/images/disk.png">\
  create new <sup style="color: gray; cursor: help;" id="storecollection">[?]</sup>\
</h5>\
<div id="storecollection_div" style="margin-left: 10px; margin-right: 10px;">\
  <p>Store a custom list of metagenomes.</p>\
  <div class="control-group">\
    <label class="control-label" for="collection_name">name</label>\
    <div class="controls">\
      <input type="text" id="collection_name" style="width: 270px;" placeholder="enter name">\
    </div>\
  </div>\
  <label><b>description</b></label>\
  <div class="control-group">\
    <div class="controls">\
      <textarea id="collection_description" placeholder="enter description (optional)" style="width: 270px;" rows=3></textarea>\
    </div>\
  </div>\
  <button class="btn pull-right" type="button" id="storeCollectionButton" onclick="Retina.WidgetInstances.metagenome_search[1].storeCollection();">create</button>\
  <div id="collection_overview"></div>\
</div>\
</div>\
</div>\
';
	
	sidebar.innerHTML = html_sidebar;
	$('#searchCollectionTab a').click(function (e) {
	    e.preventDefault();
	    $(this).tab('show');
	})

	// check for search / collection preferences
	if (stm.user) {
	    stm.loadPreferences().then(function(){
		var widget = Retina.WidgetInstances.metagenome_search[1];
		widget.updateStoredSearches();
		widget.updateCollections();
		if (Retina.cgiParam('collection')) {
		    document.getElementById('collection_tab').click();
		    widget.showCollection(Retina.cgiParam('collection'));
		}
	    });
	}

	// tooltips
	jQuery("#storeresults").popover({ trigger: "hover", html: true, content: "<p style='font-weight: normal; line-height: 20px; font-size: 14px; margin-bottom: 0px;'>Saving a search requires you to be logged in.<br><br>You must also choose at least one search parameter.</p>"});
	jQuery("#storedresults").popover({ trigger: "hover", html: true, content: "<p style='font-weight: normal; line-height: 20px; font-size: 14px; margin-bottom: 0px;'>Store your search query paramters permanently.</p>"});
	jQuery("#storedcollections").popover({ trigger: "hover", html: true, content: "<p style='font-weight: normal; line-height: 20px; font-size: 14px; margin-bottom: 0px;'>Create a persistent custom list of metagenomes.</p>"});
	jQuery("#storecollection").popover({ trigger: "hover", html: true, content: "<p style='font-weight: normal; line-height: 20px; font-size: 14px; margin-bottom: 0px;'>Create a new selection of metagenomes.</p>"});

	var keyselect = document.getElementById('advanced_search_key');
	var keylist = widget.keylist;
	document.getElementById('advanced_search_value').addEventListener('keypress', function (e) {
	    e = e || window.event;
	    if (e.keyCode == 13) {
		Retina.WidgetInstances.metagenome_search[1].refineSearch('add');
	    }
	});
	
	var keyselect_html = "";
	for (var i=0; i<keylist.length; i++) {
	    keyselect_html += "<optgroup label='"+keylist[i].name+"'>"
	    for (var h=0; h<keylist[i].items.length; h++) {
		keyselect_html += "<option value='"+keylist[i].items[h].name+"'>"+keylist[i].items[h].value+"</option>";
	    }
	    keyselect_html += "</optgroup>";
	}
	keyselect.innerHTML = keyselect_html;

	// check if a search got passed
	if (Retina.cgiParam("search")) {
	    document.getElementById('searchtext').value = Retina.cgiParam("search");

	    if (Retina.cgiParam("opt_mg")) {
		if (Retina.cgiParam("opt_mg") == "on") {
		    document.getElementById('metadata_button').className = "btn btn-mini span1 active";
		} else {
		    document.getElementById('metadata_button').className = "btn btn-mini span1";
		}
	    }
	    if (Retina.cgiParam("opt_fn")) {
		if (Retina.cgiParam("opt_fn") == "on") {
		    document.getElementById('function_button').className = "btn btn-mini span1 active";
		} else {
		    document.getElementById('function_button').className = "btn btn-mini span1";
		}
	    }
	    if (Retina.cgiParam("opt_og")) {
		if (Retina.cgiParam("opt_og") == "on") {
		    document.getElementById('organism_button').className = "btn btn-mini span1 active";
		} else {
		    document.getElementById('organism_button').className = "btn btn-mini span1";
		}
	    }
	} else if (Retina.cgiParam("stored") != "") {
	    widget.showStoredSearch(Retina.cgiParam("stored"));
	}
	
	Retina.WidgetInstances.metagenome_search[1].queryAPI();
    };

    /* 
       ADVANCED SEARCH
    */
    widget.refineSearch = function (action, item) {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	// get the DOM space for the buttons
	var target = document.getElementById('refine_search_terms');

	if (action == "add") {

	    // add key and value to the advance options
	    var skeyList = document.getElementById('advanced_search_key');
	    var skey = skeyList.options[skeyList.selectedIndex].value;
	    var sname = skeyList.options[skeyList.selectedIndex].text;
	    var sval = document.getElementById('advanced_search_value').value;
	    widget.advancedOptions[skey] = sval;
	    widget.checkStoreSearch();

	    // check if this is the first button
	    if (target.innerHTML == "") {
		// create a 'clear' button

		var clear = document.createElement('button');
		clear.className = "btn btn-small btn-danger";
		clear.innerHTML = "clear filters";
		clear.addEventListener('click', function () {
		    Retina.WidgetInstances.metagenome_search[1].refineSearch("clear");
		});
		clear.setAttribute('style', "width: 100%; clear: both; margin-bottom: 20px; margin-top: -15px;");
		target.appendChild(clear);
	    }
	    
	    var button = document.createElement('button');
	    button.className = "btn btn-small";
	    button.setAttribute('style', "float: left; margin-right: 10px; margin-bottom: 10px;");
	    button.innerHTML = sname+" - "+sval+" <i class='icon icon-remove'></i>";
	    button.title = "click to remove";
	    button.setAttribute('id', 'advSearch_'+skey);
	    button.skey = skey;
	    button.addEventListener('click', function() {
		Retina.WidgetInstances.metagenome_search[1].refineSearch("remove", this.skey);
	    });
	    target.appendChild(button);
	} else if (action == "remove") {
	    delete widget.advancedOptions[item];
	    target.removeChild(document.getElementById('advSearch_'+item));
	    if (target.childNodes.length == 1) {
		target.innerHTML = "";
	    }
	} else if (action == "clear") {
	    widget.advancedOptions = {};
	    target.innerHTML = "";
	} else if (action == "restore" && item) {
	    widget.advancedOptions = item.advancedOptions;
	    target.innerHTML = "";
	    var clear = document.createElement('button');
	    clear.className = "btn btn-small btn-danger";
	    clear.innerHTML = "clear filters";
	    clear.addEventListener('click', function () {
		Retina.WidgetInstances.metagenome_search[1].refineSearch("clear");
	    });
	    clear.setAttribute('style', "width: 100%; clear: both; margin-bottom: 20px; margin-top: -15px;");
	    target.appendChild(clear);
	    for (var i in widget.advancedOptions) {
		var skey = i;
		var sname = widget.specialKeyMapping[i] ? widget.specialKeyMapping[i] : i.replace(/_/g, " ");
		var sval = widget.advancedOptions[i];
		var button = document.createElement('button');
		button.className = "btn btn-small";
		button.setAttribute('style', "float: left; margin-right: 10px; margin-bottom: 10px;");
		button.innerHTML = sname+" - "+sval+" <i class='icon icon-remove'></i>";
		button.title = "click to remove";
		button.setAttribute('id', 'advSearch_'+skey);
		button.skey = skey;
		button.addEventListener('click', function() {
		    Retina.WidgetInstances.metagenome_search[1].refineSearch("remove", this.skey);
		});
		target.appendChild(button);
	    }
	} else {
	    console.log("undefined action for refineSearch");
	    return;
	}
	widget.queryAPI();
    };

    /* 
       TABLE
    */
    widget.resultTable = function (data, total_count) {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	var showing = "all matches.";
	var num = 0;
	for (var i in data) {
	    if (data.hasOwnProperty(i)) {
		num++;
	    }
	}
	if (num < total_count) {
	    showing = "the first "+num+" matches.";
	}
	if (total_count == 0) {
	    document.getElementById('result_text').innerHTML = "";
	    return '<div class="alert alert-warning" style="margin-top: 200px; margin-bottom: 200px; width: 300px; margin-left: auto; margin-right: auto;">Your search returned no results.</div>';
	} else {
	    document.getElementById('result_text').innerHTML = "Your search returned "+total_count.formatString()+" results. Showing "+showing+" <button class='btn btn-mini' onclick='Retina.WidgetInstances.metagenome_search[1].downloadResults()' style='position: relative; bottom: 3px; margin-left: 10px;'><img src='Retina/images/cloud-download.png' style='width: 16px;'> download search results</button>";
	}

	var html = [];
	
	html.push("<table class='table' style='font-size: 12px;' id='result_table'><thead><tr>");
	var fields = ["created", "project_name", "name", "sequence_type", "biome", "country", "location"];
	var fnames = ["Created", "Study", "Metagenome", "Seq&nbsp;Type", "Biome", "Country", "Location"];
	var widths = [ 105, 85, 100, 85, 85, 85, 85 ];
	for (var i=0;i<fields.length;i++) {
	    var style_a = "";
	    var style_d = "";
	    if (widget.sort == fields[i]) {
		if (widget.sortDir == 'asc') {
                    style_a = "border: 1px solid #0088CC; border-radius: 7px; padding: 1px 1px 2px;";
		} else {
                    style_d = "border: 1px solid #0088CC; border-radius: 7px; padding: 2px 1px 1px;";
		}
            }
            html.push("<th style='min-width: "+widths[i]+"px;'>"+fnames[i]+"&nbsp;<img onclick=\"Retina.WidgetInstances.metagenome_search[1].sortQuery(\'"+fields[i]+"\', \'asc\');\" src=\"Retina/images/up-arrow.gif\" style=\"cursor: pointer;"+style_a+"\" /><img onclick=\"Retina.WidgetInstances.metagenome_search[1].sortQuery(\'"+fields[i]+"\', \'desc\');\" src=\"Retina/images/down-arrow.gif\" style=\"cursor: pointer;"+style_d+"\" />");
	    
            html.push("</th>");
	}
	html.push("</tr></thead><tbody>");
	
	var rows = [];
	for (var i in data) {
            if (data.hasOwnProperty(i)) {
		rows.push( [ i, data[i].name ] );
            }
	}

	// mapping for nice sequence type names
	var seqTypes = { "WGS": "shotgun metagenome",
			 "MT": "metatranscriptome",
			 "Amplicon": "amplicon metagenome" };
	
	for (var i=0;i<rows.length;i++) {
            html.push("<tr"+(widget.selectedMetagenomes[data[rows[i][0]]["id"]] ? " class='alert-info' title='this metagenome is part of your currently selected collection'" : "")+">");
	    html.push("<td>"+Retina.dateString(data[rows[i][0]]["created"]).split(/\s/)[0]+"</td>");
	    if (data[rows[i][0]]["project_id"]) {
		html.push("<td><a href='?mgpage=project&project="+(data[rows[i][0]]["status"] == "private" ? Retina.idmap(data[rows[i][0]]["project_id"]) : data[rows[i][0]]["project_id"])+"' target=_blank>"+data[rows[i][0]]["project_name"]+"</a></td>");
	    } else {
		html.push("<td>-</td>");
	    }

	    
            html.push("<td style='max-width: 200px; overflow: hidden;'><a href='?mgpage=overview&metagenome="+(data[rows[i][0]]["status"] == "private" ? Retina.idmap(data[rows[i][0]]["id"]) : data[rows[i][0]]["id"])+"' target=_blank title='view'>"+data[rows[i][0]]["name"]+"</a><a href='?mgpage=download&metagenome="+data[rows[i][0]]["id"]+"' target=_blank title='download'><img src='Retina/images/cloud-download.png' style='width: 16px; margin-left: 10px; float: right;'></a></td>");
	    html.push("<td>"+seqTypes[data[rows[i][0]]["sequence_type"]]+"</td>");
            html.push("<td>"+(data[rows[i][0]]["biome"] || "-")+"</td>");
            html.push("<td>"+(data[rows[i][0]]["country"] || "-")+"</td>");
	    html.push("<td>"+(data[rows[i][0]]["location"] || "-")+"</td>");
	    html.push("</tr>");
	}
        
	html.push("<tbody></table>");

	if (num < total_count) {
	    html.push('<div class="pagination pagination-centered"><ul><li><span><a href="javascript:;" onclick="Retina.WidgetInstances.metagenome_search[1].queryAPI(true, 20);">+20</a></span></li><li><span><a href="javascript:;" onclick="Retina.WidgetInstances.metagenome_search[1].queryAPI(true, 100);">+100</a></span></li><li><span><a href="javascript:;" onclick="Retina.WidgetInstances.metagenome_search[1].queryAPI(true, 500);">+500</a></span></li></ul></div>');
	}

	return html.join("");
    };

    widget.downloadResults = function () {
	var widget = this;

	var data = [];
	for (var i in stm.DataStore.search) {
	    if (stm.DataStore.search.hasOwnProperty(i)) {
		data.push(jQuery.extend(true, {}, stm.DataStore.search[i]));
	    }
	}
	data = data.sort(Retina.propSort(widget.sort, widget.sortDir == 'asc' ? false : true));
	var exportData = [];
	var fields = Retina.keys(data[0]).sort();
	exportData.push(fields.join("\t"));
	for (var i=0; i<data.length; i++) {
	    var row = [];
	    for (var h=0; h<fields.length; h++) {
		if (fields[h] == 'id' || fields[h] == 'project_id' && data[i].status == 'private') {
		    data[i][fields[h]] = Retina.idmap(data[i][fields[h]]);
		}
		row.push(data[i][fields[h]]);
	    }
	    exportData.push(row.join("\t"));
	}
	stm.saveAs(exportData.join("\n"), "searchResultsMetadata.txt");
    };

    widget.queryAPI = function (more, howmany) {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	var o = document.getElementById('opaq');
	o.style.display = "";
	var t = document.getElementById('result');
	o.style.width = t.offsetWidth + 'px';
	o.style.height = t.offsetHeight + 'px';
	
	// get params
	widget.query = document.getElementById("searchtext").value;
	widget.checkStoreSearch();
	
	if (! stm.DataStore.hasOwnProperty('search') ) {
	    stm.DataStore.search = {};
	}
	if (more) {
	    widget.offset += widget.limit;
	} else {
	    stm.DataStore.search = {};
	    widget.offset = 0;
	}

	var api_url = RetinaConfig.mgrast_api + '/metagenome?verbosity=mixs&';
	//var api_url = RetinaConfig.mgrast_api + '/search?';
		
	// metadata function organism
	// var type = [];
	// var poss = [ 'metadata', 'organism', 'function' ];
	// for (var i=0; i<poss.length; i++) {
	//     var btn = document.getElementById(poss[i] + '_button');
	//     for (var h=0; h<btn.classList.length; h++) {
	// 	if (btn.classList[h] == 'active') {
	// 	    type.push(poss[i]);
	// 	    break;
	// 	}
	//     }
	// }

	widget.match = "all";
	
	var query_str = "";
	if (widget.query) {
	    query_str += "all=" + widget.query.split(/\s/).join("&all=");
	}
	// for (var h=0;h<type.length; h++) {
	//     if(query_str != "") {
	// 	query_str += "&";
	//     }
	//     query_str += type[h] + "=" + widget.query.split(/\s/).join("&"+type[h]+"=");
	// }

	for (var h in widget.advancedOptions) {
	    if (widget.advancedOptions.hasOwnProperty(h)) {
		query_str += (query_str.length ? "&" : "")+h.toLowerCase();
		query_str += "="+widget.advancedOptions[h];
	    }
	}

	// if (! query_str.length) {
	//     query_str = "all=*";
	// }

	widget.limit = howmany || widget.limit;
	var url = api_url + query_str + "direction=" + widget.sortDir + "&limit=" + widget.limit + "&offset=" + widget.offset + "&order="+widget.sort;
	
	jQuery.ajax( { dataType: "json",
		       url: url,
		       headers: stm.authHeader,
		       success: function(data) {
			   for (var i=0;i<data.data.length;i++) {
			       stm.DataStore.search[data.data[i]["id"]] = data.data[i];
			   }
			   Retina.WidgetInstances.metagenome_search[1].total = data.total_count;
			   document.getElementById('result').innerHTML = Retina.WidgetInstances.metagenome_search[1].resultTable(stm.DataStore.search, data.total_count);
			   document.getElementById('opaq').style.display = 'none';
		       },
		       error: function () {
			   widget.target.innerHTML = "<div class='alert alert-error' style='width: 50%;'>You do not have the permisson to view this data.</div>";
		       }
		     });
	return;
    };

    widget.sortQuery = function (field, direction) {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	widget.sort = field;
	widget.sortDir = direction;

	widget.queryAPI();
    };

    /* 
       SEARCHES
    */
    widget.checkStoreSearch = function () {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	var btn = document.getElementById('storeSearchButton');
	if (stm.user && (Retina.keys(widget.advancedOptions, true).length || widget.query)) {
	    btn.removeAttribute("disabled");
	} else {
	    btn.setAttribute("disabled", "true");
	}
    };

    widget.storeSearch = function () {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	if (! stm.user) {
	    alert('you must be logged in to store a search');
	    return;
	}

	var types = [];
	var poss = [ 'metadata', 'organism', 'function' ];
	for (var i=0; i<poss.length; i++) {
	    var btn = document.getElementById(poss[i] + '_button');
	    for (var h=0; h<btn.classList.length; h++) {
		if (btn.classList[h] == 'active') {
		    types.push(poss[i]);
		    break;
		}
	    }
	}
	
	var search = { type: "search",
		       querytypes: types,
		       name: document.getElementById('searchresult_name').value,
		       description: document.getElementById('searchresult_description').value,
		       query: widget.query,
		       advancedOptions: widget.advancedOptions };

	if (stm.user.preferences.searches.hasOwnProperty(search.name)) {
	    alert('you already have a search of that name');
	} else {
	    stm.user.preferences.searches[search.name] = search;
	    stm.storePreferences("search stored", "there was an error storing your search");
	    widget.updateStoredSearches();
	}
    };

    widget.deleteStoredSearch = function (index) {
	var widget = Retina.WidgetInstances.metagenome_search[1];
	
	var searches = Retina.keys(stm.user.preferences.searches, true).sort();
	delete stm.user.preferences.searches[searches[index]];
	searches = Retina.keys(stm.user.preferences.searches, true).sort();
	if (searches.length) {
	    widget.updateStoredSearches();
	} else {
	    document.getElementById('storedresults_div').innerHTML = "<p>You currently have no stored searches</p>";
	}
	stm.storePreferences("search deleted", "there was an error deleting your search");
    };

    widget.updateStoredSearches = function () {
	if (stm.user) {
	    if (! stm.user.hasOwnProperty("preferences")) {
		stm.user.preferences = {};
	    }
	    if (! stm.user.preferences.hasOwnProperty("searches")) {
		stm.user.preferences.searches = {};
	    }
	    var searches = Retina.keys(stm.user.preferences.searches, true).sort();
	    if (searches.length) {
		var sidehtml = "<ul class='selectList'>";
		for (var i=0; i<searches.length; i++) {
		    var item = stm.user.preferences.searches[searches[i]];
		    sidehtml += "<li title='"+item.description+"'><a onclick='Retina.WidgetInstances.metagenome_search[1].showStoredSearch("+i+");'>"+item.name+"</a><button class='btn btn-mini btn-danger pull-right' onclick='Retina.WidgetInstances.metagenome_search[1].deleteStoredSearch("+i+");' title='permanently delete this search'>delete</button></li>";
		}
		sidehtml += "</ul>";
		document.getElementById('storedresults_div').innerHTML = sidehtml;
	    }
	}
    };

    /* 
       COLLECTIONS
    */
    widget.deleteCollection = function (index) {
	var widget = Retina.WidgetInstances.metagenome_search[1];
	
	var collections = Retina.keys(stm.user.preferences.collections, true).sort();
	delete stm.user.preferences.collections[collections[index]];
	collections = Retina.keys(stm.user.preferences.collections, true).sort();
	if (collections.length) {
	    widget.updateCollections();
	} else {
	    document.getElementById('storedresults_div').innerHTML = "<p>You currently have no stored searches</p>";
	}
	stm.storePreferences("collection deleted", "there was an error deleting your collection");
    };
    
    widget.updateCollections = function () {
	if (stm.user) {
	    if (! stm.user.hasOwnProperty("preferences")) {
		stm.user.preferences = {};
	    }
	    if (! stm.user.preferences.hasOwnProperty("collections")) {
		stm.user.preferences.collections = {};
	    }
	    var collections = Retina.keys(stm.user.preferences.collections, true).sort();
	    if (collections.length) {
		var sidehtml = "<ul class='selectList'>";
		for (var i=0; i<collections.length; i++) {
		    var item = stm.user.preferences.collections[collections[i]];
		    sidehtml += "<li title='"+item.description+"'><a onclick='Retina.WidgetInstances.metagenome_search[1].showCollection("+i+");'>"+item.name+"</a><button class='btn btn-mini btn-danger pull-right' onclick='Retina.WidgetInstances.metagenome_search[1].deleteCollection("+i+");' title='permanently delete this collection'>delete</button></li>";
		}
		sidehtml += "</ul>";
		document.getElementById('collections_div').innerHTML = sidehtml;
	    }
	}
    };

    widget.showCollection = function (index) {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	var collections = Retina.keys(stm.user.preferences.collections, true).sort();
	var collection;
	var mgs = Retina.keys(widget.selectedMetagenomes, true).sort();
	if (index !== undefined) {
	    widget.currentCollection = index;
	    collection = jQuery.extend(true, {}, stm.user.preferences.collections[collections[widget.currentCollection]]);
	    widget.selectedMetagenomes = collection.metagenomes;
	    mgs = Retina.keys(collection.metagenomes, true).sort();
	} else {
	    collection = jQuery.extend(true, {}, stm.user.preferences.collections[collections[widget.currentCollection]]);
	}
	
	var html = ['<h5>'+collection.name+'<button class="btn btn-mini btn-info" style="float: right;" onclick="Retina.WidgetInstances.metagenome_search[1].unselectCollection();">unselect</button></h5><p>'+collection.description+'</p><p><b>metagenomes</b></p><div><button class="btn btn-mini btn-'+(widget.addingMetagenomes ? "success" : "info" )+'" style="width: 100%; margin-bottom: 5px;" onclick="Retina.WidgetInstances.metagenome_search[1].'+(widget.addingMetagenomes ? 'updateCollection()' : 'enableCollectionSelection(true)')+';" id="enableAddMetagenomesButton">'+(widget.addingMetagenomes ? " save changes" : "edit metagenomes" )+'</button></div>'];
	if (mgs.length == 0) {
	    html.push('<p style="text-align: center;">- this collection is empty -</p>');
	} else {
	    html.push('<ul>');
	    for (var i=0; i<mgs.length; i++) {
		var btn = '';
		if (widget.addingMetagenomes) {
		    btn =  '<button class="btn btn-mini btn-danger" style="float: right;" onclick="delete Retina.WidgetInstances.metagenome_search[1].selectedMetagenomes[\''+mgs[i]+'\'];Retina.WidgetInstances.metagenome_search[1].showCollection();Retina.WidgetInstances.metagenome_search[1].enableCollectionSelection();">x</button>';
		}
		html.push('<li style="line-height: 24px; list-style: outside none none; margin-left: -20px; border-bottom: 1px solid #cccccc; margin-top: 1px;" title="'+mgs[i]+'">'+widget.selectedMetagenomes[mgs[i]]+btn+'</li>');
	    }
	    html.push('</ul>');
	    if (widget.addingMetagenomes) {
		html.push('<button class="btn btn-mini btn-danger" style="width: 100%; margin-bottom: 5px; margin-top: 5px;" onclick="Retina.WidgetInstances.metagenome_search[1].updateCollection(true);">revert changes</button>');
	    }
	}
	document.getElementById('currentCollection').innerHTML = html.join("\n");

	// redraw search result table to highlight the collection members
	document.getElementById('result').innerHTML = Retina.WidgetInstances.metagenome_search[1].resultTable(stm.DataStore.search, widget.total);
    };

    widget.updateCollection = function (cancel) {
	var widget = this;

	var collections = Retina.keys(stm.user.preferences.collections, true).sort();
	if (cancel) {
	    widget.selectedMetagenomes = jQuery.extend(true, {}, stm.user.preferences.collections[collections[widget.currentCollection]].metagenomes);
	} else {
	    stm.user.preferences.collections[collections[widget.currentCollection]].metagenomes = jQuery.extend(true, {}, widget.selectedMetagenomes);
	    stm.storePreferences("collection stored", "there was an error storing your collection");
	}
	
	widget.addingMetagenomes = false;
	widget.showCollection();
    };

    widget.storeCollection = function () {
	var widget = Retina.WidgetInstances.metagenome_search[1];

	if (! stm.user) {
	    alert('you must be logged in to create a collection');
	    return;
	}
	
	var collection = { type: "collection",
			   metagenomes: widget.selectedMetagenomes,
			   name: document.getElementById('collection_name').value,
			   description: document.getElementById('collection_description').value,
			 };

	if (! stm.user.preferences.hasOwnProperty('collections')) {
	    stm.user.preferences.collections = {};
	}
	if (stm.user.preferences.collections.hasOwnProperty(collection.name)) {
	    alert('you already have a search store with that name');
	} else {
	    stm.user.preferences.collections[collection.name] = collection;
	    stm.storePreferences("collection stored", "there was an error storing your collection");
	    widget.updateCollections();
	}
    };

    widget.enableCollectionSelection = function (initial) {
	var widget = this;

	if (widget.addingMetagenomes || initial) {
	    widget.addingMetagenomes = true;
	    widget.showCollection();
	    document.getElementById('result_table').addEventListener('click', function(event) {
		event = event || window.event;
		var widget = Retina.WidgetInstances.metagenome_search[1];
		var href = event.target.parentNode.childNodes[2].childNodes[0].href;
		var name = event.target.parentNode.childNodes[2].childNodes[0].innerHTML;
		var mgid = href.substr(href.lastIndexOf('=')+1);
		if (widget.selectedMetagenomes.hasOwnProperty(mgid)) {
		    delete widget.selectedMetagenomes[mgid];
		} else {
		    widget.selectedMetagenomes[mgid] = name;
		}
		widget.showCollection();
		widget.enableCollectionSelection();
	    });
	}
    };

    widget.unselectCollection = function () {
	var widget = this;

	widget.selectedMetagenomes = {};
	widget.addingMetagenomes = false;
	widget.currentCollection = null;
	document.getElementById('currentCollection').innerHTML = "";
	document.getElementById('result').innerHTML = Retina.WidgetInstances.metagenome_search[1].resultTable(stm.DataStore.search, widget.total);
    };
    
})();
