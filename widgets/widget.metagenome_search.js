(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Search Widget",
                name: "metagenome_search",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.add_renderer({"name": "table", "resource": "./renderers/",  "filename": "renderer.table.js" }),
  		 Retina.load_renderer("table") ];
    };
    
    widget.query = "";
    widget.sort = "name";
    widget.sortDir = "asc";
    widget.offset = 0;
    widget.limit = 20;
    widget.match = "all";
    widget.advancedOptions = {};
    widget.keylist = [ { "name": "Project",
			 "items": [ { "name": "PI_firstname", "value": "PI firstname" },
				    { "name": "PI_lastname", "value": "PI lastname" },
				    { "name": "project_name", "value": "project name" },
				    { "name": "library_name", "value": "library name" },
				    { "name": "sample_name", "value": "sample name" },
				    { "name": "created", "value": "creation date" },
				    { "name": "name", "value": "metagenome name" },
				    { "name": "sequence_type", "value": "sequence type" },
				    { "name": "seq_method", "value": "sequencing method" } ] },
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
        widget = Retina.WidgetInstances.metagenome_search[1];
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	jQuery.extend(widget, params);
	
	// set the output area
	// search field
	var html = "<div class='input-append' style='float: left;'><input type='text' id='searchtext' style='border-radius: 15px 0 0 15px; margin-left: 10px;' placeholder='enter search term' class='span5'><button class='btn' onclick='Retina.WidgetInstances.metagenome_search[1].queryAPI();' style='border-radius: 0 15px 15px 0;'>search</button></div>";

	// option buttons
	html += "<div style='float: left; position: relative; top: 4px;'><p style='float: left; font-size: 11px; margin-left: 25px; margin-right: 5px; position: relative; top: 1px;'>search in</p><div class='btn-group' data-toggle='buttons-radio'><button class='btn btn-mini span1 active' data-toggle='button' id='metadata_button'>metadata</button><button class='btn btn-mini span1' data-toggle='button' id='function_button'>function</button><button class='btn btn-mini span1' data-toggle='button' id='organism_button'>organism</button></div></div>";

	// result text
	html += "<div style='float: left; font-size: 12px; left: 20px; position: relative; top: 5px;' id='result_text'></div>";

	// result section
	html += "<div id='result' style='clear: both; overflow-y: auto; position: absolute; top: 70px; bottom: 0px;'></div>";

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
<h3 style="margin-left: 10px;">\
  <img style="height: 20px; position: relative; bottom: 2px; margin-right: 10px;" src="images/search.png">\
  Advanced Search\
</h3>\
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
  <hr>\
  <div id="refine_search_terms"></div>\
</div>\
';
	
	sidebar.innerHTML = html_sidebar;

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
	}

	Retina.WidgetInstances.metagenome_search[1].queryAPI();
    };

    widget.refineSearch = function (action, item) {
	widget = Retina.WidgetInstances.metagenome_search[1];

	// get the DOM space for the buttons
	var target = document.getElementById('refine_search_terms');

	if (action == "add") {

	    // add key and value to the advance options
	    var skeyList = document.getElementById('advanced_search_key');
	    var skey = skeyList.options[skeyList.selectedIndex].value;
	    var sname = skeyList.options[skeyList.selectedIndex].text;
	    var sval = document.getElementById('advanced_search_value').value;
	    widget.advancedOptions[skey] = sval;

	    // check if this is the first button
	    if (target.innerHTML == "") {
		// create a 'clear' button

		var clear = document.createElement('button');
		clear.className = "btn btn-small btn-danger";
		clear.innerHTML = "clear advanced options";
		clear.addEventListener('click', function () {
		    Retina.WidgetInstances.metagenome_search[1].refineSearch("clear");
		});
		clear.setAttribute('style', "width: 100%; clear: both; margin-bottom: 20px; margin-top: -15px;");
		target.appendChild(clear);
	    }
	    
	    var button = document.createElement('button');
	    button.className = "btn btn-small";
	    button.setAttribute('style', "float: left; margin-right: 10px;");
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
	} else {
	    console.log("undefined action for refineSearch");
	    return;
	}
	widget.queryAPI();
    };
    
    widget.resultTable = function (data, total_count) {
	widget = Retina.WidgetInstances.metagenome_search[1];

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
	    document.getElementById('result_text').innerHTML = "Your search returned no results.";
	} else {
	    document.getElementById('result_text').innerHTML = "Your search returned "+total_count+" results. Showing "+showing;
	}

	var html = "";
	
	html += "<table class='table' style='font-size: 12px;'><thead><tr>";
	var fields = ["sequence_type", "name", "id", "project_name", "biome", "feature", "material", "country", "location"];
	var fnames = ["Seq&nbsp;Type", "Metagenome", "MG-RAST&nbsp;ID", "Project", "Biome", "Feature", "Material", "Country", "Location"];
	var widths = [ 85, 105, 105, 85, 85, 85, 85, 85, 85 ];
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
            html += "<th style='min-width: "+widths[i]+"px;'>"+fnames[i]+"&nbsp;<img onclick=\"Retina.WidgetInstances.metagenome_search[1].sortQuery(\'"+fields[i]+"\', \'asc\');\" src=\"images/up-arrow.gif\" style=\"cursor: pointer;"+style_a+"\" />"+
                "<img onclick=\"Retina.WidgetInstances.metagenome_search[1].sortQuery(\'"+fields[i]+"\', \'desc\');\" src=\"images/down-arrow.gif\" style=\"cursor: pointer;"+style_d+"\" />";
	    
            html += "</th>";
	}
	html += "</tr></thead><tbody>";
	
	var rows = [];
	for (var i in data) {
            if (data.hasOwnProperty(i)) {
		rows.push( [ i, data[i].name ] );
            }
	}

	for (var i=0;i<rows.length;i++) {
	    
            data[rows[i][0]]["project_id"] = data[rows[i][0]]["project_id"].substr(3);
            data[rows[i][0]]["id"] = data[rows[i][0]]["id"].substr(3);
	    
            html += "<tr>";
            html += "<td>"+data[rows[i][0]]["sequence_type"]+"</td>";
            html += "<td style='max-width: 200px; overflow: hidden;'><a href='?mgpage=overview&metagenome="+data[rows[i][0]]["id"]+"' target=_blank title='"+data[rows[i][0]]["name"]+"'>"+data[rows[i][0]]["name"]+"</a></td>";
            html += "<td>"+data[rows[i][0]]["id"]+"</td>";
            html += "<td><a href='?mgpage=project&project="+data[rows[i][0]]["project_id"]+"' target=_blank>"+data[rows[i][0]]["project_name"]+"</a></td>";
            html += "<td>"+data[rows[i][0]]["biome"]+"</td>";
            html += "<td>"+data[rows[i][0]]["feature"]+"</td>";
            html += "<td>"+data[rows[i][0]]["material"]+"</td>";
            html += "<td>"+data[rows[i][0]]["country"]+"</td>";
            html += "<td>"+data[rows[i][0]]["location"]+"</td>";
            html += "</tr>";
	}
        
	html += "<tbody></table>";

	if (num < total_count) {
	    html += "<div><table width=100% style='text-align: center;'><tr><td><button class='btn btn-mini' onclick='Retina.WidgetInstances.metagenome_search[1].queryAPI(true);'>more</button></td></tr></table></div>";
	}

	return html;
    };

    widget.queryAPI = function (more) {
	widget = Retina.WidgetInstances.metagenome_search[1];
	
	// get params
	widget.query = document.getElementById("searchtext").value;
	
	if (! stm.DataStore.hasOwnProperty('search') ) {
	    stm.DataStore.search = {};
	}
	if (more) {
	    widget.offset += widget.limit;
	} else {
	    stm.DataStore.search = {};
	    widget.offset = 0;
	}

	var api_url = stm.Config.mgrast_api + '/metagenome?verbosity=mixs&';
			
	// metadata function organism
	var type = [];
	var poss = [ 'metadata', 'organism', 'function' ];
	for (var i=0; i<poss.length; i++) {
	    var btn = document.getElementById(poss[i] + '_button');
	    for (var h=0; h<btn.classList.length; h++) {
		if (btn.classList[h] == 'active') {
		    type.push(poss[i]);
		    break;
		}
	    }
	}

	widget.match = "all";
	
	var query_str = "";
	for (var h=0;h<type.length; h++) {
	    if(query_str == "") {
		query_str = type[h] + "=" + widget.query;
	    } else {
		query_str += "&" + type[h] + "=" + widget.query;
	    }
	}

	for (var h in widget.advancedOptions) {
	    if (widget.advancedOptions.hasOwnProperty(h)) {
		query_str += "&"+h;
		query_str += "="+widget.advancedOptions[h];
	    }
	}

	var url = api_url + query_str + "&order=" + widget.sort + "&direction=" + widget.sortDir + "&match=" + widget.match + "&limit=" + widget.limit + "&offset=" + widget.offset;
	
	if (stm.Authorization) {
	    url += "&auth=" + stm.Authorization;
	}

	jQuery.getJSON(url, function(data) {
	    for (var i=0;i<data.data.length;i++) {
		stm.DataStore.search[data.data[i]["id"]] = data.data[i];
	    }

	    document.getElementById('result').innerHTML = Retina.WidgetInstances.metagenome_search[1].resultTable(stm.DataStore.search, data.total_count);
	});
	
	return;
    };

    widget.sortQuery = function (field, direction) {
	widget = Retina.WidgetInstances.metagenome_search[1];

	widget.sort = field;
	widget.sortDir = direction;

	widget.queryAPI();
    };
    
})();
