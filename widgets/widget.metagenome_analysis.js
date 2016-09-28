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
    widget.currentType = "barchart";
    
    // main display function called at startup
    widget.display = function (params) {
	widget = this;
        var index = widget.index;

	// set callback for profile manager
	if (Retina.WidgetInstances.profileManager && Retina.WidgetInstances.profileManager.length == 2) {
	    Retina.WidgetInstances.profileManager[1].callback = Retina.WidgetInstances.metagenome_analysis[1].enableLoadedProfiles;
	}
	
	jQuery.extend(widget, params);

	// initialize data storage
	if (! stm.DataStore.hasOwnProperty('metagenome')) {
	    stm.DataStore.metagenome = {};
	}
	if (! stm.DataStore.hasOwnProperty('profile')) {
	    stm.DataStore.profile = {};
	}

	// set page title
	document.getElementById("pageTitle").innerHTML = "analysis";

	// check for user / collections
	if (stm.user) {
	    stm.loadPreferences().then(function(){
		Retina.WidgetInstances.metagenome_analysis[1].enableCollections();
	    });
	}
	
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
	var toolshtml = "";
	if (Retina.cgiParam('recipe')) {
	    widget.isRecipe = true;
	    toolshtml += "<div id='recipeDisplay' style='border-radius: 5px;'></div>";
	    jQuery.getJSON('data/recipes/recipe'+Retina.cgiParam('recipe')+'.recipe.json', function (data) {
		Retina.WidgetInstances.metagenome_analysis[1].showRecipe(data);
	    });
	} else {
	    toolshtml += "<h4>Analysis Containers</h4>";
	    toolshtml += "<div id='availableContainers'></div>";
	}
	toolshtml += "<hr style='clear: both; margin-top: 15px; margin-bottom: 5px;'>";
	toolshtml += "<div id='currentContainerParams'></div><div id='recipeShowMoreOptions' style='display: none; text-align: center;'><button class='btn' onclick='document.getElementById(\"recipeShowMoreOptions\").style.display=\"none\";document.getElementById(\"containerActive\").style.display=\"\";'>show more options</button></div><div id='containerActive' style='display: none;'>";
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

	// add recipe editor modal
	var recipeDiv = document.createElement('div');
	recipeDiv.setAttribute('class', 'modal hide fade');
	recipeDiv.setAttribute('aria-hidden', "true");
	recipeDiv.setAttribute('id', 'recipeModal');
	recipeDiv.setAttribute('tabindex', "-1");
	recipeDiv.setAttribute('role', "dialog");
	recipeDiv.innerHTML = '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h3>Create a new recipe</h3></div><div class="modal-body" id="recipeModalContent" style="max-height: 550px;"></div><div class="modal-footer"><a href="#" class="btn btn-danger pull-left" data-dismiss="modal" aria-hidden="true">cancel</a><a href="#" class="btn" onclick="Retina.WidgetInstances.metagenome_analysis[1].createRecipe(true);"><img src="Retina/images/cloud-download.png" style="width: 16px; margin-right: 5px;"> download recipe</a><a href="#" class="btn" onclick="Retina.WidgetInstances.metagenome_analysis[1].createRecipe(false);"><img src="Retina/images/cloud-upload.png" style="width: 16px; margin-right: 5px;"> upload recipe to myData</a></div></div>';
	document.body.appendChild(recipeDiv);
    };

    /*
      PAGE SETUP
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
	html += "<img src='Retina/images/file-fasta.png' class='tool' onclick='if(confirm(\"Download annotated reads as FASTA?\"){Retina.WidgetInstances.metagenome_analysis[1].downloadFASTA();}' title='download annotated reads as FASTA'>";


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
    	html += "<img src='Retina/images/donut.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"donutchart\");' title='donutchart'>";
	html += "<img src='Retina/images/rarefaction.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"rarefaction\");' title='rarefaction plot'>";
    	html += "<img src='Retina/images/barchart.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"barchart2\");' title='grouped barchart'>";
    	html += "<img src='Retina/images/stackedbarchart.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"barchart\");' title='stacked barchart'>";

	html += "<img src='Retina/images/scatterplot.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"pca\");' title='PCoA'>";
	html += "<img src='images/icon_heatmap.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"heatmap\");' title='heatmap'>";
	html += "<img src='Retina/images/differential.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"differential\");' title='differential coverage'>";
	

    	container.innerHTML = html;
    };

    /*
      VISUALIZATION MANAGEMENT
    */

    // draw the selected visualization
    widget.visualize = function (type) {
    	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var c = stm.DataStore.dataContainer[widget.selectedContainer];
	type = type || c.currentRendererType || widget.currentType;
    	c.currentRendererType = widget.currentType = type;
	if (! c.visualization.hasOwnProperty(type)) {
	    c.visualization[type] = {};
	}
	
    	document.getElementById("data").style.display = "none";
    	document.getElementById("visualize").style.display = "";

    	var container = document.getElementById('visualize');

    	if (type == "container") {
    	    widget.showCurrentContainerParams();
    	    return;
    	}

    	var visMap = widget.visualizationMapping();
	
    	var html = "<p style='font-size: 20px; font-weight: 500;'>"+visMap[type].title+" of " + (widget.selectedContainer ? widget.selectedContainer : "demonstration analysis") + "</p><div id='visualizeTarget'></div>";

    	container.innerHTML = html;

	// get the target div
    	visMap[type].settings.target = document.getElementById('visualizeTarget');

	// reset the renderer instance
    	if (Retina.RendererInstances[visMap[type].renderer]) {
    	    Retina.RendererInstances[visMap[type].renderer] = [ jQuery.extend(true, {}, Retina.RendererInstances[visMap[type].renderer][0]) ];
    	}

	// reset the renderer controller instance
    	if (Retina.WidgetInstances.RendererController) {
    	    Retina.WidgetInstances.RendererController = [ jQuery.extend(true, {}, Retina.WidgetInstances.RendererController[0]) ];
    	}
	
	// get the settings
	var settings = jQuery.extend(true, {}, visMap[type].settings, c.visualization[type]);
	jQuery.extend(true, c.visualization[type], settings);

	// check if we need to adjust the control groups
	var requireDataUpdate = false;
	var groups = visMap[type].controlGroups;
	var dataUpdaters = [];
	for (var i=0; i<groups.length; i++) {
	    var k = Retina.keys(groups[i])[0];
	    for (var h=0; h<groups[i][k].length; h++) {
		var item = groups[i][k][h];

		// create default settings, if no other settings are present
		if (settings.hasOwnProperty(item.name)) {
		    if (item.hasOwnProperty('default')) {
			item['default'] = c.visualization[type][item.name];
		    } else if (item.hasOwnProperty('defaultTrue')) {
			item['defaultTrue'] = c.visualization[type][item.name];
		    }
		} else {
		    if (item.hasOwnProperty('default')) {
			c.visualization[type][item.name] = settings[item.name] = item['default'];
		    } else if (item.hasOwnProperty('defaultTrue')) {
			c.visualization[type][item.name] = settings[item.name] = item['defaultTrue'];
		    }
		}
		
		// check if this is a data updater
		if (item.isDataUpdater) {
		    dataUpdaters.push(item);
		    requireDataUpdate = true;
		}

		// check if the control item needs to adapt to the sample data
		if (item.adaptToData) {
		    var opts = [];
		    if (item.values && item.values == "metadata") {
			var mdkeys = Retina.keys(c.items[0]).sort();
			for (var j=0; j<mdkeys.length; j++) {
			    var opt = { "label": mdkeys[j], "value": mdkeys[j] };
			    if (item.hasOwnProperty('default') && (item["default"] == mdkeys[j])) {
				opt.selected = true;
			    } else if (c.parameters.metadatum == mdkeys[j]) {
				opt.selected = true;
			    }
			    opts.push(opt);
			}
		    } else {
			for (var j=0; j<c.items.length; j++) {
			    var opt = {};
			    if (item.values && item.values == "counter") {
				opt.label = j + 1;
				opt.value = j;
			    } else { 
				opt.value = j;
				opt.label = c.items[j].name;
			    }
			    if ((settings.hasOwnProperty(item.name) && settings[item.name] == j) || (item.hasOwnProperty('default') && item['default'] == j)) {
				opt.selected = true;
			    }
			    opts.push(opt);
			}
		    }
		    item.options = opts;
		}
	    }
	}

	// set the data
	settings.data = visMap[type].hasOwnProperty('dataConversion') ? widget[visMap[type].dataConversion](visMap[type].dataField) : jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer].matrix);

	// perform the data callback if needed
	if (requireDataUpdate && ! visMap[type].hasOwnProperty('dataField')) {
	    settings = widget.dataCallback({"dataUpdaters": dataUpdaters, "settings": settings});
	}

	// set the callback
	settings.callback = widget.graphCallback;

	// set the current controller
    	widget.currentVisualizationController = Retina.Widget.create('RendererController', { "target": document.getElementById("visualizeTarget"), "type": visMap[type].renderer, "settings": settings, "controls": groups, "showBreadcrumbs": true, "breadcrumbs": c.breadcrumbs || "", "dataCallback": widget.dataCallback, "settingsCallback": widget.settingsCallback });
    };

    // adjust renderer settings
    widget.settingsCallback = function (name, value) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var c = stm.DataStore.dataContainer[widget.selectedContainer];
	var ind;
	if (name.match(/^items\[/)) {
	    var ret = name.match(/^items\[(\d+)\]\.parameters\.(.+)/);
	    ind = ret[1];
	    name = ret[2];
	} else if (name.match(/^\d/)) {
	    ind = parseInt(name.match(/^\d+/)[0]);
	    name = name.match(/\D+/)[0];
	} else {
	    c.visualization[c.currentRendererType][name] = value;
	    return;
	}
	c.visualization[c.currentRendererType].items[ind].parameters[name] = value;
    };

    // adjust the data for visualization
    widget.dataCallback = function (rc) {
	var settings = rc.hasOwnProperty('renderer') ? rc.renderer.settings : rc.settings;

	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	var c = stm.DataStore.dataContainer[widget.selectedContainer];

	// check what kind of data operation is requested
	var data = jQuery.extend(true, {}, c.matrix);

	var visMap = widget.visualizationMapping()[widget.currentType];

	if (visMap.hasOwnProperty('dataField')) {
	    return;
	}
	
	// iterate over all data attributes
	for (var i=0; i<rc.dataUpdaters.length; i++) {
	    var opt = rc.dataUpdaters[i];
	    
	    // data normalization
	    if (opt.name == "normalize" && settings[opt.name]) {
		data.data = Retina.transposeMatrix(Retina.normalizeMatrix(Retina.transposeMatrix(data.data)));
	    }

	    // turn data to log
	    else if (opt.name == "log") {
		if (settings[opt.name]) {
		    data.data = Retina.logMatrix(data.data);
		    if (visMap.hasOwnProperty('logAxes')) {
			for (var h=0; h<visMap.logAxes.length; h++) {
			    settings.items[visMap.logAxes[h]].parameters.isLog = true;
			    settings.items[visMap.logAxes[h]].data += "log";
			}
		    }
		} else {
		    if (visMap.hasOwnProperty('logAxes')) {
			for (var h=0; h<visMap.logAxes.length; h++) {
			    settings.items[visMap.logAxes[h]].parameters.isLog = false;
			    settings.items[visMap.logAxes[h]].data = settings.items[visMap.logAxes[h]].data.replace(/log$/, '');
			}
		    }
		}
	    }

	    // set pca components
	    else if (opt.name == "pcaa" || opt.name == "pcab") {
		if (opt.name == "pcaa") {
		    c.parameters.pcaComponentA = settings[opt.name] || 0;
		} else {
		    c.parameters.pcaComponentB = settings.hasOwnProperty(opt.name) ? settings[opt.name] : 1;
		}
	    }

	    // set the differential plot metagenomes
	    else if (opt.name == "mga" || opt.name == "mgb") {
		if (opt.name == "mga") {
		    c.parameters.differentialMetagenomeA = settings[opt.name] || 0;
		} else {
		    c.parameters.differentialMetagenomeB = settings.hasOwnProperty(opt.name) ? settings[opt.name] : 1;
		}
	    }

	    // update the metadatum
	    else if (opt.name == "metadatum" && settings.hasOwnProperty('metadatum')) {
		c.parameters.metadatum = settings.metadatum;
		for (var h=0; h<data.cols.length; h++) {
		    data.cols[h] = c.items[h][settings[opt.name]];
		}
	    }
	}
	
	if (visMap.hasOwnProperty('dataConversion')) {
	    data = widget[visMap.dataConversion](data);
	}
	
	settings.data = data;
	
	return settings;
    };

    // a visualization was clicked to navigate
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

    // navigate to a breadcrumb that was clicked
    widget.activateBreadcrumb = function (level, value) {
	var widget = this;
	
	var container = stm.DataStore.dataContainer[widget.selectedContainer];	

	// remove all filters below the selected level
	var newfilters = [];
	var levels = container.parameters.displayType == "function" ? widget.ontLevels.Subsystems : widget.taxLevels;
	var filter = container.parameters.displayType == "function" ? container.parameters.ontFilter : container.parameters.taxFilter;
	for (var i=0; i<filter.length; i++) {
	    var f = filter[i];
	    var stay = true;
	    for (var h=0; h<levels.length; h++) {
		if (levels[h] == f.level) {
		    stay = false;
		    break;
		}
	    }
	    if (stay) {
		newfilters.push(f);
	    }
	}
	
	var bread = "<a href='#' onclick='Retina.WidgetInstances.metagenome_analysis[1].activateBreadcrumb(0);'>&raquo; all</a> ";
	    
	// add the breadcrumb as new filter
	if (value != null) {
	    newfilters.push({"level": levels[level], "source": container.parameters.displaySource, "value": value });
	    var hier = container.hierarchy[Retina.keys(container.hierarchy)[0]];
	    for (var h=0; h<=level; h++) {
		bread += "<a href='#' onclick='Retina.WidgetInstances.metagenome_analysis[1].activateBreadcrumb("+h+", \""+hier[h]+"\");'>&raquo; "+hier[h]+"</a> ";
	    }
	}
	
	container.parameters[container.parameters.displayType == "function" ? "ontFilter" : "taxFilter" ] = newfilters;
	container.breadcrumbs = bread;
	container.parameters.displayLevel = levels[value == null ? 0 : level + 1];
	
	if (! widget.container2matrix()) { return; }
	widget.showCurrentContainerParams();
	widget.visualize();
    };

    /*
      DATA CONTAINERS
    */

    // delete a container
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
		container.parameters.taxFilter.push({ "source": value2, "level": value3, "value": value4 });
	    }
	}
	// check if this is an ontology filter
	else if (param == 'ontFilter') {
	    if (value == "remove") {
		container.parameters.ontFilter.splice(value2, 1);
	    } else {
		container.parameters.ontFilter.push({ "source": value2, "level": value3, "value": value4 });
	    }
	}
	// check if this is a numerical filter
	else if (param == "evalue" || param == "identity" || param == "alilength" || param == "abundance") {
	    container.parameters[param] = parseFloat(value);
	}
	else if (param =="default") {
	    container.parameters.evalue = widget.cutoffThresholds.evalue;
	    container.parameters.identity = widget.cutoffThresholds.identity;
	    container.parameters.alilength = widget.cutoffThresholds.alilength;
	    container.parameters.abundace = 1;
	}
	else {
	    if (param == "displayType") {
		if (value == "function") {
		    container.parameters.displayLevel = "level1";
		} else {
		    container.parameters.displayLevel = "domain";
		}
	    }

	    // check breadcrumbs
	    if (param == "displayLevel") {
		container.breadcrumbs = "";

		var levels = container.parameters.displayType == "function" ? widget.ontLevels.Subsystems : widget.taxLevels;
		var filter = container.parameters.displayType == "function" ? container.parameters.ontFilter : container.parameters.taxFilter;
		var lindex;
		for (var i=0; i<levels.length; i++) {
		    if (levels[i] == value) {
			lindex = i;
			break;
		    }
		}
		
		// determine the tax levels above
		for (var i=0; i<filter.length; i++) {
		    var f = filter[i];
		    var findex;
		    for (var h=0; h<levels.length; h++) {
			if (levels[h] == f.level) {
			    findex = h;
			    break;
			}
		    }
		    
		    if (findex + 1 == lindex) {
			container.updateBreadcrumbs = "taxonomy";
			break;
		    }
		}
	    }
	    
	    container.parameters[param] = value;
	}
	document.getElementById('visualize').setAttribute('disabled', 'disabled');
	if (! widget.container2matrix()) { return; }
	
	// check for breadcrumbs
	if (container.updateBreadcrumbs) {
	    var bread = "<a href='#' onclick='Retina.WidgetInstances.metagenome_analysis[1].activateBreadcrumb(0);'>&raquo; all</a> ";
	    var hier = container.hierarchy[Retina.keys(container.hierarchy)[0]];
	    for (var h=0; h<hier.length - 1; h++) {
		bread += "<a href='#' onclick='Retina.WidgetInstances.metagenome_analysis[1].activateBreadcrumb("+h+", \""+hier[h]+"\");'>&raquo; "+hier[h]+"</a> ";
	    }
	    container.breadcrumbs = bread;
	    delete container.updateBreadcrumbs;
	}
	
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
	var html = [ "<h4><span id='containerID'>"+widget.selectedContainer+"</span><span id='containerIDEdit' style='display: none;'><input type='text' value='"+c.id+"' id='containerIDInput'></span><button class='btn btn-mini pull-right btn-danger' style='margin-left: 10px;' title='delete analysis container' onclick='if(confirm(\"Really delete this analysis container? (This will not remove the loaded profile data)\")){Retina.WidgetInstances.metagenome_analysis[1].removeDataContainer();};'><i class='icon icon-trash'></i></button>"+(Retina.cgiParam('admin') ? "<button class='btn btn-mini pull-right' onclick='Retina.WidgetInstances.metagenome_analysis[1].showRecipeEditor();' title='create recipe'><img src='Retina/images/forkknife.png' style='width: 16px;'></button>" : "")+"<button class='btn btn-mini pull-right' onclick='Retina.WidgetInstances.metagenome_analysis[1].createAnalysisObject(true);' title='download container'><img src='Retina/images/cloud-download.png' style='width: 16px;'></button><button class='btn btn-mini pull-right' id='toggleEditContainerName' onclick='jQuery(\"#containerID\").toggle();jQuery(\"#containerIDEdit\").toggle();' title='edit container name'><i class='icon icon-edit'></i></button></h4>" ];

	// cutoffs
	
	// e-value
	html.push('<div class="input-prepend" id="evalueField" style="margin-right: 5px;"><button class="btn btn-mini" style="width: 50px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'evalue\',this.nextSibling.value);">e-value</button><input id="evalueInput" type="text" value="'+p.evalue+'" style="height: 12px; font-size: 12px; width: 30px;"></div>');

	// percent identity
	html.push('<div class="input-prepend" id="identityField" style="margin-right: 5px;"><button class="btn btn-mini" style="width: 50px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'identity\',this.nextSibling.value);">%-ident</button><input id="identityInput" type="text" value="'+p.identity+'" style="height: 12px; font-size: 12px; width: 30px;"></div>');

	// alignment length
	html.push('<div class="input-prepend" id="alilenField" style="margin-right: 5px;"><button class="btn btn-mini" style="width: 50px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'alilength\',this.nextSibling.value);">length</button><input id="alilenInput" type="text" value="'+p.alilength+'" style="height: 12px; font-size: 12px; width: 30px;"></div>');

	// abundance cutoff
	html.push('<div class="input-prepend"  id="abundanceField" style="margin-right: 5px;"><button class="btn btn-mini" style="width: 90px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'abundance\',this.nextSibling.value);">min.abundance</button><input id="abundanceInput" type="text" value="'+p.abundance+'" style="height: 12px; font-size: 12px; width: 30px;"></div>');

	// reset to default
	html.push('<button class="btn btn-mini" title="reset to defaults" style="position: relative; bottom: 5px;" onclick="Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\'default\')"><i class="icon icon-step-backward"></i></button>');

	// display params table
	html.push('<table style="font-size: 12px;">');

	// source
	html.push("<tr id='sourceField'><td>source</td><td><select id='sourceSelect' style='margin-bottom: 0px; font-size: 12px; height: 27px;' onchange='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"displaySource\",this.options[this.selectedIndex].value);'>");
	for (var i=0; i<c.parameters.sources.length; i++) {
	    var sel = "";
	    if (c.parameters.sources[i] == c.parameters.displaySource) {
		sel = " selected=selected";
	    }
	    html.push("<option"+sel+">"+c.parameters.sources[i]+"</option>");
	}
	html.push("</select></td></tr>");

	// type
	html.push("<tr id='typeField'><td>type</td><td><select id='displayTypeSelect' style='margin-bottom: 0px; font-size: 12px; height: 27px;' onchange='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"displayType\",this.options[this.selectedIndex].value);'><option"+(c.parameters.displayType=="taxonomy" ? " selected=selected" : "")+">taxonomy</option><option"+(c.parameters.displayType=="function" ? " selected=selected" : "")+">function</option></select></td></tr>");

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
	    if (ontLevels.hasOwnProperty(c.parameters.displaySource)) {
		for (var i=0; i<ontLevels[c.parameters.displaySource].length; i++) {
		    var sel = "";
		    if (ontLevels[c.parameters.displaySource][i] == c.parameters.displayLevel) {
			sel = " selected=selected";
		    }
		    displayLevelSelect += '<option'+sel+'>'+ontLevels[c.parameters.displaySource][i]+'</option>';
		}
	    }
	}
	displayLevelSelect += "</select>";
	html.push('<tr id="levelField"><td>level</td><td>'+displayLevelSelect+'</td></tr>');

	html.push('</table>');

	// filters
	html.push("<button id='filterField' class='btn btn-mini' style='margin-right: 5px;' title='add filter' onclick='jQuery(\"#addFilterDiv\").toggle();'><i class='icon icon-filter'></i></button><div style='display: none; position: relative; bottom: 10px; left: 65px;' id='addFilterDiv'>");

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
	    html.push("<button class='btn btn-mini btn-primary' style='margin-right: 5px;' title='remove this filter' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"ontFilter\", \"remove\", \""+i+"\");'>"+c.parameters.ontFilter[i].source + " - " + c.parameters.ontFilter[i].level + " - " + c.parameters.ontFilter[i].value+" &times;</button>");
	    hasFilter = true;
	}

	// taxonomy
	for (var i=0; i<c.parameters.taxFilter.length; i++) {
	    html.push("<button class='btn btn-mini btn-primary' style='margin-right: 5px;' title='remove this filter' onclick='Retina.WidgetInstances.metagenome_analysis[1].changeContainerParam(\"taxFilter\", \"remove\", \""+i+"\");'>"+c.parameters.taxFilter[i].source + " - " + c.parameters.taxFilter[i].level + " - " + c.parameters.taxFilter[i].value+" &times;</button>");
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
	document.getElementById('abundanceInput').onkeyup = function (e) {
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

    widget.container2matrix = function (container, md5only) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	// get the current container
	var c = container || stm.DataStore.dataContainer[widget.selectedContainer];

	// check if all profiles are loaded and have the required sources
	var missing = [];
	var missingids = [];
	for (var i=0; i<c.items.length; i++) {
	    if (stm.DataStore.profile.hasOwnProperty(c.items[i].id)) {
		var p = stm.DataStore.profile[c.items[i].id];
		for (var h=0; h<c.parameters.sources.length; h++) {
		    var nosource = true;
		    for (var j=0; j<p.sources.length; j++) {
			if (p.sources[j] == c.parameters.sources[h]) {
			    nosource = false;
			    break;
			}
		    }
		    if (nosource) {
			missing.push( c.items[i] );
			missingids.push(c.items[i].name + " (" + c.items[i].id + ")");
			break;
		    }
		}
	    } else {
		missing.push( c.items[i] );
		missingids.push(c.items[i].name + " (" + c.items[i].id + ")");
	    }
	}
	if (missing.length) {
	    if (widget.isRecipe || confirm("The following profiles required by your analysis are not currently loaded:\n\n"+missingids.join("\n")+"\n\nDo you want to load them now?")) {
		document.getElementById('data').setAttribute('style', "");
		document.getElementById('visualize').setAttribute('style', "display: none;");
		document.getElementById('data').innerHTML = '<div id="dataprogress" style="float: left; margin-top: 25px; margin-left: 20px; width: 90%;"></div><div style="clear: both;"></div>';
		widget.loadData(missing, c.id, true);
		return false;
	    }
	}

	// update the source map
	widget.updateSourceMap(c);

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

	    // get the source map for this profile
	    var sm = c.parameters.sourceMap[c.items[i].id];

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
			var orgs = p.data[h + 5 + (sm[c.parameters.taxFilter[j].source] * 2)];

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
			var funcs = p.data[h + 6 + (sm[c.parameters.ontFilter[j].source] * 2)];
			
			// if there is no function, it definitely fails
			if (funcs == null) {
			    break;
			} else if (typeof funcs == "number") {
			    funcs = [ funcs ];
			} else if (typeof funcs == "string") {
			    funcs = funcs.split(",");
			}
			
			var source = c.parameters.ontFilter[j].source;
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
		       abundances: [],
		       headers: [] };

	var id = c.parameters.metadatum;
	var displayLevel = c.parameters.displayLevel;
	var displaySource  = c.parameters.displaySource;
	var displayType = c.parameters.displayType;

	var d = {};
	var e = {};
	var hier = {};
	var md5s = {};
	var dataRow = 1;
	var profilesMissingSource = [];
	for (var i=0; i<c.items.length; i++) {
	    md5s[c.items[i].id] = [];
	    matrix.abundances.push(0);
	    matrix.cols.push(c.items[i][id]);
	    matrix.headers.push(c.items[i]);

	    var sourceIndex;
	    if (c.parameters.sourceMap[c.items[i].id].hasOwnProperty(c.parameters.displaySource)) {
		sourceIndex = c.parameters.sourceMap[c.items[i].id][c.parameters.displaySource];
	    } else {
		profilesMissingSource.push(c.items[i].name);
		continue;
	    }
	    
	    var pid = c.items[i].id;
	    var p = stm.DataStore.profile[pid];
	    for (var h=0; h<rows[c.items[i].id].length; h++) {

		// get the row
		var row = rows[c.items[i].id][h];

		// get the md5s
		if (md5only) {
		    md5s[c.items[i].id].push(p.data[row]);
		    continue;
		}

		// get the abundance
		var val = p.data[row + dataRow];

		// get the display indices
		var datums = p.data[row + 5 + (sourceIndex * 2) + (displayType == "taxonomy" ? 0 : 1)];

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
		    if (! stm.DataStore.ontology.hasOwnProperty(displaySource)) {
			continue;
		    }
		    if (! stm.DataStore.ontology[displaySource]['id'][datums[0]]) {
			console.log("function not found: "+datums[0]);
			continue;
		    }
		    key = stm.DataStore.ontology[displaySource][displayLevel][stm.DataStore.ontology[displaySource]['id'][datums[0]][flevelIndex[displaySource+"-"+displayLevel]]];
		    hier[key] = [];
		    for (var j=0; j<=flevelIndex[displaySource+"-"+displayLevel]; j++) {
			hier[key].push(stm.DataStore.ontology[displaySource][widget.ontLevels[displaySource][j]][stm.DataStore.ontology[displaySource]['id'][datums[0]][j]]);
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

	if (md5only) {
	    return md5s;
	}
	
	matrix.rows = Retina.keys(d).sort();
	var mr = [];
	for (var i=0; i<matrix.rows.length; i++) {
	    // test abundance cutoff
	    if (c.parameters.abundance > 1) {
		var rowIn = false;
		for (var h=0; h<d[matrix.rows[i]].length; h++) {
		    if (d[matrix.rows[i]][h] >= c.parameters.abundance) {
			rowIn = true;
		    } else {
			d[matrix.rows[i]][h] = 0;
		    }
		}
		if (! rowIn) {
		    continue;
		}
	    }
	    mr.push(matrix.rows[i]);
	    
	    matrix.data.push(d[matrix.rows[i]]);
	    for (var h=0; h<e[matrix.rows[i]].length; h++) {
		e[matrix.rows[i]][h] = e[matrix.rows[i]][h] / d[matrix.rows[i]][h];
	    }
	    matrix.evalues.push(e[matrix.rows[i]]);
	}
	matrix.rows = mr;
	
	c.parameters.depth = (displayType == "taxonomy" ? levelIndex[displayLevel] : flevelIndex[displaySource+"-"+displayLevel]) + 1;
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
	    var row = [ '<a href="#" onclick="Retina.WidgetInstances.metagenome_analysis[1].graphCallback({\'cellValue\': \''+matrix.rows[i]+'\'})">'+matrix.rows[i]+'</a>' ];
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

	var matrix = Retina.copyMatrix(data ? data.data : c.matrix.data);
	var pca = Retina.pca(Retina.distanceMatrix(Retina.transposeMatrix(matrix), c.visualization.pca.distance));
	var points = [];
	
	for (var i=0; i<pca.coordinates.length; i++) {
	    points.push( { "x": pca.coordinates[i][c.visualization.pca.pcaa], "y": pca.coordinates[i][c.visualization.pca.pcab], "name": c.matrix.cols[i] } );
	}
	
	return { "data": [ { "points": points } ], "cols": c.matrix.cols, "headers": c.matrix.headers };
    };

    widget.container2differential = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var c = stm.DataStore.dataContainer[widget.selectedContainer];
	
	var matrix = Retina.copyMatrix(c.matrix.data);
	var points = [];
	for (var i=0; i<matrix.length; i++) {
	    points.push( { "x": Retina.log10(matrix[i][c.visualization.differential.mga]), "y": Retina.log10(matrix[i][c.visualization.differential.mgb]), name: c.matrix.rows[i] });
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
	    if (data.length == 0) {
		groups[i].points.push({x: 0, y: 0 });
	    }
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
			     settings: {
				 description: "The abundance matrix shows the samples as columns and the categories as rows. The abundance relative to the other samples in a category is highlighted by the opacity of the circle.</p><p>You can choose to enable / disable <a href='https://github.com/MG-RAST/tech-report/wiki/MG-RAST-glossary#normalisation' target=_blank>normalisation</a>, <a href='https://github.com/MG-RAST/tech-report/wiki/MG-RAST-glossary#log-10' target=_blank>log scaling</a> and select the sample label by <a href='https://github.com/MG-RAST/tech-report/wiki/MG-RAST-glossary#metadata' target=_blank>metadata</a> field.</p><p>Click a category to drill down to the next level. The layout tab has options to adjust the general layout of the matrix.",
				 extended: { "adjust graph data": true }
			     },
			     controlGroups: [
				 { "adjust graph data":
				   [
				       { "name": "metadatum", "type": "select", "description": "metadatum to name the datasets by", "title": "metadatum", "adaptToData": true, "default": "name", "isDataUpdater": true, "values": "metadata" },
				       { "name": "normalize", "type": "bool", "description": "normalize the datasets", "title": "perform normalization", "isDataUpdater": true, "defaultTrue": true },
				       { "name": "log", "type": "bool", "description": "view log base 10 of the data", "title": "perform log10", "isDataUpdater": true, "defaultTrue": false }
				   ]
				 },
				 { "layout":
				   [
				       { "name": "colHeaderHeight", "type": "int", "description": "height of the header column", "title": "column height", "default": 100 },
				       { "name": "circleColor", "type": "color", "description": "base color of the circles", "title": "ccircle color", "default": "purple" }
				   ]
				 }
			     ]
			   },
		 'heatmap': { title: 'heatmap',
			      renderer: "svg2",
			      settings: widget.graphs.heatmap,
			      controlGroups: widget.graphs.heatmap.controls
			    },
		 'piechart': { title: 'pie-chart',
			       renderer: "svg2",
			       settings: widget.graphs.pie,
			       controlGroups: widget.graphs.pie.controls
			     },
		 'donutchart': { title: 'donut-chart',
				 renderer: "svg2",
				 settings: widget.graphs.donut,
				 controlGroups: widget.graphs.donut.controls
			     },
		 'barchart': { title: 'stacked bar-chart',
			       renderer: "svg2",
			       settings: widget.graphs.stackedBar,
			       controlGroups: widget.graphs.stackedBar.controls
			     },
		 'barchart2': { title: 'grouped barchart',
				renderer: "svg2",
				settings: widget.graphs.bar,
				controlGroups: widget.graphs.bar.controls,
				logAxes: [ 0 ]
			     },
		 'pca': { title: 'PCoA',
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
			    settings: { extended: { "adjust table data": true },
					description: "The table shows the samples as columns and the categories as rows. Click the magnifying glass to show the filter for a column. Click the operator in the abundance column filters to change it.</p><p>You can choose to enable / disable <a href='https://github.com/MG-RAST/tech-report/wiki/MG-RAST-glossary#normalisation' target=_blank>normalisation</a> and select the sample label by <a href='https://github.com/MG-RAST/tech-report/wiki/MG-RAST-glossary#metadata' target=_blank>metadata</a> field.</p><p>Click a category to drill down to the next level. The cogwheel icon above the table opens general options for the table.",
					sort_autodetect: true,
					filter_autodetect: true },
			    dataConversion: "container2table",
			    controlGroups:
			    [
				{ "adjust table data":
				   [
				       { "name": "metadatum", "type": "select", "description": "metadatum to name the datasets by", "title": "metadatum", "adaptToData": true, "default": "name", "isDataUpdater": true, "values": "metadata" },
				       { "name": "normalize", "type": "bool", "description": "normalize the datasets", "title": "perform normalization", "isDataUpdater": true }
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
	    var html = [];

	    if (widget.isRecipe) {
		html.push("<div style='border: 1px solid #dddddd; border-radius: 6px; padding: 10px;'><h3 style='margin-top: 0px;'>Analysis Recipe: <span id='recipeTitle'></span></h3><p>To start select datasets below and click <a class='btn btn-mini btn-success' style='position: relative; left: 5px; bottom: 1px;'><i class='icon-ok icon-white'></i></a></p><p>The analysis recipe will guide you through the analysis by presetting all parameters. You only need to select the datasets you want to perform the analysis for. Use the <span style='font-weight: bold; cursor: help;' onmouseover='document.getElementById(\"mgselect\").className=\"glow\";' onmouseout='document.getElementById(\"mgselect\").className=\"\";'>selection box</span> below to do so.</p><p>Once the data is loaded, you will immediately see the analysis results. The <span style='font-weight: bold; cursor: help;' onmouseover='document.getElementById(\"recipeDisplay\").className=\"glow\";' onmouseout='document.getElementById(\"recipeDisplay\").className=\"\";'>recipe description</span> is always visible on the righthand side. It will also inform you about important parameters you can adjust. Hover over the highlighted terms to see where to change those parameters.</p><div>");
	    } else {
		html.push("<div style='border: 1px solid #dddddd; border-radius: 6px; padding: 10px;'><h3 style='margin-top: 0px;'>Create a new Analysis Container <span style='cursor: pointer;' title='click to see a short tutorial video'><sup>[?]</sup></span></h3><p>An analysis container holds all the <span class='tt' data-title='Analysis Container Settings' data-content='<p>The settings include the list of referenced profiles, the selected data-sources, the current cutoffs like e-value or alignment length, taxonomic or hierarchical filters and the current visualization.</p><p>Once the container is ready, you can adjust the settings in the righthand menu.</p>'>settings</span> for your analysis, as well as the current analysis result. It is based on metagenomic profiles, which contain all the raw data.</p><p>Select the databases and the profiles for your analysis container. You can name the container in the text-field <i>analysis container name</i>. Click the <i class='icon-ok'></i></a>-button below to begin.</p><p><span class='tt' data-title='Metagenomic Profiles' data-content='<p>Profiles are generated on our server on demand. The initial calculation may take some time, depending on the profile size. Once computed, they will be cached and subsequent requests will download immediately.</p><p>You can use the <i class=\"icon icon-folder-open\"></i>-icon in the top menu bar to store profiles on your harddrive and upload them back into your browser cache (without requiring interaction with our server).</p>'>Profiles</span> which are not yet on your machine will be downloaded. Once all required profiles are available, the analysis container is ready for exploration!</p><div style='overflow-x: auto;'>");
	    }


	    // params container
	    html.push("<div>");
	    if (! widget.isRecipe) {
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
	    }

	    // params container close and divider
	    html.push('</div><div style="clear: both;"></div>');

	     // metagenome selector
	    html.push('<h5 style="margin-top: 0px;"><div style="float: left;">metagenomes</div><div style="float: left; margin-left: 443px; height: 20px;"></div><div style="float: left; margin-right: 5px;" id="collectionSpace"></div><div style="float: left;" id="loadedProfileSpace"></div></h5><div style="clear: both; height: 5px;"></div><div id="mgselect"><img src="Retina/images/waiting.gif" style="margin-left: 40%; width: 24px;"></div>');

	    // data progress
	    html.push('<div id="dataprogress" style="float: left; margin-top: 25px; margin-left: 20px; width: 90%;"></div><div style="clear: both;">');
	    
	    // close border
	    html.push('</div>');

	    // fill the content
	    target.innerHTML = html.join("");

	    // add the tooltips
	    jQuery('.tt').popover({"trigger": "hover", "html": true, "placement": "bottom"});

	    // show the databases
	    if (! widget.isRecipe) {
		widget.showDatabases("protein");
	    }

	    // create a metagenome selection renderer
	    var result_columns = [ "name", "ID", "project id", "project name", "PI last name", "biome", "feature", "material", "environmental package", "location", "country", "sequencing method" ];
	    var result_attributes = { "ID": "id", "project id": "project_id", "project name": "project_name", "PI last name": "PI_lastname","environmental package": "env_package_type", "sequencing method": "seq_method" };

	    var specialFilters = [ { "attribute": "sequence_type", "title": "sequence type", "type": "radio", "options": [ { "value": "all", "title": "all", "checked": true }, { "value": "WGS", "title": "shotgun", "checked": false }, { "value": "amplicon", "title": "amplicon", "checked": false }, { "value": "MT", "title": "metatranscriptome", "checked": false } ] } ];
	    if (stm.user) {
		specialFilters.push( { "attribute": "status", "title": "status", "type": "radio", "options": [ { "value": "all", "title": "all", "checked": true }, { "value": "public", "title": "public", "checked": false }, { "value": "private", "title": "private", "checked": false } ] } );
	    }

	    widget.mgselect = Retina.Renderer.create("listselect", {
		target: document.getElementById("mgselect"),
		headers: stm.authHeader,
		callback: Retina.WidgetInstances.metagenome_analysis[1].loadData,
		asynch_limit: 100,
		synchronous: false,
		navigation_url: RetinaConfig.mgrast_api+'/metagenome?match=all&verbosity=mixs',
		data: [],
		filter: result_columns,
		keyMapping: result_attributes,
		result_field: widget.isRecipe ? false : true,
		result_field_placeholder: "analysis container name",
		result_field_default: widget.result_field_default || "",
		multiple: true,
		extra_wide: true,
		return_object: true,
		filter_attribute: 'name',
		filter_type: 'strict',
		specialFilters: specialFilters,
		asynch_filter_attribute: 'name',
		value: "id"
	    }).render();
	    widget.mgselect.update();
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

	widget.dataLoadParams.sources[0] = widget.sources[which][0];

	document.getElementById('databaseSelect').innerHTML = html.join("");
    };
    
    widget.loadDone = function (container) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (container.status == "ready") {
	    var html = "<p style='text-align: center;'>Your data is loaded and was placed in this container.<br>Click to analyze.</p>";
	    html += '<div style="cursor: pointer; border: 1px solid rgb(221, 221, 221); border-radius: 6px; box-shadow: 2px 2px 2px; margin-left: auto; margin-right: auto; margin-top: 20px; margin-bottom: 20px; font-weight: bold; height: 75px; width: 75px; text-align: center;" onclick="Retina.WidgetInstances.metagenome_analysis[1].selectedContainer=\''+container.id+'\';Retina.WidgetInstances.metagenome_analysis[1].visualize(Retina.WidgetInstances.metagenome_analysis[1].currentType);document.getElementById(\'dataprogress\').innerHTML=\'\';" class="glow"><img src="Retina/images/bar-chart.png" style="margin-top: 5px; width: 50px;">'+container.id+'</div>';
	    widget.selectedContainer = container.id;
	    var c = stm.DataStore.dataContainer[widget.selectedContainer];
	    
	    var sources = widget.updateSourceMap(c);
	    c.parameters.sources = Retina.keys(sources).sort();
	    c.parameters.displaySource = c.parameters.sources[0];
	    
	    document.getElementById('dataprogress').innerHTML = html;
	    if (! widget.container2matrix()) { return; }
	    widget.showDataContainers();
	} else {
	    document.getElementById('dataprogress').innerHTML = "Your data load was aborted";
	}
    };

    widget.updateSourceMap = function (c) {
	// create a profile - source mapping
	var sourceMap = {};
	var sources = {};
	for (var i=0; i<c.items.length; i++) {
	    sourceMap[c.items[i].id] = {};
	    for (var h=0; h<c.items.length; h++) {
		var s = stm.DataStore.profile[c.items[i].id].sources;
		for (var j=0; j<s.length; j++) {
		    sourceMap[c.items[i].id][s[j]] = j;
		    sources[s[j]] = true;
		}
	    }
	}
	c.parameters.sourceMap = sourceMap;
	
	return sources;
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

	params = params || widget.isRecipe;
	
	if (! stm.DataStore.hasOwnProperty('dataContainer')) {
	    stm.DataStore.dataContainer = {};
	}	

	var name = widget.isRecipe ? widget.recipe.id : collectionName || widget.dataLoadParams.name || "analysis "+(Retina.keys(stm.DataStore.dataContainer).length + 1);

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
	    if (! params) {
		stm.DataStore.dataContainer[name] = { id: name,
						      items: ids,
						      status: "loading",
						      promises: [],
						      callbacks: [],
						      parameters: { sources: widget.dataLoadParams.sources,
								    displayLevel: "domain",
								    displayType: "taxonomy",
								    metadatum: "name",
								    evalue: widget.cutoffThresholds.evalue,
								    identity: widget.cutoffThresholds.identity,
								    alilength: widget.cutoffThresholds.alilength,
								    abundance: 1,
								    taxFilter: [],
								    ontFilter: [] },
						      visualization: {},
						      created: Retina.date_string(new Date().getTime()),
						      user: stm.user || "anonymous" };
		if (typeof Retina.WidgetInstances.metagenome_analysis[1].loadDone == "function") {
		    stm.DataStore.dataContainer[name].callbacks.push(Retina.WidgetInstances.metagenome_analysis[1].loadDone);
		}
	    }
	    if (widget.isRecipe) {
		var c = stm.DataStore.dataContainer[name];
		c.items = ids;
		c.callbacks = [ function(){
		    var widget = Retina.WidgetInstances.metagenome_analysis[1];
		    if (! widget.container2matrix()) { return; }
		    widget.showCurrentContainerParams();
		    document.getElementById('recipeShowMoreOptions').style.display = "";
		    widget.visualize();
		} ];
		c.promises = [];
		
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
	    var missingSources = [];
	    if (stm.DataStore.profile.hasOwnProperty(id)) {

		// there is a profile, check the data sources
		var p = stm.DataStore.profile[id];
		for (var h=0; h<widget.dataLoadParams.sources.length; h++) {
		    var hasSource = false;
		    for (var j=0; j<p.sources.length; j++) {
			if (p.sources[j] == widget.dataLoadParams.sources[h]) {
			    hasSource = true;
			    break;
			}
		    }
		    if (! hasSource) {
			missingSources.push(widget.dataLoadParams.sources[h]);
		    }					  
		}
		if (missingSources.length == 0) {
		    needsLoad = false;
		}
	    } else {
		missingSources = widget.dataLoadParams.sources.slice();
	    }
	    if (needsLoad && ! stm.DataStore.inprogress.hasOwnProperty('profile'+id)) {
		widget.pDiv('profile'+id, false, ids[i].name, name);

		stm.DataStore.inprogress['profile'+id] = 1;
		var source = missingSources.join(",");
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
		    jQuery.ajax({ url: RetinaConfig.mgrast_api + "/metagenome/" + ids[i].id + "?verbosity=full",
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
					 stm.DataStore.profile[data.data.id+"_load"] = data.data;
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
		var source = document.getElementById('visualizeTarget').childNodes[1];
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

    widget.downloadFASTA = function () {
	var widget = this;

	var md5s = widget.container2matrix(null, true);
	if (! md5s) { return; }
	var c = stm.DataStore.dataContainer[widget.selectedContainer];

	for (var i=0; i<c.items.length; i++) {
	    var doc = document.createElement('form');
	    doc.setAttribute('method', 'post');
	    doc.setAttribute('target', '_blank');
	    doc.setAttribute('action', RetinaConfig.mgrast_api + "/annotation/sequence/"+c.items[i].id);
	    doc.setAttribute('enctype',"multipart/form-data");
	    var f = document.createElement('input');
	    f.setAttribute('type', 'text');
	    f.setAttribute('name', 'POSTDATA');
	    f.setAttribute('value', JSON.stringify({"browser":true,"type":"all","format":"fasta","source":c.displaySource,"md5s":md5s[c.items[i].id]}));
	    doc.appendChild(f);
	    var b = document.createElement('input');
	    b.setAttribute('type', 'text');
	    b.setAttribute('name', 'browser');
	    b.setAttribute('value', '1');
	    doc.appendChild(b);
	    if (c.items[i].status == "private") {
		var h = document.createElement('input');
		h.setAttribute('type', 'text');
		h.setAttribute('name', 'auth');
		h.setAttribute('value', stm.authHeader.Authorization.replace(/ /, '%20'));
		doc.appendChild(h);
	    }
	    document.body.appendChild(doc);
	    doc.submit();
	    document.body.removeChild(doc);
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

    /* 
       Recipes
    */

    // show the editor dialog
    widget.showRecipeEditor = function () {
	var widget = this;

	var html = [];

	var image;
	if (document.getElementById('SVGdiv1')) {
	    html.push("<div style='width: 200px; height: 200px; margin-left: auto; overflow: hidden; margin-right: auto; border: 1px solid gray; margin-bottom: 10px;'>"+document.getElementById('SVGdiv1').innerHTML+"</div>");
	} else if (document.getElementById('visualizeTarget')) {
	    var div = document.getElementById('visualizeTarget').childNodes[1];
	    html.push("<div style='width: 200px; height: 200px; overflow: hidden; margin-left: auto; margin-right: auto; border: 1px solid gray; margin-bottom: 10px;'><div style='transform-origin: 0px 0px 0px; transform: scale("+(200/parseInt(div.offsetWidth))+"); position: absolute;'>"+div.innerHTML+"</div></div>");
	}

	html.push("<table>");
	html.push("<tr><td style='vertical-align: top;'>name</td><td><input type='text' id='recipeName' placeholder='name of the recipe' style='width: 360px;'></td></tr>");
	html.push("<tr><td style='vertical-align: top; padding-right: 20px;'>description</td><td><textarea style='width: 360px; height: 90px;' id='recipeDescription' placeholder='a short description of what this recipe does'></textarea></td></tr>");

	html.push("</table>");

	document.getElementById('recipeModalContent').innerHTML = html.join('');
	
	jQuery('#recipeModal').modal('show');
    };

    // download / upload the recipe
    widget.createRecipe = function (download) {
	var widget = this;

	if (! download && ! stm.user) {
	    alert('you must be logged in to upload to myData');
	    return;
	}
	
	// get the current container
	var c = jQuery.extend(true, {}, stm.DataStore.dataContainer[widget.selectedContainer]);

	// remove data that has no use in a recipe
	delete c.callbacks;
	delete c.promises;
	delete c.status;
	delete c.items;
	delete c.matrix;
	c.parameters.sourceMap = {};

	// add the current visualization as image
	if (document.getElementById('SVGdiv1')) {
	    c.image = document.getElementById('SVGdiv1').innerHTML;
	} else if (document.getElementById('visualizeTarget')) {
	    c.image = document.getElementById('visualizeTarget').childNodes[1].innerHTML;
	}

	// check the parameters from the editor
	var name = document.getElementById('recipeName').value;
	var description = document.getElementById('recipeDescription').value;

	if (name.length == 0 || description.length == 0) {
	    alert('you must enter a name and a description');
	    return;
	}

	c.name = name;
	c.description = description;
	
	// check where to store the recipe

	// download as file
	if (download) {
	    stm.saveAs(JSON.stringify(c), c.id + ".recipe.json");
	}

	// upload to SHOCK
	else {
	    var w = document.createElement('div');
	    w.setAttribute('style', 'position: fixed;top: 10%;left: 50%;z-index: 1051;width: 561px; height: 610px;margin-left: -280px; opacity: 0.8; background-color: black;');
	    w.setAttribute('id', 'waiter');
	    w.innerHTML ='<div style="width: 32px; margin-left: auto; margin-right: auto; margin-top: 200px;"><img src="Retina/images/loading.gif"></div>';
	    document.body.appendChild(w);
	    
	    var url = RetinaConfig.shock_url+'/node';
	    var attributes = new Blob([ JSON.stringify({ "type": "analysisRecipe", "hasVisualization": "1", "owner": stm.user.id, "container": c }) ], { "type" : "text\/json" });
	    var form = new FormData();
	    form.append('attributes', attributes);
	    jQuery.ajax(url, {
		contentType: false,
		processData: false,
		data: form,
		success: function(data) {
		    jQuery.ajax({ url: RetinaConfig.shock_url+'/node/'+data.data.id+'/acl/public_read',
				  success: function(data) {
				      alert('recipe uploaded');
				      document.body.removeChild(document.getElementById('waiter'));
				      jQuery('#recipeModal').modal('hide');
				  },
				  error: function(jqXHR, error) {
				      Retina.WidgetInstances.metagenome_analysis[1].recipeUploaded(false);
				      alert('recipe upload failed');
				      document.body.removeChild(document.getElementById('waiter'));
				      jQuery('#recipeModal').modal('hide');
				  },
				  crossDomain: true,
				  headers: stm.authHeader,
				  type: "PUT"
				});
		},
		error: function(jqXHR, error){
		    alert('recipe upload caused an error');
		},
		crossDomain: true,
		headers: stm.authHeader,
		type: "POST"
	    });
	}
    };

    // return the recipe container to the original state
    widget.restartRecipe = function () {
	var widget = this;

	document.getElementById('dataprogress').innerHTML = "";
	widget.display();
    };

    // show the recipe in the sidebar
    widget.showRecipe = function (data) {
	var widget = this;

	var description = data.description;

	// parse the keywords
	var keywords = [ [ /\$e-value/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#evalueField\").toggleClass(\"glow\");' onmouseout='$(\"#evalueField\").toggleClass(\"glow\");'>e-value</span>" ],
			 [ /\$\%-identity/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#identityField\").toggleClass(\"glow\");' onmouseout='$(\"#identityField\").toggleClass(\"glow\");'>%-identity</span>" ],
			 [ /alignment length/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#alilenField\").toggleClass(\"glow\");' onmouseout='$(\"#alilenField\").toggleClass(\"glow\");'>alignment length</span>" ],
			 [ /\$minimum abundance/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#abundanceField\").toggleClass(\"glow\");' onmouseout='$(\"#abundanceField\").toggleClass(\"glow\");'>minimum abundance</span>" ],
			 [ /\$source/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#sourceField\").toggleClass(\"glow\");' onmouseout='$(\"#sourceField\").toggleClass(\"glow\");'>source</span>" ],
			 [ /\$type/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#typeField\").toggleClass(\"glow\");' onmouseout='$(\"#typeField\").toggleClass(\"glow\");'>type</span>" ],
			 [ /\$level/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#levelField\").toggleClass(\"glow\");' onmouseout='$(\"#levelField\").toggleClass(\"glow\");'>level</span>" ],
		         [ /\$filter/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#filterField\").toggleClass(\"glow\");' onmouseout='$(\"#filterField\").toggleClass(\"glow\");'>filter</span>" ],
			 [ /\$view/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#visualContainerSpace\").toggleClass(\"glow\");' onmouseout='$(\"#visualContainerSpace\").toggleClass(\"glow\");'>view</span>" ],
			 [ /\$export/g, "<span style='cursor: help; color: blue;' onmouseover='$(\"#exportContainerSpace\").toggleClass(\"glow\");' onmouseout='$(\"#exportContainerSpace\").toggleClass(\"glow\");'>export</span>" ] ];

	for (var i=0; i<keywords.length; i++) {
	    description = description.replace(keywords[i][0], keywords[i][1]);
	}

	// fill the html
	var html = '<h4>'+data.name+'<button class="btn btn-mini pull-right" onclick="Retina.WidgetInstances.metagenome_analysis[1].restartRecipe();" title="restart this recipe"><i class="icon icon-refresh"></i></button></h4><p>'+description+'</p>';

	widget.recipe = data;
	if (! stm.DataStore.hasOwnProperty('dataContainer')) {
	    stm.DataStore.dataContainer = {};
	}
	stm.DataStore.dataContainer[data.id] = data;
	widget.currentType = data.currentRendererType;
	widget.selectedContainer = data.id;
	
	document.getElementById('recipeDisplay').innerHTML = html;

	document.getElementById('recipeTitle').innerHTML = data.name;
    };

    // analysis object export
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
	    } else if (document.getElementById('visualizeTarget')) {
		c.image = document.getElementById('visualizeTarget').childNodes[1].innerHTML;
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
	    var image;
	    if (document.getElementById('SVGdiv1')) {
		image = new Blob([ document.getElementById('SVGdiv1').innerHTML ], { "type" : "image\/svg+xml" });
	    } else if (document.getElementById('visualizeTarget')) {
		image = new Blob([ document.getElementById('visualizeTarget').childNodes[1].innerHTML ], { "type" : "text\/html" });
	    } else {
		alert('you have no active image');
		return;
	    }
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
	var profile = stm.DataStore.profile[id+"_load"];
	
	// check if this profile is already purged
	if (stm.DataStore.profile.hasOwnProperty(id)) {
	    widget.mergeProfile(id);
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
	stm.DataStore.profile[id] = jQuery.extend(true, {}, profile);
	delete stm.DataStore.profile[id+"_load"];
    };

    widget.mergeProfile = function (id) {
	var widget = this;

	// get the profile
	var profile = stm.DataStore.profile[id+"_load"];
	var previous = stm.DataStore.profile[id];

	// check which sources need to be integrated
	var newSources = [];
	for (var i=0; i<profile.sources.length; i++) {
	    var hasSource = false;
	    for (var h=0; h<previous.sources.length; h++) {
		if (previous.sources[h] == profile.sources[i]) {
		    hasSource = true;
		    break;
		}
	    }
	    if (! hasSource) {
		newSources.push([ profile.sources[i], i ]);
	    }
	}
	
	// new target array
	var p = [];

	// get the previous profile first md5
	var prevind = 0;

	// get the number of cells per row of previous
	var prevrow = 5 + (2 * previous.sources.length);
	
	// iterate over the new profile data
	for (var h=0; h<profile.data.length; h++) {

	    // check if the previous profile md5 is smaller than the current profile md5
	    while (previous.data[prevind] < profile.data[h][0]) {
		for (var j=0; j<prevrow; j++) {
		    p.push(previous.data[prevind + j]);
		}
		
		// null values for new sources
		for (var j=0; j<newSources.length; j++) {
		    p.push(null);
		    p.push(null);
		}
		
		prevind += prevrow;
	    }

	    // merge the row if existent in both
	    if (previous.data[prevind] == profile.data[h][0]) {

		// push existing
		for (var j=0; j<prevrow; j++) {
		    p.push(previous.data[prevind + j]);
		}

		// push new
		for (var j=0; j<newSources.length; j++) {

		    // push the taxon
		    p.push( profile.data[h][5][newSources[j][1]] && profile.data[h][5][newSources[j][1]].length ? (profile.data[h][5][newSources[j][1]].length > 1 ? profile.data[h][5][newSources[j][1]].join(',') : profile.data[h][5][newSources[j][1]][0]) : null );
		    
		    // push the function
		    p.push( profile.data[h][6][newSources[j][1]] && profile.data[h][6][newSources[j][1]].length ? (profile.data[h][6][newSources[j][1]].length > 1 ? profile.data[h][6][newSources[j][1]].join(',') : profile.data[h][6][newSources[j][1]][0]) : null );
		}
		
		prevind += prevrow;
	    }

	    // if the row is new, push new values
	    if (previous.data[prevind] < profile.data[h][0]) {

		// store the hit data
		for (var j=0; j<5; j++) {
		    p.push(profile.data[h][j]);
		}

		// push null values for old sources
		for (var j=0; j<previous.sources.length; j++) {
		    p.push(null);
		    p.push(null);
		}
		
		// iterate over the sources annotation data
		for (var j=0; j<newSources.length; j++) {

		    // push the taxon
		    p.push( profile.data[h][5][newSources[j][1]] && profile.data[h][5][newSources[j][1]].length ? (profile.data[h][5][newSources[j][1]].length > 1 ? profile.data[h][5][newSources[j][1]].join(',') : profile.data[h][5][newSources[j][1]][0]) : null );
		    
		    // push the function
		    p.push( profile.data[h][6][newSources[j][1]] && profile.data[h][6][newSources[j][1]].length ? (profile.data[h][6][newSources[j][1]].length > 1 ? profile.data[h][6][newSources[j][1]].join(',') : profile.data[h][6][newSources[j][1]][0]) : null );
		}
	    }
	}

	// update the sources list
	for (var i=0; i<newSources.length; i++) {
	    previous.sources.push(newSources[i][0]);
	}
	
	// set the data of the merged profile
	previous.data = p;

	// delete the loaded additional data
	delete stm.DataStore.profile[id+"_load"];
    };

    widget.loadGraphs = function () {
	var widget = this;

	var graphs = [ "pie", "donut", "stackedBar", "bar", "heatmap", "rarefaction", "pca", "differential" ];
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
      LOADED PROFILES
     */
    widget.enableLoadedProfiles = function () {
	var widget = this;

	var html = [ '<div class="btn-group"><a class="btn dropdown-toggle btn-small" data-toggle="dropdown" href="#"><i class="icon icon-folder-open" style=" margin-right: 5px;"></i>add loaded profiles <span class="caret"></span></a><ul class="dropdown-menu">' ];

	html.push('<li><a href="#" onclick="Retina.WidgetInstances.metagenome_analysis[1].addLoadedProfile(null, true); return false;"><i>- all -</i></a></li>');
	
	var profs = Retina.keys(stm.DataStore.profile).sort();
	for (var i=0; i<profs.length; i++) {
	    html.push('<li><a href="#" onclick="Retina.WidgetInstances.metagenome_analysis[1].addLoadedProfile(\''+profs[i]+'\'); return false;">'+profs[i]+'</a></li>');
	}

	html.push('</ul></div>');

	document.getElementById('loadedProfileSpace').innerHTML = html.join("");	
    };

    widget.addLoadedProfile = function (name, all) {
	var widget = this;

	var r = widget.mgselect;
	var mgs = [];
	if (all) {
	    mgs = Retina.keys(stm.DataStore.profile).sort();
	} else {
	    mgs = [ name ]
	}

	for (var i=0; i<mgs.length; i++) {
	    stm.DataStore.profile[mgs[i]].metagenome.mixs.name = stm.DataStore.profile[mgs[i]].metagenome.name;
	    stm.DataStore.profile[mgs[i]].metagenome.mixs.id = stm.DataStore.profile[mgs[i]].metagenome.id;
	    var obj = jQuery.extend(true, {}, stm.DataStore.profile[mgs[i]].metagenome.mixs);
	    r.settings.selection_data.push(obj);
	    r.settings.selection[name] = 1;
	}
	
	r.redrawResultlist(r.result_list);
    };

    /*
      COLLECTIONS
     */
    widget.enableCollections = function () {
	var widget = this;

	var html = [ '<div class="btn-group"><a class="btn dropdown-toggle btn-small" data-toggle="dropdown" href="#"><img style="height: 16px; margin-right: 5px;" src="Retina/images/cart.png">add collection <span class="caret"></span></a><ul class="dropdown-menu">' ];

	var colls = Retina.keys(stm.user.preferences.collections).sort();
	for (var i=0; i<colls.length; i++) {
	    html.push('<li><a href="#" onclick="Retina.WidgetInstances.metagenome_analysis[1].addCollection(\''+colls[i]+'\'); return false;">'+colls[i]+'</a></li>');
	}

	html.push('</ul></div>');

	document.getElementById('collectionSpace').innerHTML = html.join("");	
    };

    widget.addCollection = function (name) {
	var widget = this;

	var c = stm.user.preferences.collections[name];
	var r = widget.mgselect;
	var mgs = Retina.keys(c.metagenomes);	
	for (var i=0; i<mgs.length; i++) {
	    var obj = { "name": c.metagenomes[mgs[i]], "biome": "", "feature": "", "material": "", "location": "", "country": "", "id": mgs[i], "project_id": "", "project_name": "", "PI_lastname": "", "env_package_type": "", "seq_method": ""};
	    r.settings.selection_data.push(obj);
	    r.settings.selection[mgs[i]] = 1;
	}
	r.redrawResultlist(r.result_list);
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
	container.parameters.displaySource = "KO";

	// get the functions
	var c = widget.container2matrix(container);
	if (! c) {
	    return;
	}
	var funcs = jQuery.extend(true, {}, c.matrix);

	container.parameters.displayLevel = "level3";
	
	// get the maps
	c = widget.container2matrix(container);
	if (! c) {
	    return;
	}
	var maps = jQuery.extend(true, {}, c.matrix);
	
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

    /* Help texts */
    widget.help = { "distance metrics":
		    { "euclidean": "https://en.wikipedia.org/wiki/Euclidean_distance",
		      "minkowski": "https://en.wikipedia.org/wiki/Minkowski_distance",
		      "canberra": "https://en.wikipedia.org/wiki/Canberra_distance",
		      "manhattan": "https://xlinux.nist.gov/dads//HTML/manhattanDistance.html",
		      "maximum": "",
		      "braycurtis": "https://en.wikipedia.org/wiki/Qualitative_variation",
		      "jaccard": "https://en.wikipedia.org/wiki/Qualitative_variation" }
		  };
    
})();
