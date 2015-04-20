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

	if (stm.user) {

            var html = '<h3>Job Statistics</h3><button class="btn btn-mini" style="float: right;" onclick="indexedDB.deleteDatabase(\'admin_statistics\').onsuccess=function(){stm.init({});Retina.WidgetInstances.admin_statistics[1].display();}">clear cache</button><div><div id="gauge_day" style="float: left; margin-left: 100px;"></div><div id="gauge_week" style="float: left; margin-left: 100px;"></div><div id="gauge_month" style="float: left; margin-left: 100px;"></div><div style="clear: both; padding-left: 240px;  margin-bottom: 50px;" id="gauge_title"></div></div><div id="statistics" style="clear: both;"><img src="Retina/images/waiting.gif" style="margin-left: 40%;"></div><h4>Monthly Job Submission</h4><div id="longtermgraph"><img src="Retina/images/waiting.gif" style="margin-left: 40%; margin-top: 50px;"></div><h3>User Statistics</h3><div id="userData"><img src="Retina/images/waiting.gif" style="margin-left: 40%; margin-top: 50px;"></div><div class="input-append"><input type="text" value="1000" id="maxcount"><button onclick="Retina.WidgetInstances.admin_statistics[1].showTheWorld(document.getElementById(\'maxcount\').value);" class="btn btn-success">show me the world!</button></div><div id="myWorld" style="width: 1000px; height: 700px;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    if (! stm.DataStore.hasOwnProperty('jobtemplate') && ! navigator.userAgent.match(/iPhone/i) && ! navigator.userAgent.match(/Android/i)) {
	    	stm.init({useDB: true, dbName: 'admin_statistics'}).then(function() {
	    	    Retina.WidgetInstances.admin_statistics[1].getJobData();
	    	});
	    } else {
	    	Retina.WidgetInstances.admin_statistics[1].getJobData();
	    }
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
	for (var i=0; i<template.tasks.length; i++) {
	    tasklabels[i] = template.tasks[i].cmd.description;
	    tasknames[i] = template.tasks[i].cmd.description;
	    taskcount[i] = [ 0, 0, 0, 0 ];
	}
	tasknames["-1"] = "done";
	tasklabels.push("done");

	var num_in_pipeline = 0;

	// store all unfinished jobs
	var unfinishedJobs = [];

	// all jobs submitted within the last 30 days (initially only the inactive ones)
	var jobs30 = [];
	var jk = Retina.keys(stm.DataStore.inactivejobs);
	var size_in_pipeline = 0;
	for (var i=0;i<jk.length;i++) {
	    jobs30.push(stm.DataStore.inactivejobs[jk[i]]);
	    if (stm.DataStore.inactivejobs[jk[i]].state[0] == 'suspend') {
		unfinishedJobs.push(stm.DataStore.inactivejobs[jk[i]]);
		num_in_pipeline++;
		var j = stm.DataStore.inactivejobs[jk[i]];
		if (j.task) {
		    for (var h=0; h<j.task.length; h++) {
			if (! taskcount.hasOwnProperty(j.task[h])) {
			    taskcount[j.task[h]] = [ 0, 0, 0, 0 ];
			}
			taskcount[j.task[h]][1]++;
			taskcount[j.task[h]][3] += j.userattr.bp_count ? parseInt(j.userattr.bp_count) : j.size;
		    }
		    size_in_pipeline += j.userattr.bp_count ? parseInt(j.userattr.bp_count) : j.size;
		} else {
		    console.log("WARNING: the following job has no tasks");
		    console.log(j);
		}
	    }
	}

	// jobs currently active in the pipeline
	var jobsactive = [];
	jk = Retina.keys(stm.DataStore.activejobs);
	for (var i=0;i<jk.length;i++) {
	    jobsactive.push(stm.DataStore.activejobs[jk[i]]);
	    if (stm.DataStore.activejobs[jk[i]].state) {
		if (stm.DataStore.activejobs[jk[i]].state[0] != 'completed') {
		    unfinishedJobs.push(stm.DataStore.activejobs[jk[i]]);
		}
	    } else {
		console.log("WARNING: job with invalid state");
		console.log(stm.DataStore.activejobs[jk[i]]);
	    }
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
	    if (! jobsactive[i].state) {
		continue;
	    }
	    for (var h=0; h<jobsactive[i].state.length; h++) {
		states[jobsactive[i].state[h]]++;
	    }

	    for (var h=0; h<jobsactive[i].state.length; h++) {

		// count the current task
		if (jobsactive[i].state[h] == "in-progress") {
		    taskcount[jobsactive[i].task[h]][0]++;
		    taskcount[jobsactive[i].task[h]][2] += jobsactive[i].userattr.bp_count ? parseInt(jobsactive[i].userattr.bp_count) : jobsactive[i].size;
		} else {
		    if (! taskcount.hasOwnProperty(jobsactive[i].task[h])) {
			taskcount[jobsactive[i].task[h]] = [ 0, 0, 0, 0 ];
		    }
		    taskcount[jobsactive[i].task[h]][1]++;
		    taskcount[jobsactive[i].task[h]][3] += jobsactive[i].userattr.bp_count ? parseInt(jobsactive[i].userattr.bp_count) : jobsactive[i].size;
		}
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

	num_in_pipeline += jobsactive.length;

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
	html += "</table>";

	// display unfinished jobs
	html += "<h4>ten oldest unfinished jobs</h4>";
	unfinishedJobs.sort(Retina.propSort('submittime'));
	html += "<table class='table table-striped table-condensed' style='width: 350px;'><tr><th>ID</th><th>size</th><th>status</th><th>age in days</th></tr>";
	var iMax = 10;
	for (var i=0; i<unfinishedJobs.length; i++) {
	    if (i == iMax) {
		break;
	    }
	    var t = new Date();
	    var daysInQueue = parseInt((t.getTime() - Date.parse(unfinishedJobs[i].submittime)) / (1000 * 60 * 60 * 24));
	    html += "<tr><td><a onclick='window.open(\"mgmain.html?mgpage=pipeline&admin=1&job="+unfinishedJobs[i].name+"\");' style='cursor: pointer;'>"+unfinishedJobs[i].name+"</a></td><td>"+(unfinishedJobs[i].userattr.bp_count ? parseInt(unfinishedJobs[i].userattr.bp_count).baseSize() : unfinishedJobs[i].size.baseSize())+"</td><td>"+unfinishedJobs[i].state[0]+"</td><td style='text-align: center;'>"+daysInQueue+"</td></tr>";
	}
	html += "</table>";

	html += "<h4>currently running stages</h4><div id='task_graph_running'></div><h4>currently pending stages</h4><div id='task_graph_pending'></div><h4>currently running data in stages in GB</h4><div id='task_graph_running_GB'></div><h4>currently pending data in stages in GB</h4><div id='task_graph_pending_GB'></div><h4>number of <span style='color: blue;'>submitted</span> and <span style='color: red;'>completed</span> jobs</h4><div id='day_graph'></div><h4><span style='color: blue;'>submitted</span> and <span style='color: red;'>completed</span> GB</h4><div id='dayc_graph'></div><h4>current job states</h4><div id='state_graph'></div><div>";
	html += "<h4>backlog graph for the last 30 days in Gbp</h4><div id='graph_target'></div></div>";

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

	var tdataps = [ { name: "pending", data: [] } ];
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
	    if (! data[i].state) {
		continue;
	    }
	    if (data[i].state[0] != "completed") {
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
	    if (! data[i].state) {
		continue;
	    }
	    if (data[i].state[0] == 'completed') {
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
	var days = Retina.keys(daysh).sort().slice(-30).reverse();

	// process data
	var graphData = [];
	var labels = [];
	var backlogs = [];
	for (var i=0; i<30; i++) {
	    var b = String(backlog / 1000000000);
	    backlogs[i] = parseFloat(b.substr(0, b.indexOf('.')+3));
	    backlog = backlog + (cdaydata[days[i]] || 0) - (sdaydata[days[i]] || 0);
	}
	labels = days;
	backlogs = backlogs.reverse();
	days = days.reverse();

	graphData.push({ name: "backlog", data: backlogs, lineColor: "blue" });

	// redraw the graph
	var target = document.getElementById('graph_target');
	target.innerHTML = "";

	Retina.Renderer.create("graph", { target: target,
					  data: graphData,
					  width: 800,
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
				     url: RetinaConfig['mgrast_api'] + "/pipeline?date_start="+timestamp+"&verbosity=minimal&limit=100000&state=completed&userattr=bp_count",
				     headers: stm.authHeader,
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
					 		    headers: stm.authHeader,
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
				     url: RetinaConfig['mgrast_api'] + "/pipeline?verbosity=minimal&limit=100000&state=suspend&userattr=bp_count",
				     headers: stm.authHeader,
				     success: function(data) {
					 if (! stm.DataStore.hasOwnProperty('inactivejobs')) {
					     stm.DataStore.inactivejobs = {};
					 }
					 for (var i=0; i<data.data.length; i++) {
					     stm.DataStore.inactivejobs[data.data[i].id] = data.data[i];
					 }
				     },
				     error: function () {
					 alert('there was an error retrieving the data');
				     }
				   } ) );
	
	promises.push(jQuery.ajax( { dataType: "json",
				     url: RetinaConfig['mgrast_api'] + "/pipeline?state=in-progress&state=queued&state=pending&verbosity=minimal&limit=100000&userattr=bp_count",
				     headers: stm.authHeader,
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
		Retina.WidgetInstances.admin_statistics[1].getLongTermJobData();
	    });
	    Retina.WidgetInstances.admin_statistics[1].showJobData();
	});
    };

    widget.getLongTermJobData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	var year = "2014";
	var month = "09";
	var now_year = new Date().getFullYear();
	var now_month = (new Date().getMonth() + 1).padLeft();
	var promises = [];
	while (year < now_year || month < now_month) {
	    var tstart = year+"-"+month+"-01T00:00:00.000Z";
	    var d = year+"-"+month;
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
	    var tend = year+"-"+month+"-01T00:00:00.000Z";
	    if (! stm.DataStore.hasOwnProperty('longTermJobData')) {
		stm.DataStore.longTermJobData = {};
	    }
	    if (! stm.DataStore.longTermJobData.hasOwnProperty(d)) {
		var p = jQuery.Deferred();
		promises.push(p);
		jQuery.ajax( { dataType: "json",
			       promise: p,
			       date: d,
			       url: RetinaConfig['mgrast_api'] + "/pipeline?date_start="+tstart+"&date_end="+tend+"&verbosity=minimal&limit=10000&state=completed&userattr=bp_count",
			       headers: stm.authHeader,
			       success: function(data) {
				   var bps = 0;
				   var min = data.data[0].userattr.bp_count ? parseInt(data.data[0].userattr.bp_count) : data.data[0].size;
				   var max = data.data[0].userattr.bp_count ? parseInt(data.data[0].userattr.bp_count) : data.data[0].size;
				   for (var i=0; i<data.data.length; i++) {
				       var s = data.data[i].userattr.bp_count ? parseInt(data.data[i].userattr.bp_count) : data.data[i].size;
				       max = s > max ? s : max;
				       min = s < min ? s : min;
				       bps += s;
				   }
				   stm.DataStore.longTermJobData[this.date] = { id: this.date, num: data.data.length, bp: bps, min: min, max: max };
				   this.promise.resolve();
			       },
			       error: function () {
				   alert('there was an error retrieving the long term job data for '+this.date);
				   this.promise.resolve();
			       }
			     } );
	    }
	}
	if (promises.length) {
	    jQuery.when.apply(this, promises).then(function() {
		stm.updateHardStorage('admin_statistics', { longTermJobData: true }).then(function() {
		    Retina.WidgetInstances.admin_statistics[1].showLongTermJobData();
		});
	    });
	} else {
	    Retina.WidgetInstances.admin_statistics[1].showLongTermJobData();
	}
    };

    widget.showLongTermJobData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	var d = jQuery.extend(true, stm.DataStore.longTermJobData, widget.legacyJobData);
	var months = Retina.keys(d).sort();
	var longdata = [ { name: "data submitted (Gbp)", data: [] },
			 //{ name: "accumulated data (Tbp)", data: [], settings: { isY2: true, seriesType: "line", stroke: "red", strokeWidth: 3, fill: "none" } },
			 { name: "average jobsize (Mbp)", data: [], settings: { isY2: true, seriesType: "line", stroke: "red", strokeWidth: 3, fill: "none" } },
		       ];
	var sumbp = 0;
	for (var i=0; i<months.length; i++) {
	    var item = d[months[i]];
	    longdata[0].data.push(parseFloat(((item.legacy ? (item.bp * 1000000000) : item.bp) / 1000000000).formatString(3, null, "")));
	    longdata[1].data.push(parseFloat(((item.legacy ? (item.bp * 1000000000) : item.bp) / 1000000 / item.num).formatString(3, null, "")));
	    //sumbp += item.legacy ? (item.bp * 1000000000) : item.bp;
	    //longdata[1].data.push(parseFloat((sumbp / 1000000000000).formatString(3, null, "")));
	}

	Retina.Renderer.create("graph", { target: document.getElementById('longtermgraph'),
					  data: longdata,
					  hasY2: true,
					  y_title: "submitted data (Gbp)",
					  y2_title: "average jobsize (Mbp)",
					  x_labels: months,
					  width: 950,
					  chartArea: [100, 0.1, 850, 0.7],
					  x_labels_rotation: "-35",
					  type: "column" }).render();
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
			       headers: stm.authHeader,
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
				     headers: stm.authHeader,
				     success: function(data) {
					 Retina.WidgetInstances.admin_statistics[1].currentUserCount = data.total_count;
				     }
				   } ));
	
	jQuery.when.apply(this, promises).then(function() {
	    if (promises.length > 1) {
		stm.updateHardStorage('admin_statistics', { userCounts: true }).then(function() {
		    Retina.WidgetInstances.admin_statistics[1].showUserData();
		});
	    } else {
		Retina.WidgetInstances.admin_statistics[1].showUserData();
	    }
	});
    };

    widget.showTheWorld = function (maxCount) {
	var widget = Retina.WidgetInstances.admin_statistics[1];
	maxCount = parseInt(maxCount);
	
	jQuery.getJSON("data/gmap.json").then( function(data) {
	    var mgdata = data;
	    window.map = new google.maps.Map(document.getElementById('myWorld'), {
		center: { lat: 40, lng: 5},
		zoom: 2
	    });
	    var count = 0;
	    for (var id in mgdata) {
		var mg = mgdata[id];
		mg.latitude = parseFloat(mg.latitude);
		mg.longitude = parseFloat(mg.longitude);
		var mgOptions = {
		    strokeColor: '#FF0000',
		    strokeOpacity: 0.2,
		    strokeWeight: 1,
		    fillColor: '#FF0000',
		    fillOpacity: 0.2,
		    map: map,
		    center: new google.maps.LatLng(mg.latitude, mg.longitude),
		    radius: 100000
		};
		count++;
		// Add the circle for this city to the map.
		cityCircle = new google.maps.Circle(mgOptions);
		if (count > maxCount) {
		    break;
		}
	    }

	    var heatmapData = [];
	    for (var id in mgdata) {
		var mg = mgdata[id];
		mg.latitude = parseFloat(mg.latitude);
		mg.longitude = parseFloat(mg.longitude);
		heatmapData.push(new google.maps.LatLng(mg.latitude, mg.longitude));
		count++;
		if (count > maxCount) {
		    break;
		}
	    }
	    var heatmap = new google.maps.visualization.HeatmapLayer({
	    	data: heatmapData,
		dissipating: false
	    });
	});
    };

    /*
      Legacy Job Data
     */
    widget.legacyJobData = {
	// "2007-04": { "num": 10, "bp": 0.09, "legacy": true },
	// "2007-05": { "num": 7, "bp": 0.16, "legacy": true },
	// "2007-06": { "num": 2, "bp": 0.12, "legacy": true },
	// "2007-07": { "num": 45, "bp": 1.21, "legacy": true },
	// "2007-08": { "num": 27, "bp": 0.39, "legacy": true },
	// "2007-09": { "num": 23, "bp": 0.39, "legacy": true },
	// "2007-10": { "num": 25, "bp": 0.40, "legacy": true },
	// "2007-11": { "num": 36, "bp": 0.90, "legacy": true },
	// "2007-12": { "num": 82, "bp": 0.88, "legacy": true },
	// "2008-01": { "num": 111, "bp": 0.50, "legacy": true },
	// "2008-02": { "num": 58, "bp": 1.39, "legacy": true },
	// "2008-03": { "num": 57, "bp": 1.17, "legacy": true },
	// "2008-04": { "num": 84, "bp": 0.99, "legacy": true },
	// "2008-05": { "num": 110, "bp": 2.77, "legacy": true },
	// "2008-06": { "num": 141, "bp": 1.92, "legacy": true },
	// "2008-07": { "num": 87, "bp": 3.67, "legacy": true },
	// "2008-08": { "num": 49, "bp": 1.88, "legacy": true },
	// "2008-09": { "num": 105, "bp": 3.51, "legacy": true },
	// "2008-10": { "num": 239, "bp": 14.26, "legacy": true },
	// "2008-11": { "num": 149, "bp": 2.74, "legacy": true },
	// "2008-12": { "num": 229, "bp": 3.22, "legacy": true },
	// "2009-01": { "num": 179, "bp": 3.90, "legacy": true },
	// "2009-02": { "num": 195, "bp": 3.97, "legacy": true },
	// "2009-03": { "num": 316, "bp": 4.83, "legacy": true },
	// "2009-04": { "num": 154, "bp": 8.64, "legacy": true },
	// "2009-05": { "num": 210, "bp": 5.44, "legacy": true },
	// "2009-06": { "num": 314, "bp": 12.43, "legacy": true },
	// "2009-07": { "num": 245, "bp": 5.35, "legacy": true },
	// "2009-08": { "num": 186, "bp": 6.38, "legacy": true },
	// "2009-09": { "num": 165, "bp": 8.41, "legacy": true },
	// "2009-10": { "num": 162, "bp": 6.36, "legacy": true },
	// "2009-11": { "num": 238, "bp": 8.75, "legacy": true },
	// "2009-12": { "num": 183, "bp": 7.05, "legacy": true },
	// "2010-01": { "num": 256, "bp": 13.67, "legacy": true },
	// "2010-02": { "num": 196, "bp": 31.35, "legacy": true },
	// "2010-03": { "num": 531, "bp": 20.13, "legacy": true },
	// "2010-04": { "num": 485, "bp": 31.39, "legacy": true },
	// "2010-05": { "num": 622, "bp": 33.11, "legacy": true },
	// "2010-06": { "num": 539, "bp": 30.50, "legacy": true },
	// "2010-07": { "num": 595, "bp": 31.70, "legacy": true },
	// "2010-08": { "num": 436, "bp": 25.65, "legacy": true },
	// "2010-09": { "num": 421, "bp": 23.68, "legacy": true },
	// "2010-10": { "num": 529, "bp": 44.45, "legacy": true },
	// "2010-11": { "num": 759, "bp": 15.98, "legacy": true },
	// "2010-12": { "num": 516, "bp": 36.08, "legacy": true },
	// "2011-01": { "num": 506, "bp": 29.35, "legacy": true },
	// "2011-02": { "num": 727, "bp": 33.68, "legacy": true },
	// "2011-03": { "num": 149, "bp": 30.18, "legacy": true },
	// "2011-04": { "num": 159, "bp": 73.15, "legacy": true },
	// "2011-05": { "num": 9868, "bp": 501.33, "legacy": true },
	// "2011-06": { "num": 1867, "bp": 720.18, "legacy": true },
	// "2011-07": { "num": 2083, "bp": 221.71, "legacy": true },
	// "2011-08": { "num": 2101, "bp": 472.44, "legacy": true },
	// "2011-09": { "num": 3104, "bp": 4732.48, "legacy": true },
	// "2011-10": { "num": 1394, "bp": 592.07, "legacy": true },
	// "2011-11": { "num": 1692, "bp": 111.78, "legacy": true },
	// "2011-12": { "num": 1660, "bp": 1260.73, "legacy": true },
	"2012-01": { "num": 1922, "bp": 896.64, "legacy": true },
	"2012-02": { "num": 3550, "bp": 1081.32, "legacy": true },
	"2012-03": { "num": 2602, "bp": 695.20, "legacy": true },
	"2012-04": { "num": 2487, "bp": 650.16, "legacy": true },
	"2012-05": { "num": 3305, "bp": 1193.34, "legacy": true },
	"2012-06": { "num": 1445, "bp": 446.47, "legacy": true },
	"2012-07": { "num": 3080, "bp": 791.64, "legacy": true },
	"2012-08": { "num": 2446, "bp": 476.42, "legacy": true },
	"2012-09": { "num": 2720, "bp": 1260.94, "legacy": true },
	"2012-10": { "num": 3357, "bp": 951.35, "legacy": true },
	"2012-11": { "num": 2593, "bp": 786.49, "legacy": true },
	"2012-12": { "num": 1759, "bp": 1077.42, "legacy": true },
	"2013-01": { "num": 2895, "bp": 953.34, "legacy": true },
	"2013-02": { "num": 3135, "bp": 1700.24, "legacy": true },
	"2013-03": { "num": 2573, "bp": 1984.73, "legacy": true },
	"2013-04": { "num": 2550, "bp": 1695.53, "legacy": true },
	"2013-05": { "num": 2409, "bp": 1241.64, "legacy": true },
	"2013-06": { "num": 3248, "bp": 876.77, "legacy": true },
	"2013-07": { "num": 2527, "bp": 2100.13, "legacy": true },
	"2013-08": { "num": 3832, "bp": 1491.26, "legacy": true },
	"2013-09": { "num": 2922, "bp": 2302.40, "legacy": true },
	"2013-10": { "num": 4377, "bp": 3188.31, "legacy": true },
	"2013-11": { "num": 3438, "bp": 1472.80, "legacy": true },
	"2013-12": { "num": 3362, "bp": 1776.19, "legacy": true },
	"2014-01": { "num": 2859, "bp": 1705.05, "legacy": true },
	"2014-02": { "num": 3049, "bp": 1327.80, "legacy": true },
	"2014-03": { "num": 4280, "bp": 1663.67, "legacy": true },
	"2014-04": { "num": 4010, "bp": 2244.64, "legacy": true },
	"2014-05": { "num": 4009, "bp": 1799.97, "legacy": true },
	"2014-06": { "num": 3753, "bp": 1953.90, "legacy": true },
	"2014-07": { "num": 4271, "bp": 2301.45, "legacy": true },
	"2014-08": { "num": 4357, "bp": 1380.57, "legacy": true },
    };

})();