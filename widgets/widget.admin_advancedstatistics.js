(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Administrator Advanced Statistics Widget",
            name: "admin_advancedstatistics",
            author: "Tobias Paczian",
            requires: [ "rgbcolor.js" ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("graph"),
		 Retina.load_renderer("plot") ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "span10 offset1";

	if (widget.user) {

            var html = '<h3>Computation Statistics</h3><div id="statistics" style="clear: both;"><img src="Retina/images/waiting.gif" style="margin-left: 40%;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    if (! stm.DataStore.hasOwnProperty('jobtemplate') && ! navigator.userAgent.match(/iPhone/i) && ! navigator.userAgent.match(/Android/i)) {
		stm.init({useDB: true, dbName: 'admin_statistics'}).then(function() {
		    Retina.WidgetInstances.admin_advancedstatistics[1].getJobData();
		});
	    } else {
		Retina.WidgetInstances.admin_advancedstatistics[1].getJobData();
	    }

	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.getJobData = function () {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var timestamp = widget.dateString(new Date().getTime());
	var offset = 0;
	var limit = 250;
	var maximum = 6000;
	if (widget.hasOwnProperty('updateOffset')) {
	    widget.updateOffset += limit;
	    offset = widget.updateOffset;
	} else {
	    widget.updateOffset = 0;
	}
	if (stm.DataStore.hasOwnProperty('updateTime') && stm.DataStore.updateTime[2]) {
	    timestamp = widget.dateString(new Date().getTime() - stm.DataStore.updateTime[2].update_time);
	}
	
	var prom = jQuery.Deferred();
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig['mgrast_api'] + "/pipeline?date_start="+timestamp+"&limit="+limit+"&offset="+offset+"&state=completed",
		       headers: widget.authHeader,
		       success: function(data) {
			   if (! stm.DataStore.hasOwnProperty('completedJobs')) {
			       stm.DataStore.completedJobs = {};
			   }
			   for (var i=0; i<data.data.length; i++) {
			       stm.DataStore.completedJobs[data.data[i].id] = data.data[i];
			   }
			   if ((! (data.offset > maximum)) && data.total_count > (data.limit + data.offset)) {
			       Retina.WidgetInstances.admin_advancedstatistics[1].incomplete = 1;
			   } else {
			       Retina.WidgetInstances.admin_advancedstatistics[1].incomplete = 0;
			   }
			   if (stm.DataStore.hasOwnProperty('jobtemplate') && stm.DataStore.jobtemplate[1]) {
			       prom.resolve();
			   } else {
			       jQuery.ajax( { dataType: "json",
					      url: RetinaConfig['mgrast_api'] + "/pipeline/"+data.data[0].info.name,
					      headers: widget.authHeader,
					      success: function(data) {
					 	  stm.DataStore.jobtemplate = { 1: data.data[0] };
					      },
					      error: function () {
					 	  alert('there was an error retrieving the data');
					      }
					    } ).then(function(){ prom.resolve(); });
			   }
		       },
		       error: function () {
			   alert('there was an error retrieving the data');
		       }
		     } );
	prom.then(function() {
	    var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	    if (widget.incomplete) {
		widget.getJobData();
	    } else {
		stm.DataStore.updateTime = { 2: { update_time: new Date().getTime() } };
		stm.dump(true, 'admin_statistics');
		widget.showStatistics();
	    }
	});
    };

    widget.showStatistics = function () {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var target = document.getElementById('statistics');
	
	widget.jobids = Retina.keys(stm.DataStore.completedJobs);

	var html = "loaded "+widget.jobids.length+" completed job statistics<h4>average input size in Mbp</h4><div id='avg_size'></div><h4>average computation time in minutes</h4><div id='avg_time'></div><div>task <div class='input-append'><input type='text' value='0' class='span2'><button class='btn' onclick='Retina.WidgetInstances.admin_advancedstatistics[1].updateTask(this.previousSibling.value);'>show</button></div></div><div id='tasktime'></div><div>job <div class='input-append'><input type='text' value='0' class='span2'><button class='btn' onclick='Retina.WidgetInstances.admin_advancedstatistics[1].updateJob(this.previousSibling.value);'>show</button></div></div><h4>size</h4><div id='one'></div><h4>time</h4><div id='two'></div>";
	target.innerHTML = html;

	var which_job = 0;
	var which_task = 0;
	var avg_time = [];
	var avg_size = [];
	var size_one = [];
	var time_one = [];
	var tasktime = [];
	var min_time;
	var max_time;
	var min_size;
	var max_size;
	var numtasks = stm.DataStore.completedJobs[widget.jobids[0]].tasks.length;
	for (var i=0; i<numtasks; i++) {
	    avg_time.push(0);
	    avg_size.push(0);
	}
	for (var i=0; i<widget.jobids.length; i++) {
	    var job = stm.DataStore.completedJobs[widget.jobids[i]];
	    for (var h=0; h<job.tasks.length; h++) {
		var size = 0;
		var inputs = Retina.keys(job.tasks[h].inputs);
		for (var j=0; j<inputs.length; j++) {
		    size += job.tasks[h].inputs[inputs[j]].size;
		}
		var duration = Date.parse(job.tasks[h].completeddate) - Date.parse(job.tasks[h].starteddate);
		avg_time[h] += duration;
		avg_size[h] += size;
		if (i==which_job) {
		    time_one[h] = duration;
		    size_one[h] = size;
		}
		if (h==which_task) {
		    if (! min_size || min_size > (size / 1000000)) {
			min_size = (size / 1000000);
		    }
		    if (! max_size || max_size < (size / 1000000)) {
			max_size = (size / 1000000);
		    }
		    if (! min_time || min_time > (duration / 60000)) {
			min_time = (duration / 60000);
		    }
		    if (! max_time || max_time < (duration / 60000)) {
			max_time = (duration / 60000);
		    }
		    tasktime.push( { x: (duration / 60000), y: (size / 1000000) } );
		}
	    }
	}
	tasktime.sort(Retina.propSort('x', true));
	for (var i=0; i<numtasks; i++) {
	    avg_time[i] = avg_time[i] / widget.jobids.length / 1000 / 60;
	    avg_size[i] = avg_size[i] / widget.jobids.length / 1000000;
	}
	widget.at = time_one;
	widget.as = size_one;

	// draw the graphs
	var template = stm.DataStore.jobtemplate[1];

	// get the names for the task ids and initialize the task counter
	var tasklabels = [];
	for (var i=0; i<template.tasks.length; i++) {
	    tasklabels[i] = template.tasks[i].cmd.description;
	}

	Retina.Renderer.create("graph", { target: document.getElementById('avg_size'),
					  data: [ { name: "size / Mbp", data: avg_size } ],
					  x_labels: tasklabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();
	Retina.Renderer.create("graph", { target: document.getElementById('avg_time'),
					  data: [ { name: "time / min", data: avg_time } ],
					  x_labels: tasklabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  y_scale: "log",
					  type: "column" }).render();
	widget.taskGraph = Retina.Renderer.create("plot", { target: document.getElementById('tasktime'),
							    x_min: min_time,
							    x_max: max_time,
							    y_min: min_size,
							    y_max: max_size,
							    show_dots: true,
							    connected: false,
							    data: { series: [ { name: "task", shape: "circle", pointSize: 3, color: 'blue' } ],
								    points: [ tasktime ] } }).render();
	widget.sizeGraph = Retina.Renderer.create("graph", { target: document.getElementById('one'),
							     data: [ { name: "size in bp", data: size_one } ],
							     x_labels: tasklabels,
							     chartArea: [0.1, 0.1, 0.95, 0.7],
							     x_labels_rotation: "-25",
							     type: "column" }).render();
	widget.timeGraph = Retina.Renderer.create("graph", { target: document.getElementById('two'),
							     data: [ { name: "time in sec", data: time_one } ],
							     x_labels: tasklabels,
							     chartArea: [0.1, 0.1, 0.95, 0.7],
							     x_labels_rotation: "-25",
							     y_scale: "log",
							     type: "column" }).render();
    };

    widget.updateTask = function (whichtask) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var tasktime = [];
	var min_time;
	var max_time;
	var min_size;
	var max_size;

	for (var i=0; i<widget.jobids.length; i++) {
	    var job = stm.DataStore.completedJobs[widget.jobids[i]];
	    var size = 0;
	    var inputs = Retina.keys(job.tasks[whichtask].inputs);
	    for (var j=0; j<inputs.length; j++) {
		size += job.tasks[whichtask].inputs[inputs[j]].size;
	    }
	    var duration = Date.parse(job.tasks[whichtask].completeddate) - Date.parse(job.tasks[whichtask].starteddate);
	    if (! min_size || min_size > (size / 1000000)) {
		min_size = (size / 1000000);
	    }
	    if (! max_size || max_size < (size / 1000000)) {
		max_size = (size / 1000000);
	    }
	    if (! min_time || min_time > (duration / 60000)) {
		min_time = (duration / 60000);
	    }
	    if (! max_time || max_time < (duration / 60000)) {
		max_time = (duration / 60000);
	    }
	    tasktime.push( { x: (duration / 60000), y: (size / 1000000) } );
	}

	tasktime.sort(Retina.propSort('x', true));

	var t = document.getElementById('tasktime');
	t.innerHTML = "";
	widget.taskGraph.settings.target = t;
	widget.taskGraph.settings.x_min = min_time;
	widget.taskGraph.settings.x_max = max_time;
	widget.taskGraph.settings.y_min = min_size;
	widget.taskGraph.settings.y_max = max_size;
	widget.taskGraph.settings.data.points[0] = tasktime;
	widget.taskGraph.render();
    }

    widget.updateJob = function (whichjob) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var sdata = [];
	var tdata = [];
	var job = stm.DataStore.completedJobs[widget.jobids[whichjob]];
	for (var h=0; h<job.tasks.length; h++) {
	    var size = 0;
	    var inputs = Retina.keys(job.tasks[h].inputs);
	    for (var j=0; j<inputs.length; j++) {
		size += job.tasks[h].inputs[inputs[j]].size;
	    }
	    var duration = Date.parse(job.tasks[h].completeddate) - Date.parse(job.tasks[h].starteddate);
	    tdata[h] = duration;
	    sdata[h] = size;
	}

	var s = document.getElementById('one');
	s.innerHTML = "";
	widget.sizeGraph.settings.target = s;
	widget.sizeGraph.settings.data[0].data = sdata;
	widget.sizeGraph.render();

	var t = document.getElementById('two');
	t.innerHTML = "";
	widget.timeGraph.settings.target = t;
	widget.timeGraph.settings.data[0].data = tdata;
	widget.timeGraph.render();
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

    // login callback
    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];
	if (data.user) {
	    widget.user = data.user;
	    widget.authHeader = { "Auth": data.token };
	} else {
	    widget.user = null;
	    widget.authHeader = {};
	}
	widget.display();
    };

})();