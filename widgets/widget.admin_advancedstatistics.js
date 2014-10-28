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

	if (widget.user) {

	    var nowTemp = new Date();
	    var pastTemp = new Date(new Date().getTime() - (1000 * 60 * 60 * 24))
	    var now = nowTemp.getFullYear() + "-" + (nowTemp.getMonth() + 1).padLeft() + "-" + (nowTemp.getDate() + 1).padLeft();
	    var past = pastTemp.getFullYear() + "-" + (pastTemp.getMonth() + 1).padLeft() + "-" + (pastTemp.getDate() + 1).padLeft();
            var html = '<h3>Computation Statistics</h3><div><div class="input-prepend"><span class="add-on">from</span><input type="text" id="pick_start" value="'+past+'"></div> <div class="input-prepend input-append"><span class="add-on">to</span><input type="text" id="pick_end" value="'+now+'"><button class="btn" onclick="Retina.WidgetInstances.admin_advancedstatistics[1].getJobData();">show</button></div></div><div id="statistics" style="clear: both;"><img src="Retina/images/waiting.gif" style="margin-left: 40%;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    // initialize the datepickers
	    
	    jQuery("#pick_start").datepicker({ date: pastTemp,
					       format: "yyyy-mm-dd" });
	    jQuery("#pick_end").datepicker({ date: nowTemp,
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

	var dstart = document.getElementById('pick_start').value + "T00:00:00.000Z";
	var dend = document.getElementById('pick_end').value + "T00:00:00.000Z";
	var limit = 2500;
	
	var prom = jQuery.Deferred();
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig['mgrast_api'] + "/pipeline?date_start="+dstart+"&date_end="+dend+"&limit="+limit+"&state=completed",
		       headers: widget.authHeader,
		       success: function(data) {
			   if (! stm.DataStore.hasOwnProperty('completedJobs')) {
			       stm.DataStore.completedJobs = {};
			   }
			   for (var i=0; i<data.data.length; i++) {
			       stm.DataStore.completedJobs[data.data[i].id] = data.data[i];
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
	    widget.showStatistics();
	});
    };

    widget.showStatistics = function () {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var target = document.getElementById('statistics');
	
	widget.jobids = Retina.keys(stm.DataStore.completedJobs);

	var html = "loaded "+widget.jobids.length+" completed job statistics<h4>average input size in Mbp</h4><div id='avg_size'></div><h4>average computation time in minutes</h4><div id='avg_time'></div><div>task <div class='input-append'><input type='text' value='0' class='span2' id='tasknumselect'><button class='btn' onclick='Retina.WidgetInstances.admin_advancedstatistics[1].updateTask(this.previousSibling.value);'>show</button></div></div><div class='row'><div id='tasktime' class='span8'></div><div id='taskdetails' class='span4'></div></div><div id='jobnumsel' style='height: 70px;'></div><div>job <div class='input-append'><input type='text' value='"+stm.DataStore.completedJobs[widget.jobids[0]].info.name+"' class='span4' id='jobnumselect'><button class='btn' onclick='Retina.WidgetInstances.admin_advancedstatistics[1].updateJob(this.previousSibling.value);'>show</button></div></div><h4>size</h4><div id='one'></div><h4>time</h4><div id='two'></div>";
	target.innerHTML = html;

	var which_job = 0;
	var which_task = 0;
	var avg_time = [];
	var avg_size = [];
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
		    var d = (duration / 60000);
		    var s = (size / 1000000);
		    tasktime.push( { x: d, y: s } );
		    tt2wd[d+""+s] = widget.jobids[i];
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
							    drag_select: Retina.WidgetInstances.admin_advancedstatistics[1].tasktimeSelected,
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
		      headers: widget.authHeader
		    });
    };

    widget.updateTask = function (whichtask) {
	var widget = Retina.WidgetInstances.admin_advancedstatistics[1];

	var tasktime = [];
	var min_time;
	var max_time;
	var min_size;
	var max_size;
	var tt2wd = {};
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
	    tasktime.push( { x: d, y: s } );
	    tt2wd[d+""+s] = widget.jobids[i];
	}
	
	widget.tt2wd = tt2wd;

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