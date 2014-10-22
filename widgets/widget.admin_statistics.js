(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Administrator Statistics Widget",
            name: "admin_statistics",
            author: "Tobias Paczian",
            requires: [ "rgbcolor.js" ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("graph") ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_statistics[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "span10 offset1";

	if (widget.user) {

            var html = '<h3>Job Statistics</h3><div><div id="gauge_day" style="float: left; margin-left: 100px;"></div><div id="gauge_week" style="float: left; margin-left: 100px;"></div><div id="gauge_month" style="float: left; margin-left: 100px;"></div><div style="clear: both; padding-left: 240px;  margin-bottom: 50px;" id="gauge_title"></div></div><div id="statistics" style="clear: both;"><img src="Retina/images/waiting.gif" style="margin-left: 40%;"></div><h3>User Statistics</h3><div id="userData"><img src="Retina/images/waiting.gif" style="margin-left: 40%; margin-top: 50px;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    widget.getJobData();

	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    /*
      STATISTICS
     */
    widget.showJobData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	// the target div
	var target = document.getElementById('statistics');

	// the job template
	var template = stm.DataStore.jobtemplate[1];

	// get the names for the task ids and initialize the task counter
	var tasklabels = [];
	var tasknames = {};
	var taskcount = {};
	var parallelTasks = {};
	for (var i=0; i<template.tasks.length; i++) {
	    tasklabels[i] = template.tasks[i].cmd.description;
	    tasknames[i] = template.tasks[i].cmd.description;
	    taskcount[i] = [ 0, 0, 0, 0 ];
	    for (var h=0; h<template.tasks[i].dependsOn.length; h++) {
		var dep = template.tasks[i].dependsOn[h];
		var t = dep.substr(dep.lastIndexOf('_') + 1);
		if (! parallelTasks.hasOwnProperty(t)) {
		    parallelTasks[t] = [];
		}
		parallelTasks[t].push(i);
	    }
	}
	tasknames["-1"] = "done";
	tasklabels.push("done");

	// all jobs submitted within the last 30 days (initially only the inactive ones)
	var jobs30 = [];
	var jk = Retina.keys(stm.DataStore.inactivejobs);
	var size_in_pipeline = 0;
	for (var i=0;i<jk.length;i++) {
	    jobs30.push(stm.DataStore.inactivejobs[jk[i]]);
	    if (stm.DataStore.inactivejobs[jk[i]].state == 'suspend') {
		size_in_pipeline += stm.DataStore.inactivejobs[jk[i]].userattr.bp_count ? parseInt(stm.DataStore.inactivejobs[jk[i]].userattr.bp_count) : stm.DataStore.inactivejobs[jk[i]].size;
	    }
	}

	// jobs currently active in the pipeline
	var jobsactive = [];
	jk = Retina.keys(stm.DataStore.activejobs);
	for (var i=0;i<jk.length;i++) {
	    jobsactive.push(stm.DataStore.activejobs[jk[i]]);
	}

	// timestamp of 30 days ago
	var month = widget.dateString(1000 * 60 * 60 * 24 * 30);
	var week = widget.dateString(1000 * 60 * 60 * 24 * 7);
	var day = widget.dateString(1000 * 60 * 60 * 24);
	
	// chicago day
	var chicagoTime = new Date( new Date().getTime() - (1000 * 60 * 60 * 6) ); // UTC-6
	var chicagoDayStart = chicagoTime.getUTCMilliseconds() + (1000 * chicagoTime.getUTCSeconds()) + (1000 * 60 * chicagoTime.getUTCMinutes()) + (1000 * 60 * 60 * chicagoTime.getUTCHours());
	chicagoDayStart =  widget.dateString(chicagoDayStart);

	// initialize state counter
	var states = { "in-progress": 0,
		       "pending": 0,
		       "queued": 0,
		       "suspend": 0,
		       "unknown": 0 };

	// iterate over the active jobs
	for (var i=0; i<jobsactive.length; i++) {

	    // count the total size in the pipeline
	    size_in_pipeline += jobsactive[i].userattr.bp_count ? parseInt(jobsactive[i].userattr.bp_count) : jobsactive[i].size;

	    // count the current state
	    states[jobsactive[i].state]++;

	    // count the current task
	    if (jobsactive[i].state == "in-progress") {
		taskcount[jobsactive[i].task][0]++;
		taskcount[jobsactive[i].task][2] += jobsactive[i].userattr.bp_count ? parseInt(jobsactive[i].userattr.bp_count) : jobsactive[i].size;
	    } else {
		if (! taskcount.hasOwnProperty(jobsactive[i].task)) {
		    taskcount[jobsactive[i].task] = [ 0, 0, 0, 0 ];
		}
		taskcount[jobsactive[i].task][1]++;
		taskcount[jobsactive[i].task][3] += jobsactive[i].userattr.bp_count ? parseInt(jobsactive[i].userattr.bp_count) : jobsactive[i].size;
	    }

	    // get the active jobs for last 30 days
	    if (jobsactive[i].submittime >= month) {
		jobs30.push(jobsactive[i]);
	    }
	}

	// add chicago timestamps
	var chicago = 1000 * 60 * 60 * 6;
	var now = new Date().getTime();
	for (var i=0; i<jobs30.length; i++) {
	    jobs30[i].submitChicago = widget.dateString(now - (Date.parse(jobs30[i].submittime) - chicago));
	    jobs30[i].completeChicago = widget.dateString(now - (Date.parse(jobs30[i].completedtime) - chicago));
	}

	var num_in_pipeline = jobsactive.length;

	// initialize vars
	var submitted_today = 0;
	var num_submitted_today = 0;
	var completed_today = 0;
	var num_completed_today = 0;
	var submitted_week = 0;
	var num_submitted_week = 0;
	var completed_week = 0;
	var num_completed_week = 0;
	var submitted_month = 0;
	var num_submitted_month = 0;
	var completed_month = 0;
	var num_completed_month = 0;

	var completed_jobs = {};
	var submitted_jobs = {};
	var completed_bases = {};
	var submitted_bases = {};
	
	var completed_chicago_day = 0;

	// iterate over all jobs of the last month
	for (var i=0; i<jobs30.length; i++) {
	    var submitted_day = jobs30[i].submitChicago.substr(0,10);
	    var completed_day = jobs30[i].completeChicago.substr(0,10);
	    if (! submitted_jobs.hasOwnProperty(submitted_day)) {
		submitted_jobs[submitted_day] = 0;
		submitted_bases[submitted_day] = 0;
	    }
	    submitted_jobs[submitted_day]++;
	    submitted_bases[submitted_day] += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;
	    if (! completed_jobs.hasOwnProperty(completed_day)) {
		completed_jobs[completed_day] = 0;
		completed_bases[completed_day] = 0;
	    }
	    completed_jobs[completed_day]++;
	    completed_bases[completed_day] += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;

	    if (jobs30[i].submittime >= month) {
		num_submitted_month++;
		submitted_month += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;
	    }
	    if (jobs30[i].submittime >= week) {
		num_submitted_week++;
		submitted_week += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;
	    }
	    if (jobs30[i].submittime >= day) {
		num_submitted_today++;
		submitted_today += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;
	    }
	    if (jobs30[i].completedtime >= month) {
		num_completed_month++;
		completed_month += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;
	    }
	    if (jobs30[i].completedtime >= week) {
		num_completed_week++;
		completed_week += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;
	    }
	    if (jobs30[i].completedtime >= day) {
		num_completed_today++;
		completed_today += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;
	    }
	    if (jobs30[i].completedtime >= chicagoDayStart) {
		completed_chicago_day += jobs30[i].userattr.bp_count ? parseInt(jobs30[i].userattr.bp_count) : jobs30[i].size;
	    }
	}

	var submitted_week_per_day = submitted_week / 7;
	var num_submitted_week_per_day = parseInt(num_submitted_week / 7);
	var completed_week_per_day = completed_week / 7;
	var num_completed_week_per_day = parseInt(num_completed_week / 7);
	var submitted_month_per_day = submitted_month / 30;
	var num_submitted_month_per_day = parseInt(num_submitted_month / 30);
	var completed_month_per_day = completed_month / 30;
	var num_completed_month_per_day = parseInt(num_completed_month / 30);
	
	var html = '<div><b>Data completed today (since 00:00AM Chicago time)</b><div class="progress"><div class="bar" style="width: '+(completed_chicago_day / 2000000000)+'%;"></div></div></div><div style="position: relative; bottom: 40px; color: lightgray; left: 20px;">'+(completed_chicago_day / 1000000000).formatString(3)+' Gbp</div>';
	html += '<table class="table">';
	html += "<tr><td><b>data currently in the pipeline</b></td><td>"+size_in_pipeline.baseSize()+" in "+num_in_pipeline+" jobs</td></tr>";
	html += "<tr><td><b>submitted last 24h</b></td><td>"+submitted_today.baseSize()+" in "+num_submitted_today+" jobs</td></tr>";
	html += "<tr><td><b>completed last 24h</b></td><td>"+completed_today.baseSize()+" in "+num_completed_today+" jobs</td></tr>";
	html += "<tr><td><b>submitted last 7 days</b></td><td>"+submitted_week.baseSize()+" (avg. "+submitted_week_per_day.baseSize()+" per day) in "+num_submitted_week+" jobs (avg. "+num_submitted_week_per_day+" per day)</td></tr>";
	html += "<tr><td><b>completed last 7 days</b></td><td>"+completed_week.baseSize()+" (avg. "+completed_week_per_day.baseSize()+" per day) in "+num_completed_week+" jobs (avg. "+num_completed_week_per_day+" per day)</td></tr>";
	html += "<tr><td><b>submitted last 30 days</b></td><td>"+submitted_month.baseSize()+" (avg. "+submitted_month_per_day.baseSize()+" per day) in "+num_submitted_month+" jobs (avg. "+num_submitted_month_per_day+" per day)</td></tr>";
	html += "<tr><td><b>completed last 30 days</b></td><td>"+completed_month.baseSize()+" (avg. "+completed_month_per_day.baseSize()+" per day) in "+num_completed_month+" jobs (avg. "+num_completed_month_per_day+" per day)</td></tr>";

	html += "</table><h4>currently running stages</h4><div id='task_graph_running'></div><h4>currently pending stages</h4><div id='task_graph_pending'></div><h4>currently running data in stages in GB</h4><div id='task_graph_running_GB'></div><h4>currently pending data in stages in GB</h4><div id='task_graph_pending_GB'></div><h4>number of <span style='color: blue;'>submitted</span> and <span style='color: red;'>completed</span> jobs</h4><div id='day_graph'></div><h4><span style='color: blue;'>submitted</span> and <span style='color: red;'>completed</span> GB</h4><div id='dayc_graph'></div><h4>current job states</h4><div id='state_graph'></div><div>";
	html += "<h4>backlog graph in Gbp</h4><div id='graph_target'></div></div>";

	target.innerHTML = html;

	// backlog graph
	widget.updateGraph();

	// gauges
	var gauges = ['day','week','month'];
	for (var i=0; i<gauges.length; i++) {
	    var val = parseInt(((i == 1) ? completed_week_per_day : (i == 2 ? completed_month_per_day : completed_today)) / 1000000000);
	    var tick =  parseInt(((i == 1) ? submitted_week_per_day : (i == 2 ? submitted_month_per_day : submitted_today)) / 1000000000);
	    var gauge_data = google.visualization.arrayToDataTable([ ['Label', 'Value'], [gauges[i] == 'day' ? "24h" : gauges[i], val] ]);
	    var mt = ["0",20,40,60,80,100,120,140,160,180,200];
	    if (val > 200 || tick > 200) {
		mt = [];
		var v = (val > tick) ? val : tick;
		var t = parseInt(v / 10);
		for (var h=0; h<10; h++) {
		    mt.push((h * t)+"");
		}
		mt.push(v);
	    }
            var gauge_options = {
		width: 325, height: 200,
		redFrom: tick - 2, redTo: tick,
		majorTicks: mt,
		minorTicks: 0,
		min: 0,
		max: val > tick ? (val > 200 ? val : 200) : (tick > 200 ? tick : 200)
            };

            var chart = new google.visualization.Gauge(document.getElementById('gauge_'+gauges[i]));
            chart.draw(gauge_data, gauge_options);
	}
	document.getElementById('gauge_title').innerHTML = "average Gigabasepair throughput per 24h period (red mark shows submission)";

	// state graph
	var sdata = [ { name: "count", data: [] } ];
	var slabels = [];
	for (var i in states) {
	    if (states.hasOwnProperty(i)) {
		sdata[0].data.push(states[i]);
		slabels.push(i+" ("+states[i]+")");
	    }
	}
	Retina.Renderer.create("graph", { target: document.getElementById('state_graph'),
					  x_labels: slabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  data: sdata }).render();
	
	// task graph s
	var tdatar = [ { name: "running", data: [] } ];
	for (var i=0; i<template.tasks.length; i++) {
	    tdatar[0].data.push(taskcount[i][0]);
	}
	Retina.Renderer.create("graph", { target: document.getElementById('task_graph_running'),
					  data: tdatar,
					  x_labels: tasklabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();

	var tdatap = [ { name: "pending", data: [] } ];
	for (var i=0; i<template.tasks.length; i++) {
	    tdatap[0].data.push(taskcount[i][1]);
	}
	Retina.Renderer.create("graph", { target: document.getElementById('task_graph_pending'),
					  data: tdatap,
					  x_labels: tasklabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();


	// task GB graph s
	var tdatars = [ { name: "running", data: [] } ];
	for (var i=0; i<template.tasks.length; i++) {
	    tdatars[0].data.push(parseInt(taskcount[i][2] / 1000000000));
	}
	Retina.Renderer.create("graph", { target: document.getElementById('task_graph_running_GB'),
					  data: tdatars,
					  x_labels: tasklabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();

	var tdataps = [ { name: "running", data: [] } ];
	for (var i=0; i<template.tasks.length; i++) {
	    tdataps[0].data.push(parseInt(taskcount[i][3] / 1000000000));
	}
	Retina.Renderer.create("graph", { target: document.getElementById('task_graph_pending_GB'),
					  data: tdataps,
					  x_labels: tasklabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();


	// daygraph
	var days = [];
	var one_day = 1000 * 60 * 60 * 24;
	for (var i=0; i<30; i++) {
	    days.push(widget.dateString((29 - i) * one_day).substr(0,10));
	}
	var daydata = [ { name: "#submitted", data: [] },
			{ name: "#completed", data: [] } ];
	var daycdata = [ { name: "submitted (GB)", data: [] },
			 { name: "completed (GB)", data: [] } ];
	var avgsizedata = [ { name: "average jobsize submitted", data: [] },
			    { name: "average jobsize completed", data: [] } ];
	for (var i=0; i<days.length; i++) {
	    daydata[0].data.push(submitted_jobs.hasOwnProperty(days[i]) ? submitted_jobs[days[i]] : 0)
	    daydata[1].data.push(completed_jobs.hasOwnProperty(days[i]) ? completed_jobs[days[i]] : 0);
	    daycdata[0].data.push(submitted_bases.hasOwnProperty(days[i]) ? parseInt(submitted_bases[days[i]] / 1000000000) : 0);
	    daycdata[1].data.push(completed_bases.hasOwnProperty(days[i]) ? parseInt(completed_bases[days[i]] / 1000000000) : 0);
	}
	Retina.Renderer.create("graph", { target: document.getElementById('day_graph'),
					  data: daydata,
					  x_labels: days,
					  width: 950,
					  chartArea: [0.05, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-35",
					  type: "column" }).render();
	Retina.Renderer.create("graph", { target: document.getElementById('dayc_graph'),
					  data: daycdata,
					  width: 950,
					  x_labels: days,
					  chartArea: [0.05, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-35",
					  type: "column" }).render();
    };

    widget.updateGraph = function (params) {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	// get all data
	var data = [];
	var inactivejobs = stm.DataStore.inactivejobs;
	var activejobs = stm.DataStore.activejobs;
	for (var i in activejobs) {
	    if (activejobs.hasOwnProperty(i)) {
		data.push(activejobs[i]);
	    }
	}
	for (var i in inactivejobs) {
	    if (inactivejobs.hasOwnProperty(i)) {
		data.push(inactivejobs[i]);
	    }
	}

	// add chicago time
	var chicago = 1000 * 60 * 60 * 6;
	var now = new Date().getTime();
	for (var i=0; i<data.length; i++) {
	    data[i].submitChicago = widget.dateString(now - (Date.parse(data[i].submittime) - chicago));
	    data[i].completeChicago = widget.dateString(now - (Date.parse(data[i].completedtime) - chicago));
	}

	// get initial backlog
	var backlog = 0;
	for (var i=0; i<data.length; i++) {
	    if (data[i].state != "completed") {
		if (data[i].userattr.hasOwnProperty('bp_count')) {
		    backlog += parseInt(data[i].userattr.bp_count) || 0;
		} else if (data[i].hasOwnProperty('size')) {
		    backlog += data[i].size;
		}
	    }
	}

	// get the daydata
	var cdaydata = {};
	var sdaydata = {};
	var daysh = {};
	for (var i=0; i<data.length; i++) {
	    if (data[i].state == 'completed') {
		var cday = data[i].completeChicago.substr(0,10);
		daysh[cday] = 1;
		if (! cdaydata.hasOwnProperty(cday)) {
		    cdaydata[cday] = 0;
		}
		cdaydata[cday] += data[i].userattr.bp_count ? parseInt(data[i].userattr.bp_count) : data[i].size;
	    }
	    var sday = data[i].submitChicago.substr(0,10);
	    daysh[sday] = 1;
	    if (! sdaydata.hasOwnProperty(sday)) {
		sdaydata[sday] = 0;
	    }
	    sdaydata[sday] += data[i].userattr.bp_count ? parseInt(data[i].userattr.bp_count) : data[i].size;
	}
	var days = Retina.keys(daysh).sort().reverse();

	// process data
	var graphData = [];
	var labels = [];
	var backlogs = [];
	var submitteds = [];
	var completeds = [];

	for (var i=0; i<days.length; i++) {
	    var b = String(backlog / 1000000000);
	    backlogs[i] = parseFloat(b.substr(0, b.indexOf('.')+3));
	    completeds[i] = (parseFloat(cdaydata[days[i]] / 1000000000) || 0);
	    submitteds[i] = (parseFloat(sdaydata[days[i]] / 1000000000) || 0);
	    backlog = backlog - (cdaydata[days[i]] || 0) + (sdaydata[days[i]] || 0);
	}
	backlogs = backlogs.reverse();
	submitteds = submitteds.reverse();
	completeds = completeds.reverse();
	labels = days.reverse();

	graphData.push({ name: "backlog", data: backlogs, lineColor: "blue" });
//	graphData.push({ name: "submitted", data: submitteds, lineColor: "red", settings: { noLines: true } });
//	graphData.push({ name: "completed", data: completeds, lineColor: "green", settings: { noLines: true } });

	var w = 200 + (submitteds.length * 20);

	// redraw the graph
	var target = document.getElementById('graph_target');
	target.innerHTML = "";

	Retina.Renderer.create("graph", { target: target,
					  data: graphData,
					  width: w,
					  height: 600,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-35",
					  x_labels: labels,
					  type: "line" }).render();
	
    };

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

    widget.getJobData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];
	
	var timestamp = widget.dateString(1000 * 60 * 60 * 24 * 30);
	if (stm.DataStore.hasOwnProperty('updateTime') && stm.DataStore.updateTime[1]) {
	     timestamp = widget.dateString(new Date().getTime() - stm.DataStore.updateTime[1].update_time);
	}
	var utime = new Date().getTime();
	var promises = [];
	var prom = jQuery.Deferred();
	promises.push(prom);
	promises.push(jQuery.ajax( { dataType: "json",
				     url: RetinaConfig['mgrast_api'] + "/pipeline?date_start="+timestamp+"&verbosity=minimal&limit=10000&state=completed&state=suspend&userattr=bp_count",
				     headers: widget.authHeader,
				     success: function(data) {
					 if (! stm.DataStore.hasOwnProperty('inactivejobs')) {
					     stm.DataStore.inactivejobs = {};
					 }
					 for (var i=0; i<data.data.length; i++) {
					     stm.DataStore.inactivejobs[data.data[i].id] = data.data[i];
					 }
					 if (stm.DataStore.hasOwnProperty('jobtemplate') && stm.DataStore.jobtemplate[1]) {
					     prom.resolve();
					 } else {
					     jQuery.ajax( { dataType: "json",
					 		    url: RetinaConfig['mgrast_api'] + "/pipeline/"+data.data[0].name,
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
				   } ) );
	
	promises.push(jQuery.ajax( { dataType: "json",
				     url: RetinaConfig['mgrast_api'] + "/pipeline?state=in-progress&state=queued&state=pending&verbosity=minimal&limit=10000&userattr=bp_count",
				     headers: widget.authHeader,
				     success: function(data) {
					 stm.DataStore.activejobs = {};
					 for (var i=0; i<data.data.length; i++) {
					     stm.DataStore.activejobs[data.data[i].id] = data.data[i];
					 }
				     },
				     error: function () {
					 alert('there was an error retrieving the data');
				     }
				   } ) );
	jQuery.when.apply(this, promises).then(function() {
	    stm.DataStore.updateTime = { 1: { update_time: new Date().getTime() } };
	    stm.dump(true, 'admin_statistics').then(function() {
		Retina.WidgetInstances.admin_statistics[1].getUserData();
	    });
	    Retina.WidgetInstances.admin_statistics[1].showJobData();
	});
    };

    // USERS
    widget.showUserData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	var target = document.getElementById('userData');

	var labels = Retina.keys(stm.DataStore.userCounts).sort();
	widget.allUserCounts = [];
	for (var i=0; i<labels.length; i++) {
	    widget.allUserCounts.push(labels[i]+"\t"+stm.DataStore.userCounts[labels[i]].count);
	}

	var html = "<p><b>Users Registered this Month:</b> "+ widget.currentUserCount;
	html += "<button class='btn btn-small' style='margin-left: 50px; position: relative; bottom: 3px;' onclick='stm.saveAs(Retina.WidgetInstances.admin_statistics[1].allUserCounts.join(\"\\n\"), \"newUsers.txt\");'><img src='Retina/images/download.png' style='width: 16px;'> download all</button>";
	html += "<h4>New Users per Month</h4><div id='userCountGraph'></div>";
	
	target.innerHTML = html;
	
	var last12 = labels.slice(labels.length - 12);
	var d = [];
	for (var i=0;i<last12.length;i++) {
	    d.push(stm.DataStore.userCounts[last12[i]].count);
	}
	var graphData = [ { name: "new users", data: d, lineColor: "blue" } ];
	Retina.Renderer.create("graph", { target: document.getElementById('userCountGraph'),
					  data: graphData,
					  width: 800,
					  height: 600,
					  chartArea: [50, 0.1, 0.99, 0.7],
					  x_labels_rotation: "-35",
					  x_labels: last12,
					  type: "line" }).render();
    };

    widget.getUserData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	if (! stm.DataStore.hasOwnProperty('userCounts')) {
	    stm.DataStore.userCounts = {};
	}
	var promises = [];
	var year = "2007";
	var month = "07";
	var now_year = new Date().getFullYear();
	var now_month = (new Date().getMonth() + 1).padLeft();
	while (year < now_year || month < now_month) {
	    var d = year+"-"+month;
	    var timestamp = "["+d;
	    month = parseInt(month);
	    month++;
	    if (month > 12) {
		month = "01";
		year = parseInt(year);
		year++;
		year += "";
	    } else {
		month = month.padLeft();
	    }
	    timestamp += ";"+year+"-"+month+"[";
	    if (! stm.DataStore.userCounts.hasOwnProperty(d)) {
		var p = jQuery.Deferred();
		promises.push(p);
		jQuery.ajax( { dataType: "json",
			       url: RetinaConfig['mgrast_api'] + "/user?entry_date="+encodeURIComponent(timestamp)+"&verbosity=minimal&limit=1",
			       promise: p,
			       date: d,
			       headers: widget.authHeader,
			       success: function(data) {
				   stm.DataStore.userCounts[this.date] = { "count": data.total_count };
				   this.promise.resolve();
			       }
			     } );
	    }
	}
	promises.push(jQuery.ajax( { dataType: "json",
				     url: RetinaConfig['mgrast_api'] + "/user?entry_date="+encodeURIComponent("["+now_year+"-"+now_month)+"&verbosity=minimal&limit=1",
				     date: now_year+"-"+now_month,
				     headers: widget.authHeader,
				     success: function(data) {
					 widget.currentUserCount = data.total_count;
				     }
				   } ));
	
	jQuery.when.apply(this, promises).then(function() {
	    widget.showUserData();
	});
    };

    // login callback
    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.admin_statistics[1];
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