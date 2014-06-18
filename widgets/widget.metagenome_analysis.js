(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Analysis Widget",
                name: "metagenome_analysis",
                author: "Tobias Paczian",
                requires: [ "rgbcolor.js" ]
        }
    });
    
    // load all required widgets and renderers
    widget.setup = function () {
	return [ Retina.add_widget({"name": "mgbrowse", "resource": "./widgets/",  "filename": "widget.mgbrowse.js"}),
		 Retina.load_widget("mgbrowse"),
		 Retina.add_widget({"name": "RendererController", "resource": "./widgets/",  "filename": "widget.RendererController.js"}),
		 Retina.load_widget("RendererController")
	       ];
    };
    
    // main display function called at startup
    widget.display = function (params) {
	widget = this;
        var index = widget.index;

	jQuery.extend(widget, params);
	
	// set the output area
	widget.main.innerHTML = '<style>\
.tool {\
    border: 1px solid #808080;\
    border-radius: 6px;\
    box-shadow: 3px 3px 3px;\
    padding: 4px;\
    width: 32px;\
    margin: 10px;\
    cursor: pointer;\
}\
.tool:hover {\
    background-color: #F0F0F0;\
}\
.tool:active {\
    box-shadow: 0px 0px 1px;\
}\
</style><div id="main"></div>';

	// set the tool area
	var tools = widget.sidebar;
	tools.setAttribute('style', 'padding: 10px;');

	var html = "<h4>Data Container</h4><div id='data_containers'></div><hr style='clear: both;'><h4>Manipulate</h4><div id='manipulation'></div><hr><h4>Visualizer</h4><div id='visualize'></div><hr><h4>Results</h4><div id='visResults'><p>no results available</p></div>";

	tools.innerHTML = html;

	// fill the tools area
	widget.fillContainers();
	widget.fillManipulators();
	widget.fillVisualizations();
	
    };

    /*
      MAIN AREA INTERFACES
     */

    /*
      Data Loader
    */

    // data loader main function
    widget.dataLoader = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('main');

	container.innerHTML = '\
<div style="height: 160px; overflow-x: scroll;">\
  <h4>available data containers</h4>\
  <div id="availableContainers"></div>\
</div>\
<hr>\
<div style="display: none;">\
  <button class="btn btn-mini pull-right" style="padding: 0 2px;" onclick="this.parentNode.style.display=\'none\';this.parentNode.nextSibling.style.display=\'\';"><img src="images/expand.png" style="width: 16px;"></button><h4>load data</h4>\
</div>\
<div>\
  <button class="btn btn-mini pull-right" style="padding: 0 2px;" onclick="this.parentNode.style.display=\'none\';this.parentNode.previousSibling.style.display=\'\';"><img src="images/contract.png" style="width: 16px;"></button><h4>load data</h4>\
  <div class="form-inline" style="margin-bottom: 10px;">\
    <b>name</b><input type="text" placeholder="pick a name" style="margin-left: 10px; margin-right: 10px; width: 185px;" id="dataContainerName"><b>source</b> <select style="margin-left: 10px; margin-right: 10px;" id="profile_source"><optgroup label="protein databases"><option>M5NR</option><option>RefSeq</option><option>GenBank</option><option>IMG</option><option>SEED</option><option>TrEMBL</option><option>SwissProt</option><option>PATRIC</option><option>KEGG</option></optgroup><optgroup label="RNA databases"><option>M5RNA</option><option>RDP</option><option>Greengenes</option><option>LSU</option><option>SSU</option></optgroup><optgroup label="ontology databases"><option>Subsystems</option><option>NOG</option><option>COG</option><option>KO</option></optgroup></select> <b>type</b> <select id="profile_type" style="margin-left: 10px;"><option>organism</option><option>function</option><option>feature</option></select>\
  </div>\
  <div>\
    <div id="mgbrowse"></div>\
  </div>\
</div>\
<hr>\
<div style="overflow-y: scroll;">\
  <button class="btn-mini btn" style="float: right; margin-top: 5px; margin-right: 10px;" onclick="document.getElementById(\'dataprogress\').innerHTML=\'\';" type="button">clear</button><h4>loading state</h4>\
  <div id="dataprogress"></div>\
</div>';

	widget.showDataContainers();

	if (widget.browse) {
	    widget.browse.target = document.getElementById("mgbrowse");
	    widget.browse.display();
	} else {
	    widget.browse = Retina.Widget.create('mgbrowse', { "target": document.getElementById("mgbrowse"), "type": "listselect", "multiple": true, "wide": true, callback: Retina.WidgetInstances.metagenome_analysis[1].loadData });
	}
    };

    /*
      TOOLBAR AREA INTERFACES
     */

    // data section
    widget.fillContainers = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('data_containers');

	var html = "<img src='images/data.png' class='tool' style='float: left; margin-bottom: 20px;' onclick='Retina.WidgetInstances.metagenome_analysis[1].dataLoader();'>";

	if (widget.selectedContainer) {
	    html += widget.displaySelectedContainer();
	}

	container.innerHTML = html;
    };

    // manipulator section
    widget.fillManipulators = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('manipulation');

	container.innerHTML = "<img src='images/filter.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].manipulate(\"filter\");'><img src='images/shuffle.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].manipulate(\"transform\");'><img src='images/tree_ltr.png' class='tool' style='width: 32px;' onclick='Retina.WidgetInstances.metagenome_analysis[1].manipulate(\"merge\");'>";
    };

    widget.manipulate = function (type) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('main');

	var html = "<div id='availableContainers'></div><h4>manipulate - "+type+" data container</h4>";

	if (widget.selectedContainer) {
	    html += widget.displaySelectedContainer();
	    var c = stm.DataStore.dataContainer[widget.selectedContainer];

	    if (c.type == "biom") {
		if (c.source == "load") {
		    if (c.status == "ready") {
			if (type == 'filter') {
			    html += "<table style='margin-left: 45px; float: left;'><tr><td><b>name</b></td><td><b>rows</b></td></tr>";
			    for (var i=0; i<c.items.length; i++) {
				html += "<tr><td style='padding-right: 20px;'>"+c.items[i].name+"</td><td>"+stm.DataStore.profile[c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source].rows.length+"</td></tr>";
			    }
			    html += "</table>";
			    html += "<div class='form-inline' style='clear: both;'>";
			    var p = stm.DataStore.profile[c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source];
			    for (var i=1; i<p.columns.length; i++) {
				html += p.columns[i].id + " <input class='span1' style='margin-right: 10px;' type='text' id='manipulate_"+p.columns[i].id+"'>";
			    }
			    html += "<button type='button' class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].performFilter();'>filter</button></div>";
			    html += "<div id='filter_result'></div>";
			}
		    }
		}
	    }

	    container.innerHTML = html;
	} else {
	    html += "<p>please first select a data container</p><div id='availableContainers'></div>";
	    container.innerHTML = html;
	}
	widget.showDataContainers();

    };

    // perform a filter on the current data container
    // the result is stored in tmp
    widget.performFilter = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('filter_result');

	var html = "<h4>result</h4>";

	var c = stm.DataStore.dataContainer[widget.selectedContainer];

	var p = stm.DataStore.profile[c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source];
	var filters = {};
	for (var i=1; i<p.columns.length; i++) {
	    var val = document.getElementById("manipulate_"+p.columns[i].id).value;
	    if (val) {
		filters[i] = { value: val, name: p.columns[i].id };
	    }
	}
	var data = {};
	var rows = {};
	for (var i=0; i<c.items.length; i++) {
	    rows[c.items[i].id] = [];
	    var p = stm.DataStore.profile[c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source];
	    for (var h=0; h<p.rows.length; h++) {
		var stay = true;
		for (var j in filters) {
		    if (filters.hasOwnProperty(j)) {
			if (Math.abs(p.data[h][j]) < filters[j].value) {
			    stay = false;
			    continue;
			}
		    }
		}
		if (stay) {
		    rows[c.items[i].id].push(h);
		}
	    }
	}
	stm.DataStore.tmpRows = rows;
	var f = {};
	for (var i in filters) {
	    if (filters.hasOwnProperty(i)) {
		f[filters[i].name] = filters[i].value;
	    }
	}
	stm.DataStore.tmpParams = f;

	html += "<table><tr><td><b>name</b></td><td><b>rows</b></td></tr>";
	for (var i=0; i<c.items.length; i++) {
	    html += "<tr><td style='padding-right: 20px;'>"+c.items[i].name+"</td><td>"+rows[c.items[i].id].length+"</td></tr>";
	}
	html += "</table>";

	html += "<div class='form-inline' style='margin-top: 20px;'>store as <input type='text' id='tmpStoreName' style='margin-right: 20px;'> <button type='button' class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].storeTmp();'>store</button></div>";
	
	container.innerHTML = html;
    };

    // store the current temporary data in a data container
    widget.storeTmp = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var name = document.getElementById('tmpStoreName').value;
	if (! name) {
	    alert('you must pick a name for the data container');
	    return;
	}
	if (stm.DataStore.dataContainer.hasOwnProperty(name)) {
	    if (! confirm('This container already exists. Replace with the current selection?')) {
		return;
	    }
	}

	var d = {};
	var c = stm.DataStore.dataContainer[widget.selectedContainer];	
	var newContainer = { id: name,
			     source: 'filter',
			     type: 'biom',
			     items: jQuery.extend(true, [], c.items),
			     status: "ready",
			     promises: [],
			     callbacks: [],
			     rows: stm.DataStore.tmpRows,
			     parameters: jQuery.extend(true, {}, stm.DataStore.tmpParams, c.parameters),
			     created: Retina.date_string(new Date().getTime()),
			     user: widget.user || "public" };

	stm.DataStore.dataContainer[name] = newContainer;

	delete stm.DataStore.tmpRows;
	delete stm.DataStore.tmpParams;

	Retina.WidgetInstances.metagenome_analysis[1].showDataContainers();
    };

    // visualization section
    widget.fillVisualizations = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('visualize');

	container.innerHTML = "<img src='images/table.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"table\");'><img src='images/pie.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"piechart\");'><img src='images/stats.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"linechart\");'><img src='images/bars2.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"barchart\");'><img src='images/areachart.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"areachart\");'><img src='images/icon_pcoa.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"dotplot\");'><img src='images/icon_boxplot.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"boxplot\");'><img src='images/icon_deviationplot.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"deviationplot\");'><img src='images/icon_heatmap.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"heatmap\");'><img src='images/spinner.png' class='tool' onclick='Retina.WidgetInstances.metagenome_analysis[1].visualize(\"donut\");'>";
    };

    // draw a demo version of the selected visualization
    widget.visualize = function (type) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('main');

	var demo_data = widget.demoData();

	var containerData = "";
	if (widget.selectedContainer) {
	    var c = stm.DataStore.dataContainer[widget.selectedContainer];
	    var p = stm.DataStore.profile[c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source];
	    var mdname = Retina.keys(p.rows[0].metadata)[0];
	    var cols = p.rows[0].metadata[mdname];
	    var matrixLevels = "";
	    for (var i=0; i<cols.length; i++) {
		matrixLevels += "<option value='"+i+"'>"+i+"</option>";
	    }

	    containerData = "<div class='form-inline' style='margin-bottom: 20px;'>select "+mdname+" level <select class='span1' id='matrixLevel' style='margin-right: 10px;'>"+matrixLevels+"</select><button type='button' class='btn' onclick='Retina.WidgetInstances.metagenome_analysis[1].updateVis();'>draw</button></div><div id='visualizeBreadcrumbs' style='margin-bottom: 20px;'></div>";
	}

	var html = "<h4>visualize - "+demo_data[type].title+"</h4>"+containerData+"<div id='visualizeTarget'></div>";

	container.innerHTML = html;

	demo_data[type].settings.target = document.getElementById('visualizeTarget');
	if (Retina.RendererInstances[demo_data[type].renderer] && Retina.RendererInstances[demo_data[type].renderer].length > 1) {
	    Retina.RendererInstances[demo_data[type].renderer] = [ Retina.RendererInstances[demo_data[type].renderer][0] ];
	}
	if (Retina.WidgetInstances.RendererController.length > 1) {
	    Retina.WidgetInstances.RendererController = [ Retina.WidgetInstances.RendererController[0] ];
	}
	widget.currentVisualizationController = Retina.Widget.create('RendererController', { "target": document.getElementById("visualizeTarget"), "type": demo_data[type].renderer, "settings": demo_data[type].settings });

	if (widget.selectedContainer) {
	    console.log('hello world');
	    widget.updateVis();
	}
    };

    // draw the current visualization with updated parameters
    widget.updateVis = function (filter, reset) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	if (reset) {
	    document.getElementById('matrixLevel').selectedIndex = 0;
	    document.getElementById('visualizeBreadcrumbs').innerHTML = "";
	}
	
	var matrixLevel = document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value;
	var r = widget.currentVisualizationController;

	/* drilldown */
	if (filter && filter.level !== null) {
	    var sel = document.getElementById('matrixLevel');
	    if (sel.options.length > filter.level + 1) {
		matrixLevel = filter.level + 1;
		document.getElementById('matrixLevel').selectedIndex = parseInt(matrixLevel);
	    }
	}

	var b = document.getElementById('visualizeBreadcrumbs');
	if (b.innerHTML == "") {
	    b.innerHTML = '<a style="cursor: pointer;" onclick="Retina.WidgetInstances.metagenome_analysis[1].updateVis(null, true);">&raquo; All </a>';
	}

	/* drilldown */

	if (r.params.type == 'matrix') {	
	    var matrix = widget.container2matrix({ dataColIndex: matrixLevel, filter: filter });
	    r.data(1, { data: matrix.data,
			rows: matrix.rows,
			columns: matrix.cols });

	    r.renderer.settings.callback = function (p) {
		var rend = Retina.RendererInstances.matrix[p.rendererIndex];
		if ((rend.settings.orientation=='transposed' && p.rowIndex == null) || (rend.settings.orientation=='normal' && p.colIndex == null)) {
		    var widget = Retina.WidgetInstances.metagenome_analysis[1];
		    var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}Retina.WidgetInstances.metagenome_analysis[1].updateVis({level: '+parseInt(document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value)+', value: \''+p.cellValue+'\'});">&raquo; '+p.cellValue+' </a>';
		    if (document.getElementById('matrixLevel').selectedIndex + 1 == document.getElementById('matrixLevel').options.length) {
			html = "";
		    }
		    document.getElementById('visualizeBreadcrumbs').innerHTML += html;
		    widget.updateVis( { level: parseInt(document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value),
					value: p.cellValue } );
		    
		}
	    };
	} else if (r.params.type == 'graph') {
	    var data = widget.container2graphseries({ dataColIndex: matrixLevel, filter: filter });
	    r.data(1, data.data);
	    r.renderer.settings.x_labels = data.x_labels;
	    r.renderer.settings.onclick = function (p) {
		var rend = Retina.RendererInstances.graph[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
		var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}Retina.WidgetInstances.metagenome_analysis[1].updateVis({level: '+parseInt(document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value)+', value: \''+p.label+'\'});">&raquo; '+p.label+' </a>';
		if (document.getElementById('matrixLevel').selectedIndex + 1 == document.getElementById('matrixLevel').options.length) {
		    html = "";
		}
		document.getElementById('visualizeBreadcrumbs').innerHTML += html;
		widget.updateVis( { level: parseInt(document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value),
				    value: p.label } );
	    };
	} else if (r.params.type == 'plot') {
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
	} else if (r.params.type == 'heatmap') {
	    var matrix = widget.container2matrix({ dataColIndex: matrixLevel, filter: filter });
	    var data = widget.normalizeMatrix(matrix.data);
	    r.data(1, { data: data,
			rows: matrix.rows,
			columns: matrix.cols });
	    r.renderer.settings.height = document.getElementById('RendererControllerInput_1_height').value;
	    r.renderer.settings.min_cell_height = document.getElementById('RendererControllerInput_1_min_cell_height').value;
	    r.renderer.settings.rowClicked = function (p) {
		var rend = Retina.RendererInstances.heatmap[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
		var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}Retina.WidgetInstances.metagenome_analysis[1].updateVis({level: '+parseInt(document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value)+', value: \''+p.label+'\'});">&raquo; '+p.label+' </a>';
		if (document.getElementById('matrixLevel').selectedIndex + 1 == document.getElementById('matrixLevel').options.length) {
		    html = "";
		}
		document.getElementById('visualizeBreadcrumbs').innerHTML += html;
		widget.updateVis( { level: parseInt(document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value),
				    value: p.label } );
	    };
	} else if (r.params.type == 'donut') {
	    var matrix = widget.container2matrix({ dataColIndex: matrixLevel, filter: filter });
	    r.data(1, matrix.data);
	    r.renderer.settings.rows = matrix.rows;
	    r.renderer.settings.onclick = function (p) {
		var rend = Retina.RendererInstances.donut[p.rendererIndex];
		var widget = Retina.WidgetInstances.metagenome_analysis[1];
		var html = '<a style="cursor: pointer;" onclick="while(this.nextSibling){this.parentNode.removeChild(this.nextSibling);}Retina.WidgetInstances.metagenome_analysis[1].updateVis({level: '+parseInt(document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value)+', value: \''+rend.settings.rows[p.slice]+'\'});">&raquo; '+rend.settings.rows[p.slice]+' </a>';
		if (document.getElementById('matrixLevel').selectedIndex + 1 == document.getElementById('matrixLevel').options.length) {
		    html = "";
		}
		document.getElementById('visualizeBreadcrumbs').innerHTML += html;
		widget.updateVis( { level: parseInt(document.getElementById('matrixLevel').options[document.getElementById('matrixLevel').selectedIndex].value),
				    value: rend.settings.rows[p.slice] } );
		
	    };
	}

	r.render(1);	   
    };

    /* 
       ACTION FUNCTIONS
     */

    // perform a set of API requests and create a data container
    widget.loadData = function (ids) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var type = document.getElementById('profile_type').options[document.getElementById('profile_type').selectedIndex].value;
	var source = document.getElementById('profile_source').options[document.getElementById('profile_source').selectedIndex].value;
	var name = document.getElementById('dataContainerName').value;
	if (! stm.DataStore.hasOwnProperty('dataContainer')) {
	    stm.DataStore.dataContainer = {};
	}
	if (ids.length) {
	    if (! name) {
		var i = Retina.keys(stm.DataStore.dataContainer).length;
		while (stm.DataStore.dataContainer.hasOwnProperty('data_'+i)) {
		    i++;
		}
		name = 'data_'+i;
		document.getElementById('dataContainerName').value = name;
	    }
	    if (stm.DataStore.dataContainer.hasOwnProperty(name)) {
		if (! confirm("The name '"+name+"' already exists. Do you want \nto replace it with the current selection?")) {
		    return;
		}
	    }
	    stm.DataStore.dataContainer[name] = { id: name,
						  source: 'load',
						  type: 'biom',
						  items: ids,
						  status: "loading",
						  promises: [],
						  callbacks: [ Retina.WidgetInstances.metagenome_analysis[1].showDataContainers ],
						  parameters: { type: type,
								source: source },
						  created: Retina.date_string(new Date().getTime()),
						  user: widget.user || "public" };
	}
	if (! stm.DataStore.hasOwnProperty('profile') ) {
	    stm.DataStore.profile = [];
	}
	if (! stm.DataStore.hasOwnProperty('inprogress')) {
	    stm.DataStore.inprogress = [];
	}
	for (i=0;i<ids.length;i++) {
	    var id = ids[i].id+"_"+type+"_"+source;
	    if (! stm.DataStore.profile.hasOwnProperty(id) && ! stm.DataStore.inprogress.hasOwnProperty('profile'+id)) {
		widget.pDiv('profile'+id, false, ids[i].name, type, source);

		stm.DataStore.inprogress['profile'+id] = true;
		stm.DataStore.dataContainer[name].promises.push(
		    jQuery.ajax({ bound: 'profile'+id,
				  url: RetinaConfig.mgrast_api + "/profile/" + ids[i].id + "?type="+type+"&source="+source,
				  dataType: "json",
				  success: function(data) {
				      var widget = Retina.WidgetInstances.metagenome_analysis[1];
				      if (data != null) {
					  if (data.hasOwnProperty('ERROR')) {
					      console.log("error: "+data.ERROR);
					  } else {
					      stm.DataStore.profile[data.id] = data;
					  }
				      } else {
					  console.log("error: invalid return structure from API server");
					  console.log(data);
				      }
				  },
				  error: function(jqXHR, error) {
				      var widget = Retina.WidgetInstances.metagenome_analysis[1];
				      console.log("error: unable to connect to API server");
				      console.log(error);
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
						  var percentComplete = evt.loaded / evt.total;
						  display.innerHTML = evt.loaded.byteSize;
						  bar.style.width = percentComplete +"%";
					      } else {
						  display.innerHTML = evt.loaded.byteSize();
					      }
					  }
				      }, false); 
				      return xhr;
				  },
				  headers: Retina.WidgetInstances.metagenome_analysis[1].authHeader
				}).then(function(data){
				    Retina.WidgetInstances.metagenome_analysis[1].dataLoaded(this.bound);
				    delete stm.DataStore.inprogress[this.bound];
				    var bar = document.getElementById('progressbar'+this.bound);
				    if (bar) {
					document.getElementById('progress'+this.bound).innerHTML += " - complete.";
					bar.parentNode.setAttribute('class', 'progress');
					bar.setAttribute('class', 'bar bar-success');
					bar.style.width = '100%';
				    }
				}));
	    } else {
		widget.pDiv('profile'+id, true, ids[i].name, type, source);
	    }
	}
	if (ids.length) {
	    jQuery.when.apply(this, stm.DataStore.dataContainer[name].promises).then(function() {
		Retina.WidgetInstances.metagenome_analysis[1].dataContainerReady(name);
	    });
	}

	return;
    };

    /*
      HELPER FUNCTIONS
     */

    // create a progress div
    widget.pDiv = function (id, done, name, type, source) {
	var progressContainer = document.getElementById('dataprogress');
	if (document.getElementById(id)) {
	    return;
	}
	var div = document.createElement('div');
	div.setAttribute('id', id);
	div.setAttribute('class', 'prog');
	div.setAttribute('style', 'clear: both;');
	div.innerHTML = '<div style="float: left; margin-right: 10px;">'+name+' ['+source+' - '+type+']</div><button class="close" onclick="this.parentNode.parentNode.removeChild(this.parentNode);" type="button" style="margin-top: -3px;">×</button><div style="float: right; margin-right: 10px;"><div class="progress'+(done ? '' : ' progress-striped active')+'" style="width: 100px;"><div class="bar'+(done ? ' bar-success' : '')+'" id="progressbar'+id+'" style="width: 100%;"></div></div></div><div style="float: right; margin-right: 10px;" id="progress'+id+'">'+(done ? "complete." : "waiting for server... <img src='images/waiting.gif' style='height: 16px; position: relative; bottom: 2px;'>")+'</div>';
	progressContainer.appendChild(div);
    };

    // display all current data containers
    widget.showDataContainers = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var container = document.getElementById('availableContainers');

	if (container) {
	    if (stm.DataStore.hasOwnProperty('dataContainer') && Retina.keys(stm.DataStore.dataContainer).length) {
		var keys = Retina.keys(stm.DataStore.dataContainer).sort();
		var html = "<table><tr>";
		for (var i=0; i<keys.length; i++) {
		    html += "<td style='text-align: center; vertical-align: top;'><div style='width: 75px; word-wrap: break-word;' cname='"+keys[i]+"' onclick='Retina.WidgetInstances.metagenome_analysis[1].selectedContainer=this.getAttribute(\"cname\");Retina.WidgetInstances.metagenome_analysis[1].fillContainers();'><img src='images/data.png' class='tool'><br>"+keys[i]+"</div></td>";
		}
		html += "</tr></table>";
		container.innerHTML = html;
	    } else {
		container.innerHTML = '<p style="margin-left: 50px; margin-top: 50px;">no data containers available</p>';
	    }
	}
    };

    // display details about the currently selected data container
    widget.displaySelectedContainer = function () {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];

	var c = stm.DataStore.dataContainer[widget.selectedContainer];
	var type = "unspecified items";
	if (c.type == 'biom') {
	    if (c.source == "load") {
		type = "metagenome profiles";
	    }
	}
	var plist = Retina.keys(c.parameters).sort();
	var params = "";
	for (var i=0;i<plist.length;i++) {
	    params += plist[i]+" - "+c.parameters[plist[i]]+"<br>";
	}
	var html = "<table style='text-align: left; float: left; margin-bottom: 20px;'><tr><td style='padding-right: 10px;'><b>name</b></td><td>"+c.id+"</td></tr>";
	html += "<tr><td style='padding-right: 10px; vertical-align: top;'><b>created</b></td><td>"+c.created+"</td></tr>";
	html += "<tr><td style='padding-right: 10px; vertical-align: top;'><b>user</b></td><td>"+c.user+"</td></tr>";
	html += "<tr><td style='padding-right: 10px; vertical-align: top;'><b>status</b></td><td>"+c.status+"</td></tr>";
	html += "<tr><td style='padding-right: 10px; vertical-align: top;'><b>contents</b></td><td>"+c.items.length+" "+type+"</td></tr>";
	html += "<tr><td style='padding-right: 10px; vertical-align: top;'><b>parameters</b></td><td>"+params+"</td></tr>";
	html += "</table>";

	return html;
    };

    /*
      CALLBACK FUNCTIONS
     */

    // login widget sends an action (log-in or log-out)
    widget.loginAction = function (params) {
	if (Retina.WidgetInstances.metagenome_analysis[1].browse) {
	    Retina.WidgetInstances.metagenome_analysis[1].browse.result_list.update_data({},1);
	}
	if (params.token) {
	    Retina.WidgetInstances.metagenome_analysis[1].user = params.user;
	    Retina.WidgetInstances.metagenome_analysis[1].authHeader = { "Auth": params.token };
	} else {
	    Retina.WidgetInstances.metagenome_analysis[1].user = null;
	    Retina.WidgetInstances.metagenome_analysis[1].authHeader = {};
	}
    };

    // a dataset has finished loading from the API
    widget.dataLoaded = function (id) {

    };

    // all promises for a data container have been fulfilled
    widget.dataContainerReady = function (name) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var dataContainer = stm.DataStore.dataContainer[name];
	dataContainer.promises = [];
	dataContainer.status = "ready";
	for (var i=0; i<dataContainer.callbacks.length; i++) {
	    dataContainer.callbacks[i].call(null, dataContainer);
	}
    };

    /*
      DATA CONTAINER CONVERSION METHODS
     */

    widget.container2graphseries = function (params) {
	var widget = Retina.WidgetInstances.metagenome_analysis[1];
	
	var cname = params.container || widget.selectedContainer;
	var c = stm.DataStore.dataContainer[cname];

	var series = { data:[] };

	var id = params.colHeader || 'id';

	var d = {};
	var dataRow = params.dataRow || 0;
	var isFiltered = false;
	if (c.hasOwnProperty('rows')) {
	    isFiltered = true;
	}
	var colItem = params.dataColItem || Retina.keys(stm.DataStore.profile[c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source].rows[0].metadata)[0];
	var colIndex = params.dataColIndex;
	var palette = GooglePalette(c.items.length);
	for (var i=0; i<c.items.length; i++) {
	    var p = stm.DataStore.profile[c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source];
	    series.data.push( { name: c.items[i][id], data: [], fill: palette[i] } );
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
		    for (j=0;j<c.items.length;j++) {
			d[key][j] = 0;
		    }
		}
		d[key][i] += val;
	    }
	}

	var rows = Retina.keys(d).sort();
	series.x_labels = rows;
	for (var i=0; i<rows.length; i++) {
	    for (var h=0; h<c.items.length; h++) {
		series.data[h].data.push(d[rows[i]][h]);
	    }
	}
	
	return series;
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
	var colItem = params.dataColItem || Retina.keys(stm.DataStore.profile[c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source].rows[0].metadata)[0];
	var colIndex = params.dataColIndex;
	var palette = GooglePalette(c.items.length);
	for (var i=0; i<c.items.length; i++) {
	    var p = stm.DataStore.profile[c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source];
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
		    for (j=0;j<c.items.length;j++) {
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
	var colItem = params.dataColItem || Retina.keys(stm.DataStore.profile[c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source].rows[0].metadata)[0];
	var colIndex = params.dataColIndex;
	if (colIndex >= stm.DataStore.profile[c.items[0].id+"_"+c.parameters.type+"_"+c.parameters.source].rows[0].metadata[colItem].length) {
	    colIndex--;
	}
	for (var i=0; i<c.items.length; i++) {
	    var p = stm.DataStore.profile[c.items[i].id+"_"+c.parameters.type+"_"+c.parameters.source];
	    matrix.cols.push(c.items[i][id]);
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
		    for (j=0;j<c.items.length;j++) {
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

    // switch rows and cols of a matrix
    widget.transposeMatrix = function (matrix) {
	var mnew = { rows: matrix.cols,
		     cols: matrix.rows,
		     data: [] };
	for (var i=0;i<matrix.data.length; i++) {
	    for (var h=0;h<matrix.data[i].length;h++) {
		if (! mnew.data[h]) {
		    mnew.data[h] = [];
		}
		mnew.data[h][i] = matrix.data[i][h];
	    }
	}
	
	return mnew;
    };

    widget.normalizeMatrix = function (matrix) {
	var maxes = [];

	for (var i=0; i<matrix[0].length; i++) {
	    maxes.push(0);
	}
	for (var i=0;i<matrix.length;i++) {
	    for (var h=0; h<matrix[i].length; h++) {
		if (maxes[h]<matrix[i][h]) {
		    maxes[h] = matrix[i][h];
		}
	    }
	}
	for (var i=0;i<matrix.length;i++) {
	    for (var h=0; h<matrix[i].length; h++) {
		matrix[i][h] = matrix[i][h] / maxes[h];
		}
	}

	return matrix;
    };

    

    /*
      DATA SECTION
     */

    widget.demoData = function () {
	return { 'table': { title: 'abundance table',
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
					  legend_width: 90 }
			    },
		 'deviationplot': { title: 'deviationplot',
				    renderer: "deviationplot",
				    settings: { }
				  },
		 'boxplot': { title: 'boxplot',
			      renderer: "boxplot",
			      settings: { }
			    },
		 'piechart': { title: 'piechart',
			       renderer: "graph",
			       settings: { title: 'my pie',
    					   type: 'pie',
    					   title_settings: { 'font-size': '18px', 'font-weight': 'bold', 'x': 0, 'text-anchor': 'start' },
    					   x_labels: [""],
    					   show_legend: true,
    					   legendArea: [290, 20, 9 * 23, 250],
    					   chartArea: [25, 20, 250, 250],
    					   width: 250,
    					   height: 250,
    					   data: [ { name: "A", data: [ 100 ], fill: GooglePalette(9)[0] },
						   { name: "B", data: [ 50 ], fill: GooglePalette(9)[1] },
						   { name: "C", data: [ 25 ], fill: GooglePalette(9)[2] },
						   { name: "D", data: [ 20 ], fill: GooglePalette(9)[3] },
						   { name: "E", data: [ 19 ], fill: GooglePalette(9)[4] },
						   { name: "F", data: [ 18 ], fill: GooglePalette(9)[5] },
						   { name: "G", data: [ 12 ], fill: GooglePalette(9)[6] },
						   { name: "H", data: [ 5 ], fill: GooglePalette(9)[7] },
						   { name: "I", data: [ 1 ], fill: GooglePalette(9)[8] } ] }
			     },
		 'areachart': { title: 'areachart',
				renderer: "graph",
				settings: {'x_title': "x-axis",
					   'y_title': "y-axis",
					   'type': 'stackedArea',
					   'x_tick_interval': 1,
					   'x_labeled_tick_interval': 5,
					   'show_legend': true,
					   'legendArea': [770, 20, 15, 5 * 23],
     					   'chartArea': [70, 20, 750, 300],
     					   'width': 805,
     					   'height': 345,
					   'data': [ { name: "A", data: [ 50, 55, 54, 45, 41, 52, 41, 52, 51, 42 ], fill: GooglePalette(5)[0] },
						     { name: "T", data: [ 55, 54, 45, 41, 52, 41, 52, 51, 42, 60 ], fill: GooglePalette(5)[1] },
						     { name: "C", data: [ 54, 45, 41, 52, 41, 52, 51, 42, 60, 22 ], fill: GooglePalette(5)[2] },
						     { name: "G", data: [ 45, 41, 52, 41, 52, 51, 42, 60, 12, 5 ], fill: GooglePalette(5)[3] },
						     { name: "N", data: [ 1, 2, 1, 2, 1, 2, 1, 2, 1, 2 ], fill: GooglePalette(5)[4] } ]
					  }
			      },
		 'linechart': { title: 'linechart',
				renderer: "plot",
				settings: { 'x_titleOffset': 40,
					    'y_titleOffset': 60,
					    'x_title': 'bp position',
					    'y_title': 'percent error',
					    'x_min': 0,
					    'x_max': 10,
					    'y_min': 0,
					    'y_max': 30,
					    'show_legend': false,
					    'show_dots': false,
					    'connected': true,
					    'chartArea': [70, 20, 750, 300],
					    'width': 790,
					    'height': 345,
					    'data': { 'series': [ {'name': 'Metagenome A', color: GooglePalette(3)[0] },
								  {'name': 'Metagenome B', color: GooglePalette(3)[1] },
								  {'name': 'Metagenome C', color: GooglePalette(3)[2] } ],
						      'points': [ [ { x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 2 }, { x: 4, y: 1 }, { x: 5, y: 2 }, { x: 6, y: 3 }, { x: 7, y: 5 }, { x: 8, y: 8 }, { x: 9, y: 10 }, { x: 10, y: 19 } ],
								  [ { x: 0, y: 3 }, { x: 1, y: 12 }, { x: 2, y: 2 }, { x: 3, y: 4 }, { x: 4, y: 2 }, { x: 5, y: 5 }, { x: 6, y: 1 }, { x: 7, y: 6 }, { x: 8, y: 5 }, { x: 9, y: 8 }, { x: 10, y: 15 } ],
								  [ { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 1 }, { x: 4, y: 3 }, { x: 5, y: 1 }, { x: 6, y: 5 }, { x: 7, y: 9 }, { x: 8, y: 11 }, { x: 9, y: 18 }, { x: 10, y: 29 } ]
								] }
				      }
			      },
		 'dotplot': { title: 'dotplot',
			      renderer: "plot",
			      settings: { 'x_titleOffset': 40,
					  'y_titleOffset': 60,
					  'x_title': '',
					  'y_title': '',
					  'x_min': -10,
					  'x_max': 10,
					  'y_min': -10,
					  'y_max': 10,
					  'show_legend': false,
					  'show_dots': true,
					  'connected': false,
					  'chartArea': [70, 20, 450, 400],
					  'width': 500,
					  'height': 450,
					  'data': { 'series': [ {'name': 'Metagenome A', color: GooglePalette(3)[0], shape: 'circle', filled: true },
								{'name': 'Metagenome B', color: GooglePalette(3)[1], shape: 'circle', filled: true },
								{'name': 'Metagenome C', color: GooglePalette(3)[2], shape: 'circle', filled: true } ],
						    'points': [ [ { x: -5, y: -1 }, { x: 1, y: 2 }, { x: 2, y: -3 }, { x: -3, y: 2 } ],
								[ { x: -8, y: -3 }, { x: 5, y: 9 }, { x: 7, y: 2 }, { x: 3, y: 8 } ],
								[ { x: -2, y: 0 }, { x: 2, y: -5 }, { x: 9, y: -4 }, { x: 3, y: 7 } ]
							      ] }
					}
			    },
		 'barchart': { title: 'barchart',
			       renderer: "graph",
			       settings: {'title': '',
    					  'type': 'column',
    					  'default_line_width': 1,
    					  'default_line_color': 'blue',
					  'x_labels': ['Organism A', 'Organism B', 'Organism C', 'Organism D', 'Organism E'],
    					  'x_labels_rotation': '310',
    					  'x_tick_interval': 5,
    					  'show_legend': false,
    					  //'chartArea': [180, 20, 700, 250],
    					  'width': 830,
    					  'height': 340,
					  'data': [ { name: "Metagenome A", data: [ 50, 55, 54, 45, 41 ], fill: GooglePalette(3)[0] },
						    { name: "Metagenome B", data: [ 41, 52, 51, 42, 60 ], fill: GooglePalette(3)[1] },
						    { name: "Metagenome C", data: [ 45, 41, 60, 22, 19 ], fill: GooglePalette(3)[2] } ]
					 }
			     },
		 'donut': { title: 'donut',
			    renderer: "donut",
			    settings: {'title': 'Sample' }
			  }
	       };
    };
})();