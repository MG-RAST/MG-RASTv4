(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Analysis Widget",
                name: "metagenome_analysis",
                author: "Tobias Paczian",
            requires: [ "rgbcolor.js", "html2canvas.js", "jszip.min.js", "numeric.min.js" ]
        }
    });
    
    // load all required widgets and renderers
    widget.setup = function () {
	return [ Retina.load_widget({"name": "RendererController", "resource": "Retina/widgets/"}),
		 Retina.load_renderer('table'),
		 Retina.load_renderer('svg2'),
		 Retina.load_renderer('listselect')
	       ];
    };

    widget.taxLevels = [ "domain", "phylum", "className", "order", "family", "genus", "species", "strain" ];
    widget.ontLevels = { "Subsystems": ["level1","level2","level3","function"], "KO": ["level1","level2","level3","function"], "COG": ["level1","level2","function"], "NOG": ["level1","level2","function"] };
    widget.sources = { "protein": ["RefSeq", "IMG", "TrEMBL", "SEED", "KEGG", "GenBank", "SwissProt", "PATRIC", "eggNOG"], "RNA": ["RDP", "LSU", "SSU", "ITS", "Greengenes"], "hierarchical": ["Subsystems","KO","COG","NOG"] };


    widget.cutoffThresholds = {
	"evalue": 5,
	"identity": 60,
	"alilength": 15
    };

    widget.graphs = {};

    widget.context = "none";
    widget.currentType = "table";
    
    // main display function called at startup
    widget.display = function (params) {
	widget = this;
        var index = widget.index;

	jQuery.extend(widget, params);

	if (! stm.DataStore.hasOwnProperty('metagenome')) {
	    stm.DataStore.metagenome = {};
	}
	if (! stm.DataStore.hasOwnProperty('profile')) {
	    stm.DataStore.profile = {};
	}

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
	tools.setAttribute('style', 'padding: 10px; overflow-x: auto;');

	// check the context
	var toolshtml = "<h4>Analysis Containers</h4>";
	toolshtml += "<div id='availableContainers'></div>";
	toolshtml += "<hr style='clear: both; margin-top: 15px; margin-bottom: 5px;'>";
	toolshtml += "<div id='currentContainerParams'></div><div id='containerActive' style='display: none;'>";
	toolshtml += "<h4>View</h4>";
	toolshtml += "<div id='visualContainerSpace'></div>";
	toolshtml += "<h4>Plugins</h4>";
	toolshtml += "<div id='pluginContainerSpace'></div>";
	toolshtml += "<h4>myData &nbsp; Export</h4>";
	toolshtml += "<div id='exportContainerSpace'></div></div>";
	tools.innerHTML = toolshtml;

	widget.showDataContainers();
	widget.fillVisualizations();
	widget.fillExport();
	widget.fillPlugins();

	widget.loadDataUI();

	widget.loadGraphs();

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

	html += "<img src='Retina/images/cloud-upload.png' class='tool' style='float: left;' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"shock\");' title='upload to myData in MG-RAST' id='uploadButton'><div style='float: left; width: 1px; height: 55px; background-color: rgb(204, 204, 204); position: relative; top: 5px; margin-left: 3px;'></div>";
	html += "<img src='Retina/images/file-xml.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"svg\");' title='SVG'>";
	html += "<img src='Retina/images/image.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"png\");' title='PNG'>";
	html += "<img src='Retina/images/table.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"tsv\");' title='TSV'>";
	html += "<img src='Retina/images/file-css.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].exportData(\"json\");' title='JSON'>";


	container.innerHTML = html;
    };

    widget.fillPlugins = function () {
	var widget = this;

	var container = document.getElementById('pluginContainerSpace');

	var html = "";

	html += "<img src='Retina/images/krona.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].plugin(\"krona\");' title='krona'>Krona";
	html += "<img src='images/kegg.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].plugin(\"kegg\");' title='KEGG Mapper'>KEGG Mapper";

	container.innerHTML = html;
    };

    // visualization section
    widget.fillVisualizations = function () {
    	var widget = Retina.WidgetInstances.metagenome_analysis[1];

    	var container = document.getElementById('visualContainerSpace');

    	var html = "";
    	html += "<img src='Retina/images/table.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"table\");' title='table'>";
    	html += "<img src='Retina/images/matrix.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"matrix\");' title='matrix'>";

    	html += "<img src='Retina/images/pie.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"piechart\");' title='piechart'>";
    	html += "<img src='Retina/images/barchart.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"barchart2\");' title='grouped barchart'>";
    	html += "<img src='Retina/images/stackedbarchart.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"barchart\");' title='stacked barchart'>";

	html += "<img src='Retina/images/rarefaction.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"rarefaction\");' title='rarefaction plot'>";
	html += "<img src='Retina/images/scatterplot.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"pca\");' title='PCA'>";
	html += "<img src='images/icon_heatmap.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"heatmap\");' title='heatmap'>";
	html += "<img src='Retina/images/differential.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"differential\");' title='differential coverage'>";
	

    	container.innerHTML = html;
    };

    // draw the selected visualization
    widget.visualize = function (type) {
    	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var c = stm.DataStore.dataContainer[widget.selectedContainer];
    	type = type || c.currentRendererType || widget.currentType;
    	widget.currentType = type;
	
    	document.getElementById("data").style.display = "none";
    	document.getElementById("visualize").style.display = "";

    	var container = document.getElementById('visualize');

    	if (type == "container") {
    	    widget.showCurrentContainerParams();
    	    return;
    	}

    	var visMap = widget.visualizationMapping();
	
    	var html = "<h4>visualize container " + (widget.selectedContainer ? widget.selectedContainer : "Demo") + " - "+visMap[type].title+"</h4><div id='visualizeTarget'></div>";

    	container.innerHTML = html;

	// get the target div
    	visMap[type].settings.target = document.getElementById('visualizeTarget');

	// reset the renderer instance
    	if (Retina.RendererInstances[visMap[type].renderer]) {
    	    Retina.RendererInstances[visMap[type].renderer] = [ Retina.RendererInstances[visMap[type].renderer][0] ];
    	}

	// reset the renderer controller instance
    	if (Retina.WidgetInstances.RendererController) {
    	    Retina.WidgetInstances.RendererController = [ Retina.WidgetInstances.RendererController[0] ];
    	}

	if (! c.currentRendererType || (c.currentRendererType && c.currentRendererType !== type)) {
	    stm.DataStore.dataContainer[widget.selectedContainer].currentRendererDefaults = {};
	}
	
	// get the data
	var settings = jQuery.extend(true, {}, visMap[type].settings, stm.DataStore.dataContainer[widget.selectedContainer].currentRendererDefaults || {});
	settings.data = visMap[type].hasOwnProperty('dataConversion') ? widget[visMap[type].dataConversion](visMap[type].dataField) : jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer].matrix);

	// set the callback
	settings.callback = widget.graphCallback;

	// set the current controller
    	widget.currentVisualizationController = Retina.Widget.create('RendererController', { "target": document.getElementById("visualizeTarget"), "type": visMap[type].renderer, "settings": settings, "controls": visMap[type].controlGroups, "dataCallback": widget.dataCallback, "settingsCallback": widget.settingsCallback });

	c.currentRendererType = type;
    };

    widget.settingsCallback = function (name, value) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	stm.DataStore.dataContainer[widget.selectedContainer].currentRendererDefaults[name] = value;
    };

    widget.dataCallback = function () {
	var rc = this;
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	// check what kind of data operation is requested
	var data = jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer].matrix);

	var visMap = widget.visualizationMapping()[widget.currentType];

	// iterate over all data attributes
	for (var i=0; i<rc.dataUpdaters.length; i++) {
	    var opt = rc.dataUpdaters[i];
	    
	    // data normalization
	    if (opt.name == "normalize" && rc.renderer.settings[opt.name]) {
		data.data = Retina.transposeMatrix(Retina.normalizeMatrix(Retina.transposeMatrix(data.data)));
	    }

	    // turn data to log
	    else if (opt.name == "log") {
		if (rc.renderer.settings[opt.name]) {
		    data.data = Retina.logMatrix(data.data);
		    if (visMap.hasOwnProperty('logAxes')) {
			for (var h=0; h<visMap.logAxes.length; h++) {
			    rc.renderer.settings.items[visMap.logAxes[h]].parameters.isLog = true;
			    rc.renderer.settings.items[visMap.logAxes[h]].data += "log";
			}
		    }
		} else {
		    if (visMap.hasOwnProperty('logAxes')) {
			for (var h=0; h<visMap.logAxes.length; h++) {
			    rc.renderer.settings.items[visMap.logAxes[h]].parameters.isLog = false;
			    rc.renderer.settings.items[visMap.logAxes[h]].data = rc.renderer.settings.items[visMap.logAxes[h]].data.replace(/log$/, '');
			}
		    }
		}
	    }

	    // set pca components
	    else if (opt.name == "pcaa" || opt.name == "pcab") {
		isPCA = true;
		var c = stm.DataStore.dataContainer[widget.selectedContainer];
		if (opt.name == "pcaa") {
		    c.parameters.pcaComponentA = rc.renderer.settings[opt.name] || 0;
		} else {
		    c.parameters.pcaComponentB = rc.renderer.settings.hasOwnProperty(opt.name) ? rc.renderer.settings[opt.name] : 1;
		}
	    }
	}

	
	if (visMap.hasOwnProperty('dataConversion')) {
	    data.data = widget[visMap.dataConversion](data.data).data;
	}
	
	rc.renderer.settings.data = data;
    };
    
    widget.graphCallback = function (event) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	var rend = this.renderer;
	event = event || window.event;

	var cat;
	
	if (event.hasOwnProperty('cellValue') && event.colIndex == null) {
	    cat = event.cellValue;
	} else {
	
	    var t = event.target;
	    
	    if (t.nodeName == "text") {
		cat = t.innerHTML;
	    } else if (t.previousSibling && t.previousSibling.nodeName == "title") {
		cat = t.previousSibling.innerHTML.split(/ - /)[1];
	    } else {
		console.log('unhandled click element');
		console.log(t);
		return;
	    }
	}

	var dls = document.getElementById('displayLevelSelect');
	
	// check if we can zoom in
	if (dls.selectedIndex + 1 < dls.options.length) {
	    
	    // remove the filters for the current displayType
	    var c = stm.DataStore.dataContainer[widget.selectedContainer];
	    if (c.parameters.displayType == "taxonomy") {
		c.parameters.taxFilter = [ { "level": c.parameters.displayLevel, "source": c.parameters.displaySource, "value": cat } ];
	    } else {
		c.parameters.ontFilter = [ { "level": c.parameters.displayLevel, "source": c.parameters.displaySource, "value": cat } ];
	    }
	    dls.selectedIndex++;
	    dls.onchange();
	}
    };

    widget.removeDataContainer = function () {
	var widget = this;

	delete stm.DataStore.dataContainer[widget.selectedContainer];
	widget.selectedContainer = Retina.keys(stm.DataStore.dataContainer).length ? Retina.keys(stm.DataStore.dataContainer).sort()[0] : null;
	widget.showDataContainers();
	document.getElementById('dataprogress').innerHTML = '';
	document.getElementById('currentContainerParams').innerHTML = "";
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
	}
	else if (param =="default") {
	    container.parameters.evalue = widget.cutoffThresholds.evalue;
	    container.parameters.identity = widget.cutoffThresholds.identity;
	    container.parameters.alilength = widget.cutoffThresholds.alilength;
	}
	else {
	    if (param == "displayType") {
		if (value == "function") {
		    container.parameters.displayLevel = "level1";
		} else {
		    container.parameters.displayLevel = "domain";
		}
	    }
	    container.parameters[param] = value;
	}
	document.getElementById('visualize').setAttribute('disabled', 'disabled');
	widget.container2matrix();
	
	document.getElementById('visualize').removeAttribute('disabled');
	widget.showCurrentContainerParams();
	widget.visualize();
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
		widget.showCurrentContainerParams();
	    }
	} else {
	    alert("you did not choose a name");
	}
    };

    /*
      HELPER FUNCTIONS
     */

    // display all current data containers
    widget.showDataContainers = function () {
	var widget = this;

	var container = document.getElementById('availableContainers');

	if (container) {
	    var html = "";
	    if (stm.DataStore.hasOwnProperty('dataContainer') && Retina.keys(stm.DataStore.dataContainer).length) {
		widget.showCurrentContainerParams();
		var keys = Retina.keys(stm.DataStore.dataContainer).sort();
		for (var i=0; i<keys.length; i++) {
		    if (! widget.selectedContainer) {
			widget.selectedContainer = keys[i];
		    }
		    var glow = "";
		    var name = keys[i];
		    if (keys[i] == widget.selectedContainer) {
			glow = " glow";
			name = "<span style='color: blue;'>"+name+"</span>";
		    }
		    html += "<div title='click to select analysis container' style='width: 75px; word-wrap: break-word; float: left; text-align: center;' cname='"+keys[i]+"' onclick='Retina.WidgetInstances.metagenome_analysis[1].selectedContainer=this.getAttribute(\"cname\");Retina.WidgetInstances.metagenome_analysis[1].showDataContainers();Retina.WidgetInstances.metagenome_analysis[1].visualize();'><img src='Retina/images/bar-chart.png' class='tool"+glow+"'><br>"+name+"</div>";
		}
		
	    }
	    html += "<div title='create a new analysis container' style='width: 75px; word-wrap: break-word; float: left; padding-left: 7px;' onclick='Retina.WidgetInstances.metagenome_analysis[1].loadDataUI();Retina.WidgetInstances.metagenome_analysis[1].showDataContainers();'><div class='tool' id='addDataIcon'><div style='font-weight: bold; font-size: 20px; margin-top: 4px; text-align: center;'>+</div></div></div>";
	    container.innerHTML = html;

	    if (widget.selectedContainer) {
		document.getElementById('containerActive').style.display = "";
	    } else {
		document.getElementById('containerActive').style.display = "none";
	    }
	}
    };

    widget.showCurrentContainerParams = function () {
	var widget = this;

	// get some basic variables
	var target = document.getElementById('currentContainerParams');
	var c = stm.DataStore.dataContainer[widget.selectedContainer];
	var p = c.parameters;
	var taxLevels = widget.taxLevels;
	var ontLevels = widget.ontLevels;

	// container name
	var html = [ "<h4><span id='containerID'>"+widget.selectedContainer+"</span><span id='containerIDEdit' style='display: none;'><input type='text' value='"+c.id+"' id='containerIDInput'></span><button class='btn btn-mini pull-right btn-danger' style='margin-left: 10px;' title='delete analysis container' onclick='if(confirm(\"Really delete this analysis container? (This will not remove the loaded profile data)\")){Retina.WidgetInstances.metagenome_analysis[1].removeDataContainer();};'><i class='icon icon-trash'></i></button><button class='btn btn-mini pull-right' onclick='Retina.WidgetInstances.metagenome_analysis[1].createAnalysisObject(true);' title='download container'><img src='Retina/images/cloud-download.png' style='width: 16px;'></button><button class='btn btn-mini pull-right' id='toggleEditContainerName' onclick='jQuery(\"#containerID\").toggle();jQuery(\"#containerIDEdit\").toggle();' title='edit container name'><i class='icon icon-edit'></i></button></h4>" ];

	// cutoffs
	html.push('<div class="input-prepend" style="margin-right: 5px;"><button class="btn btn-mini" style="width: 50px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'evalue\',this.nextSibling.value);">e-value</button><input id="evalueInput" type="text" value="'+p.evalue+'" style="height: 12px; font-size: 12px; width: 30px;"></div>');
	html.push('<div class="input-prepend" style="margin-right: 5px;"><button class="btn btn-mini" style="width: 50px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'identity\',this.nextSibling.value);">%-ident</button><input id="identityInput" type="text" value="'+p.identity+'" style="height: 12px; font-size: 12px; width: 30px;"></div>');
	html.push('<div class="input-prepend" style="margin-right: 5px;"><button class="btn btn-mini" style="width: 50px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'alilength\',this.nextSibling.value);">length</button><input id="alilenInput" type="text" value="'+p.alilength+'" style="height: 12px; font-size: 12px; width: 30px;"></div>');
	html.push('<button class="btn btn-mini" title="reset to defaults" style="position: relative; bottom: 5px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'default\')"><i class="icon icon-refresh"></i></button>');

	// display params table
	html.push('<table style="font-size: 12px;">');
	
	// metadatum
	var mdSelect = [ "<tr><td style='width: 100px;'>metadatum</td><td><select style='margin-bottom: 0px; font-size: 12px; height: 27px;' onchange='Retina.WidgetInstances.metagenome_analysis[1].containerSetIDs(null,this.options[this.selectedIndex].value);'>" ];
	var mdkeys = Retina.keys(c.items[0]).sort();
	for (var i=0; i<mdkeys.length; i++) {
	    var sel = "";
	    if (mdkeys[i] == p.metadatum) {
		sel = " selected=selected";
	    }
	    mdSelect.push("<option"+sel+">"+mdkeys[i]+"</option>");
	}
	mdSelect.push('</select></td></tr>');
	html.push(mdSelect.join(''));

	// source
	html.push("<tr><td>source</td><td><select style='margin-bottom: 0px; font-size: 12px; height: 27px;' onchange='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"displaySource\",this.selectedIndex);'>");
	for (var i=0; i<c.parameters.sources.length; i++) {
	    var sel = "";
	    if (i == c.parameters.displaySource) {
		sel = " selected=selected";
	    }
	    html.push("<option"+sel+">"+c.parameters.sources[i]+"</option>");
	}
	html.push("</select></td></tr>");

	// type
	html.push("<tr><td>type</td><td><select style='margin-bottom: 0px; font-size: 12px; height: 27px;' onchange='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"displayType\",this.options[this.selectedIndex].value);'><option"+(c.parameters.displayType=="taxonomy" ? " selected=selected" : "")+">taxonomy</option><option"+(c.parameters.displayType=="function" ? " selected=selected" : "")+">function</option></select></td></tr>");

	// level
	var displayLevelSelect = "<select id='displayLevelSelect' style='margin-bottom: 0px; font-size: 12px; height: 27px;' onchange='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"displayLevel\",this.options[this.selectedIndex].value);'>";
	if (c.parameters.displayType == "taxonomy") {

	    for (var i=0; i<taxLevels.length; i++) {
		var sel = "";
		if (taxLevels[i] == c.parameters.displayLevel) {
		    sel = " selected=selected";
		}
		displayLevelSelect += "<option value='"+taxLevels[i]+"'"+sel+">"+(taxLevels[i] == 'className' ? 'class' : taxLevels[i])+"</option>";
	    }
	} else {
	    if (ontLevels.hasOwnProperty(c.parameters.sources[c.parameters.displaySource])) {
		for (var i=0; i<ontLevels[c.parameters.sources[c.parameters.displaySource]].length; i++) {
		    var sel = "";
		    if (ontLevels[c.parameters.sources[c.parameters.displaySource]][i] == c.parameters.displayLevel) {
			sel = " selected=selected";
		    }
		    displayLevelSelect += '<option'+sel+'>'+ontLevels[c.parameters.sources[c.parameters.displaySource]][i]+'</option>';
		}
	    }
	}
	displayLevelSelect += "</select>";
	html.push('<tr><td>level</td><td>'+displayLevelSelect+'</td></tr>');

	html.push('</table>');

	// filters
	html.push("<button class='btn btn-mini' style='margin-right: 5px;' title='add filter' onclick='jQuery(\"#addFilterDiv\").toggle();'><i class='icon icon-filter'></i></button><div style='display: none; position: relative; bottom: 10px; left: 65px;' id='addFilterDiv'>");

	// filter form

	// filter source
	html.push("<select id='taxType' style='margin-bottom: 2px; font-size: 12px; height: 27px;'>");
	for (var i=0; i<c.parameters.sources.length; i++) {
	    html.push("<option>"+c.parameters.sources[i]+"</option>");
	}
	html.push("</select>");
	
	// tax filter
	html.push('<div id="taxFilterDiv">');
	html.push("<select style='margin-bottom: 2px; font-size: 12px; height: 27px;' id='displayTaxSelect' onchange='if(this.selectedIndex<6){jQuery(\"#taxText\").data(\"typeahead\").source=stm.DataStore.taxonomy[this.options[this.selectedIndex].value];}else{jQuery(\"#taxText\").data(\"typeahead\").source=[];}'>");
	for (var i=0; i<taxLevels.length; i++) {
	    var sel = "";
	    if (taxLevels[i] == c.parameters.displayLevel) {
		sel = " selected=selected";
	    }
	    html.push("<option value='"+taxLevels[i]+"'>"+(taxLevels[i] == 'className' ? 'class' : taxLevels[i])+"</option>");
	}
	html.push("</select>");
	
	html.push("<div class='input-append'><input type='text' autocomplete='off' id='taxText' style='margin-bottom: 0px; font-size: 12px; height: 17px; width: 160px;'><button class='btn' style='font-size: 12px; height: 27px;' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"taxFilter\", \"add\", document.getElementById(\"taxType\").options[document.getElementById(\"taxType\").selectedIndex].value, this.parentNode.previousSibling.options[this.parentNode.previousSibling.selectedIndex].value, document.getElementById(\"taxText\").value);'>add</button></div>");
	html.push('</div>');
	
	// ont filter
	html.push('<div id="ontFilterDiv">');
	var ontTypeSelect = [ '<select style="margin-bottom: 2px; font-size: 12px; height: 27px;" id="ontType" onchange="' ];
	var onts = Retina.keys(ontLevels).sort();
	for (var i=0; i<onts.length; i++) {
	    ontTypeSelect.push('document.getElementById(\''+onts[i]+'SelectDiv\').style.display=\'none\';');
	}
	ontTypeSelect.push('document.getElementById(this.options[this.selectedIndex].value+\'SelectDiv\').style.display=\'\';">');
	var ontSelects = [];
	for (var i=0; i<c.parameters.sources.length; i++) {
	    if (ontLevels.hasOwnProperty(c.parameters.sources[i])) {
		ontTypeSelect.push("<option>"+c.parameters.sources[i]+"</option>");
		ontSelects.push('<div id="'+c.parameters.sources[i]+'SelectDiv" style="'+(ontSelects.length ? "display: none;" : "")+'"><select style="margin-bottom: 2px; font-size: 12px; height: 27px;" id="'+c.parameters.sources[i]+'Select" onchange="jQuery(\'#'+c.parameters.sources[i]+'SelectText\').data(\'typeahead\').source=stm.DataStore.ontology[\''+c.parameters.sources[i]+'\'][this.options[this.selectedIndex].value];">');
		for (var h=0; h<ontLevels[c.parameters.sources[i]].length; h++) {
		    ontSelects.push('<option>'+ontLevels[c.parameters.sources[i]][h]+'</option>');
		}
		ontSelects.push('</select><div class="input-append"><input type="text" id="'+c.parameters.sources[i]+'SelectText" autocomplete="off" style="margin-bottom: 0px; font-size: 12px; height: 17px; width: 160px;"><button class="btn" style="font-size: 12px; height: 27px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'ontFilter\', \'add\', document.getElementById(\'ontType\').options[document.getElementById(\'ontType\').selectedIndex].value,this.parentNode.previousSibling.options[this.parentNode.previousSibling.selectedIndex].value, document.getElementById(\''+c.parameters.sources[i]+'SelectText\').value);">add</button></div></div>');
	    }
	}
	ontTypeSelect.push('</select>');
	html.push(ontTypeSelect.join('') + ontSelects.join(''));
	html.push('</div>');
	
	// end filter form
	html.push('</div>');
	
	var hasFilter = false;
	
	// ontology
	for (var i=0; i<c.parameters.ontFilter.length; i++) {
	    html.push("<button class='btn btn-mini btn-primary' style='margin-right: 5px;' title='remove this filter' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"ontFilter\", \"remove\", \""+i+"\");'>"+c.parameters.sources[c.parameters.ontFilter[i].source] + " - " + c.parameters.ontFilter[i].level + " - " + c.parameters.ontFilter[i].value+"</button>");
	    hasFilter = true;
	}

	// taxonomy
	for (var i=0; i<c.parameters.taxFilter.length; i++) {
	    html.push("<button class='btn btn-mini btn-primary' style='margin-right: 5px;' title='remove this filter' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"taxFilter\", \"remove\", \""+i+"\");'>"+c.parameters.sources[c.parameters.taxFilter[i].source] + " - " + c.parameters.taxFilter[i].level + " - " + c.parameters.taxFilter[i].value+"</button>");
	    hasFilter = true;
	}

	if (! hasFilter) {
	    html.push('<span style="font-size: 12px;"> - no filter -</span>');
	}
	
	// result data
	html.push("<table style='font-size: 12px; width: 322px;'><th style='text-align: left;'>ID</th><th style='text-align: right; padding-left: 100px;'>hits</th></tr>");
	for (var i=0; i<c.items.length; i++) {
	    html.push("<tr><td title='"+c.items[i].name+"'>"+c.items[i].id+"</td><td style='text-align: right; padding-left: 100px;'>"+c.matrix.abundances[i].formatString()+"</td></tr>");
	}
	html.push("</table>");
	
	html.push("<hr>");

	target.innerHTML = html.join("");

	// attach events
	document.getElementById('containerIDInput').onkeyup = function (e) {
	    e = e || window.event;

	    if (e.keyCode==13) {
		Retina.WidgetInstances.metagenome_analysis[1].renameContainer(this.value);
	    } else if (e.keyCode==27) {
		document.getElementById("toggleEditContainerName").click();
	    }
	};
	document.getElementById('evalueInput').onkeyup = function (e) {
	    e = e || window.event;

	    if (e.keyCode==13) {
		this.previousSibling.click();
	    }
	};
	document.getElementById('identityInput').onkeyup = function (e) {
	    e = e || window.event;

	    if (e.keyCode==13) {
		this.previousSibling.click();
	    }
	};
	document.getElementById('alilenInput').onkeyup = function (e) {
	    e = e || window.event;

	    if (e.keyCode==13) {
		this.previousSibling.click();
	    }
	};
	jQuery("#taxText").typeahead({"source": stm.DataStore.taxonomy.domain});
	for (var i=0; i<c.parameters.sources.length; i++) {
	    if (ontLevels.hasOwnProperty(c.parameters.sources[i])) {
		jQuery("#"+c.parameters.sources[i]+"SelectText").typeahead({"source": stm.DataStore.ontology[c.parameters.sources[i]].level1});
	    }
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

    widget.container2matrix = function (container) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	// get the current container
	var c = container || stm.DataStore.dataContainer[widget.selectedContainer];

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
	if (c.parameters.alilength > widget.cutoffThresholds['alilength']) {
	    filters.push([ 4, c.parameters.alilength ]);
	}
	
	// create array index lookups for taxonomy and ontology levels
	var levelIndex = { "domain": 0, "phylum": 1, "className": 2, "order": 3, "family": 4, "genus": 5, "species": 6, "strain": 7 };
	var flevelIndex = { "Subsystems-level1": 0, "Subsystems-level2": 1, "Subsystems-level3": 2, "Subsystems-function": 3, "KO-level1": 0, "KO-level2": 1, "KO-level3": 2, "KO-function": 3, "COG-level1": 0, "COG-level2": 1, "COG-function": 2, "NOG-level1": 0, "NOG-level2": 1, "NOG-function": 3 };

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
			var single = true;
			var iterator = single ? 1 : orgs.length;
			for (var k=0; k<iterator; k++) {			    

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
			if (! stm.DataStore.ontology.hasOwnProperty(source)) {
			    stay = false;
			    break;
			}

			// iterate over the function array
			var single = true;
			var iterator = single ? 1 : funcs.length;
			for (var k=0; k<iterator; k++) {

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
				console.log("func not found: "+funcs[k])
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
		       evalues: [],
		       abundances: [] };

	var id = c.parameters.metadatum;
	var displayLevel = c.parameters.displayLevel;
	var displaySource  = c.parameters.displaySource;
	var source = c.parameters.sources[displaySource];
	var displayType = c.parameters.displayType;

	var d = {};
	var e = {};
	var hier = {};
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
		var datums = p.data[row + 5 + (displaySource * 2) + (displayType == "taxonomy" ? 0 : 1)];

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
		    hier[key] = [];
		    for (var j=0; j<=levelIndex[displayLevel]; j++) {
			hier[key].push(stm.DataStore.taxonomy[widget.taxLevels[j]][stm.DataStore.taxonomy["organism"][datums[0]][j]]);
		    }
		} else {
		    if (! stm.DataStore.ontology.hasOwnProperty(source)) {
			continue;
		    }
		    if (! stm.DataStore.ontology[source]['id'][datums[0]]) {
			console.log("function not found: "+datums[0]);
			continue;
		    }
		    key = stm.DataStore.ontology[source][displayLevel][stm.DataStore.ontology[source]['id'][datums[0]][flevelIndex[source+"-"+displayLevel]]];
		    hier[key] = [];
		    for (var j=0; j<=flevelIndex[source+"-"+displayLevel]; j++) {
			hier[key].push(stm.DataStore.ontology[source][widget.ontLevels[source][j]][stm.DataStore.ontology[source]['id'][datums[0]][j]]);
		    }
		}
		if (! d.hasOwnProperty(key)) {
		    d[key] = [];
		    e[key] = [];
		    for (var j=0;j<c.items.length;j++) {
			d[key][j] = 0;
			e[key][j] = 0;
		    }
		}
		d[key][i] += val;
		e[key][i] += val * p.data[row + dataRow + 1];
		matrix.abundances[i] += val;
	    }
	}
	matrix.rows = Retina.keys(d).sort();
	for (var i=0; i<matrix.rows.length; i++) {
	    matrix.data.push(d[matrix.rows[i]]);
	    for (var h=0; h<e[matrix.rows[i]].length; h++) {
		e[matrix.rows[i]][h] = e[matrix.rows[i]][h] / d[matrix.rows[i]][h];
	    }
	    matrix.evalues.push(e[matrix.rows[i]]);
	}

	c.parameters.depth = (displayType == "taxonomy" ? levelIndex[displayLevel] : flevelIndex[source+"-"+displayLevel]) + 1;
	c.matrix = matrix;
	c.matrix.itemsX = matrix.cols.length;
	c.matrix.itemsY = matrix.rows.length;
	c.matrix.itemsProd = matrix.cols.length * matrix.rows.length;
	c.hierarchy = hier;

	return c;
    };

    widget.containerSetIDs = function (container, metadatum) {
	var widget = this;

	var redraw = true;
	if (container) {
	    redraw = false;
	} else {
	    container = stm.DataStore.dataContainer[widget.selectedContainer];
	}

	container.parameters.metadatum = metadatum;
	for (var i=0; i<container.matrix.cols.length; i++) {
	    container.matrix.cols[i] = container.items[i][metadatum];
	}

	if (redraw) {
	    widget.visualize(widget.currentType);
	}
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

    widget.container2pca = function (data) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var c = stm.DataStore.dataContainer[widget.selectedContainer];

	if (c.parameters.pcaComponentA == null) {
	    c.parameters.pcaComponentA = 0;
	    c.parameters.pcaComponentB = 1;
	}

	var matrix = Retina.copyMatrix(data || c.matrix.data);
	var pca = Retina.pca(Retina.distanceMatrix(Retina.transposeMatrix(matrix)));
	var points = [];
	var colors = GooglePalette();
	for (var i=0; i<pca.coordinates.length; i++) {
	    points.push( { "x": pca.coordinates[i][c.parameters.pcaComponentA], "y": pca.coordinates[i][c.parameters.pcaComponentB], "name": c.matrix.cols[i], "format": { "fill": colors[i] } } );
	}
	
	return { "data": [ { "points": points } ], "cols": c.matrix.cols };
    };

    widget.container2differential = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var c = stm.DataStore.dataContainer[widget.selectedContainer];
	var matrix = Retina.copyMatrix(c.matrix.data);
	var points = [];
	for (var i=0; i<matrix.length; i++) {
	    points.push( { "x": Retina.log10(matrix[i][0]), "y": Retina.log10(matrix[i][1]), name: c.matrix.rows[i] });
	}
	
	return { "data": [ { "points": points } ] };
    };

    widget.container2plot = function (field) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var c = stm.DataStore.dataContainer[widget.selectedContainer];
	var groups = [];

	for (var i=0; i<c.items.length; i++) {
	    groups.push({ name: c.matrix.cols[i], points: [] });
	    var data = jQuery.extend(true, [], stm.DataStore.profile[c.items[i].id].metagenome.statistics[field]);
	    for (var h=0; h<data.length; h++) {
		groups[i].points.push({x: data[h][0], y: data[h][1]});
	    }
	}

	return { data: groups };
    };

    /*
      DATA SECTION
     */
    widget.visualizationMapping = function () {
	return { 'matrix': { title: 'abundance matrix',
			     renderer: "matrix",
			     settings: {},
			     controlGroups: [
				 { "data":
				   [
				       { "name": "normalize", "type": "bool", "description": "normalize the datasets", "title": "perform normalization", "isDataUpdater": true },
				       { "name": "log", "type": "bool", "description": "view log base 10 of the data", "title": "perform log10", "isDataUpdater": true }
				   ]
				 }
			     ]
			   },
		 'heatmap': { title: 'heatmap',
			      renderer: "svg2",
			      settings: widget.graphs.heatmap,
			      controlGroups: widget.graphs.heatmap.controls
			    },
		 'piechart': { title: 'piechart',
			       renderer: "svg2",
			       settings: widget.graphs.pie,
			       controlGroups: widget.graphs.pie.controls
			     },
		 'barchart': { title: 'barchart',
			       renderer: "svg2",
			       settings: widget.graphs.stackedBar,
			       controlGroups: widget.graphs.stackedBar.controls
			     },
		 'barchart2': { title: 'barchart',
				renderer: "svg2",
				settings: widget.graphs.bar,
				controlGroups: widget.graphs.bar.controls,
				logAxes: [ 0 ]
			     },
		 'pca': { title: 'pca',
			  renderer: 'svg2',
			  settings: widget.graphs.pca,
			  controlGroups: widget.graphs.pca.controls,
			  dataConversion: 'container2pca' },
		 'differential': { title: 'differential coverage',
				   renderer: 'svg2',
				   settings: widget.graphs.differential,
				   controlGroups: widget.graphs.differential.controls,
				   dataConversion: 'container2differential' },
		 'table': { title: 'table',
			    renderer: 'table',
			    settings: { 'sort_autodetect': true },
			    dataConversion: "container2table",
			    controlGroups:
			    [
				{ "general":
				  [
				      { "name": 'filter_autodetect', "type": 'bool', "description": "should all columns have an auto detected filter?",
					"title": "filter autodetection" }
				  ]
				},
				{ "data":
				   [
				       { "name": "normalize", "type": "bool", "description": "normalize the datasets", "title": "perform normalization", "isDataUpdater": true }
				   ]
				},
				{ "layout":
				  [
				      { "name": 'rows_per_page', "type": 'int', "description": "number of rows diplayed per page", "title": "rows per page" },
				  ]
				}
			    ]
			  },
		 'rarefaction': { title: 'rarefaction plot',
				  renderer: 'svg2',
				  settings: widget.graphs.rarefaction,
				  controlGroups: widget.graphs.rarefaction.controls,
				  dataConversion: "container2plot",
				  dataField: "rarefaction"
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
	    var html = [ "<div style='border: 1px solid #dddddd; border-radius: 6px; padding: 10px;'><h3 style='margin-top: 0px;'>Create a new Analysis Container <span style='cursor: pointer;' title='click to see a short tutorial video'><sup>[?]</sup></span></h3><p>An analysis container holds all the <span class='tt' data-title='Analysis Container Settings' data-content='<p>The settings include the list of referenced profiles, the selected data-sources, the current cutoffs like e-value or alignment length, taxonomic or hierarchical filters and the current visualization.</p><p>Once the container is ready, you can adjust the settings in the righthand menu.</p>'>settings</span> for your analysis, as well as the current analysis result. It is based on metagenomic profiles, which contain all the raw data.</p><p>Select the databases and the profiles for your analysis container. You can name the container in the text-field <i>analysis container name</i>. Click the <i class='icon-ok'></i></a>-button below to begin.</p><p><span class='tt' data-title='Metagenomic Profiles' data-content='<p>Profiles are generated on our server on demand. The initial calculation may take some time, depending on the profile size. Once computed, they will be cached and subsequent requests will download immediately.</p><p>You can use the <i class=\"icon icon-folder-open\"></i>-icon in the top menu bar to store profiles on your harddrive and upload them back into your browser cache (without requiring interaction with our server).</p>'>Profiles</span> which are not yet on your machine will be downloaded. Once all required profiles are available, the analysis container is ready for exploration!</p><div style='overflow-x: auto;'>" ];


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

	    // add the tooltips
	    jQuery('.tt').popover({"trigger": "hover", "html": true, "placement": "bottom"});

	    // show the databases
	    widget.showDatabases("protein");

	    // create a metagenome selection renderer
	    var result_columns = widget.header || [ "id", "name", "project_id", "project_name", "PI_lastname", "biome", "feature", "material", "env_package_type", "location", "country", "longitude", "latitude", "collection_date", "sequence_type", "seq_method", "status", "created" ];
	    widget.mgselect = Retina.Renderer.create("listselect", {
		target: document.getElementById("mgselect"),
		headers: stm.authHeader,
		callback: Retina.WidgetInstances.metagenome_analysis[1].loadData,
		asynch_limit: 100,
		synchronous: false,
		navigation_url: RetinaConfig.mgrast_api+'/metagenome?match=all&verbosity=mixs',
		data: [],
		filter: result_columns,
		result_field: true,
		result_field_placeholder: "analysis container name",
		result_field_default: widget.result_field_default || "",
		multiple: true,
		extra_wide: true,
		return_object: true,
		filter_attribute: 'name',
		asynch_filter_attribute: 'name',
		value: "id"
	    });

	    widget.mgselect.update_data({},1);
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
    };
    
    widget.loadDone = function (container) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (container.status == "ready") {
	    var html = "<p style='text-align: center;'>Your data is loaded and was placed in this container.<br>Click to analyze.</p>";
	    html += '<div style="cursor: pointer; border: 1px solid rgb(221, 221, 221); border-radius: 6px; box-shadow: 2px 2px 2px; margin-left: auto; margin-right: auto; margin-top: 20px; margin-bottom: 20px; font-weight: bold; height: 75px; width: 75px; text-align: center;" onclick="Retina.WidgetInstances.metagenome_analysis[1].selectedContainer=\''+container.id+'\';Retina.WidgetInstances.metagenome_analysis[1].visualize(Retina.WidgetInstances.metagenome_analysis[1].currentType);document.getElementById(\'dataprogress\').innerHTML=\'\';" class="glow"><img src="Retina/images/bar-chart.png" style="margin-top: 5px; width: 50px;">'+container.id+'</div>';
	    widget.selectedContainer = container.id;
	    stm.DataStore.dataContainer[widget.selectedContainer].parameters.sources = stm.DataStore.profile[stm.DataStore.dataContainer[widget.selectedContainer].items[0].id].sources;
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

	var name = collectionName || widget.dataLoadParams.name || "analysis"+Retina.keys(stm.DataStore.dataContainer).length;

	if (ids.length) {

	    // sanity check if there is a sequence type mix
	    var seqTypes = {};
	    for (var i=0; i<ids.length; i++) {
		if (! seqTypes.hasOwnProperty(ids[i].sequence_type)) {
		    seqTypes[ids[i].sequence_type] = 0;
		}
		seqTypes[ids[i].sequence_type]++;
	    }
	    if (Retina.keys(seqTypes).length > 1) {
		if (! confirm("Your selection is composed of multiple sequence types ("+Retina.keys(seqTypes).join(", ")+").\n\nYou can check the sequence type by selecting it in the filter type. Are you sure you want to load these data?")) {
		    return;
		}
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
								metadatum: "name",
								evalue: widget.cutoffThresholds.evalue,
								identity: widget.cutoffThresholds.identity,
								alilength: widget.cutoffThresholds.alilength,
								taxFilter: [],
								ontFilter: [] },
						  created: Retina.date_string(new Date().getTime()),
						  user: stm.user || "anonymous" };
	    if (typeof Retina.WidgetInstances.metagenome_analysis[1].loadDone == "function") {
		stm.DataStore.dataContainer[name].callbacks.push(Retina.WidgetInstances.metagenome_analysis[1].loadDone);
	    }
	} else {
	    alert('You did not select any metagenomes');
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
				  contentType: 'application/json',
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
		stm.DataStore.dataContainer[name].promises.push(
		    jQuery.ajax({ url: RetinaConfig.mgrast_api + "/metagenome/" + ids[i].id + "?verbosity=stats",
				  dc: name,
				  contentType: 'application/json',
				  headers: stm.authHeader,
				  bound: "profile"+id,
				  metagenome: id,
				  success: function (data) {
				      var widget = Retina.WidgetInstances.metagenome_analysis[1];
				      if (data != null) {
					  if (data.hasOwnProperty('ERROR')) {
					      console.log("error: "+data.ERROR);
					      widget.updatePDiv(this.bound, 'error', data.ERROR);
					  } else if (data.hasOwnProperty('statistics')) {
					      if (stm.DataStore.profile.hasOwnProperty(this.metagenome)) {
						  stm.DataStore.profile[this.metagenome].metagenome = data;
					      } else {
						  stm.DataStore.metagenome[this.metagenome] = data;
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
			     contentType: 'application/json',
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
			     contentType: 'application/json',
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
					 if (stm.DataStore.metagenome.hasOwnProperty(data.data.id)) {
					     stm.DataStore.profile[data.data.id].metagenome = jQuery.extend(true, {}, stm.DataStore.metagenome[data.data.id]);
					     delete stm.DataStore.metagenome[data.data.id];
					 }
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
	    if (document.getElementsByClassName('hasSVG').length) {
		var source = document.getElementsByClassName('hasSVG')[0].firstChild;
		Retina.svg2png(null, resultDiv, source.getAttribute('width'), source.getAttribute('height')).then(
		    function() {
			Retina.WidgetInstances.metagenome_analysis[1].saveCanvas();
		    });
	    }
	    // the image is html
	    else {
		var source = document.getElementById('visualizeTarget');
		html2canvas(source, {
		    onrendered: function(canvas) {
			document.getElementById('canvasResult').appendChild(canvas);
			Retina.WidgetInstances.metagenome_analysis[1].saveCanvas();
		    }
		});
	    }
	} else if (type == 'svg') {
	    // the image is svg
	    if (document.getElementById('SVGdiv1')) {
		stm.saveAs(document.getElementById('SVGdiv1').innerHTML, widget.selectedContainer + ".svg");
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
	} else if (type == 'shock') {
	    if (stm.user) {
		widget.createAnalysisObject();
	    } else {
		alert('you must be logged in to use this function');
	    }
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

    widget.createAnalysisObject = function (download) {
	var widget = this;

	// set up the node
	var c = jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer]);
	delete c.callbacks;
	delete c.promises;
	delete c.status;
	delete c.user;

	// create download
	if (download) {
	    if (document.getElementById('SVGdiv1')) {
		c.image = document.getElementById('SVGdiv1').innerHTML;
	    }
	    stm.saveAs(JSON.stringify(c), c.id + ".ao.json");
	}

	// upload to SHOCK
	else {
	    
	    // disable the upload button
	    document.getElementById('uploadButton').removeAttribute('onclick');
	    document.getElementById('uploadButton').setAttribute('src', 'Retina/images/waiting.gif');
	    
	    // set up the url
	    var url = RetinaConfig.shock_url+'/node';
	    var attributes = new Blob([ JSON.stringify({ "type": "analysisObject", "hasVisualization": "1", "owner": stm.user.id, "container": c }) ], { "type" : "text\/json" });
	    var form = new FormData();
	    var filename = widget.selectedContainer;
	    form.append('attributes', attributes);
	    form.append('file_name', filename);
	    var image = new Blob([ document.getElementById('SVGdiv1').innerHTML ], { "type" : "image\/svg+xml" });
	    form.append('upload', image);
	    
	    jQuery.ajax(url, {
		contentType: false,
		processData: false,
		data: form,
		success: function(data) {
		    jQuery.ajax({ url: RetinaConfig.shock_url+'/node/'+data.data.id+'/acl/public_read',
				  success: function(data) {
				      document.getElementById('uploadButton').setAttribute('onclick', 'Retina.WidgetInstances.metagenome_analysis[1].exportData("shock");');
				      document.getElementById('uploadButton').setAttribute('src', 'Retina/images/cloud-upload.png');
				      alert('image uploaded');
				  },
				  error: function(jqXHR, error) {
				      document.getElementById('uploadButton').setAttribute('src', 'Retina/images/cloud-upload.png');
				      document.getElementById('uploadButton').setAttribute('onclick', 'Retina.WidgetInstances.metagenome_analysis[1].exportData("shock");');
				      alert('image upload failed');
				  },
				  crossDomain: true,
				  headers: stm.authHeader,
				  type: "PUT"
				});
		},
		error: function(jqXHR, error){
		    alert('image upload caused an error');
		},
		crossDomain: true,
		headers: stm.authHeader,
		type: "POST"
	    });
	}
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

    widget.loadGraphs = function () {
	var widget = this;

	var graphs = [ "pie", "stackedBar", "bar", "heatmap", "rarefaction", "pca", "differential" ];
	for (var i=0; i<graphs.length; i++) {
	    jQuery.ajax({ url: 'data/graphs/'+graphs[i]+'.json',
			  contentType: 'application/json',
			  graph: graphs[i],
			  complete: function (xhr) {
			      var widget = Retina.WidgetInstances.metagenome_analysis[1];
			      
			      widget.graphs[this.graph] = JSON.parse(xhr.responseText);
			  }
			});
	}
    };

    /*
      PLUGINS
    */

    // open a window for the plugin, pass the data and initialize it
    widget.plugin = function (which) {
	var widget = this;

	var info = { "krona": { "authors": "Ondov BD, Bergman NH, and Phillippy AM", "publication": "http://www.ncbi.nlm.nih.gov/pubmed/21961884" },
		     "kegg": { "authors": "Tobias Paczian" } };

	var d = widget["container2"+which]();
	if (! d) {
	    return;
	}
	
	var data = { "plugin": which,
		     "info": info[which],
		     "transfer": d };

	var w = window.open('plugin.html');
	w.onload = function () {
	    w.initWebApp(data);
	};
    };

    widget.container2kegg = function () {
	var widget = this;

	var container = jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer]);
	var hasKO = false;
	var koSource = 0;
	for (var i=0; i<container.parameters.sources.length; i++) {
	    if (container.parameters.sources[i] == "KO") {
		hasKO = true;
		koSource = i;
		break;
	    }
	}
	if (! hasKO) {
	    alert("Your container must include the KO source to use the KEGG Mapper");
	    return false;
	}

	// set the correct parameters
	container.parameters.displayType = "function";
	container.parameters.displayLevel = "function";
	container.parameters.displaySource = koSource;

	// get the functions
	var funcs = jQuery.extend(true, {}, widget.container2matrix(container).matrix);

	container.parameters.displayLevel = "level3";
	
	// get the maps
	var maps = jQuery.extend(true, {}, widget.container2matrix(container).matrix);
	
	var data = { "functions": funcs, "maps": maps };
	
	return data;
    };

    widget.container2krona = function () {
	var widget = this;

	var container = stm.DataStore.dataContainer[widget.selectedContainer];
	var ranks = container.parameters.displayType == "taxonomy" ? widget.taxLevels.slice(0, container.parameters.depth) : widget.ontLevels[container.parameters.sources[container.parameters.displaySource]].slice(0, container.parameters.depth);
	var matrixdata = [];
	for (var i=0; i<container.matrix.cols.length; i++) {
	    matrixdata.push([]);
	    for (var h=0; h<container.matrix.data.length; h++) {
		var row = [];
		for (var j=0;j<ranks.length; j++) {
		    row.push(container.hierarchy[container.matrix.rows[h]][j]);
		}
		row.push(container.matrix.data[h][i]);
		row.push(container.matrix.evalues[h][i]);
		matrixdata[i].push(row);
	    }
	}

	if (ranks[2] == "className") { ranks[2] = "class"; }
	
	var data = { "ranks": ranks,
		     "names": container.matrix.cols,
		     "data": matrixdata,
		     "containerName": container.id };
	return data;
    };
    
})();
