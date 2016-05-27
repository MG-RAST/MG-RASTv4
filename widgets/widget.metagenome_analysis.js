(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Analysis Widget",
                name: "metagenome_analysis",
                author: "Tobias Paczian",
            requires: [ "rgbcolor.js", "html2canvas.js", "jszip.min.js" ]
        }
    });
    
    // load all required widgets and renderers
    widget.setup = function () {
	return [ Retina.load_widget("mgbrowse"),
		 Retina.load_widget({"name": "RendererController", "resource": "Retina/widgets/"}),
		 Retina.load_renderer('table')
	       ];
    };

    widget.cutoffThresholds = {
	"evalue": 5,
	"identity": 60,
	"length": 15
    };

    widget.context = "none";
    widget.normalizeData = false;
    widget.standardizeData = false;
    
    // main display function called at startup
    widget.display = function (params) {
	widget = this;
        var index = widget.index;

	jQuery.extend(widget, params);

	document.getElementById("pageTitle").innerHTML = "analysis";
	
	// set the output area
	if (! stm.DataStore.hasOwnProperty('taxonomy')) {
	    widget.main.innerHTML = '<div id="data">checking local storage... <img src="Retina/images/waiting.gif" style="width: 16px;"></div><div id="visualize"></div>';
	    stm.readHardStorage("analysis").then( function () {
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
		if (stm.DataStore.hasOwnProperty('taxonomy')) {
		    widget.display();
		} else {
		    widget.main.innerHTML = '<div id="data">loading taxonomy data... <img src="Retina/images/waiting.gif" style="width: 16px;"></div><div id="visualize"></div>';
		    widget.loadBackgroundData();
		    return;
		}
	    });
	    return;
	}

	// set the tool area
	var tools = widget.sidebar;
	tools.parentNode.style.overflowY = "visible";
	tools.setAttribute('style', 'padding: 10px;');

	// check the context
	var toolshtml = "<h4>Data</h4>";
	toolshtml += "<div id='availableContainers'></div>";
	toolshtml += "<hr style='clear: both; margin-top: 15px;'>";
	toolshtml += "<h4>View</h4>";
	toolshtml += "<div id='visualContainerSpace'></div>";
	toolshtml += "<h4>Export</h4>";
	toolshtml += "<div id='exportContainerSpace'></div>";
	tools.innerHTML = toolshtml;

	widget.showDataContainers();
	widget.fillVisualizations();
	widget.fillExport();

	widget.loadDataUI();
    };

    /*
      DATA VISUALISATION
     */

    // fill the export options
    widget.fillExport = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

    	var container = document.getElementById('exportContainerSpace');
	var html = "";

	html += "<img src='Retina/images/file-xml.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"svg\");' title='SVG'>";
	html += "<img src='Retina/images/image.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"png\");' title='PNG'>";
	html += "<img src='Retina/images/table.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"tsv\");' title='TSV'>";
	html += "<img src='Retina/images/file-css.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"json\");' title='JSON'>";

	container.innerHTML = html;
    };

    // perform a filter on the current data container
    widget.performFilter = function () {
    	var widget = Retina.WidgetInstances.metagenome_analysis[1];

    	var c = stm.DataStore.dataContainer[widget.selectedContainer];
    	var pid = c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source;
    	var p = stm.DataStore.profile[pid];
    	var filters = [];
	if (c.parameters.evalue > widget.cutoffThresholds['evalue']) {
	    filters.push([ 1, c.parameters.evalue ]);
	}
	if (c.parameters.identity > widget.cutoffThresholds['identity']) {
	    filters.push([ 2, c.parameters.identity ]);
	}
	if (c.parameters.alilength > widget.cutoffThresholds['length']) {
	    filters.push([ 3, c.parameters.alilength ]);
	}
	var taxfilters = Retina.keys(c.parameters.taxFilter);
	for (var i=0; i<taxfilters.length; i++) {
	    if (Retina.keys(c.parameters.taxFilter[taxfilters[i]]).length == 0) {
		delete c.parameters.taxFilter[taxfilters[i]];
	    }
	}
	taxfilters = Retina.keys(c.parameters.taxFilter);

	var ontfilters = Retina.keys(c.parameters.ontFilter);
	for (var i=0; i<ontfilters.length; i++) {
	    if (Retina.keys(c.parameters.ontFilter[ontfilters[i]]).length == 0) {
		delete c.parameters.ontFilter[ontfilters[i]];
	    }
	}
	ontfilters = Retina.keys(c.parameters.ontFilter);
	
	var levelIndex = { "domain": 0, "phylum": 1, "className": 2, "order": 3, "family": 4, "genus": 5, "species": 6 };
	var flevelIndex = { "Subsystems-level1": 0, "Subsystems-level2": 1, "Subsystems-level3": 2, "Subsystems-functions": 3, "KO-level1": 0, "KO-level2": 1, "KO-level3": 2, "KO-functions": 0, "COG-level1": 0, "COG-level2": 1, "COG-functions": 2, "NOG-level1": 0, "NOG-level2": 1, "NOG-functions": 3 };
	
    	var rows = {};
    	for (var i=0; i<c.items.length; i++) {
    	    rows[c.items[i].id] = [];
    	    var pid = c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source;
    	    var p = stm.DataStore.profile[pid];
    	    for (var h=0; h<p.rows.length; h++) {
    		var stay = true;

		// test for cutoffs
		for (var j=0; j<filters.length; j++) {
    		    if (Math.abs(p.data[h][filters[j][0]]) < filters[j][1]) {
    			stay = false;
    			continue;
    		    }
    		}

		// test for tax filters
		if (taxfilters.length) {
		    for (var j=0; j<taxfilters.length; j++) {
			var org = p.rows[h].metadata.organism[0];
			var val;
			if (stm.DataStore.taxonomy.organism.hasOwnProperty(org)) {
			    val = stm.DataStore.taxonomy[taxfilters[j]][stm.DataStore.taxonomy.organism[org][levelIndex[taxfilters[j]]]];
			} else {
			    console.log("org not found: "+org)
			    stay = false;
			    continue;
			}
			if (! c.parameters.taxFilter[taxfilters[j]][val]) {
			    stay = false;
			    continue;
			}
		    }
		}

		// test for function filters
		// if (ontfilters.length) {
		//     for (var j=0; j<ontfilters.length; j++) {
		// 	var func = p.rows[h].metadata['function'][0];
		// 	var val;
		// 	var type, level;
		// 	[ type, level ] = ontfilters[j].split(/-/);
		// 	if (stm.DataStore.ontology[type]['id'].hasOwnProperty(func)) {
		// 	    val = stm.DataStore.ontology[type][level][stm.DataStore.ontology[type]['id'][func][flevelIndex[ontfilters[j]]]];
		// 	} else {
		// 	    console.log("func not found: "+func)
		// 	    stay = false;
		// 	    continue;
		// 	}
		// 	if (! c.parameters.ontFilter[ontfilters[j]][val]) {
		// 	    stay = false;
		// 	    continue;
		// 	}
		//     }
		// }
		
    		if (stay) {
    		    rows[c.items[i].id].push(h);
    		}
    	    }
    	}
    	c.rows = rows;
    };

    // visualization section
    widget.fillVisualizations = function () {
    	var widget = Retina.WidgetInstances.metagenome_analysis[1];

    	var container = document.getElementById('visualContainerSpace');

    	var html = "";
    	html += "<img src='Retina/images/matrix.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"matrix\");' title='matrix'>";

    	html += "<img src='Retina/images/pie.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"piechart\");' title='piechart'>";
    	html += "<img src='Retina/images/bars3.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"barchart\");' title='barchart'>";
    	html += "<img src='images/icon_heatmap.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"heatmap\");' title='heatmap'>";
    	html += "<img src='Retina/images/table.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"table\");' title='table'>";
    	html += "<img src='images/icon_boxplot.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"boxplot\");' title='table'>";
    	container.innerHTML = html;
    };

    // draw a demo version of the selected visualization
    widget.visualize = function (type) {
    	var widget = Retina.WidgetInstances.metagenome_analysis[1];

    	type = type || "matrix";
    	widget.currentType = type;

    	document.getElementById("data").style.display = "none";
    	document.getElementById("visualize").style.display = "";

    	var container = document.getElementById('visualize');

    	if (type == "container") {
    	    widget.editContainer();
    	    return;
    	}

    	var demo_data = widget.demoData();
	
    	var containerData = "";
    	if (widget.selectedContainer) {
    	    var c = stm.DataStore.dataContainer[widget.selectedContainer];
    	    var pid = c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source;
    	    var p = stm.DataStore.profile[pid];
    	    var mdname = "";
    	    if (p.rows.length > 0) {
    		var matrixLevels = "";
		var cols = ["domain", "phylum", "className", "order", "family", "genus", "species" ];
    		for (var i=0; i<cols.length; i++) {
    		    matrixLevels += "<option value='"+cols[i]+"'>"+cols[i]+"</option>";
    		}
		
    		containerData = "<div class='form-inline' style='margin-bottom: 20px; display: none;'>select "+mdname+" level <select class='span1' id='matrixLevel' style='margin-right: 10px;'>"+matrixLevels+"</select><button type='button' class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].updateVis();'>draw</button></div>";
    	    } else {
    		containerData = "<p>The selected data container does not contain any data rows.</p>";
    	    }
    	}
    	var html = "<h4>visualize container " + (widget.selectedContainer ? widget.selectedContainer : "Demo") + " - "+demo_data[type].title+"</h4>"+containerData+"<div id='visualizeTarget'></div>";

    	container.innerHTML = html;

    	demo_data[type].settings.target = document.getElementById('visualizeTarget');
    	if (Retina.RendererInstances[demo_data[type].renderer] && Retina.RendererInstances[demo_data[type].renderer].length > 1) {
    	    Retina.RendererInstances[demo_data[type].renderer] = [ Retina.RendererInstances[demo_data[type].renderer][0] ];
    	}
    	if (Retina.WidgetInstances.RendererController.length > 1) {
    	    Retina.WidgetInstances.RendererController = [ Retina.WidgetInstances.RendererController[0] ];
    	}
    	widget.currentVisualizationController = Retina.Widget.create('RendererController', { "target": document.getElementById("visualizeTarget"), "type": demo_data[type].renderer, "settings": demo_data[type].settings, "breadcrumbs": 'visualizeBreadcrumbs', "noControl": true });

    	if (widget.selectedContainer) {
    	    widget.updateVis();
    	}
    };

    widget.editContainer = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('visualize');
	var html = [];
	var onts = ["Subsystems", "KO", "COG", "NOG"];
	if (widget.selectedContainer) {
	    html.push("<h3>edit data container<button class='btn btn-danger' style='float: right;' title='delete data container' onclick='if(confirm(\"Really delete this data container? (This will not remove the loaded profile data)\")){Retina.WidgetInstances.metagenome_analysis[1].removeDataContainer();};'><i class='icon icon-trash'></i></button></h3><p>Here you can view and modify the settings of the selected data container.</p>")
	    var c = stm.DataStore.dataContainer[widget.selectedContainer];
	    
	    html.push("<table>");
	    html.push("<tr><td style='height: 30px; width: 200px;'>name</td><td><div class='input-append' style='margin-bottom: 0px;'><input type='text' value='"+c.id+"'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].renameContainer(this.previousSibling.value);'>update</button></div></td></tr>");
	    var uname = typeof c.user == "object" ? c.user.firstname+" "+c.user.lastname+" ("+c.user.login+")" : c.user;
	    html.push("<tr><td style='height: 30px;'>created</td><td>"+c.created+"</td></tr>");
	    html.push("<tr><td style='height: 30px;'>by</td><td>"+uname+"</td></tr>");
	    html.push("<tr><td style='height: 30px;'>hit type</td><td>"+c.parameters.type+"</td></tr>");
	    html.push("<tr><td style='height: 30px;'>source</td><td>"+c.parameters.source+"</td></tr></table>");

	    html.push('<h4>Filter Parameters</h4>');
	    
	    html.push("<table><tr><td style='height: 30px; width: 200px;'>e-value</td><td><div class='input-append' style='margin-bottom: 0px;'><input type='text' value='"+c.parameters.evalue+"' class='span3' id='containerParamevalue'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"evalue\",this.previousSibling.value);'>update</button></div></td></tr>");
	    html.push("<tr><td style='height: 30px;'>%-identity</td><td><div class='input-append' style='margin-bottom: 0px;'><input type='text' value='"+c.parameters.identity+"' class='span3' id='containerParamidentity'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"identity\",this.previousSibling.value);'>update</button></div></td></tr>");
	    html.push("<tr><td style='padding-right: 20px; height: 30px;'>alignment length</td><td><div class='input-append' style='margin-bottom: 0px;'><input type='text' value='"+c.parameters.alilength+"' class='span3' id='containerParamlength'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"length\",this.previousSibling.value);'>update</button></div></td></tr>");

	    var taxSelect = "<select onchange='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"taxLevel\",this.options[this.selectedIndex].value);'>";
	    var taxSelect2 = "<select onchange='if(this.selectedIndex<6){jQuery(\"#taxText\").data(\"typeahead\").source=stm.DataStore.taxonomy[this.options[this.selectedIndex].value];}else{jQuery(\"#taxText\").data(\"typeahead\").source=[];}'>";
	    var taxLevels = [ "domain", "phylum", "className", "order", "family", "genus", "species" ];
	    for (var i=0; i<taxLevels.length; i++) {
		var sel = "";
		if (taxLevels[i] == c.parameters.taxLevel) {
		    sel = " selected=selected";
		}
		taxSelect += "<option"+sel+" value='"+taxLevels[i]+"'>"+(taxLevels[i] == 'className' ? 'class' : taxLevels[i])+"</option>";
		taxSelect2 += "<option value='"+taxLevels[i]+"'>"+(taxLevels[i] == 'className' ? 'class' : taxLevels[i])+"</option>";
	    }
	    taxSelect += "</select>";
	    taxSelect2 += "</select>";
	    
	    html.push("<tr><td style='vertical-align: top; padding-top: 5px;'>taxonomy display level</td><td>"+taxSelect+"</td></tr>");

	    var taxFilter = taxSelect2 + "<div class='input-append'><input type='text' autocomplete='off' id='taxText'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"taxFilter\", \"add\", this.parentNode.previousSibling.options[this.parentNode.previousSibling.selectedIndex].value, document.getElementById(\"taxText\").value);'>add</button></div>";
	    html.push("<tr><td style='vertical-align: top; padding-top: 5px;'>taxonomy filters</td><td>"+taxFilter+"</td></tr>");

	    var tf = Retina.keys(c.parameters.taxFilter).sort();
	    for (var i=0; i<tf.length; i++) {
		var f = c.parameters.taxFilter[tf[i]];
		html.push("<tr><td>"+tf[i]+"</td><td>");
		var v = Retina.keys(f).sort();
		for (var h=0; h<v.length; h++) {
		    html.push("<button class='btn btn-mini' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"taxFilter\", \"remove\", \""+tf[i]+"\", \""+v[h]+"\");'>"+v[h]+"</button>");
		}
		html.push("</td>");
	    }

	    var ontLevels = { "Subsystems": ["level1","level2","level3","functions"], "KO": ["level1","level2","level3","functions"], "COG": ["level1","level2","functions"], "NOG": ["level1","level2","functions"] };
	    var ontTypeSelect = '<select id="ontType" onchange="';
	    for (var i=0; i<onts.length; i++) {
		ontTypeSelect += 'document.getElementById(\''+onts[i]+'SelectDiv\').style.display=\'none\';';
	    }
	    ontTypeSelect += 'document.getElementById(this.options[this.selectedIndex].value+\'SelectDiv\').style.display=\'\';">';
	    var ontSelects = [];
	    for (var i=0; i<onts.length; i++) {
		ontTypeSelect += "<option>"+onts[i]+"</option>";
		ontSelects.push('<div id="'+onts[i]+'SelectDiv" style="'+(i==0 ? "" : "display: none;")+'"><select id="'+onts[i]+'Select" onchange="jQuery(\'#'+onts[i]+'SelectText\').data(\'typeahead\').source=stm.DataStore.ontology[\''+onts[i]+'\'][this.options[this.selectedIndex].value];">');
		for (var h=0; h<ontLevels[onts[i]].length; h++) {
		    ontSelects.push('<option>'+ontLevels[onts[i]][h]+'</option>');
		}
		ontSelects.push('</select><div class="input-append"><input type="text" id="'+onts[i]+'SelectText" autocomplete="off"><button class="btn" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'ontFilter\', \'add\', document.getElementById(\'ontType\').options[document.getElementById(\'ontType\').selectedIndex].value,this.parentNode.previousSibling.options[this.parentNode.previousSibling.selectedIndex].value, document.getElementById(\''+onts[i]+'SelectText\').value);">add</button></div></div>');
	    }
	    ontTypeSelect += '</select>';
	    
	    // var ontSelect = "<select>";
	    // var ontLevels = [ "level1", "level2", "level3", "function" ];
	    // for (var i=0; i<ontLevels.length; i++) {
	    // 	ontSelect += "<option>"+ontLevels[i]+"</option>";
	    // }
	    // ontSelect += "</select>";
	    // html.push("<tr><td style='vertical-align: top; padding-top: 5px;'>ontology display level</td><td>"+ontSelect+"</td></tr>");

	    html.push("<tr><td style='vertical-align: top; padding-top: 5px;'>functional hierarchy filters</td><td>"+ontTypeSelect+ontSelects.join("")+"</td></tr>");

	    var of = Retina.keys(c.parameters.ontFilter).sort();
	    for (var i=0; i<of.length; i++) {
		var f = c.parameters.ontFilter[of[i]];
		html.push("<tr><td>"+of[i]+"</td><td>");
		var v = Retina.keys(f).sort();
		for (var h=0; h<v.length; h++) {
		    html.push("<button class='btn btn-mini' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"ontFilter\", \"remove\", \""+of[i]+"\", \""+v[h]+"\");'>"+v[h]+"</button>");
		}
		html.push("</td>");
	    }
	    
	    html.push("</table>");

	    html.push('<h4>Result Sets</h4>');

	    html.push("<table><th style='text-align: left;'>name</th><th style='text-align: left;'># distinct hits</th></tr>");
	    for (var i=0; i<c.items.length; i++) {
		html.push("<tr><td>"+c.items[i].name+"</td><td style='text-align: right;'>"+c.rows[c.items[i].id].length+"</td></tr>");
	    }
	    html.push("</table>");
	} else {
	    html.push("<p>You currently have no data loaded. To do so, click the <span style='border: 1px solid black; border-radius: 3px; padding-bottom: 2px; padding-left: 5px; padding-right: 4px; font-weight: bold;'>+</span> icon on the right.</p>");
	    document.getElementById('addDataIcon').className = "tool glow";
	}

	container.innerHTML = html.join("");
	if (widget.selectedContainer) {
	    
	    jQuery("#taxText").typeahead({"source": stm.DataStore.taxonomy.domain});
	    for (var i=0; i<onts.length; i++) {
		jQuery("#"+onts[i]+"SelectText").typeahead({"source": stm.DataStore.ontology[onts[i]].level1});
	    }
	}
    };

    widget.removeDataContainer = function () {
	var widget = this;

	delete stm.DataStore.dataContainer[widget.selectedContainer];
	widget.showDataContainers();
	document.getElementById('dataprogress').innerHTML = '';
	widget.loadDataUI();
    };

    // change a parameter of a container
    widget.changeContainerParam = function (param, value, value2, value3, value4) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (widget.cutoffThresholds.hasOwnProperty(param) && widget.cutoffThresholds[param] > value) {
	    document.getElementById('containerParam'+param).value = widget.cutoffThresholds[param];
	    alert(param+' minimum threshols is '+widget.cutoffThresholds[param]);
	    return;
	}

	var container = stm.DataStore.dataContainer[widget.selectedContainer];

	// check if this is a tax filter
	if (param == 'taxLevel') {
	    container.parameters.taxLevel = value;
	} else if (param == 'ontLevel') {
	    container.parameters.ontLevel = value;
	} else {
	    if (param == 'taxFilter') {
		if (value == "remove") {
		    delete container.parameters.taxFilter[value2][value3];
		} else {
		    if (! container.parameters.taxFilter.hasOwnProperty(value2)) {
			container.parameters.taxFilter[value2] = {};
		    }
		    container.parameters.taxFilter[value2][value3] = true;
		}
	    } else if (param == 'ontFilter') {
		if (value == "remove") {
		    delete container.parameters.ontFilter[value2][value3];
		} else {
		    if (! container.parameters.ontFilter.hasOwnProperty(value2+"-"+value3)) {
			container.parameters.ontFilter[value2+"-"+value3] = {};
		    }
		    container.parameters.ontFilter[value2+"-"+value3][value4] = true;
		}
	    } else {
		// update parameter data
		container.parameters[param] = parseFloat(value);
	    }
	    document.getElementById('visualize').setAttribute('disabled', 'disabled');
	    widget.performFilter();
	    document.getElementById('visualize').removeAttribute('disabled');
	    widget.editContainer();
	}
    };

    // change the container name
    widget.renameContainer = function (newName) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	if (newName && newName.length) {
	    if (stm.DataStore.dataContainer.hasOwnProperty(newName)) {
		alert("this name is already taken, please select another");
	    } else {
		stm.DataStore.dataContainer[newName] = stm.DataStore.dataContainer[widget.selectedContainer];
		delete stm.DataStore.dataContainer[widget.selectedContainer];
		widget.selectedContainer = newName;
		stm.DataStore.dataContainer[widget.selectedContainer].id = newName;
		widget.showDataContainers();
		widget.editContainer();
	    }
	} else {
	    alert("you did not choose a name");
	}
    };

    // draw the current visualization with updated parameters
    widget.updateVis = function (matrixLevel, filter, reset) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (reset) {
	    matrixLevel = document.getElementById('matrixLevel').options[0].value;
	    document.getElementById('visualizeBreadcrumbs').innerHTML = "";
	}

	if (! matrixLevel) {
	    matrixLevel = document.getElementById('matrixLevel').options[0].value;
	}
	
	var r = widget.currentVisualizationController;

	var b = document.getElementById('visualizeBreadcrumbs');
	if (b.innerHTML == "") {
	    b.innerHTML = '<a style="cursor: pointer;" onclick="Retina.WidgetInstances.metagenome_analysis[1].updateVis(null, null, true);">&raquo; All </a>';
	}

	/* drilldown */
	if (widget.currentType == 'matrix') {
	    var matrix = widget.container2matrix({ level: matrixLevel, filter: filter, colHeader: "name" });

	    if (Retina.normalizeData) {
		matrix.data = Retina.transposeMatrix(Retina.normalizeMatrix(Retina.transposeMatrix(matrix.data)));
	    }
	    if (widget.standardizeData) {
		matrix.data = Retina.transposeMatrix(Retina.standardizeMatrix(Retina.transposeMatrix(matrix.data)));
	    }
	    r.data(1, { data: matrix.data,
			rows: matrix.rows,
			columns: matrix.cols });

	    r.renderer.settings.callback = function (p) {
		var rend = Retina.RendererInstances.matrix[p.rendererIndex];
		if ((rend.settings.orientation=='transposed' && p.rowIndex == null) || (rend.settings.orientation=='normal' && p.colIndex == null)) {
		    document.getElementById('matrixLevel').selectedIndex++;
		    var widget = Retina.WidgetInstances.metagenome_analysis[1];
		    var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}Retina.WidgetInstances.metagenome_analysis[1].updateVis(\''+document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value+'\', {level: \''+document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex - 1].value+'\', value: \''+p.cellValue+'\'});">&raquo; '+p.cellValue+' </a>';
		    if (document.getElementById('matrixLevel').selectedIndex + 1 == document.getElementById('matrixLevel').options.length) {
			html = "";
		    }
		    document.getElementById('visualizeBreadcrumbs').innerHTML += html;
		    widget.updateVis( document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value, { level: document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex - 1].value,
																		    value: p.cellValue } );
		    
		}
	    };
	} else if (widget.currentType == 'barchart') {
	    var data = widget.container2graphseries({ dataColIndex: matrixLevel, filter: filter });
	    r.data(1, data.data);
	    r.renderer.settings.x_labels = data.x_labels;
	    r.renderer.settings.chartArea = [ 120, 0, 0.8, 1 ];
	    r.renderer.settings.legendArea = [ 0.81, 0, 0.97, 1 ];
	    r.renderer.settings.onclick = function (p) {
		var rend = Retina.RendererInstances.graph[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
		var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}Retina.WidgetInstances.metagenome_analysis[1].updateVis({level: \''+document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value+'\', value: \''+p.series+'\'});">&raquo; '+p.series+' </a>';
		if (document.getElementById('matrixLevel').selectedIndex + 1 == document.getElementById('matrixLevel').options.length) {
		    html = "";
		}
		document.getElementById('visualizeBreadcrumbs').innerHTML += html;
		widget.updateVis( { level: document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value,
				    value: p.series } );
	    };
	} else if (widget.currentType == 'plot') {
	    var data = widget.container2plotseries({ dataColIndex: matrixLevel, filter: filter });
	    for (var i=0; i<data.data.points.length; i++) {
		data.data.points[i] = data.data.points[i].sort(Retina.propSort('y', true));
		for (var h=0;h<data.data.points[i].length; h++) {
		    data.data.points[i][h].x=h;
		}
	    }
	    r.data(1, data.data);
	    r.renderer.settings.x_min = data.x_min;
	    r.renderer.settings.x_max = data.x_max;
	    r.renderer.settings.y_min = data.y_min;
	    r.renderer.settings.y_max = data.y_max;
	    r.renderer.settings.x_title = "";
	    r.renderer.settings.y_title = "abundance";
	} else if (widget.currentType == 'heatmap') {
	    var matrix = widget.container2matrix({ dataColIndex: matrixLevel, filter: filter });
	    var data = Retina.scaleMatrix(matrix.data);
	    r.data(1, { data: data,
			rows: matrix.rows,
			columns: matrix.cols });
	    r.renderer.settings.height = document.getElementById('RendererControllerInput_1_height').value;
	    r.renderer.settings.min_cell_height = document.getElementById('RendererControllerInput_1_min_cell_height').value;
	    r.renderer.settings.rowClicked = function (p) {
		var rend = Retina.RendererInstances.heatmap[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
		var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}Retina.WidgetInstances.metagenome_analysis[1].updateVis({level: \''+document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value+'\', value: \''+p.label+'\'});">&raquo; '+p.label+' </a>';
		if (document.getElementById('matrixLevel').selectedIndex + 1 == document.getElementById('matrixLevel').options.length) {
		    html = "";
		}
		document.getElementById('visualizeBreadcrumbs').innerHTML += html;
		widget.updateVis( { level: document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value,
				    value: p.label } );
	    };
	} else if (widget.currentType == 'piechart') {
	    var data = widget.container2graphseries({ dataColIndex: matrixLevel, filter: filter });
	    r.data(1, data.data);
	    r.renderer.settings.x_labels = data.x_labels;
	    r.renderer.settings.onclick = function (p) {
		var rend = Retina.RendererInstances.graph[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
		var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}Retina.WidgetInstances.metagenome_analysis[1].updateVis({level: \''+document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value+'\', value: \''+p.series+'\'});">&raquo; '+p.series+' </a>';
		if (document.getElementById('matrixLevel').selectedIndex + 1 == document.getElementById('matrixLevel').options.length) {
		    html = "";
		}
		document.getElementById('visualizeBreadcrumbs').innerHTML += html;
		widget.updateVis( { level:document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value,
				    value: p.series } );
	    };
	} else if (widget.currentType == 'table') {
	    var data = widget.container2table({ dataColIndex: matrixLevel, filter: filter, aggregationFunctions: [ "sum", "average", "average", "average" ] });
	    r.renderer.settings.sorttype = { 2: "number", 3: "number", 4: "number", 5: "number" };
	    r.renderer.settings.filter = { 0: { "type": "select" }, 1: { "type": "select" }, 2: { "type": "text", "operator": [">", "<", "=", "><" ], "active_operator": 0 }, 3: { "type": "text", "operator": [">", "<", "=", "><" ], "active_operator": 0 }, 4: { "type": "text", "operator": [">", "<", "=", "><" ], "active_operator": 0 }, 5: { "type": "text", "operator": [">", "<", "=", "><" ], "active_operator": 0 } };
	    r.renderer.settings.header = null;
	    r.renderer.settings.tdata = null;
	    r.data(1, data);
	} else if (widget.currentType == 'boxplot') {
	    var data = widget.container2boxplot({ dataColIndex: 3, filter: filter });
	    r.data(1, data.data);
	    r.renderer.settings.x_labels = data.x_labels;
	    r.renderer.settings.chartArea = [ 120, 0, 0.8, 1 ];
	    r.renderer.settings.legendArea = [ 0.81, 0.1, 0.97, 1 ];
	}
	r.render(1);	   
    };

    /*
      HELPER FUNCTIONS
     */

    // display all current data containers
    widget.showDataContainers = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('availableContainers');

	if (container) {
	    var html = "";
	    if (stm.DataStore.hasOwnProperty('dataContainer') && Retina.keys(stm.DataStore.dataContainer).length) {
		var keys = Retina.keys(stm.DataStore.dataContainer).sort();
		for (var i=0; i<keys.length; i++) {
		    if (! widget.selectedContainer) {
			widget.selectedContainer = keys[i];
		    }
		    var glow = "";
		    if (keys[i] == widget.selectedContainer) {
			glow = " glow";
		    }
		    html += "<div style='width: 75px; word-wrap: break-word; float: left; text-align: center;' cname='"+keys[i]+"' onclick='Retina.WidgetInstances.metagenome_analysis[1].selectedContainer=this.getAttribute(\"cname\");Retina.WidgetInstances.metagenome_analysis[1].visualize(\"container\");'><img src='Retina/images/data.png' class='tool"+glow+"'><br>"+keys[i]+"</div>";
		}
		
	    }
	    html += "<div style='width: 75px; word-wrap: break-word; float: left; padding-left: 7px;' onclick='Retina.WidgetInstances.metagenome_analysis[1].loadDataUI();Retina.WidgetInstances.metagenome_analysis[1].showDataContainers();'><div class='tool' id='addDataIcon'><div style='font-weight: bold; font-size: 20px; margin-top: 4px; text-align: center;'>+</div></div></div>";
	    container.innerHTML = html;
	}
    };

    /*
      CALLBACK FUNCTIONS
     */

    // all promises for a data container have been fulfilled
    widget.dataContainerReady = function (name, abort) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var dataContainer = stm.DataStore.dataContainer[name];
	if (! abort && Retina.keys(stm.DataStore.inprogress).length) {
	    return;
	}
	dataContainer.promises = [];
	widget.xhr = {};
	dataContainer.status = abort ? abort : "ready";
	for (var i=0; i<dataContainer.callbacks.length; i++) {
	    dataContainer.callbacks[i].call(null, dataContainer);
	}
    };

    /*
      DATA CONTAINER CONVERSION METHODS
     */
    widget.container2graphseries = function (params) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var matrix = widget.container2matrix(params);
	
	var data = [];
	var palette = GooglePalette(matrix.rows.length);
	for (var i=0; i<matrix.rows.length; i++) {
	    var series = { name: matrix.rows[i], data: [], fill: palette[i] };
	    for (var h=0; h<matrix.cols.length; h++) {
		series.data.push(matrix.data[i][h]);
	    }
	    data.push(series);
	}
	
	var retval = { x_labels: matrix.cols, data: data };
	
	return retval;
    };

    widget.container2boxplot = function (params) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var matrix = widget.container2matrix(params);
	
	var data = [];
	var palette = GooglePalette(matrix.rows.length);
	for (var i=0; i<matrix.cols.length; i++) {
	    var series = { name: matrix.cols[i], data: [], fill: palette[i] };
	    for (var h=0; h<matrix.rows.length; h++) {
		series.data.push(matrix.data[h][i]);
	    }
	    data.push(series);
	}
	
	var retval = { x_labels: matrix.cols, data: data };
	
	return retval;
    };

    widget.container2plotseries = function (params) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var cname = params.container || widget.selectedContainer;
	var c = stm.DataStore.dataContainer[cname];

	var series = { data: { series: [ ],
			       points: [ ] } };

	var id = params.colHeader || 'id';

	var d = {};
	var dataRow = params.dataRow || 0;
	var isFiltered = false;
	if (c.hasOwnProperty('rows')) {
	    isFiltered = true;
	}
	var pid = c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source;
	var cp = stm.DataStore.profile[pid];
	var colItem = params.dataColItem || cp.mdname;
	var colIndex = params.dataColIndex;
	var palette = GooglePalette(c.items.length);
	for (var i=0; i<c.items.length; i++) {
	    var pid = c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source;
	    var p = stm.DataStore.profile[pid];
	    series.data.series.push( { name: c.items[i][id], color: palette[i] } );
	    series.data.points.push([]);
	    for (var h=0; h<(isFiltered ? c.rows[c.items[i].id].length : p.rows.length); h++) {
		var row = (isFiltered ? c.rows[c.items[i].id][h] : h);
		var val = p.data[row][dataRow];
		var key = (colIndex === null ? p.rows[row].metadata[colItem] : p.rows[row].metadata[colItem][colIndex]);

		if (params.filter && params.filter.level !== null && params.filter.value !== null) {
		    if (p.rows[row].metadata[colItem][params.filter.level] != params.filter.value) {
			continue;
		    }
		}

		if (! d.hasOwnProperty(key)) {
		    d[key] = [];
		    for (var j=0;j<c.items.length;j++) {
			d[key][j] = 0;
		    }
		}
		d[key][i] += val;
	    }
	}

	var rows = Retina.keys(d).sort();
	var max = 0;
	for (var i=0; i<rows.length; i++) {
	    for (var h=0; h<c.items.length; h++) {
		series.data.points[h].push({ x: i, y: d[rows[i]][h] });
		if (d[rows[i]][h] > max) {
		    max = d[rows[i]][h];
		}
	    }
	}
	series.x_min = 0;
	series.x_max = rows.length - 1;
	series.y_max = max;
	series.y_min = 0;

	return series;
    };

    widget.container2matrix = function (params) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var cname = params.container || widget.selectedContainer;
	var c = stm.DataStore.dataContainer[cname];

	var matrix = { data: [],
		       rows: [],
		       cols: [] };

	var id = params.colHeader || 'id';

	var d = {};
	var dataRow = params.dataRow || 0;
	var isFiltered = false;
	if (c.hasOwnProperty('rows')) {
	    isFiltered = true;
	}
	var levelIndex = {"domain": 0, "phylum": 1, "className": 2, "order": 3, "family": 4, "genus": 5, "species": 6};
	for (var i=0; i<c.items.length; i++) {
	    var pid = c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source;
	    var p = stm.DataStore.profile[pid];
	    matrix.cols.push(c.items[i][id]);
	    for (var h=0; h<(isFiltered ? c.rows[c.items[i].id].length : p.rows.length); h++) {
		var row = (isFiltered ? c.rows[c.items[i].id][h] : h);
		var val = p.data[row][dataRow];
		var org = p.rows[row].metadata["organism"][0];
		org = org.replace(/''/g, "'");
		if (! stm.DataStore.taxonomy["organism"][org]) {
		    console.log(org);
		    continue;
		}
		var key = stm.DataStore.taxonomy[params.level][stm.DataStore.taxonomy["organism"][org][levelIndex[params.level]]];
		if (params.filter && params.filter.level !== null && params.filter.value !== null) {
		    if (stm.DataStore.taxonomy[params.filter.level][stm.DataStore.taxonomy["organism"][org][levelIndex[params.filter.level]]] != params.filter.value) {
			continue;
		    }
		}

		if (! d.hasOwnProperty(key)) {
		    d[key] = [];
		    for (var j=0;j<c.items.length;j++) {
			d[key][j] = 0;
		    }
		}
		d[key][i] += val;
	    }
	}
	matrix.rows = Retina.keys(d).sort();
	for (var i=0; i<matrix.rows.length; i++) {
	    matrix.data.push(d[matrix.rows[i]]);
	}
	
	return matrix;
    };

    widget.container2table = function (params) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var cname = params.container || widget.selectedContainer;
	var c = stm.DataStore.dataContainer[cname];

	var d = {};
	var m = {};
	var isFiltered = false;
	if (c.hasOwnProperty('rows')) {
	    isFiltered = true;
	}
	var pid = c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source;
	var cp = stm.DataStore.profile[pid];
	var colItem = params.dataColItem || Retina.keys(cp.rows[0].metadata)[0];
	var colIndex = params.dataColIndex || cp.rows[0].metadata[colItem].length - 1;
	for (var i=0; i<c.items.length; i++) {
	    var pid = c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source;
	    var p = stm.DataStore.profile[pid];
	    for (var h=0; h<(isFiltered ? c.rows[c.items[i].id].length : p.rows.length); h++) {
		var row = (isFiltered ? c.rows[c.items[i].id][h] : h);
		var dataFields = p.data[row];
		var key = "";
		if (colIndex === null) {
		    key = p.rows[row].metadata[colItem];
		} else {
		    for (var j=0; j<=colIndex; j++) {
			key += p.rows[row].metadata[colItem][j];
		    }
		}
		key += c.items[i].id;

		if (params.filter && params.filter.level !== null && params.filter.value !== null) {
		    if (p.rows[row].metadata[colItem][params.filter.level] != params.filter.value) {
			continue;
		    }
		}

		if (! m.hasOwnProperty(key)) {
		    m[key] = [ c.items[i].id ];
		    if (colIndex === null) {
			m[key].push(p.rows[row].metadata[colItem]);
		    } else {
			for (var j=0; j<=colIndex; j++) {
			    m[key].push(p.rows[row].metadata[colItem][j]);
			}
		    }
		}

		if (! d.hasOwnProperty(key)) {
		    d[key] = [];
		    for (var j=0;j<dataFields.length;j++) {
			d[key][j] = 0;
		    }
		}
		for (var j=0;j<dataFields.length;j++) {
		    var val = p.data[row][j];
		    var func = "sum";
		    if (params.aggregationFunctions) {
			func = params.aggregationFunctions[j];
		    }
		    if (func == "sum") {
			d[key][j] += val;
		    }
		    else if (func = "average") {
			if (d[key][j] == 0) {
			    d[key][j] = [ val, 1 ];
			} else {
			    d[key][j] = [ d[key][j][0] + val, d[key][j][1] + 1 ] ;
			}
		    }
		}
	    }
	}
	var tableData = [];
	var rows = Retina.keys(d).sort();
	for (var i=0; i<rows.length; i++) {
	    var row = [];
	    for (var h=0; h<m[rows[i]].length; h++) {
		row.push(m[rows[i]][h]);
	    }
	    for (var h=0; h<d[rows[i]].length; h++) {
		if (typeof d[rows[i]][h].max == "function") {
		    d[rows[i]][h] = (d[rows[i]][h][0] / d[rows[i]][h][1]).round(2);
		}
		row.push(d[rows[i]][h]);
	    }
	    tableData.push(row);
	}

	var id = params.colHeader || 'metagenome';
	var tableHeaders = [ id ];
	for (var i=0; i<=colIndex; i++) {
	    if (c.parameters.type == "organism") {
		tableHeaders.push(widget.taxonTitles[i]);
	    } else {
		tableHeaders.push(i==(cp.rows[0].metadata[colItem].length - 1) ? "Function" : "Level "+(i+1));
	    }
	}
	for (var i=0; i<cp.columns.length; i++) {
	    tableHeaders.push(cp.columns[i].id);
	}

	return { data: tableData, header: tableHeaders };
    };

    /*
      DATA SECTION
     */
    widget.demoData = function () {
	return { 'matrix': { title: 'abundance matrix',
			    renderer: "matrix",
			    settings: { data: { rows: ['metagenome a', 'metagenome b', 'metagenome c'],
						columns: ['function 1', 'function 2', 'function 3', 'function 4', 'function 5', 'function 6', 'function 7', 'function 8', 'function 9', 'function 10' ],
						data: [ [1,2,3,4,5,4,3,2,1,0],
							[5,4,3,2,1,0,1,2,3,4],
							[0,1,0,4,0,7,0,3,0,2] ] },
					colHeaderHeight: 100 },
			  },
		 'heatmap': { title: 'heatmap',
			      renderer: "heatmap",
			      settings: { width: 200,
					  height: 200,
					  legend_height: 80,
					  legend_width: 400 }
			    },
		 'piechart': { title: 'piechart',
			       renderer: "graph",
			       settings: { title: ' ',
    					   type: 'pie',
    					   title_settings: { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
    					   x_labels: [""],
					   chartOptions: { },
    					   show_legend: true,
    					   //legendArea: [290, 20, 9 * 23, 250],
    					   //chartArea: [25, 20, 250, 250],
    					   width: 850,
    					   height: 650,
    					   data: [ { name: "Archaea", data: [ 100 ], fill: GooglePalette(9)[0] },
						   { name: "Bacteria", data: [ 50 ], fill: GooglePalette(9)[1] },
						   { name: "Eukaryota", data: [ 25 ], fill: GooglePalette(9)[2] },
						   { name: "Virus", data: [ 20 ], fill: GooglePalette(9)[3] },
						   { name: "unclassified", data: [ 19 ], fill: GooglePalette(9)[4] } ] }
			     },
		 'barchart': { title: 'barchart',
			       renderer: "graph",
			       settings: {'title': '',
    					  'type': 'row',
    					  'default_line_width': 1,
    					  'default_line_color': 'blue',
					  'x_labels': ['Metgenome A', 'Metgenome B', 'Metgenome C', 'Metgenome D', 'Metgenome E'],
    					  'x_labels_rotation': '310',
    					  'x_tick_interval': 5,
    					  'show_legend': true,
    					  'chartArea': [120, 0, 0.79, 1],
    					  'width': 830,
    					  'height': 540,
					  'data': [ { name: "Organism A", data: [ 50, 55, 54, 45, 41 ], fill: GooglePalette(5)[0] },
						    { name: "Organism B", data: [ 41, 52, 51, 42, 60 ], fill: GooglePalette(5)[1] },
						    { name: "Organism C", data: [ 45, 41, 60, 22, 19 ], fill: GooglePalette(5)[2] },
						    { name: "Organism D", data: [ 38, 27, 50, 32, 59 ], fill: GooglePalette(5)[3] },
						    { name: "Organism E", data: [ 49, 14, 40, 42, 79 ], fill: GooglePalette(5)[4] } ]
					 }
			     },
		 'table': { title: 'table',
			    renderer: 'table',
			    settings: {}
			  },
		 'boxplot': { title: 'boxplot',
			      renderer: 'graph',
			      settings: { 'title': '',
    					  'type': 'deviation',
    					  'default_line_width': 1,
    					  'default_line_color': 'blue',
					  'x_labels': ['Metgenome A', 'Metgenome B', 'Metgenome C', 'Metgenome D', 'Metgenome E'],
    					  'x_labels_rotation': '310',
    					  'x_tick_interval': 5,
    					  'show_legend': true,
    					  'chartArea': [120, 0, 0.79, 1],
					  'legendArea': [0.8, 0.1, 1, 1],
    					  'width': 830,
    					  'height': 540,
					  'data': [ { name: "Organism A", data: [ 50, 55, 54, 45, 41 ], fill: GooglePalette(5)[0] },
						    { name: "Organism B", data: [ 41, 52, 51, 42, 60 ], fill: GooglePalette(5)[1] },
						    { name: "Organism C", data: [ 45, 41, 60, 22, 19 ], fill: GooglePalette(5)[2] },
						    { name: "Organism D", data: [ 38, 27, 50, 32, 59 ], fill: GooglePalette(5)[3] },
						    { name: "Organism E", data: [ 49, 14, 40, 42, 79 ], fill: GooglePalette(5)[4] } ] }
			    }
	       };
    };

    /*
      DATA LOADING UI
    */
    widget.loadDataUI = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var target = document.getElementById('data');
	document.getElementById("visualize").style.display = "none";
	document.getElementById("data").style.display = "";

	if (! widget.hasOwnProperty('mgselect')) {

	    // border and title
	    var html = [ "<div style='border: 1px solid #dddddd; border-radius: 6px; padding: 10px;'><h3 style='margin-top: 0px;'>Data Loader <span style='cursor: pointer;'><sup>[?]</sup></span></h3><div>" ];


	    // params container
	    html.push("<div>");

	    // protein vs rna
	    html.push('<div class="span4"><h5>database</h5><div><div class="btn-group" data-toggle="buttons-radio" style="float: left;"><button type="button" class="btn active" onclick="Retina.WidgetInstances.metagenome_analysis[1].showDatabases(\'protein\');">protein</button><button type="button" class="btn" onclick="Retina.WidgetInstances.metagenome_analysis[1].showDatabases(\'RNA\');">RNA</button></div><div id="databaseSelect" style="position: relative; bottom: 3px"></div></div></div>');

	    // hit type
	    html.push('<div class="span6"><h5>hit type</h5><div><div class="btn-group" data-toggle="buttons-radio">\
                       <button type="button" class="btn active" onclick="Retina.WidgetInstances.metagenome_analysis[1].dataLoadParams.type=\'single\';">representative hit</button>\
                       <button type="button" class="btn" onclick="Retina.WidgetInstances.metagenome_analysis[1].dataLoadParams.type=\'all\';">best hit</button>\
                       <button type="button" class="btn" onclick="Retina.WidgetInstances.metagenome_analysis[1].dataLoadParams.type=\'lca\';">lowest common ancestor</button></div></div></div>');

	    // params container close and divider
	    html.push('</div><div style="clear: both;"></div>');

	     // metagenome selector
	    html.push('<h5 style="margin-top: 0px;">metagenomes</h5><div id="mgselect"><img src="Retina/images/waiting.gif" style="margin-left: 40%; width: 24px;"></div>');

	    // data progress
	    html.push('<div id="dataprogress" style="float: left; margin-top: 25px; margin-left: 20px; height: 230px; overflow-y: auto; width: 90%;"></div><div style="clear: both;">');
	    
	    // close border
	    html.push('</div>');

	    // fill the content
	    target.innerHTML = html.join("");

	    // show the databases
	    widget.showDatabases("protein");
	    
	    widget.mgselect = Retina.Widget.create('mgbrowse',
						   { target: document.getElementById("mgselect"),
						     type: "listselect",
						     multiple: true,
						     result_field: true,
						     result_field_placeholder: "data container name",
						     wide: true,
						     callback: Retina.WidgetInstances.metagenome_analysis[1].loadData });
	    widget.mgselect.display();
	}
    }

    // show the available databases for either protein or RNA
    widget.showDatabases = function (which) {
	var widget = this;

	var html = ['<ul class="nav nav-pills" style="float: left; margin-left: 20px;"><li class="dropdown">\
<a class="dropdown-toggle" style="border: 1px solid;" data-toggle="dropdown" href="#"><span id="selectedSource">'+widget.sources[which][0]+'</span> <b class="caret"></b></a>\
<ul class="dropdown-menu" role="menu">'];

	for (var i=0; i<widget.sources[which].length; i++) {
	    html.push(' <li><a href="#" onclick="document.getElementById(\'selectedSource\').innerHTML=\''+widget.sources[which][i]+'\';Retina.WidgetInstances.metagenome_analysis[1].dataLoadParams.source=\''+widget.sources[which][i]+'\';">'+widget.sources[which][i]+'</a></li>');
	}
	   
	html.push('</ul></li></ul>');

	document.getElementById('databaseSelect').innerHTML = html.join("");
	widget.dataLoadParams.source = widget.sources[which][0];
    };

    widget.taxonTitles = [ "domain", "phylum", "className", "order", "family", "genus", "species", "strain" ];
    widget.sources = { "protein": ["RefSeq", "IMG", "TrEMBL", "SEED", "KEGG", "GenBank", "SwissProt", "PATRIC", "eggNOG"], "RNA": ["RDP", "LSU", "SSU", "ITS", "Greengenes"] };

     widget.loadDone = function (container) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (container.status == "ready") {
	    var html = "<p style='text-align: center;'>Your data is loaded and was placed in this container.<br>Click to analyze.</p>";
	    html += '<div style="cursor: pointer; border: 1px solid rgb(221, 221, 221); border-radius: 6px; box-shadow: 2px 2px 2px; margin-left: auto; margin-right: auto; margin-top: 20px; font-weight: bold; height: 75px; width: 75px; text-align: center;" onclick="Retina.WidgetInstances.metagenome_analysis[1].selectedContainer=\''+container.id+'\';Retina.WidgetInstances.metagenome_analysis[1].visualize();document.getElementById(\'dataprogress\').innerHTML=\'\';" class="glow"><img src="Retina/images/data.png" style="margin-top: 5px; width: 50px;">'+container.id+'</div>';
	    widget.selectedContainer = container.id;
	    document.getElementById('dataprogress').innerHTML = html;
	    widget.performFilter();
	    widget.showDataContainers();
	} else {
	    document.getElementById('dataprogress').innerHTML = "Your data load was aborted";
	}
    };

    // create a progress div
    widget.pDiv = function (id, done, name, type, source, cname) {
	var progressContainer = document.getElementById('dataprogress');
	if (document.getElementById(id)) {
	    return;
	}
	var div = document.createElement('div');
	div.setAttribute('id', id);
	div.setAttribute('class', 'prog');
	div.setAttribute('style', 'margin-left: 15px; float: left; width: 300px;');
	div.innerHTML = '<div>'+name+'</div><div><div class="progress'+(done ? '' : ' progress-striped active')+'" style="width: 100px; float: left; margin-right: 5px;"><div class="bar" id="progressbar'+id+'" style="width: '+(done ? '100' : '0' )+'%;"></div></div><div id="progress'+id+'" style="float: left;">'+(done ? "complete." : "waiting for server... <img src='Retina/images/waiting.gif' style='height: 16px; position: relative; bottom: 2px;'><button class='btn btn-mini btn-danger' onclick='Retina.WidgetInstances.metagenome_analysis[1].abortLoad(\""+id+"\", null, \""+cname+"\");' style='margin-left: 5px;'>cancel</button>")+'</div></div>';
	progressContainer.appendChild(div);
    };

    /*
      DATA LOADING BACKEND
     */

    widget.dataLoadParams = { source: "RefSeq",
			      type: "single" };

    widget.xhr = {};

    // perform a set of API requests and create a data container
    widget.loadData = function (ids, collectionName, params) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (! stm.DataStore.hasOwnProperty('dataContainer')) {
	    stm.DataStore.dataContainer = {};
	}	

	var type = widget.dataLoadParams.type;
	var source = widget.dataLoadParams.source;
	var name = collectionName || widget.dataLoadParams.name || "data"+Retina.keys(stm.DataStore.dataContainer).length;

	if (ids.length) {
	    if (! name) {
		var i = Retina.keys(stm.DataStore.dataContainer).length;
		while (stm.DataStore.dataContainer.hasOwnProperty('data_'+i)) {
		    i++;
		}
		name = 'data_'+i;
		document.getElementById('dataContainerName').value = name;
	    }
	    if (stm.DataStore.dataContainer.hasOwnProperty(name) && ! params) {
		if (! confirm("The name '"+name+"' already exists. Do you want \nto replace it with the current selection?")) {
		    return;
		}
	    }
	    document.getElementById('dataprogress').innerHTML = "";
	    stm.DataStore.dataContainer[name] = { id: name,
						  source: 'load',
						  type: 'biom',
						  items: ids,
						  status: "loading",
						  promises: [],
						  callbacks: [],
						  parameters: { type: type,
								source: source,
								evalue: widget.cutoffThresholds.evalue,
								identity: widget.cutoffThresholds.identity ,
								alilength: widget.cutoffThresholds.length,
								taxFilter: {},
								ontFilter: {} },
						  created: Retina.date_string(new Date().getTime()),
						  user: stm.user || "anonymous" };
	    if (typeof Retina.WidgetInstances.metagenome_analysis[1].loadDone == "function") {
		stm.DataStore.dataContainer[name].callbacks.push(Retina.WidgetInstances.metagenome_analysis[1].loadDone);
	    }
	}
	if (! stm.DataStore.hasOwnProperty('profile') ) {
	    stm.DataStore.profile = {};
	}
	if (! stm.DataStore.hasOwnProperty('inprogress')) {
	    stm.DataStore.inprogress = {};
	}
	for (var i=0;i<ids.length;i++) {
	    var id = ids[i].id+"_"+type+"_"+source;
	    
	    // check if the profile is already loaded
	    var needsLoad = true;
	    if (stm.DataStore.profile.hasOwnProperty(id)) {
		needsLoad = false;
	    }
	    if (needsLoad && ! stm.DataStore.inprogress.hasOwnProperty('profile'+id)) {
		widget.pDiv('profile'+id, false, ids[i].name, type, source, name);

		stm.DataStore.inprogress['profile'+id] = 1;
		stm.DataStore.dataContainer[name].promises.push(
		    jQuery.ajax({ url: RetinaConfig.mgrast_api + "/profile/" + ids[i].id + "?type=feature&asynchronous=1&source="+source+"&nocutoff=1&hit_type="+type,
				  dc: name,
				  headers: stm.authHeader,
				  bound: 'profile'+id,
				  success: function (data) {
				      var widget = Retina.WidgetInstances.metagenome_analysis[1];
				      if (data != null) {
					  if (data.hasOwnProperty('ERROR')) {
					      console.log("error: "+data.ERROR);
					  } else if (data.hasOwnProperty('status')) {
					      if (data.status == 'done') {
						  widget.downloadComputedData(this.bound, this.dc, data.url);
					      } else {
						  widget.queueDownload(this.bound, data.url, this.dc);
					      }
					  }
				      } else {
					  console.log("error: invalid return structure from API server");
					  console.log(data);
				      }
				  },
				  error: function(jqXHR, error) {
				      Retina.WidgetInstances.metagenome_analysis[1].deleteProgress(this.bound);
				  },
				  complete: function () {
				      Retina.WidgetInstances.metagenome_analysis[1].dataContainerReady(this.dc);
				  }
				}));
	    } else {
		widget.pDiv('profile'+id, true, ids[i].name, type, source, name);
	    }
	}
	if (ids.length) {
	    Retina.WidgetInstances.metagenome_analysis[1].dataContainerReady(name);
	}

	return;
    };

    widget.queueDownload = function (id, url, name) {
	var widget = this;

	var container = stm.DataStore.dataContainer[name];

	var timeout = stm.DataStore.inprogress[id] > 3 ? 60 : stm.DataStore.inprogress[id] * 10;
	stm.DataStore.inprogress[id]++;
	var sid = id.replace(/^profile/, "");

	widget.xhr[sid] = window.setTimeout(widget.checkDownload.bind(null, id, url, name), timeout * 1000);
    };

    widget.checkDownload = function (id, url, name) {
	return jQuery.ajax({ url: url,
			     dc: name,
			     headers: stm.authHeader,
			     bound: id,
			     success: function (data) {
				 var widget = Retina.WidgetInstances.metagenome_analysis[1];
				 if (data != null) {
				     if (data.hasOwnProperty('ERROR')) {
					 console.log("error: "+data.ERROR);
				     } else if (data.hasOwnProperty('status')) {
					 if (data.status == 'done') {
					     widget.downloadComputedData(this.bound, this.dc, data.url);
					 } else {
					     widget.queueDownload(this.bound, data.url, this.dc);
					 }
				     }
				 } else {
				     console.log("error: invalid return structure from API server");
				     console.log(data);
				 }
			     },
			     error: function(jqXHR, error) {
				 Retina.WidgetInstances.metagenome_analysis[1].deleteProgress(this.bound);
			     },
			     complete: function () {
				 Retina.WidgetInstances.metagenome_analysis[1].dataContainerReady(this.dc);
			     }
			   });
    };

    widget.downloadComputedData = function (id, name, url) {
	var widget = this;

	return jQuery.ajax({ bound: id,
			     url: url,
			     headers: stm.authHeader,
			     dataType: "json",
			     id: id,
			     dc: name,
			     beforeSend: function (xhr) {
				 xhr.dc = this.dc;
				 Retina.WidgetInstances.metagenome_analysis[1].xhr[this.id] = xhr;
			     },
			     success: function(data) {
				 var widget = Retina.WidgetInstances.metagenome_analysis[1];
				 if (data != null) {
				     if (data.hasOwnProperty('ERROR')) {
					 console.log("error: "+data.ERROR);
				     } else {
					 var cont = stm.DataStore.dataContainer[this.dc];
					 stm.DataStore.profile[data.data.id.replace(/feature/, cont.parameters.type)] = data.data;
				     }
				 } else {
				     console.log("error: invalid return structure from API server");
				     console.log(data);
				 }
			     },
			     error: function(jqXHR, error) {
				 Retina.WidgetInstances.metagenome_analysis[1].abortLoad(this.bound, error, this.dc);
			     },
			     xhr: function() {
				 var xhr = new window.XMLHttpRequest();
				 xhr.bound = this.bound;
				 xhr.addEventListener("progress", function(evt){
				     var display = document.getElementById('progress'+this.bound);
				     if (display) {
					 if (evt.lengthComputable) {
					     var bar = document.getElementById('progressbar'+this.bound);
					     bar.parentNode.setAttribute('class', 'progress')
					     var percentComplete = parseInt(evt.loaded / evt.total * 100);
					     display.innerHTML = evt.loaded.byteSize();
					     bar.style.width = percentComplete +"%";
					 } else {
					     display.innerHTML = evt.loaded.byteSize();
					 }
				     }
				 }, false); 
				 return xhr;
			     },
			     complete: function () {
				 delete stm.DataStore.inprogress[this.bound];
				 Retina.WidgetInstances.metagenome_analysis[1].deleteProgress(this.bound);
				 Retina.WidgetInstances.metagenome_analysis[1].dataContainerReady(this.dc);
			     }
			   });
    };

    widget.deleteProgress = function (id) {
	var widget = this;

	delete stm.DataStore.inprogress[id];
	var bar = document.getElementById('progressbar'+id);
	if (bar) {
	    document.getElementById('progress'+id).innerHTML += " - complete.";
	    bar.parentNode.setAttribute('class', 'progress');
	    bar.setAttribute('class', 'bar bar-success');
	    bar.style.width = '100%';
	}
    };
    
    widget.abortLoad = function (id, abort, name) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var sid = id.replace(/^profile/, "");
	var k = Retina.keys(widget.xhr);
	for (var i=0; i<k.length; i++) {
	    if (typeof widget.xhr[k[i]] == 'number') {
		window.clearTimeout(widget.xhr[k[i]]);
	    } else {
		widget.xhr[k[i]].abort();
	    }
	}
	var container = stm.DataStore.dataContainer[name];
	widget.xhr = [];
	container.promises = [];
	stm.DataStore.inprogress = {};
	
	Retina.WidgetInstances.metagenome_analysis[1].dataContainerReady(container.id, abort || "aborted by user");
    };

    /*
      EXPORT FUNCTIONS
     */
    widget.exportData = function (type) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (! widget.selectedContainer) {
	    alert('you currently have no data selected');
	    return;
	}

	if (type == 'png') {
	    // set the output div
	    var resultDiv = document.createElement('div');
	    resultDiv.setAttribute('style', 'display: none;');
	    resultDiv.setAttribute('id', 'canvasResult');
	    document.body.appendChild(resultDiv);
	    
	    // the image is svg
	    if (document.getElementById('graph_div1')) {
		var source = document.getElementById('graph_div1').firstChild;
		Retina.svg2png(null, resultDiv, source.getAttribute('width'), source.getAttribute('height')).then(
		    function() {
			Retina.WidgetInstances.metagenome_analysis[1].saveCanvas();
		    });
	    }
	    // the image is html
	    else {
		var source = document.getElementById('visualizeBreadcrumbs').nextSibling;
		
		html2canvas(source, {
		    onrendered: function(canvas) {
			document.getElementById('canvasResult').appendChild(canvas);
			Retina.WidgetInstances.metagenome_analysis[1].saveCanvas();
		    }
		});
	    }
	} else if (type == 'svg') {
	    // the image is svg
	    if (document.getElementById('graph_div1')) {
		stm.saveAs(document.getElementById('graph_div1').innerHTML, widget.selectedContainer + ".svg");
	    } else {
		alert('this feature is not available for this view');
	    }
	} else if (type == 'json') {
	    stm.saveAs(JSON.stringify(widget.container2matrix({ dataColIndex: document.getElementById('matrixLevel') ? document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value : 'domain', filter: widget.currentFilter }), null, 2), widget.selectedContainer + ".json");
	    return;
	} else if (type == 'tsv') {
	    var exportData = widget.container2table({ dataColIndex: document.getElementById('matrixLevel') ? document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value : 'domain', filter: widget.currentFilter });
	    var exportString = [];
	    exportString.push(exportData.header.join("\t"));
	    for (var i=0; i<exportData.data.length; i++) {
		exportString.push(exportData.data[i].join("\t"));
	    }
	    stm.saveAs(exportString.join("\n"), widget.selectedContainer + ".tsv");
	    return;
	}
    };

    widget.saveCanvas = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	// create the href and click it
	var href = document.createElement('a');
	var canvas = document.getElementById('canvasResult').children[0];
	href.setAttribute('href', canvas.toDataURL());
	href.setAttribute('download', widget.selectedContainer + ".png");
	href.setAttribute('style', 'display: none;');
	document.body.appendChild(href);
	href.click();

	// remove the elements
	document.body.removeChild(href);
	document.body.removeChild(document.getElementById('canvasResult'));
    };

    // LOAD BACKGROUND DATA
    widget.loadBackgroundData = function () {
	var widget = this;
	
	JSZipUtils.getBinaryContent('data/tax.v1.json.zip', function(err, data) {
	    if(err) {
		throw err; // or handle err
	    }
	    
	    var zip = new JSZip();
	    zip.loadAsync(data).then(function(zip) {
		zip.file("tax.json").async("string").then(function (tax) {
	    	    tax = JSON.parse(tax);
		    var out = { "domain": [], "phylum": [], "className": [], "order": [], "family": [], "genus": [], "species": [], "organism": {} };
		    for (var d in tax) {
			if (tax.hasOwnProperty(d)) {
			    for (var p in tax[d]) {
				if (tax[d].hasOwnProperty(p)) {
				    for (var c in tax[d][p]) {
					if (tax[d][p].hasOwnProperty(c)) {
					    for (var o in tax[d][p][c]) {
						if (tax[d][p][c].hasOwnProperty(o)) {
						    for (var f in tax[d][p][c][o]) {
							if (tax[d][p][c][o].hasOwnProperty(f)) {
							    for (var g in tax[d][p][c][o][f]) {
								if (tax[d][p][c][o][f].hasOwnProperty(g)) {
								    for (var s in tax[d][p][c][o][f][g]) {
									if (tax[d][p][c][o][f][g].hasOwnProperty(s)) {
									    for (var org in tax[d][p][c][o][f][g][s]) {
										if (tax[d][p][c][o][f][g][s].hasOwnProperty(org)) {
										    out.organism[org] = [ out.domain.length, out.phylum.length, out.className.length, out.order.length, out.family.length, out.genus.length, out.species.length ];
										}
									    }
									    out.species.push(s);
									}
								    }
								    out.genus.push(g)
								}
							    }
							    out.family.push(f);
							}
						    }
						    out.order.push(o);
						}
					    }
					    out.className.push(c);
					}
				    }
				    out.phylum.push(p);
				}
			    }
			    out.domain.push(d);
			}
		    }
		    
		    stm.DataStore.taxonomy = out;
		    document.getElementById('data').innerHTML = 'loading ontology data... <img src="Retina/images/waiting.gif" style="width: 16px;">';
		    jQuery.getJSON('data/ont.v1.json').then(function(d) {
			stm.DataStore.ontology = d;
			document.getElementById('data').innerHTML = 'creating local store... <img src="Retina/images/waiting.gif" style="width: 16px;">';
			stm.updateHardStorage("analysis", { "ontology": true, "taxonomy": true }).then( function () {
			    Retina.WidgetInstances.metagenome_analysis[1].display();
			});
		    });
		});
	    });
	});
    };

    widget.testFunctions = function () {
	var widget = this;

	var profile = "mgm4448226.3_single_SEED";

	var found = 0;
	var notFound = {};
	var p = stm.DataStore.profile[profile];
	for (var i=0; i<p.rows.length; i++) {
	    for (var h=0; h<p.rows[i].metadata['function'].length; h++) {
		var func = p.rows[i].metadata['function'][h];
		if (stm.DataStore.ontology.functions.hasOwnProperty(func)) {
		    found++;
		} else {
		    if (notFound.hasOwnProperty(func)) {
			notFound[func]++;
		    } else {
			notFound[func] = 1;
		    }
		}
	    }
	}
	console.log(found);
	console.log(Retina.keys(notFound).length);
	console.log(notFound);
    };

})();
