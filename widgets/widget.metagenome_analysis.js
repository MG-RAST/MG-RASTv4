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
		 Retina.load_renderer('table'),
		 Retina.load_renderer('svg2')
	       ];
    };

    widget.taxonTitles = [ "domain", "phylum", "className", "order", "family", "genus", "species", "strain" ];
    widget.sources = { "protein": ["RefSeq", "IMG", "TrEMBL", "SEED", "KEGG", "GenBank", "SwissProt", "PATRIC", "eggNOG"], "RNA": ["RDP", "LSU", "SSU", "ITS", "Greengenes"], "hierarchical": ["Subsystems","KO","COG","NOG"] };


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

	widget.graph = Retina.Renderer.create("svg2", {});
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
    	    var pid = c.items[0].id;
    	    var p = stm.DataStore.profile[pid];
    	    var mdname = "";
    	    if (p.data.length > 0) {
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

	/* TEST */
	// if (widget.currentType == "barchart") {
	//     widget.graph.settings.target = document.getElementById("visualizeTarget");
	//     jQuery.extend(widget.graph.settings, widget.testVis);
	//     widget.graph.settings.data = stm.DataStore.dataContainer[widget.selectedContainer].matrix;
	//     widget.graph.render();
	//     return;
	// }

	/* TEST END */

    	demo_data[type].settings.target = document.getElementById('visualizeTarget');
    	if (Retina.RendererInstances[demo_data[type].renderer] && Retina.RendererInstances[demo_data[type].renderer].length > 1) {
    	    Retina.RendererInstances[demo_data[type].renderer] = [ Retina.RendererInstances[demo_data[type].renderer][0] ];
    	}
    	if (Retina.WidgetInstances.RendererController.length > 1) {
    	    Retina.WidgetInstances.RendererController = [ Retina.WidgetInstances.RendererController[0] ];
    	}
    	widget.currentVisualizationController = Retina.Widget.create('RendererController', { "target": document.getElementById("visualizeTarget"), "type": demo_data[type].renderer, "settings": demo_data[type].settings, "noControl": true });

    	if (widget.selectedContainer) {
    	    widget.updateVis();
    	}
    };

    widget.editContainer = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('visualize');
	var html = [];
	var onts = { "Subsystems": true, "KO": true, "COG": true, "NOG": true };
	if (widget.selectedContainer) {
	    html.push("<h3>edit data container<button class='btn btn-danger' style='float: right;' title='delete data container' onclick='if(confirm(\"Really delete this data container? (This will not remove the loaded profile data)\")){Retina.WidgetInstances.metagenome_analysis[1].removeDataContainer();};'><i class='icon icon-trash'></i></button></h3><p>Here you can view and modify the settings of the selected data container.</p>")
	    var c = stm.DataStore.dataContainer[widget.selectedContainer];
	    
	    html.push("<table>");
	    html.push("<tr><td style='height: 30px; width: 200px;'>name</td><td><div class='input-append' style='margin-bottom: 0px;'><input type='text' value='"+c.id+"'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].renameContainer(this.previousSibling.value);'>update</button></div></td></tr>");
	    var uname = typeof c.user == "object" ? c.user.firstname+" "+c.user.lastname+" ("+c.user.login+")" : c.user;
	    html.push("<tr><td style='height: 30px;'>created</td><td>"+c.created+"</td></tr>");
	    html.push("<tr><td style='height: 30px;'>by</td><td>"+uname+"</td></tr>");
	    html.push("<tr><td style='height: 30px;'>sources</td><td>"+c.parameters.sources.join(", ")+"</td></tr></table>");

	    html.push('<h4>Filter Parameters</h4>');
	    
	    html.push("<table><tr><td style='height: 30px; width: 200px;'>e-value</td><td><div class='input-append' style='margin-bottom: 0px;'><input type='text' value='"+c.parameters.evalue+"' class='span3' id='containerParamevalue'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"evalue\",this.previousSibling.value);'>update</button></div></td></tr>");
	    html.push("<tr><td style='height: 30px;'>%-identity</td><td><div class='input-append' style='margin-bottom: 0px;'><input type='text' value='"+c.parameters.identity+"' class='span3' id='containerParamidentity'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"identity\",this.previousSibling.value);'>update</button></div></td></tr>");
	    html.push("<tr><td style='padding-right: 20px; height: 30px;'>alignment length</td><td><div class='input-append' style='margin-bottom: 0px;'><input type='text' value='"+c.parameters.alilength+"' class='span3' id='containerParamlength'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"alilength\",this.previousSibling.value);'>update</button></div></td></tr>");

	    var taxSelect = "<select onchange='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"displayLevel\",this.options[this.selectedIndex].value);'>";
	    var taxSelect2 = "<select id='taxType' style='width: 120px;'>";
	    for (var i=0; i<c.parameters.sources.length; i++) {
		taxSelect2 += "<option>"+c.parameters.sources[i]+"</option>";
	    }
	    taxSelect2 += "</select><br>";
	    taxSelect2 += "<select id='displayTaxSelect' style='width: 120px;"+(c.parameters.displayType == 'function' ? " display: none;" : "")+"' onchange='if(this.selectedIndex<6){jQuery(\"#taxText\").data(\"typeahead\").source=stm.DataStore.taxonomy[this.options[this.selectedIndex].value];}else{jQuery(\"#taxText\").data(\"typeahead\").source=[];}'>";
	    var taxLevels = [ "domain", "phylum", "className", "order", "family", "genus", "species" ];
	    for (var i=0; i<taxLevels.length; i++) {
		var sel = "";
		if (taxLevels[i] == c.parameters.displayLevel) {
		    sel = " selected=selected";
		}
		taxSelect += "<option"+sel+" value='"+taxLevels[i]+"'>"+(taxLevels[i] == 'className' ? 'class' : taxLevels[i])+"</option>";
		taxSelect2 += "<option value='"+taxLevels[i]+"'>"+(taxLevels[i] == 'className' ? 'class' : taxLevels[i])+"</option>";
	    }
	    taxSelect += "</select>";
	    taxSelect2 += "</select>";
	    var levelSelect = "<select id='displayLevelSelect' style='width: 120px;"+(c.parameters.displayType == 'function' ? "" : " display: none;")+"' onchange='if(this.selectedIndex<6){jQuery(\"#funcText\").data(\"typeahead\").source=stm.DataStore.ontology["+c.parameters.displaySource+"][this.options[this.selectedIndex].value];}else{jQuery(\"#funcText\").data(\"typeahead\").source=[];}'>";
	    var levels = ['level1','level2','level3','function'];
	    for (var i=0; i<levels.length; i++) {
		var sel = "";
		if (levels[i] == c.parameters.displayLevel) {
		    sel = " selected=selected";
		}
		levelSelect += "<option"+sel+">"+levels[i]+"</option>";
	    }
	    levelSelect += "</select>";

	    var taxFilter = taxSelect2 + "<div class='input-append'><input type='text' autocomplete='off' id='taxText'><button class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"taxFilter\", \"add\", document.getElementById(\"taxType\").options[document.getElementById(\"taxType\").selectedIndex].value, this.parentNode.previousSibling.options[this.parentNode.previousSibling.selectedIndex].value, document.getElementById(\"taxText\").value);'>add</button></div>";
	    html.push("<tr><td style='vertical-align: top; padding-top: 5px;'>taxonomy filters</td><td>"+taxFilter+"</td></tr>");

	    html.push("<tr><td colspan=2>");
	    for (var i=0; i<c.parameters.taxFilter.length; i++) {
		html.push("<button class='btn btn-mini btn-danger' style='margin-right: 15px;' title='remove this filter' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"taxFilter\", \"remove\", \""+i+"\");'><i class='icon icon-remove'></i> "+c.parameters.sources[c.parameters.taxFilter[i].source] + " - " + c.parameters.taxFilter[i].level + " - " + c.parameters.taxFilter[i].value+"</button>");
	    }
	    html.push("</td></tr>");

	    var ontLevels = { "Subsystems": ["level1","level2","level3","functions"], "KO": ["level1","level2","level3","functions"], "COG": ["level1","level2","functions"], "NOG": ["level1","level2","functions"] };
	    var ontTypeSelect = '<select style="width: 120px;" id="ontType" onchange="';
	    for (var i=0; i<onts.length; i++) {
		ontTypeSelect += 'document.getElementById(\''+onts[i]+'SelectDiv\').style.display=\'none\';';
	    }
	    ontTypeSelect += 'document.getElementById(this.options[this.selectedIndex].value+\'SelectDiv\').style.display=\'\';">';
	    var ontSelects = [];
	    for (var i=0; i<c.parameters.sources.length; i++) {
		if (onts[c.parameters.sources[i]]) {
		    ontTypeSelect += "<option>"+c.parameters.sources[i]+"</option>";
		    ontSelects.push('<div id="'+c.parameters.sources[i]+'SelectDiv" style="'+(ontSelects.length ? "display: none;" : "")+'"><select style="width: 120px;" id="'+c.parameters.sources[i]+'Select" onchange="jQuery(\'#'+c.parameters.sources[i]+'SelectText\').data(\'typeahead\').source=stm.DataStore.ontology[\''+c.parameters.sources[i]+'\'][this.options[this.selectedIndex].value];">');
		    for (var h=0; h<ontLevels[c.parameters.sources[i]].length; h++) {
			ontSelects.push('<option>'+ontLevels[c.parameters.sources[i]][h]+'</option>');
		    }
		    ontSelects.push('</select><div class="input-append"><input type="text" id="'+c.parameters.sources[i]+'SelectText" autocomplete="off"><button class="btn" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'ontFilter\', \'add\', document.getElementById(\'ontType\').options[document.getElementById(\'ontType\').selectedIndex].value,this.parentNode.previousSibling.options[this.parentNode.previousSibling.selectedIndex].value, document.getElementById(\''+c.parameters.sources[i]+'SelectText\').value);">add</button></div></div>');
		}
	    }
	    ontTypeSelect += '</select>';

	    if (ontSelects.length) {
		html.push("<tr><td style='vertical-align: top; padding-top: 5px;'>functional hierarchy filters</td><td>"+ontTypeSelect+ontSelects.join("")+"</td></tr>");
		
		html.push("<tr><td colspan=2>");
		for (var i=0; i<c.parameters.ontFilter.length; i++) {
		    html.push("<button class='btn btn-mini btn-danger' style='margin-right: 15px;' title='remove this filter' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"ontFilter\", \"remove\", \""+i+"\");'><i class='icon icon-remove'></i> "+c.parameters.sources[c.parameters.ontFilter[i].source] + " - " + c.parameters.ontFilter[i].level + " - " + c.parameters.ontFilter[i].value+"</button>");
		}
		html.push("</td></tr>");
	    }
	    
	    html.push("</table>");

	    html.push('<h4>Display Parameters</h4>');
	    html.push('<table>');

	    var mdSelect = [ "<select onchange='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"metadatum\",this.options[this.selectedIndex].value);'>" ];
	    var mdkeys = Retina.keys(c.items[0]).sort();
	    for (var i=0; i<mdkeys.length; i++) {
		var sel = "";
		if (mdkeys[i] == c.parameters.metadatum) {
		    sel = " selected=selected";
		}
		mdSelect.push("<option"+sel+">"+mdkeys[i]+"</option>");
	    }
	    mdSelect.push('</select>');

	    html.push("<tr><td style='vertical-align: top; padding-top: 5px; height: 30px; width: 200px;'>display type</td><td><select><option>taxonomy</option><option>function</option></select></td></tr>");
	    html.push("<tr><td style='vertical-align: top; padding-top: 5px; height: 30px; width: 200px;'>display source</td><td><select>");
	    for (var i=0; i<c.parameters.sources.length; i++) {
		var sel = "";
		if (c.parameters.sources[i] == c.parameters.displaySource) {
		    sel = " selected=selected";
		}
		html.push("<option"+sel+">"+c.parameters.sources[i]+"</option>");
	    }
	    html.push("</select></td></tr>");
	    html.push("<tr><td style='vertical-align: top; padding-top: 5px; height: 30px; width: 200px;'>display level</td><td>"+taxSelect+levelSelect+"</td></tr>");
	    html.push("<tr><td style='vertical-align: top; padding-top: 5px;'>metadatum</td><td>"+mdSelect.join('')+"</td></tr>");

	    html.push('</table>');
	    
	    html.push('<h4>Result Sets</h4>');

	    html.push("<table><th style='text-align: left;'>name</th><th style='text-align: right; padding-left: 100px;'># total hits</th></tr>");
	    for (var i=0; i<c.items.length; i++) {
		html.push("<tr><td>"+c.items[i].name+"</td><td style='text-align: right; padding-left: 100px;'>"+c.matrix.abundances[i].formatString()+"</td></tr>");
	    }
	    html.push("</table>");
	} else {
	    html.push("<p>You currently have no data loaded. To do so, click the <span style='border: 1px solid black; border-radius: 3px; padding-bottom: 2px; padding-left: 5px; padding-right: 4px; font-weight: bold;'>+</span> icon on the right.</p>");
	    document.getElementById('addDataIcon').className = "tool glow";
	}

	container.innerHTML = html.join("");
	if (widget.selectedContainer) {
	    
	    jQuery("#taxText").typeahead({"source": stm.DataStore.taxonomy.domain});
	    for (var i=0; i<c.parameters.sources.length; i++) {
		if (onts[c.parameters.sources[i]]) {
		    jQuery("#"+c.parameters.sources[i]+"SelectText").typeahead({"source": stm.DataStore.ontology[c.parameters.sources[i]].level1});
		}
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
	if (param == 'taxFilter') {
	    if (value == "remove") {
		container.parameters.taxFilter.splice(value2, 1);
	    } else {
		var source;
		for (var i=0; i<container.parameters.sources.length; i++) {
		    if (container.parameters.sources[i] == value2) {
			source = i;
			break;
		    }
		}
		container.parameters.taxFilter.push({ "source": source, "level": value3, "value": value4 });
	    }
	}
	// check if this is an ontology filter
	else if (param == 'ontFilter') {
	    if (value == "remove") {
		container.parameters.ontFilter.splice(value2, 1);
	    } else {
		var source;
		for (var i=0; i<container.parameters.sources.length; i++) {
		    if (container.parameters.sources[i] == value2) {
			source = i;
			break;
		    }
		}
		container.parameters.ontFilter.push({ "source": source, "level": value3, "value": value4 });
	    }
	}
	// check if this is a numerical filter
	else if (param == "evalue" || param == "identity" || param == "alilength") {
	    container.parameters[param] = parseFloat(value);
	} else {
	    container.parameters[param] = value;
	}
	document.getElementById('visualize').setAttribute('disabled', 'disabled');
	widget.container2matrix();
	
	document.getElementById('visualize').removeAttribute('disabled');
	widget.editContainer();
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
    widget.updateVis = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var r = widget.currentVisualizationController;

	/* drilldown */
	if (widget.currentType == 'matrix') {
	    var matrix = jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer].matrix);

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
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
		var rend = Retina.RendererInstances.matrix[p.rendererIndex];
	    };
	} else if (widget.currentType == 'barchart') {
	    var data = widget.container2graphseries({});
	    r.data(1, data.data);
	    r.renderer.settings.x_labels = data.x_labels;
	    r.renderer.settings.chartArea = [ 120, 0, 0.8, 1 ];
	    r.renderer.settings.legendArea = [ 0.81, 0, 0.97, 1 ];
	    r.renderer.settings.onclick = function (p) {
		var rend = Retina.RendererInstances.graph[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
	    };
	} else if (widget.currentType == 'heatmap') {
	    var matrix = jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer].matrix);
	    var data = Retina.scaleMatrix(matrix.data);
	    r.data(1, { data: data,
			rows: matrix.rows,
			columns: matrix.cols });
	    r.renderer.settings.height = 10 * matrix.rows.length + 150;
	    r.renderer.settings.min_cell_height = 20;
	    r.renderer.settings.min_cell_width = 20;
	    r.renderer.settings.rowClicked = function (p) {
		var rend = Retina.RendererInstances.heatmap[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
	    };
	} else if (widget.currentType == 'piechart') {
	    var data = widget.container2graphseries({});
	    r.data(1, data.data);
	    r.renderer.settings.x_labels = data.x_labels;
	    r.renderer.settings.onclick = function (p) {
		var rend = Retina.RendererInstances.graph[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
	    };
	} else if (widget.currentType == 'table') {
	    var data = widget.container2table({});
	    var sorttypes = {};
	    for (var i=1; i<data.header.length; i++) {
		sorttypes[i] = "number";
	    }
	    r.renderer.settings.filter = { 0: {"type": "text", "searchword": ""} };
	    r.renderer.settings.sorttype = sorttypes;
	    r.renderer.settings.header = null;
	    r.renderer.settings.tdata = null;
	    r.data(1, data);
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
	
	var matrix = jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer].matrix);
	
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

    widget.container2plotseries = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var c = stm.DataStore.dataContainer[widget.selectedContainer];

	var series = { data: { series: [ ],
			       points: [ ] } };

	var id = params.colHeader || 'id';

	var d = {};
	var dataRow = params.dataRow || 0;
	var isFiltered = false;
	if (c.hasOwnProperty('rows')) {
	    isFiltered = true;
	}
	var pid = c.items[0].id;
	var cp = stm.DataStore.profile[pid];
	var colItem = params.dataColItem || cp.mdname;
	var colIndex = params.dataColIndex;
	var palette = GooglePalette(c.items.length);
	for (var i=0; i<c.items.length; i++) {
	    var pid = c.items[i].id;
	    var p = stm.DataStore.profile[pid];
	    series.data.series.push( { name: c.items[i][id], color: palette[i] } );
	    series.data.points.push([]);
	    for (var h=0; h<(isFiltered ? c.rows[c.items[i].id].length : p.rows.length); h++) {
		var row = (isFiltered ? c.rows[c.items[i].id][h] : h);
		var val = p.data[row][dataRow];
		var key = (colIndex === null ? p.rows[row].metadata[colItem] : p.rows[row].metadata[colItem][colIndex]);

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

    widget.container2matrix = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	// get the current container
	var c = stm.DataStore.dataContainer[widget.selectedContainer];

	/*
	  perform filter
	*/

	// fill the filters array with the cutoffs
    	var filters = [];
	if (c.parameters.evalue > widget.cutoffThresholds['evalue']) {
	    filters.push([ 2, c.parameters.evalue ]);
	}
	if (c.parameters.identity > widget.cutoffThresholds['identity']) {
	    filters.push([ 3, c.parameters.identity ]);
	}
	if (c.parameters.alilength > widget.cutoffThresholds['length']) {
	    filters.push([ 4, c.parameters.alilength ]);
	}
	
	// create array index lookups for taxonomy and ontology levels
	var levelIndex = { "domain": 0, "phylum": 1, "className": 2, "order": 3, "family": 4, "genus": 5, "species": 6 };
	var flevelIndex = { "Subsystems-level1": 0, "Subsystems-level2": 1, "Subsystems-level3": 2, "Subsystems-functions": 3, "KO-level1": 0, "KO-level2": 1, "KO-level3": 2, "KO-functions": 0, "COG-level1": 0, "COG-level2": 1, "COG-functions": 2, "NOG-level1": 0, "NOG-level2": 1, "NOG-functions": 3 };

	// initialize the output row hash
    	var rows = {};

	// iterate over the items in this container
    	for (var i=0; i<c.items.length; i++) {

	    // initialize the rows for this item
    	    rows[c.items[i].id] = [];

	    // get the profile for this item
    	    var pid = c.items[i].id;
    	    var p = stm.DataStore.profile[pid];

	    // calculate the row length
	    var rl = 5 + (p.sources.length * 2);

	    // iterate over the data of this profile
    	    for (var h=0; h<p.data.length; h+=rl) {

		// if no filters hit, the row stays
    		var stay = true;

		// test cutoff filters
		for (var j=0; j<filters.length; j++) {
    		    if (Math.abs(p.data[h + filters[j][0]]) < filters[j][1]) {
    			stay = false;
    			break;
    		    }
    		}

		// if it did not pass the cutoff filter, go to the next row
		if (! stay) {
		    continue;
		}

		// test for tax filters
		if (c.parameters.taxFilter.length) {

		    // if none of the filters match, the row goes
		    stay = false;

		    // iterate over the list of taxonomy filters
		    for (var j=0; j<c.parameters.taxFilter.length; j++) {

			// get the organism array of this row for this source
			var orgs = p.data[h + 5 + (c.parameters.taxFilter[j].source * 2)];

			// if there is no organism, it definitely fails
			if (orgs == null) {
			    break;
			} else if (typeof orgs == "number") {
			    orgs = [ orgs ];
			} else if (typeof orgs == "string") {
			    orgs = orgs.split(",");
			}

			// iterate over the organisms
			for (var k=0; k<orgs.length; k++) {

			    // check if the organism exists in the taxonomy
			    if (stm.DataStore.taxonomy.organism.hasOwnProperty(orgs[k])) {

				// get the value of the organism id in the chosen hierarchy level
				var val = stm.DataStore.taxonomy[c.parameters.taxFilter[j].level][stm.DataStore.taxonomy.organism[orgs[k]][levelIndex[c.parameters.taxFilter[j].level]]];

				// if the user selected value is a match to val, the row is in and we do not need
				// to check the other organisms
				if (c.parameters.taxFilter[j].value == val) {
				    stay = true;
				    break;
				}
			    } else {

				// this is bad, the taxonomy does not match the data in the profile
				if (org[k]) {
				    console.log("org not found: "+org[k])
				}
			    }
			}

			// if one org passed, we dont need to check the others
			if (stay) {
			    break;
			}
		    }
		}

		// if the org did not pass, go to the next iteration
		if (! stay) {
		    continue;
		}

		// test for function filters
		if (c.parameters.ontFilter.length) {

		    // if there is no match, the row goes
		    stay = false;

		    // iterate over the list of function filters
		    for (var j=0; j<c.parameters.ontFilter.length; j++) {

			// the the function array for this row for this ontology
			var funcs = p.data[h + 6 + (c.parameters.ontFilter[j].source * 2)];
			
			// if there is no function, it definitely fails
			if (funcs == null) {
			    break;
			} else if (typeof funcs == "number") {
			    funcs = [ funcs ];
			} else if (typeof funcs == "string") {
			    funcs = funcs.split(",");
			}
			
			var source = c.parameters.sources[c.parameters.ontFilter[j].source];
			var level = c.parameters.ontFilter[j].level;

			// iterate over the function array
			for (var k=0; k<funcs.length; k++) {

			    // if the ontology does not have an entry for this id, we're in trouble
			    if (stm.DataStore.ontology[source]['id'].hasOwnProperty(funcs[k])) {

				// get the value in the chosen ontology and level
				var val = stm.DataStore.ontology[source][level][stm.DataStore.ontology[source]['id'][funcs[k]][flevelIndex[source+"-"+level]]];

				// we have a match, the row stays
				if (c.parameters.ontFilter[j].value == val) {
				    stay = true;
				    break;
				}
			    } else {
				console.log("func not found: "+func)
			    }
			}

			// if there is at least one match, the row stays
			if (stay) {
			    break;
			}
		    }
		}

		// the row passed all filters, push it to the result
    		if (stay) {
    		    rows[c.items[i].id].push(h);
    		}
    	    }
    	}

	/*
	  create matrix
	*/

	// initialize data fields
	var matrix = { data: [],
		       rows: [],
		       cols: [],
		       abundances: [] };

	var id = c.parameters.metadatum;
	var displayLevel = c.parameters.displayLevel;
	var displaySource  = c.parameters.displaySource;
	var displayType = c.parameters.displayType;

	var d = {};
	var dataRow = 1;
	for (var i=0; i<c.items.length; i++) {
	    matrix.abundances.push(0);
	    var pid = c.items[i].id;
	    var p = stm.DataStore.profile[pid];
	    matrix.cols.push(c.items[i][id]);
	    for (var h=0; h<rows[c.items[i].id].length; h++) {

		// get the row
		var row = rows[c.items[i].id][h];

		// get the abundance
		var val = p.data[row + dataRow];

		// get the display indices
		var datums = p.data[row + 5 + displaySource + (displayType == "taxonomy" ? 0 : 1)];

		// if there is no index, skip this row
		if (datums == null) {
		    continue;
		} else if (typeof datums == "number") {
		    datums = [ datums ];
		} else if (typeof datums == "string") {
		    datums = datums.split(",");
		}

		// find indices in target id space
		var key;
		if (displayType == "taxonomy") {
		    if (! stm.DataStore.taxonomy["organism"][datums[0]]) {
			console.log("organism not found: "+datums[0]);
			continue;
		    }
		    key = stm.DataStore.taxonomy[displayLevel][stm.DataStore.taxonomy["organism"][datums[0]][levelIndex[displayLevel]]];
		} else {
		    if (! stm.DataStore.ontology[displaySource]['id'][datums[0]]) {
			console.log("function not found: "+datums[0]);
			continue;
		    }
		    key = stm.DataStore.ontology[displaySource][displayLevel][stm.DataStore.ontology[displaySource]['id'][datums[0]]][flevelIndex[displaySource+"-"+displayLevel]];
		}
		if (! d.hasOwnProperty(key)) {
		    d[key] = [];
		    for (var j=0;j<c.items.length;j++) {
			d[key][j] = 0;
		    }
		}
		d[key][i] += val;
		matrix.abundances[i] += val;
	    }
	}
	matrix.rows = Retina.keys(d).sort();
	for (var i=0; i<matrix.rows.length; i++) {
	    matrix.data.push(d[matrix.rows[i]]);
	}
	
	c.matrix = matrix;

	return c;
    };

    widget.container2table = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var c = stm.DataStore.dataContainer[widget.selectedContainer];

	var matrix = jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer].matrix);
	var tableHeaders = [ c.parameters.displayLevel ];
	for (var i=0; i<matrix.cols.length; i++) {
	    tableHeaders.push(matrix.cols[i]);
	}

	var tableData = [];
	for (var i=0; i<matrix.rows.length; i++) {
	    var row = [ matrix.rows[i] ];
	    for (var h=0; h<matrix.data[i].length; h++) {
		row.push(matrix.data[i][h]);
	    }
	    tableData.push(row);
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
	    html.push('<div class="span4"><h5>taxonomic / functional database</h5><div><div class="btn-group" data-toggle="buttons-radio" style="float: left;"><button type="button" class="btn active" onclick="Retina.WidgetInstances.metagenome_analysis[1].showDatabases(\'protein\');">protein</button><button type="button" class="btn" onclick="Retina.WidgetInstances.metagenome_analysis[1].showDatabases(\'RNA\');">RNA</button></div><div id="databaseSelect" style="position: relative; bottom: 3px"></div></div></div>');
	    
	    // ontology
	    var ontSources = widget.sources.hierarchical;
	    html.push('<div class="span4"><h5>hierarchical ontology database</h5><div><ul class="nav nav-pills" style="float: left; position: relative; bottom: 3px;"><li class="dropdown">\
<a class="dropdown-toggle" style="border: 1px solid;" data-toggle="dropdown" href="#"><span id="selectedOntSource">'+ontSources[0]+'</span> <b class="caret"></b></a>\
<ul class="dropdown-menu" role="menu">');

	    for (var i=0; i<ontSources.length; i++) {
		html.push(' <li><a href="#" onclick="document.getElementById(\'selectedOntSource\').innerHTML=\''+ontSources[i]+'\';Retina.WidgetInstances.metagenome_analysis[1].dataLoadParams.sources[1]=\''+ontSources[i]+'\';">'+ontSources[i]+'</a></li>');
	    }
	    
	    html.push('</ul></li></ul></div></div>');

	    // params container close and divider
	    html.push('</div><div style="clear: both;"></div>');

	     // metagenome selector
	    html.push('<h5 style="margin-top: 0px;">metagenomes</h5><div id="mgselect"><img src="Retina/images/waiting.gif" style="margin-left: 40%; width: 24px;"></div>');

	    // data progress
	    html.push('<div id="dataprogress" style="float: left; margin-top: 25px; margin-left: 20px; width: 90%;"></div><div style="clear: both;">');
	    
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
	    html.push(' <li><a href="#" onclick="document.getElementById(\'selectedSource\').innerHTML=\''+widget.sources[which][i]+'\';Retina.WidgetInstances.metagenome_analysis[1].dataLoadParams.sources[0]=\''+widget.sources[which][i]+'\';">'+widget.sources[which][i]+'</a></li>');
	}
	   
	html.push('</ul></li></ul>');

	document.getElementById('databaseSelect').innerHTML = html.join("");
	widget.dataLoadParams.source = widget.sources[which][0];
    };
    
    widget.loadDone = function (container) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (container.status == "ready") {
	    var html = "<p style='text-align: center;'>Your data is loaded and was placed in this container.<br>Click to analyze.</p>";
	    html += '<div style="cursor: pointer; border: 1px solid rgb(221, 221, 221); border-radius: 6px; box-shadow: 2px 2px 2px; margin-left: auto; margin-right: auto; margin-top: 20px; font-weight: bold; height: 75px; width: 75px; text-align: center;" onclick="Retina.WidgetInstances.metagenome_analysis[1].selectedContainer=\''+container.id+'\';Retina.WidgetInstances.metagenome_analysis[1].visualize();document.getElementById(\'dataprogress\').innerHTML=\'\';" class="glow"><img src="Retina/images/data.png" style="margin-top: 5px; width: 50px;">'+container.id+'</div>';
	    widget.selectedContainer = container.id;
	    document.getElementById('dataprogress').innerHTML = html;
	    widget.container2matrix();
	    widget.showDataContainers();
	} else {
	    document.getElementById('dataprogress').innerHTML = "Your data load was aborted";
	}
    };

    // create a progress div
    widget.pDiv = function (id, done, name, cname) {
	var progressContainer = document.getElementById('dataprogress');
	if (document.getElementById(id)) {
	    return;
	}
	var div = document.createElement('div');
	div.setAttribute('id', id);
	div.setAttribute('class', 'prog');
	div.setAttribute('style', 'margin-left: 15px; float: left; width: 300px;');
	div.innerHTML = '<div style="word-wrap: break-word">'+name+'</div><div><div class="progress'+(done ? '' : ' progress-striped active')+'" style="width: 100px; float: left; margin-right: 5px;"><div class="bar" id="progressbar'+id+'" style="width: '+(done ? '100' : '0' )+'%;"></div></div><div id="progress'+id+'" style="float: left;">'+(done ? "complete." : "waiting for server... <img src='Retina/images/waiting.gif' style='height: 16px; position: relative; bottom: 2px;'><button class='btn btn-mini btn-danger' onclick='Retina.WidgetInstances.metagenome_analysis[1].abortLoad(\""+id+"\", null, \""+cname+"\");' style='margin-left: 5px;'>cancel</button>")+'</div></div>';
	progressContainer.appendChild(div);
    };

    widget.updatePDiv = function (id, status, msg, cname) {
	var target = document.getElementById("progress"+id);
	if (status == 'error') {
	    target.innerHTML = "error: "+msg;
	} else {
	    target.innerHTML = "<span title='updated "+(new Date(Date.now()).toString())+"'>"+status+"... </span><img src='Retina/images/waiting.gif' style='height: 16px; position: relative; bottom: 2px;'><button class='btn btn-mini btn-danger' onclick='Retina.WidgetInstances.metagenome_analysis[1].abortLoad(\""+id+"\", null, \""+cname+"\");' style='margin-left: 5px;'>cancel</button>";
	}
    };

    /*
      DATA LOADING BACKEND
     */

    widget.dataLoadParams = { sources: [ "RefSeq", "Subsystems" ] };

    widget.xhr = {};

    // perform a set of API requests and create a data container
    widget.loadData = function (ids, collectionName, params) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (! stm.DataStore.hasOwnProperty('dataContainer')) {
	    stm.DataStore.dataContainer = {};
	}	

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
						  items: ids,
						  status: "loading",
						  promises: [],
						  callbacks: [],
						  parameters: { sources: widget.dataLoadParams.sources,
								displayLevel: "domain",
								displayType: "taxonomy",
								displaySource: 0,
								metadatum: "id",
								evalue: widget.cutoffThresholds.evalue,
								identity: widget.cutoffThresholds.identity,
								alilength: widget.cutoffThresholds.length,
								taxFilter: [],
								ontFilter: [] },
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
	    var id = ids[i].id;
	    
	    // check if the profile is already loaded
	    var needsLoad = true;
	    if (stm.DataStore.profile.hasOwnProperty(id)) {
		needsLoad = false;
	    }
	    if (needsLoad && ! stm.DataStore.inprogress.hasOwnProperty('profile'+id)) {
		widget.pDiv('profile'+id, false, ids[i].name, name);

		stm.DataStore.inprogress['profile'+id] = 1;
		var source = widget.dataLoadParams.sources.join(",");
		stm.DataStore.dataContainer[name].promises.push(
		    jQuery.ajax({ url: RetinaConfig.mgrast_api + "/profile/" + ids[i].id + "?format=mgrast&condensed=1&verbosity=minimal&source="+source,
				  dc: name,
				  headers: stm.authHeader,
				  bound: 'profile'+id,
				  success: function (data) {
				      var widget = Retina.WidgetInstances.metagenome_analysis[1];
				      if (data != null) {
					  if (data.hasOwnProperty('ERROR')) {
					      console.log("error: "+data.ERROR);
					      widget.updatePDiv(this.bound, 'error', data.ERROR);
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
					  widget.updatePDiv(this.bound, 'error', data.ERROR);
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
		widget.pDiv('profile'+id, true, ids[i].name, name);
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
	return jQuery.ajax({ url: url+"?verbosity=minimal",
			     dc: name,
			     headers: stm.authHeader,
			     bound: id,
			     success: function (data) {
				 var widget = Retina.WidgetInstances.metagenome_analysis[1];
				 if (data != null) {
				     if (data.hasOwnProperty('ERROR')) {
					 console.log("error: "+data.ERROR);
					 widget.updatePDiv('profile'+this.bound, 'error', data.ERROR);
					 return;
				     } else if (data.hasOwnProperty('status')) {
					 if (data.status == 'done') {
					     widget.downloadComputedData(this.bound, this.dc, data.url);
					 } else {
					     if (data.status != 'submitted' && data.status != 'processing') {
						 widget.updatePDiv(this.bound, 'error', data.status);
						 return;
					     }
					     widget.updatePDiv(this.bound, data.status, null, this.dc);
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
					 data.data.size = data.size;
					 stm.DataStore.profile[data.data.id] = data.data;
					 widget.purgeProfile(data.data.id);
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
		// html2canvas(source, {
		//     onrendered: function(canvas) {
		// 	document.getElementById('canvasResult').appendChild(canvas);
		// 	Retina.WidgetInstances.metagenome_analysis[1].saveCanvas();
		//     }
		// });
	    }
	} else if (type == 'svg') {
	    // the image is svg
	    if (document.getElementById('graph_div1')) {
		stm.saveAs(document.getElementById('graph_div1').innerHTML, widget.selectedContainer + ".svg");
	    } else {
		alert('this feature is not available for this view');
	    }
	} else if (type == 'json') {
	    stm.saveAs(JSON.stringify(stm.DataStore.dataContainer[widget.selectedContainer].matrix, null, 2), widget.selectedContainer + ".json");
	    return;
	} else if (type == 'tsv') {
	    var exportData = widget.container2table({});
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
		zip.file("taxonomy.json").async("string").then(function (tax) {
	    	    tax = JSON.parse(tax);
		    var out = { "domain": [], "phylum": [], "className": [], "order": [], "family": [], "genus": [], "species": [], "strain": [], "organism": {} };
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
									    for (var str in tax[d][p][c][o][f][g][s]) {
										if (tax[d][p][c][o][f][g][s].hasOwnProperty(str)) {
										    
										    out.organism[tax[d][p][c][o][f][g][s][str]] = [ out.domain.length, out.phylum.length, out.className.length, out.order.length, out.family.length, out.genus.length, out.species.length, out.strain.length ];
										    out.strain.push(str);
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
		    JSZipUtils.getBinaryContent('data/ont.v1.json.zip', function(err, data) {
			if(err) {
			    throw err; // or handle err
			}
			var zip = new JSZip();
			zip.loadAsync(data).then(function(zip) {
			    zip.file("ontology.json").async("string").then(function (ont) {
	    			ont = JSON.parse(ont);
				var out = { "Subsystems": { "level1": [], "level2": [], "level3": [], "function": [], "id": { } }, "COG": { "level1": [], "level2": [], "function": [], "id": { } }, "NOG": { "level1": [], "level2": [], "function": [], "id": { } }, "KO": { "level1": [], "level2": [], "level3": [], "function": [], "id": { } } };
				for (var o in ont) {
				    if (ont.hasOwnProperty(o)) {
					for (var l1 in ont[o]) {
					    if (ont[o].hasOwnProperty(l1)) {
						for (var l2 in ont[o][l1]) {
						    if (ont[o][l1].hasOwnProperty(l2)) {
							if (o == "NOG" || o == "COG") {
							    for (var func in ont[o][l1][l2]) {
								if (ont[o][l1][l2].hasOwnProperty(func)) {
								    var id = Retina.keys(ont[o][l1][l2][func])[0];
								    out[o]["id"][ont[o][l1][l2][func][id]] = [ out[o]["level1"].length, out[o]["level2"].length, out[o]["function"].length ];
								    out[o]["function"].push(func);
								}
							    }
							} else {							    
							    for (var l3 in ont[o][l1][l2]) {
								if (ont[o][l1][l2].hasOwnProperty(l3)) {
								    for (var func in ont[o][l1][l2][l3]) {
									if (ont[o][l1][l2][l3].hasOwnProperty(func)) {
									    var id = Retina.keys(ont[o][l1][l2][l3][func])[0];
									    out[o]["id"][ont[o][l1][l2][l3][func][id]] = [ out[o]["level1"].length, out[o]["level2"].length, out[o]["level3"].length, out[o]["function"].length ];
									    out[o]["function"].push(func);
									}
								    }
								    out[o]["level3"].push(l3);
								}
							    }
							}
							out[o]["level2"].push(l2)
						    }
						}
						out[o]["level1"].push(l1);
					    }
					}
				    }
				}
				stm.DataStore.ontology = out;
				document.getElementById('data').innerHTML = 'creating local store... <img src="Retina/images/waiting.gif" style="width: 16px;">';
				stm.updateHardStorage("analysis", { "ontology": true, "taxonomy": true }).then( function () {
				    Retina.WidgetInstances.metagenome_analysis[1].display();
				});
			    });
			});
		    });
		});
	    });
	});
    };

    widget.purgeProfile = function (id) {

	// get the profile
	var profile = stm.DataStore.profile[id];

	// check if this profile is already purged
	if (profile.purged) {
	    console.log(profile.id + ' already purged');
	    return;
	}
	
	// store all in one big array
	var p = [];

	// iterate over the profile data
	for (var h=0; h<profile.data.length; h++) {
	    
	    // store the hit data
	    for (var j=0; j<5; j++) {
		p.push(profile.data[h][j]);
	    }

	    // iterate over the sources annotation data
	    for (var j=0; j<profile.sources.length; j++) {

		// push the taxon
		p.push( profile.data[h][5][j] && profile.data[h][5][j].length ? (profile.data[h][5][j].length > 1 ? profile.data[h][5][j].join(',') : profile.data[h][5][j][0]) : null );
		
		// push the function
		p.push( profile.data[h][6][j] && profile.data[h][6][j].length ? (profile.data[h][6][j].length > 1 ? profile.data[h][6][j].join(',') : profile.data[h][6][j][0]) : null );
	    }

	}
	profile.data = p;
	profile.purged = true;
    };
    
})();
