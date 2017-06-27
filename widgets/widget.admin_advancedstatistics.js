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
    widget.seqtypes = { "Amplicon": true, "MT": true, "WGS": true };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	stm.DataStore.jobDataIndex = {
	    "id": 0,
	    "submitted": 1,
	    "started": 2,
	    "completed": 3,
	    "pipeline": 4,
	    "priority": 5,
	    "bpcount": 6,
	    "seqtype": 7,
	    "tasks": 8
	};
	stm.DataStore.taskDataIndex = {
	    "cmd": 0,
	    "started": 1,
	    "completed": 2,
	    "computetime": 3,
	    "inputsize": 4,
	    "outputsize": 5
	};

	stm.DataStore.pipelines = {};
	widget.pipelines = {};
	
	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "span10 offset1";

	if (stm.user) {

	    var pastTemp = new Date(new Date().getTime() - (1000 * 60 * 60 * 24));
	    var past = pastTemp.getFullYear() + "-" + (pastTemp.getMonth() + 1).padLeft() + "-" + (pastTemp.getDate() + 1).padLeft();
            var html = '<h3>Computation Statistics</h3><div id="statistics" style="clear: both;"><img src="Retina/images/waiting.gif" style="margin-left: 40%;"></div>';

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

	var promises = widget.promises = [];

	promises.push(jQuery.getJSON("data/graphs/statistics_bar.json", function (data) {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    widget.graphs.bar = data;
	}));

	promises.push(jQuery.getJSON("data/graphs/statistics_plot.json", function (data) {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    widget.graphs.plot = data;
	}));

	promises.push(jQuery.getJSON("data/jobdata.json", function (data) {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    stm.DataStore.jobdata = data;
	    widget.data = { "ctime": {},
			    "rtime": {},
			    "numjobs": 0 };
	    for (var i=0; i<data.length; i+=9) {
		widget.data.numjobs++;
		var t = data[i+8].split('^');
		var tasks = [];
		for (var h=0; h<t.length; h++) {
		    tasks.push(t[h].split("|")[0]);
		}
		if (! stm.DataStore.pipelines.hasOwnProperty(data[i + 4])) {
		    widget.pipelines[data[i+4]] = true;
		    widget.data.ctime[data[i+4]] = { "job": [0,0] };
		    widget.data.rtime[data[i+4]] = { "job": [0,0] };
		    for (var h=0; h<tasks.length; h++) {
			widget.data.ctime[data[i+4]][tasks[h]] = [0,0];
			widget.data.rtime[data[i+4]][tasks[h]] = [0,0];
		    }
		    stm.DataStore.pipelines[data[i+4]] = tasks;
		}
		widget.data.ctime[data[i+4]].job[0] += data[i+6];
		widget.data.ctime[data[i+4]].job[1] += widget.timeDifference(data[i+2], data[i+3]);
		for (var h=0; h<tasks.length; h++) {
		    widget.data.ctime[data[i+4]][tasks[h]][0] += data[i+6];
		    widget.data.ctime[data[i+4]][tasks[h]][1] += widget.timeDifference(data[i+2], data[i+3]);
		}
	    }
	}));

	// var p = jQuery.Deferred();
	// promises.push(p);
	// widget.loadJobs(0, p);
	

	jQuery.when.apply(this, promises).then(function() {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    widget.showGraph();
	});
    };

    widget.loadJobs = function (offset, promise) {
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig['mgrast_api'] + "/pipeline?info.pipeline="+RetinaConfig.pipelines[2]+"&verbosity=full&offset="+offset+"&state=completed&limit=100",
		       headers: stm.authHeader,
		       p: promise,
		       o: offset,
		       success: function(data) {
			   var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
			   console.log((this.o + 100) + " jobs done");
			   if (! stm.DataStore.hasOwnProperty('jobdata')) {
			       widget.total = data.total_count;
			       stm.DataStore.jobdata = [];
			   }
			   for (var i=0; i<data.data.length; i++) {
			       var d = data.data[i];
			       stm.DataStore.jobdata.push(d.info.userattr.id);
			       stm.DataStore.jobdata.push(d.info.submittime);
			       stm.DataStore.jobdata.push(d.info.startedtime);
			       stm.DataStore.jobdata.push(d.info.completedtime);
			       stm.DataStore.jobdata.push(d.info.pipeline);
			       stm.DataStore.jobdata.push(d.info.priority);
			       stm.DataStore.jobdata.push(d.info.userattr.bp_count);
			       stm.DataStore.jobdata.push(d.info.userattr.sequence_type);
			       var tasks = [];
			       for (var h=0; h<d.tasks.length; h++) {
				   var t = d.tasks[h];
				   var insize = 0;
				   var outsize = 0;
				   for (var j=0; j<t.outputs.length; j++) {
				       outsize += t.outputs[j].size;
				   }
				   for (var j=0; j<t.inputs.length; j++) {
				       insize += t.inputs[j].size;
				   }
				   tasks.push(t.cmd.description+"|"+t.starteddate+"|"+t.completeddate+"|"+t.computetime+"|"+insize+"|"+outsize);
			       }
			       stm.DataStore.jobdata.push(tasks.join("^"));
			   }
			   if (this.o < widget.total) {
			       var promise = jQuery.Deferred();
			       widget.promises.push(promise);
			       this.o += 100;
			       widget.loadJobs(this.o, promise);
			   }
			   this.p.resolve();
		       },
		       error: function (xhr) {
			   Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		       }
		     } );
    };
    
    widget.showGraph = function () {
	var widget = this;

	// prepare the HTML
	var html = [];
	var tasks = widget.tasks = stm.DataStore.pipelines[RetinaConfig.pipelines[0]];
	html.push('<div style="float: left; margin-right: 50px;"><h4>select data</h4><div class="input-prepend"><span class="add-on">display</span><select id="display_select"><option>runtime-size</option><option>computetime-size</option></select></div><br><div class="input-prepend"><span class="add-on" style="width: 45px;">task</span><select style="margin-bottom: 0px;" id="task_select">');
for (var i=0; i<tasks.length; i++) {
	    html.push('<option>'+tasks[i]+'</option>');
	}
	html.push('</select></div></div>');

	html.push('<div style="float: left; margin-right: 50px;"><h4>select cutoffs</h4>');
	html.push('<div class="input-prepend"><span class="add-on">min size</span><input type="text" id="min_size" value="0" style="width: 100px;"></div><br>');
	html.push('<div class="input-prepend"><span class="add-on">max size</span><input type="text" id="max_size" value="0" style="width: 100px;"></div><br>');
	html.push('<div class="input-prepend"><span class="add-on">min time</span><input type="text" id="min_time" value="0" style="width: 100px;"></div><br>');
	html.push('<div class="input-prepend"><span class="add-on">max time</span><input type="text" id="max_time" value="0" style="width: 100px;"></div>');
	html.push('</div>');
	
	html.push('<div style="float: left; margin-right: 50px;"><h4>select pipelines</h4>');

	var pipelines = Retina.keys(stm.DataStore.pipelines).sort();
	for (var i=0; i<pipelines.length; i++) {
	    html.push('<div><input type="checkbox" style="margin-top: 0px;" checked="checked" onclick="Retina.WidgetInstances.admin_advancedstatistics[1].pipelines[\''+pipelines[i]+'\']=this.checked;"> '+pipelines[i]+'</div>');
	}
	html.push('</div>');

	html.push('<div style="float: left; margin-right: 50px;"><h4>select sequence types</h4>');

	var seqtypes = Retina.keys(widget.seqtypes).sort();
	for (var i=0; i<seqtypes.length; i++) {
	    html.push('<div><input type="checkbox" style="margin-top: 0px;" checked="checked" onclick="Retina.WidgetInstances.admin_advancedstatistics[1].seqtypes[\''+seqtypes[i]+'\']=this.checked;"> '+seqtypes[i]+'</div>');
	}
	html.push('</div>');
	
	html.push('<button class="btn" onclick="Retina.WidgetInstances.admin_advancedstatistics[1].updateGraph();" style="margin-bottom: 10px; margin-left: 20px;">update</button><br><button class="btn" onclick="Retina.WidgetInstances.admin_advancedstatistics[1].resetZoom();" style="margin-bottom: 10px; margin-left: 20px;">reset zoom</button>');

	html.push('<div id="graph" style="margin-top: 50px;"></div>');

	document.getElementById('statistics').innerHTML = html.join("");
    };

    widget.resetZoom = function () {
	var widget = this;

	document.getElementById('min_size').value = 0;
	document.getElementById('max_size').value = 0;
    	document.getElementById('min_time').value = 0;
    	document.getElementById('max_time').value = 0;

	widget.updateGraph();
    };
    
    widget.updateGraph = function () {
	var widget = this;

	var task = document.getElementById('task_select').options[document.getElementById('task_select').selectedIndex].value;
	var display = document.getElementById('display_select').options[document.getElementById('display_select').selectedIndex].value;
	var taskindex;
	var tasks = widget.tasks;
	for (var i=0; i<tasks.length; i++) {
	    if (tasks[i] == task) {
		taskindex = i;
		break;
	    }
	}

	widget.graphType = 'plot';

	var shapes = ['circle','square','triangle','udtriangle','rhombus'];
	var colors = GooglePalette();
	var data = stm.DataStore.jobdata;
	var names = {};
	var seqtypes = {};
	var d = { "data": [], "cols": [], "headers": [] };
	for (var i=0; i<data.length; i+=8) {
	    if (! widget.pipelines[data[i+4]]) {
		continue;
	    }

	    if (! widget.seqtypes[data[i+7]]) {
		continue;
	    }
	    
	    if (! names.hasOwnProperty(data[i+4])) {
		names[data[i+4]] = Retina.keys(names).length;
		d.data.push({ "name": data[i+4], "points": [] })
		d.cols.push(data[i+4]);
	    }
	    if (! seqtypes.hasOwnProperty(data[i+7])) {
		seqtypes[data[i+7]] = shapes[Retina.keys(seqtypes).length];
		d.headers.push({"seqtype": data[i+7]});
	    }
	    
	    var t = data[i+8].split('^')[taskindex].split("|");

	    // check filters
	    var minsize = parseInt(document.getElementById('min_size').value);
	    var maxsize = parseInt(document.getElementById('max_size').value);
	    var mintime = parseInt(document.getElementById('min_time').value);
	    var maxtime = parseInt(document.getElementById('max_time').value);

	    var y;
	    var x;
	    var runtime = parseInt(widget.timeDifference(t[1], t[2]) / 60);

	    if (runtime < 0) {
		continue;
	    }
	    
	    var computetime = parseInt(t[3]) / 60;
	    if (display == 'runtime-size') {
		y = runtime;
		x = parseInt(t[4]) / (1024 * 1024);
	    } else if (display == 'computetime-size') {
		y = computetime;
		x = parseInt(t[4]) / (1024 * 1024);
	    }
	    
	    if (minsize != 0 && x < minsize) {
		continue;
	    }
	    if (maxsize != 0 && x > maxsize) {
		continue;
	    }
	    if (mintime != 0 && y < mintime) {
		continue;
	    }
	    if (maxtime != 0 && y > maxtime) {
		continue;
	    }
	    
	    d.data[names[data[i+4]]].points.push({ "x": x, "y": y, "shape": seqtypes[data[i+7]], "format": { "fill": colors[names[data[i+4]]], "onclick": "window.open('mgmain.html?mgpage=overview&metagenome="+data[i]+"');" } });
	}
	
	var params = jQuery.extend(true, {}, widget.graphs[widget.graphType]);
	params.target = document.getElementById('graph');
	params.data = d;
	params.items[2].parameters.radius = 3;
	params.dragCallback = widget.zoom;

	Retina.RendererInstances.svg2 = [ Retina.RendererInstances.svg2[0] ];
	widget.graph = Retina.Renderer.create('svg2', params);
	widget.graph.render();
    };

    widget.zoom = function (params) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	if (params.x1 == params.x2 || params.y1 == params.y2) {
	    return;
	}

	document.getElementById('min_size').value = parseInt(params.x1);
	document.getElementById('max_size').value = parseInt(params.x2);
    	document.getElementById('min_time').value = parseInt(params.y1);
    	document.getElementById('max_time').value = parseInt(params.y2);

	widget.updateGraph();
    };

    widget.timeDifference = function(a, b) {
	return parseInt((new Date(b).valueOf() - new Date(a).valueOf()) / 1000);
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
