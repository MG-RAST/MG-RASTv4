(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Administrator Advanced Statistics Widget",
            name: "admin_advancedstatistics",
            author: "Tobias Paczian",
            requires: [ "rgbcolor.js", "jquery.datepicker.js" ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer('svg2') ];
    };

    widget.graphs = {};
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "span10 offset1";

	if (stm.user) {

	    var pastTemp = new Date(new Date().getTime() - (1000 * 60 * 60 * 24));
	    var past = pastTemp.getFullYear() + "-" + (pastTemp.getMonth() + 1).padLeft() + "-" + (pastTemp.getDate() + 1).padLeft();
            var html = '<h3>Computation Statistics</h3><div><div class="input-prepend"><span class="add-on">from</span><input type="text" id="pick_start" value="'+past+'"></div> <div class="input-prepend input-append"><span class="add-on">to</span><input type="text" id="pick_end" value="'+past+'"><button class="btn" onclick="Retina.WidgetInstances.admin_advancedstatistics[1].getJobData();">show</button></div></div><div id="statistics" style="clear: both;"><img src="Retina/images/waiting.gif" style="margin-left: 40%;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    // initialize the datepickers
	    
	    jQuery("#pick_start").datepicker({ date: pastTemp,
					       format: "yyyy-mm-dd" });
	    jQuery("#pick_end").datepicker({ date: pastTemp,
					     format: "yyyy-mm-dd" });

	    widget.getJobData();

	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.getJobData = function () {
	var widget = this;

	var promises = [];

	promises.push(jQuery.getJSON("data/graphs/statistics_bar.json", function (data) {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    widget.graphs.bar = data;
	}));

	promises.push(jQuery.getJSON("data/graphs/statistics_plot.json", function (data) {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    widget.graphs.plot = data;
	}));

	promises.push(jQuery.getJSON("data/jobdata_base.json", function (data) {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    widget.jobData = data;
	}));

	jQuery.when.apply(this, promises).then(function() {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    widget.showGraph();
	});
    };

    widget.showGraph = function () {
	var widget = this;

	var html = [];

	html.push('<div><div class="input-prepend"><span class="add-on">display</span></div><select id="display_select"><option>time-size</option><option>average-task-times</option><option>average-task-times-size</option></select></div></div>');

	html.push('<div class="input-prepend"><span class="add-on">pipeline</span><select id="pipeline_select" style="margin-bottom: 0px;" onchange="Retina.WidgetInstances.admin_advancedstatistics[1].updateTasklist();"><option> - select - </option>');

	var pipelines = Retina.keys(widget.jobData).sort();
	for (var i=0; i<pipelines.length; i++) {
	    html.push('<option>'+pipelines[i]+'</option>');
	}
	html.push('</select></div><div class="input-prepend"><span class="add-on">task</span><select id="task_select" style="margin-bottom: 0px;"></select></div>');
	
	html.push('<button class="btn" onclick="Retina.WidgetInstances.admin_advancedstatistics[1].updateGraph();" style="margin-bottom: 10px; margin-left: 20px;">update</button>');

	html.push('<div id="graph" style="margin-top: 50px;"></div>');

	document.getElementById('statistics').innerHTML = html.join("");

	widget.graphType = "plot";
	widget.baseCalculations();
    };

    widget.updateTasklist = function () {
	var widget = this;

	var pipeline = widget.pipeline = document.getElementById('pipeline_select').options[document.getElementById('pipeline_select').selectedIndex].value;
	var tasks = Retina.keys(widget.jobData[pipeline].tasks).sort();
	var html = [];
	for (var i=0; i<tasks.length; i++) {
	    html.push('<option>'+tasks[i]+'</option>');
	}
	document.getElementById('task_select').innerHTML = html.join("");
    };

    widget.baseCalculations = function () {
	var widget = this;

	widget.data = {};
	
	var pipelines = Retina.keys(widget.jobData).sort();
	var ptasks = {};
	for (var i=0; i<pipelines.length; i++) {
	    ptasks[pipelines[i]] = Retina.keys(widget.jobData[pipelines[i]].tasks).sort();
	}	

	/*
	  TASK
	     0        1        2         3      4     5
	  created, started, completed, runtime, size, id

	  JOB
	     0        1         2        3    4
	  created, started, completed, size, id
	*/


	// Time - Size data for all pipelines and tasks
	widget.data['time-size'] = {};
	widget.data['average-task-times'] = {};
	widget.data['average-task-times-size'] = {};

	for (var i=0; i<pipelines.length; i++) {
	    var pipeline = pipelines[i];
	    
	    widget.data['time-size'][pipeline] = {};
	    widget.data['average-task-times'][pipeline] = {};
	    widget.data['average-task-times-size'][pipeline] = {};
	    
	    for (var h=0; h<ptasks[pipeline].length; h++) {
		var task = ptasks[pipeline][h];
		
		var d = [];
		var day_data = {};
		var start = "0";
		var end = "X"
		var jd = widget.jobData[pipeline].tasks[task];

		widget.data['average-task-times'][pipeline][task] = 0;
		widget.data['average-task-times-size'][pipeline][task] = 0;
		
		for (var j=0; j<jd.length; j++) {
		    d.push({ "x": jd[j][4] / (1024 * 1024), "y": jd[j][3] / 60 });
		    widget.data['average-task-times'][pipeline][task] += jd[j][3] / 60;
		    widget.data['average-task-times-size'][pipeline][task] += (jd[j][3] || 1) / (jd[j][4] / (1024 * 1024 * 1024));
		}

		widget.data['average-task-times'][pipeline][task] = widget.data['average-task-times'][pipeline][task] / jd.length;
		widget.data['average-task-times-size'][pipeline][task] = widget.data['average-task-times-size'][pipeline][task] / jd.length;
		widget.data['time-size'][pipeline][task] = { "data": [ { "name": "minutes / MB", "points": d } ] };
	    }

	    var d = [];
	    var d2 = [];
	    for (var h=0; h<ptasks[pipeline].length; h++) {
		d.push(widget.data['average-task-times'][pipeline][ptasks[pipeline][h]]);
		d2.push(widget.data['average-task-times-size'][pipeline][ptasks[pipeline][h]]);
	    }
	    widget.data['average-task-times'][pipeline] = { "data": Retina.transposeMatrix([ d ]), "rows": ptasks[pipeline], "cols": [ "average task duration" ], "itemsProd": ptasks[pipeline].length };
	    widget.data['average-task-times-size'][pipeline] = { "data": Retina.transposeMatrix([ d2 ]), "rows": ptasks[pipeline], "cols": [ "average compute minutes / MB" ], "itemsProd": ptasks[pipeline].length };
	}
    };

    widget.updateGraph = function () {
	var widget = this;

	var pipeline = document.getElementById('pipeline_select').options[document.getElementById('pipeline_select').selectedIndex].value;
	var task = document.getElementById('task_select').options[document.getElementById('task_select').selectedIndex].value;
	var display = document.getElementById('display_select').options[document.getElementById('display_select').selectedIndex].value;
	
	var data;
	if (display == 'time-size') {
	    data = widget.data[display][pipeline][task];
	} else if ((display == 'average-task-times') || (display == 'average-task-times-size')) {
	    widget.graphType = 'bar';
	    data = widget.data[display][pipeline];
	}

	var params = jQuery.extend(true, {}, widget.graphs[widget.graphType]);
	params.target = document.getElementById('graph');
	params.data = jQuery.extend(true, {}, data);

	Retina.RendererInstances.svg2 = [ Retina.RendererInstances.svg2[0]];
	widget.graph = Retina.Renderer.create('svg2', params);
	widget.graph.render();
    };

    // helper function to get an AWE type date string
    widget.dateString = function (period) {
	var past = new Date(new Date().getTime() - period);
	var d = past.getUTCDate().padLeft();
	var m = (past.getUTCMonth() + 1).padLeft();
	var hour = past.getUTCHours().padLeft();
	var minute = past.getUTCMinutes().padLeft();
	var second = past.getUTCSeconds().padLeft();
	var ms = past.getUTCMilliseconds().padLeft(100);
	var timestamp;
	timestamp = past.getUTCFullYear() + "-" + m + "-" + d + "T" + hour +":" + minute + ":" + second + "." + ms + "Z";
	return timestamp;
    };
})();
