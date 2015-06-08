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

	    Retina.WidgetInstances.admin_advancedstatistics[1].getJobData();

	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.getJobData = function () {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	document.getElementById('statistics').innerHTML = '<img src="Retina/images/waiting.gif" style="margin-left: 40%;">';

	var dstart = widget.dateString(new Date().getTime() - (Date.parse(document.getElementById('pick_start').value + "T00:00:00.000Z") + (1000 * 60 * 60 * 6)));
	var dend = widget.dateString(new Date().getTime() - (Date.parse(document.getElementById('pick_end').value + "T23:59:59.999Z") + (1000 * 60 * 60 * 6)));
	var limit = 2500;
	
	var prom = jQuery.Deferred();
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig['mgrast_api'] + "/pipeline?date_start="+dstart+"&info.pipeline=mgrast-prod&date_end="+dend+"&limit="+limit+"&state=completed",
		       headers: stm.authHeader,
		       dend: dend,
		       dstart: dstart,
		       success: function(data) {
			   stm.DataStore.completedJobs = {};
			   var j;
			   for (var i=0; i<data.data.length; i++) {
			       if ((data.data[i].info.completedtime > this.dstart) && (data.data[i].info.completedtime < this.dend)) {
				   stm.DataStore.completedJobs[data.data[i].id] = data.data[i];
				   stm.DataStore.jobtemplate = { 1: data.data[i] };
			       }
			   }
			   prom.resolve();
		       },
		       error: function () {
			   alert('there was an error retrieving the data');
		       }
		     } );
	prom.then(function() {
	    widget.showStatistics();
	});
    };

    widget.showStatistics = function () {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var target = document.getElementById('statistics');
	
	widget.jobids = Retina.keys(stm.DataStore.completedJobs);

	var nowTemp = new Date();
	var now = nowTemp.getFullYear() + "-" + (nowTemp.getMonth() + 1).padLeft() + "-" + (nowTemp.getDate() + 1).padLeft();
	var html = "loaded "+widget.jobids.length+" completed job statistics<h4>average input size in MB</h4><div id='avg_size'></div><h4>average computation time in minutes</h4><div id='avg_time'></div><div><h4 style='margin-top: 25px;'>Task Plot</h4><div class='input-prepend'><span class='add-on'>task</span><select class='span10' id='tasknumselect' onchange='Retina.WidgetInstances.admin_advancedstatistics[1].updateTask(this.options[this.selectedIndex].value);'></select></div><div class='input-prepend'><span class='add-on'>separation date</span><input type='text' id='pick_sep' value='"+now+"' onchange='Retina.WidgetInstances.admin_advancedstatistics[1].updateTask(document.getElementById(\"tasknumselect\").options[document.getElementById(\"tasknumselect\").selectedIndex].value);'></div></div><div class='row'><div id='tasktime' class='span8'></div><div id='taskdetails' class='span4'></div></div><div id='jobnumsel' style='height: 70px;'></div><div>job <div class='input-append'><input type='text' value='"+stm.DataStore.completedJobs[widget.jobids[0]].info.name+"' class='span4' id='jobnumselect'><button class='btn' onclick='Retina.WidgetInstances.admin_advancedstatistics[1].updateJob(this.previousSibling.value);'>show</button></div></div><h4>size</h4><div id='one'></div><h4>time</h4><div id='two'></div>";
	target.innerHTML = html;

	var sel = document.getElementById('tasknumselect');
	var tmpl = stm.DataStore.jobtemplate[1];
	var selhtml = "";
	for (var i=0; i<tmpl.tasks.length; i++) {
	    selhtml += "<option value='"+i+"'>"+tmpl.tasks[i].cmd.description+"</option>";
	}
	sel.innerHTML = selhtml;

	jQuery("#pick_sep").datepicker({ format: "yyyy-mm-dd" });

	var which_job = 0;
	var which_task = 0;
	var avg_time = [];
	var avg_size = [];
	var all_times = [];
	var all_sizes = [];
	var size_one = [];
	var time_one = [];
	var tasktime = [];
	var tt2wd = {};
	var min_time;
	var max_time;
	var min_size;
	var max_size;
	var numtasks = stm.DataStore.completedJobs[widget.jobids[0]].tasks.length;
	for (var i=0; i<numtasks; i++) {
	    avg_time.push(0);
	    avg_size.push(0);
	    all_times[i] = [];
	    all_sizes[i] = [];
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
		all_times[h].push(duration / 60000);
		all_sizes[h].push(size / 1000000);
		if (i==which_job) {
		    time_one[h] = duration / 60000;
		    size_one[h] = size / 1000000;
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
		    var d = (duration / 60000);
		    var s = (size / 1000000);
		    tasktime.push( { y: d, x: s } );
		    tt2wd[s+""+d] = widget.jobids[i];
		}
	    }
	}
	widget.tt2wd = tt2wd;
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
					  data: [ { name: "size / MB", data: avg_size } ],
					  x_labels: tasklabels,
					  x_title: "task",
					  y_title: "size in MB",
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();
	Retina.Renderer.create("graph", { target: document.getElementById('avg_time'),
					  data: [ { name: "time / min", data: avg_time } ],
					  x_labels: tasklabels,
					  x_title: "task",
					  y_title: "time in minutes",
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();
	widget.taskGraph = Retina.Renderer.create("plot", { target: document.getElementById('tasktime'),
							    y_title: "time in minutes",
							    x_title: "size in MB",
							    show_dots: true,
							    show_legend: true,
							    connected: false,
							    drag_select: Retina.WidgetInstances.admin_advancedstatistics[1].tasktimeSelected,
							    data: { series: [ { name: "task", shape: "circle", pointSize: 3, color: 'blue' } ],
								    points: [ tasktime ] } }).render();
	widget.sizeGraph = Retina.Renderer.create("graph", { target: document.getElementById('one'),
							     data: [ { name: "size in MB", data: size_one } ],
							     x_labels: tasklabels,
							     x_title: "task",
							     y_title: "size in MB",
							     chartArea: [0.1, 0.1, 0.95, 0.7],
							     x_labels_rotation: "-25",
							     type: "column" }).render();
	widget.timeGraph = Retina.Renderer.create("graph", { target: document.getElementById('two'),
							     data: [ { name: "time in minutes", data: time_one } ],
							     x_labels: tasklabels,
							     x_title: "task",
							     y_title: "time in minutes",
							     chartArea: [0.1, 0.1, 0.95, 0.7],
							     x_labels_rotation: "-25",
							     type: "column" }).render();
    };

    widget.tasktimeSelected = function (data) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var task = parseInt(document.getElementById('tasknumselect').value);
	var html = "<table class='table table-condensed'><tr><td><b>job</b></td><td><b>taskdata</b></td></tr>";
	for (var i=0; i<data.length; i++) {
	    var job = stm.DataStore.completedJobs[widget.tt2wd[data[i].x+""+data[i].y]];
	    html += "<tr><td><a href='#jobnumsel' onclick='document.getElementById(\"jobnumselect\").value=\""+job.info.name+"\";Retina.WidgetInstances.admin_advancedstatistics[1].updateJob(\""+job.info.name+"\");'>"+job.info.name+"</a></td><td><table>";
	    html += "<tr><td>started</td><td>"+job.tasks[task].starteddate+"</td></tr>";
	    html += "<tr><td>completed</td><td>"+job.tasks[task].completeddate+"</td></tr>";
	    html += "<tr><td>duration</td><td>"+parseInt((Date.parse(job.tasks[task].completeddate) - Date.parse(job.tasks[task].starteddate)) / 60000)+" min</td></tr>";
	    var inp = Retina.keys(job.tasks[task].inputs);
	    for (var h=0; h<inp.length; h++) {
		html += "<tr><td>"+inp[h]+"</td><td><a style='cursor: pointer;' onclick='Retina.WidgetInstances.admin_advancedstatistics[1].authenticatedDownload(\""+job.tasks[task].inputs[inp[h]].node+"\", \""+inp[h]+"\");'>"+job.tasks[task].inputs[inp[h]].size.byteSize()+"</a></td></tr>";
	    }
	    html += "</table></td></tr>";
	}
	html += "</table>";

	document.getElementById('taskdetails').innerHTML = html;
    };

    widget.authenticatedDownload = function (id, fn) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	jQuery.ajax({ url: RetinaConfig.shock_url + "/node/" + id + "?download_url&filename="+fn,
		      dataType: "json",
		      success: function(data) {
			  if (data != null) {
			      if (data.error != null) {
				  console.log("error: "+data.error);
			      }
			      window.location = data.data.url;
			  } else {
			      console.log("error: invalid return structure from SHOCK server");
			      console.log(data);
			  }
		      },
		      error: function(jqXHR, error) {
			  console.log( "error: unable to connect to SHOCK server" );
			  console.log(error);
		      },
		      crossDomain: true,
		      headers: stm.authHeader
		    });
    };

    widget.updateTask = function (whichtask) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var tasktime = [];
	var tasktime2 = [];
	var min_time;
	var max_time;
	var min_size;
	var max_size;
	var tt2wd = {};
	var chicagoTimeSplit = null;
	if (document.getElementById('pick_sep').value != "none") {
	    chicagoTimeSplit = widget.dateString(new Date().getTime() - (Date.parse(document.getElementById('pick_sep').value + "T00:00:00.000Z") + (1000 * 60 * 60 * 6)));
	}
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
	    var d = (duration / 60000);
	    var s = (size / 1000000);
	    if (chicagoTimeSplit && chicagoTimeSplit < job.info.completedtime) {
		tasktime2.push( { y: d, x: s } );
	    } else {
		tasktime.push( { y: d, x: s } );
	    }
	    tt2wd[s+""+d] = widget.jobids[i];
	}
	
	widget.tt2wd = tt2wd;

	tasktime.sort(Retina.propSort('x', true));

	var t = document.getElementById('tasktime');
	t.innerHTML = "";
	widget.taskGraph.settings.target = t;
	var sx = Retina.niceScale({min: min_time, max: max_time});
	var sy = Retina.niceScale({min: min_size, max: max_size});
	widget.taskGraph.settings.y_min = sx.min;
	widget.taskGraph.settings.y_max = sx.max;
	widget.taskGraph.settings.x_min = sy.min;
	widget.taskGraph.settings.x_max = sy.max;
	widget.taskGraph.settings.data.points[0] = tasktime;
	if (tasktime2.length) {
	    if (widget.taskGraph.settings.data.points.length == 1) {
		widget.taskGraph.settings.data.points.push([]);
		widget.taskGraph.settings.data.series.push({ name: "after", shape: "circle", pointSize: 3, color: 'red' });
		widget.taskGraph.settings.data.series[0].name = "before";
	    }
	    widget.taskGraph.settings.data.points[1] = tasktime2;
	} else {
	    widget.taskGraph.settings.data.series[0].name = "task";
	    delete widget.taskGraph.settings.data.series[1];
	    delete widget.taskGraph.settings.data.points[1];
	}
	widget.taskGraph.render();
    }

    widget.updateJob = function (whichjob) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var n2j = {};
	for (var i=0; i<widget.jobids.length; i++) {
	    n2j[stm.DataStore.completedJobs[widget.jobids[i]].info.name] = i;
	}
	var sdata = [];
	var tdata = [];
	var job = stm.DataStore.completedJobs[widget.jobids[n2j[whichjob]]];
	for (var h=0; h<job.tasks.length; h++) {
	    var size = 0;
	    var inputs = Retina.keys(job.tasks[h].inputs);
	    for (var j=0; j<inputs.length; j++) {
		size += job.tasks[h].inputs[inputs[j]].size;
	    }
	    var duration = Date.parse(job.tasks[h].completeddate) - Date.parse(job.tasks[h].starteddate);
	    tdata[h] = duration / 60000;
	    sdata[h] = size / 1000000;
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
})();