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
	return [ Retina.load_renderer('svg2') ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_statistics[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	var pipelines = {};
	for (var i=0; i<RetinaConfig.pipelines.length; i++) {
	    pipelines[RetinaConfig.pipelines[i]] = true;
	}
	widget.params = {
	    "activePipelines": pipelines,
	    "startMonth": 30,
	    "startDay": 30
	};

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "span10 offset1";

	if (stm.user) {

	    var pipeline_selection = '';
	    for (var i=0; i<RetinaConfig.pipelines.length; i++) {
		pipeline_selection += '<input style="margin-top: 0px; margin-left: 10px;" type="checkbox" checked value="'+RetinaConfig.pipelines[i]+'" onchange="Retina.WidgetInstances.admin_statistics[1].params.activePipelines[this.value]=this.checked;Retina.WidgetInstances.admin_statistics[1].showJobData();"> '+RetinaConfig.pipelines[i];
	    }

	    var month_selection = '<span style="margin-left: 20px;"></span> how many months back <input type="text" value="'+widget.params.startMonth+'" style="width: 50px; margin-bottom: 0px;" onchange="Retina.WidgetInstances.admin_statistics[1].params.startMonth=this.value;Retina.WidgetInstances.admin_statistics[1].showJobData();"><span style="margin-left: 20px;"></span> how many days back <input type="text" value="'+widget.params.startDay+'" style="width: 50px; margin-bottom: 0px;" onchange="Retina.WidgetInstances.admin_statistics[1].params.startDay=this.value;Retina.WidgetInstances.admin_statistics[1].showJobData();">';

            var html = '<h3>Job Statistics</h3><div>'+pipeline_selection+month_selection+'</div><div><div id="gauge_day" style="float: left; margin-left: 100px;"></div><div id="gauge_week" style="float: left; margin-left: 100px;"></div><div id="gauge_month" style="float: left; margin-left: 100px;"></div><div style="clear: both; padding-left: 240px;  margin-bottom: 50px;" id="gauge_title"></div></div><div id="statistics" style="clear: both;"><img src="Retina/images/waiting.gif" style="margin-left: 40%;"></div><h3>Monthly Job Submission</h3><div id="longtermgraph"><img src="Retina/images/waiting.gif" style="margin-left: 40%; margin-top: 50px;"></div><h3>User Statistics</h3><div id="userData"><img src="Retina/images/waiting.gif" style="margin-left: 40%; margin-top: 50px;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    Retina.WidgetInstances.admin_statistics[1].getJobData();
	    Retina.WidgetInstances.admin_statistics[1].getUserData();
	    Retina.WidgetInstances.admin_statistics[1].getLongTermJobData();

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

	var params = widget.params;

	// get the names for the task ids and initialize the task counter
	var tasklabels = [];
	var tasknames = {};
	var taskcount = {};
	var template = stm.DataStore.templates[RetinaConfig.pipelines[RetinaConfig.pipelines.length - 1]];
	for (var i=0; i<template.length; i++) {
	    tasklabels[i] = template[i].cmd.description;
	    tasknames[i] = template[i].cmd.description;
	    taskcount[i] = [];
	}
	tasknames["-1"] = "done";
	tasklabels.push("done");

	var cdaydata = {};
	var sdaydata = {};
	var daysh = {};

	// timestamp of 30 days ago
	var month = widget.dateString(1000 * 60 * 60 * 24 * 30);
	var week = widget.dateString(1000 * 60 * 60 * 24 * 7);
	var day = widget.dateString(1000 * 60 * 60 * 24);

	// chicago day
	var chicagoTime = new Date( new Date().getTime() - (1000 * 60 * 60 * 6) ); // UTC-6
	var chicagoDayStart = chicagoTime.getUTCMilliseconds() + (1000 * chicagoTime.getUTCSeconds()) + (1000 * 60 * chicagoTime.getUTCMinutes()) + (1000 * 60 * 60 * chicagoTime.getUTCHours());
	chicagoDayStart =  widget.dateString(chicagoDayStart);
	
	// initialize vars
	var submitted_today = [0];
	var num_submitted_today = [0];
	var completed_today = [0];
	var num_completed_today = [0];
	var submitted_week = [0];
	var num_submitted_week = [0];
	var completed_week = [0];
	var num_completed_week = [0];
	var submitted_month = [0];
	var num_submitted_month = [0];
	var completed_month = [0];
	var num_completed_month = [0];
	var num_in_pipeline = [0];
	var size_in_pipeline = [0];

	var completed_jobs = {};
	var submitted_jobs = {};
	var completed_bases = {};
	var submitted_bases = {};
	
	var completed_chicago_day = [0];
	var inprogress = [];
	
	// initialize state counter
	var states = { "in-progress": [0],
		       "pending": [0],
		       "queued": [0],
		       "suspend": [0] };

	var pipelineIndex = {};
	for (var i=0; i<template.length; i++) {
	    taskcount[i].push( [ 0, 0, 0, 0 ] );
	}
	for (var i=0; i<RetinaConfig.pipelines.length; i++) {
	    pipelineIndex[RetinaConfig.pipelines[i]] = i + 1;
	    submitted_today.push(0);
	    num_submitted_today.push(0);
	    completed_today.push(0);
	    num_completed_today.push(0);
	    submitted_week.push(0);
	    num_submitted_week.push(0);
	    completed_week.push(0);
	    num_completed_week.push(0);
	    submitted_month.push(0);
	    num_submitted_month.push(0);
	    completed_month.push(0);
	    num_completed_month.push(0);
	    num_in_pipeline.push(0);
	    size_in_pipeline.push(0);
	    states['in-progress'].push(0);
	    states.pending.push(0);
	    states.queued.push(0);
	    states.suspend.push(0);
	    for (var h=0; h<template.length; h++) {
		taskcount[h].push( [ 0, 0, 0, 0 ] );
	    }
	}
	
	// all jobs 
	var jk = Retina.keys(stm.DataStore.jobs30);
	for (var i=0;i<jk.length;i++) {

	    var job = stm.DataStore.jobs30[jk[i]];

	    if (! params.activePipelines[job.pipeline]) {
		continue;
	    }
	    
	    // add chicago timestamps
	    var chicago = 1000 * 60 * 60 * 6;
	    var now = new Date().getTime();
	    job.submitChicago = widget.dateString(now - (Date.parse(job.submittime) - chicago));

	    // completed
	    if (job.state[0] == "completed") {
		job.completeChicago = widget.dateString(now - (Date.parse(job.completedtime) - chicago));

		var completed_day = job.completeChicago.substr(0,10);
		if (! completed_jobs.hasOwnProperty(completed_day)) {
		    completed_jobs[completed_day] = [0];
		    completed_bases[completed_day] = [0];
		    for (var h=0; h<RetinaConfig.pipelines.length; h++) {
			completed_jobs[completed_day].push(0);
			completed_bases[completed_day].push(0);
		    }
		}
		completed_jobs[completed_day][pipelineIndex[job.pipeline]]++;
		completed_bases[completed_day][pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
		completed_jobs[completed_day][0]++;
		completed_bases[completed_day][0] += parseInt(job.userattr.bp_count);
		if (job.completedtime >= month) {
		    num_completed_month[0]++;
		    completed_month[0] += parseInt(job.userattr.bp_count);
		    num_completed_month[pipelineIndex[job.pipeline]]++;
		    completed_month[pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
		}
		if (job.completedtime >= week) {
		    num_completed_week[0]++;
		    completed_week[0] += parseInt(job.userattr.bp_count);
		    num_completed_week[pipelineIndex[job.pipeline]]++;
		    completed_week[pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
		}
		if (job.completedtime >= day) {
		    num_completed_today[0]++;
		    completed_today[0] += parseInt(job.userattr.bp_count);
		    num_completed_today[pipelineIndex[job.pipeline]]++;
		    completed_today[pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
		}
		if (job.completedtime >= chicagoDayStart) {
		    completed_chicago_day[0] += parseInt(job.userattr.bp_count);
		    completed_chicago_day[pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
		}
	    }

	    // in progress
	    else {
		num_in_pipeline[0]++;
		size_in_pipeline[0] += parseInt(job.userattr.bp_count);
		num_in_pipeline[pipelineIndex[job.pipeline]]++;
		size_in_pipeline[pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
		inprogress.push(job);
		
		// count the current tasks
		for (var h=0; h<job.state.length; h++) {

		    if (states.hasOwnProperty(job.state[h])) {
			states[job.state[h]][0]++;
			states[job.state[h]][pipelineIndex[job.pipeline]]++;
		    }
		    
		    if (job.state[h] == "in-progress") {
			if (! taskcount.hasOwnProperty(job.task[h])) {
			    taskcount[job.task[h]] = [];
			    for (var j=0; j<RetinaConfig.pipelines.length; j++) {
				taskcount[job.task[h]][j] = [ 0, 0, 0, 0 ];
			    }
			}
			taskcount[job.task[h]][pipelineIndex[job.pipeline]][0]++;
			taskcount[job.task[h]][pipelineIndex[job.pipeline]][2] += parseInt(job.userattr.bp_count);
		    } else {
			if (! taskcount.hasOwnProperty(job.task[h])) {
			    taskcount[job.task[h]] = [];
			    for (var j=0; j<RetinaConfig.pipelines.length; j++) {
				taskcount[job.task[h]][j] = [ 0, 0, 0, 0 ];
			    }
			}
			taskcount[job.task[h]][pipelineIndex[job.pipeline]][1]++;
			taskcount[job.task[h]][pipelineIndex[job.pipeline]][3] += parseInt(job.userattr.bp_count);
		    }
		}
	    }

	    var submitted_day = job.submitChicago.substr(0,10);
	    if (! submitted_jobs.hasOwnProperty(submitted_day)) {
		submitted_jobs[submitted_day] = [0];
		submitted_bases[submitted_day] = [0];
		for (var j=0; j<RetinaConfig.pipelines.length; j++) {
		    submitted_jobs[submitted_day].push(0);
		    submitted_bases[submitted_day].push(0);
		}
	    }
	    submitted_jobs[submitted_day][0]++;
	    submitted_bases[submitted_day][0] += parseInt(job.userattr.bp_count);
	    submitted_jobs[submitted_day][pipelineIndex[job.pipeline]]++;
	    submitted_bases[submitted_day][pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
	    if (job.submittime >= month) {
		num_submitted_month[0]++;
		submitted_month[0] += parseInt(job.userattr.bp_count);
		num_submitted_month[pipelineIndex[job.pipeline]]++;
		submitted_month[pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
	    }
	    if (job.submittime >= week) {
		num_submitted_week[0]++;
		submitted_week[0] += parseInt(job.userattr.bp_count);
		num_submitted_week[pipelineIndex[job.pipeline]]++;
		submitted_week[pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
	    }
	    if (job.submittime >= day) {
		num_submitted_today[0]++;
		submitted_today[0] += parseInt(job.userattr.bp_count);
		num_submitted_today[pipelineIndex[job.pipeline]]++;
		submitted_today[pipelineIndex[job.pipeline]] += parseInt(job.userattr.bp_count);
	    }
	}

	var submitted_week_per_day = [0];
	var num_submitted_week_per_day = [0];
	var completed_week_per_day = [0];
	var num_completed_week_per_day = [0];
	var submitted_month_per_day = [0];
	var num_submitted_month_per_day = [0];
	var completed_month_per_day = [0];
	var num_completed_month_per_day = [0];
	for (var i=0; i<RetinaConfig.pipelines.length; i++) {
	    submitted_week_per_day[0] += submitted_week[i] / 7;
	    num_submitted_week_per_day[0] += parseInt(num_submitted_week[i] / 7);
	    completed_week_per_day[0] += completed_week[i] / 7;
	    num_completed_week_per_day[0] += parseInt(num_completed_week[i] / 7);
	    submitted_month_per_day[0] += submitted_month[i] / 30;
	    num_submitted_month_per_day[0] += parseInt(num_submitted_month[i] / 30);
	    completed_month_per_day[0] += completed_month[i] / 30;
	    num_completed_month_per_day[0] += parseInt(num_completed_month[i] / 30);
	    
	    submitted_week_per_day.push(submitted_week[i] / 7);
	    num_submitted_week_per_day.push(parseInt(num_submitted_week[i] / 7));
	    completed_week_per_day.push(completed_week[i] / 7);
	    num_completed_week_per_day.push(parseInt(num_completed_week[i] / 7));
	    submitted_month_per_day.push(submitted_month[i] / 30);
	    num_submitted_month_per_day.push(parseInt(num_submitted_month[i] / 30));
	    completed_month_per_day.push(completed_month[i] / 30);
	    num_completed_month_per_day.push(parseInt(num_completed_month[i] / 30));
	}
	
	var html = '<div><b>Data completed today (since 00:00AM Chicago time)</b><div class="progress"><div class="bar" style="width: '+(completed_chicago_day[0] / 2000000000)+'%;"></div></div></div><div style="position: relative; bottom: 40px; color: lightgray; left: 20px;">'+(completed_chicago_day[0] / 1000000000).formatString(3)+' Gbp</div>';
	html += '<table class="table">';
	html += "<tr><td><b>data currently in the pipeline</b></td><td>"+parseInt(size_in_pipeline[0]).baseSize()+" in "+num_in_pipeline[0]+" jobs</td></tr>";
	html += "<tr><td><b>submitted last 24h</b></td><td>"+submitted_today[0].baseSize()+" in "+num_submitted_today[0]+" jobs</td></tr>";
	html += "<tr><td><b>completed last 24h</b></td><td>"+completed_today[0].baseSize()+" in "+num_completed_today[0]+" jobs</td></tr>";
	html += "<tr><td><b>submitted last 7 days</b></td><td>"+submitted_week[0].baseSize()+" (avg. "+submitted_week_per_day[0].baseSize()+" per day) in "+num_submitted_week[0]+" jobs (avg. "+num_submitted_week_per_day[0]+" per day)</td></tr>";
	html += "<tr><td><b>completed last 7 days</b></td><td>"+completed_week[0].baseSize()+" (avg. "+completed_week_per_day[0].baseSize()+" per day) in "+num_completed_week[0]+" jobs (avg. "+num_completed_week_per_day[0]+" per day)</td></tr>";
	html += "<tr><td><b>submitted last 30 days</b></td><td>"+submitted_month[0].baseSize()+" (avg. "+submitted_month_per_day[0].baseSize()+" per day) in "+num_submitted_month[0]+" jobs (avg. "+num_submitted_month_per_day[0]+" per day)</td></tr>";
	html += "<tr><td><b>completed last 30 days</b></td><td>"+completed_month[0].baseSize()+" (avg. "+completed_month_per_day[0].baseSize()+" per day) in "+num_completed_month[0]+" jobs (avg. "+num_completed_month_per_day[0]+" per day)</td></tr>";
	html += "</table>";

	// display unfinished jobs
	html += "<h4>ten oldest unfinished jobs</h4>";
	inprogress.sort(Retina.propSort('submittime'));
	html += "<table class='table table-striped table-condensed' style='width: 550px;'><tr><th>ID</th><th>size</th><th>status</th><th>age in days</th><th>current tasks</th></tr>";
	var iMax = 10;
	for (var i=0; i<inprogress.length; i++) {
	    if (i == iMax) {
		break;
	    }
	    var t = new Date();
	    var daysInQueue = parseInt((t.getTime() - Date.parse(inprogress[i].submittime)) / (1000 * 60 * 60 * 24));
	    var ts = [];
	    for (var j=0; j<inprogress[i].task.length; j++) {
		ts.push(template[inprogress[i].task[j]].cmd.description);
	    }
	    html += "<tr><td><a onclick='window.open(\"mgmain.html?mgpage=pipeline&admin=1&job="+inprogress[i].name+"\");' style='cursor: pointer;'>"+inprogress[i].name+"</a></td><td>"+parseInt(inprogress[i].userattr.bp_count).baseSize()+"</td><td>"+inprogress[i].state[0]+"</td><td style='text-align: center;'>"+daysInQueue+"</td><td>"+ts.join(", ")+"</td></tr>";
	}
	html += "</table>";

	html += "<h4>currently running stages</h4><div id='task_graph_running'></div><h4>currently pending stages</h4><div id='task_graph_pending'></div><h4>currently running data in stages in GB</h4><div id='task_graph_running_GB'></div><h4>currently pending data in stages in GB</h4><div id='task_graph_pending_GB'></div><h4>number of submitted and completed jobs</h4><div id='day_graph'></div><h4>submitted and completed GB</h4><div id='dayc_graph'></div><h4>current job states</h4><div id='state_graph'></div><div>";
	html += "<h4>backlog graph in Gbp</h4><div id='graph_target'></div></div>";

	target.innerHTML = html;

	// backlog graph
	var days = Retina.keys(submitted_bases).sort().slice(-1 * params.startDay).reverse();
	var graphData = [];
	var labels = [];
	var backlogs = [];
	var btemp = [];

	for (var i=0; i<RetinaConfig.pipelines.length; i++) {
	    btemp.push(size_in_pipeline[i + 1]);
	}

	for (var i=0; i<params.startDay; i++) {
	    backlogs[i] = [];
	    if (! completed_bases.hasOwnProperty(days[i])) {
		continue;
	    }
	    for (var h=0; h<RetinaConfig.pipelines.length; h++) {
		var b = String(btemp[h] / 1000000000);
		backlogs[i][h] = parseFloat(b.substr(0, b.indexOf('.')+3));
		btemp[h] += completed_bases[days[i]][h + 1] - submitted_bases[days[i]][h + 1];
	    }
	}
	labels = days;
	backlogs = backlogs.reverse();
	days = days.reverse();
	for (var i=0; i<backlogs.length; i++) {
	    graphData.push(backlogs[i]);
	}

	// draw the backlog graph
	document.getElementById('graph_target').innerHTML = "";

	graphData = Retina.transpose(graphData);
	
	var settings1 = jQuery.extend(true, {}, widget.graphs.stackedBar);
	settings1.target = document.getElementById('graph_target');
	settings1.width = 1200;
	settings1.items[4].parameters.width = 15;
	settings1.items[1].parameters.spaceMajor = 25;
	settings1.items[1].parameters.shift = 70;
	settings1.data = { "data": graphData, "rows": RetinaConfig.pipelines, "cols": labels, "itemsX": labels.length, "itemsY": RetinaConfig.pipelines.length, "itemsProd": labels.length * RetinaConfig.pipelines.length };
	Retina.Renderer.create("svg2", settings1).render();

	// gauges
	var gauges = ['day','week','month'];
	for (var i=0; i<gauges.length; i++) {
	    var val = parseInt(((i == 1) ? completed_week_per_day[0] : (i == 2 ? completed_month_per_day[0] : completed_today[0])) / 1000000000);
	    var tick =  parseInt(((i == 1) ? submitted_week_per_day[0] : (i == 2 ? submitted_month_per_day[0] : submitted_today[0])) / 1000000000);
	    var gauge_data = google.visualization.arrayToDataTable([ ['Label', 'Value'], [gauges[i] == 'day' ? "24h" : gauges[i], val] ]);
	    var mt = ["0",50,100,150,200,250,300,350,400];
	    if (val > 400 || tick > 400) {
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
		max: val > tick ? (val > 400 ? val : 400) : (tick > 400 ? tick : 400)
            };

            var chart = new google.visualization.Gauge(document.getElementById('gauge_'+gauges[i]));
            chart.draw(gauge_data, gauge_options);
	}
	document.getElementById('gauge_title').innerHTML = "average Gigabasepair throughput per 24h period (red mark shows submission)";

	// state graph
	var sdata = [];
	var slabels = [];
	for (var i in states) {
	    if (states.hasOwnProperty(i)) {
		var row = [];
		for (var h=1; h<states[i].length; h++) {
		    row.push(states[i][h]);
		}
		sdata.push(row);
		slabels.push(i);
	    }
	}
	sdata = Retina.transpose(sdata);
	var table = [ "<table class='table' style='width: 800px;'>" ];
	table.push('<tr><td></td><th>'+slabels.join('</th><th>')+'</th><tr>');
	for (var i=0; i<sdata.length; i++) {
	    table.push('<tr><th>'+RetinaConfig.pipelines[i]+'</th><td>'+sdata[i].join('</td><td>')+'</td></tr>');
	}
	table.push('</table>');
	document.getElementById('state_graph').innerHTML = table.join('');
	
	// task graph s
	var tdatar = [];
	for (var i=0; i<template.length; i++) {
	    var row = [];
	    for (var h=1; h<taskcount[i].length; h++) {
		row.push(taskcount[i][h][0]);
	    }
	    tdatar.push(row);
	}
	tdatar = Retina.transpose(tdatar);

	var settings3 = jQuery.extend(true, {}, widget.graphs.stackedBar);
	settings3.target = document.getElementById('task_graph_running');
	settings3.width = 1200;
	settings3.data = { "data": tdatar, "rows": RetinaConfig.pipelines, "cols": tasklabels, "itemsX": tasklabels.length, "itemsY": RetinaConfig.pipelines.length, "itemsProd": RetinaConfig.pipelines.length * tasklabels.length };
	Retina.Renderer.create("svg2", settings3).render();
	
	var tdatap = [];
	for (var i=0; i<template.length; i++) {
	    var row = [];
	    for (var h=1; h<taskcount[i].length; h++) {
		row.push(taskcount[i][h][1]);
	    }
	    tdatap.push(row);
	}
	tdatap = Retina.transpose(tdatap);
	
	var settings4 = jQuery.extend(true, {}, widget.graphs.stackedBar);
	settings4.target = document.getElementById('task_graph_pending');
	settings4.width = 1200;
	settings4.data = { "data": tdatap, "rows": RetinaConfig.pipelines, "cols": tasklabels, "itemsX": tasklabels.length, "itemsY": RetinaConfig.pipelines.length, "itemsProd": RetinaConfig.pipelines.length * tasklabels.length };
	Retina.Renderer.create("svg2", settings4).render();

	// task GB graph s
	var tdatars = [];
	for (var i=0; i<template.length; i++) {
	    var row = [];
	    for (var h=1; h<taskcount[i].length; h++) {
		row.push(parseInt(taskcount[i][h][2] / 1000000000));
	    }
	    tdatars.push(row);
	}
	tdatars = Retina.transpose(tdatars);
	
	var settings5 = jQuery.extend(true, {}, widget.graphs.stackedBar);
	settings5.target = document.getElementById('task_graph_running_GB');
	settings5.width = 1200;
	settings5.data = { "data": tdatars, "rows": RetinaConfig.pipelines, "cols": tasklabels, "itemsX": tasklabels.length, "itemsY": RetinaConfig.pipelines.length, "itemsProd": RetinaConfig.pipelines.length * tasklabels.length };
	Retina.Renderer.create("svg2", settings5).render();

	var tdataps = [];
	for (var i=0; i<template.length; i++) {
	    var row = [];
	    for (var h=1; h<taskcount[i].length; h++) {
		row.push(parseInt(taskcount[i][h][3] / 1000000000));
	    }
	    tdataps.push(row);
	}
	tdataps = Retina.transpose(tdataps);

	
	var settings6 = jQuery.extend(true, {}, widget.graphs.stackedBar);
	settings6.target = document.getElementById('task_graph_pending_GB');
	settings6.width = 1200;
	settings6.data = { "data": tdataps, "rows": RetinaConfig.pipelines, "cols": tasklabels, "itemsX": tasklabels.length, "itemsY": RetinaConfig.pipelines.length, "itemsProd": RetinaConfig.pipelines.length * tasklabels.length };
	Retina.Renderer.create("svg2", settings6).render();

	// daygraph
	days = [];
	var one_day = 1000 * 60 * 60 * 24;
	for (var i=0; i<params.startDay; i++) {
	    days.push(widget.dateString((params.startDay - i - 1) * one_day).substr(0,10));
	}
	var daylabels = [];
	for (var i=0; i<days.length; i++) {
	    daylabels.push(days[i] + " submitted");
	    daylabels.push(days[i] + " completed");
	}
	var daydata = [];
	var daycdata = [];
	var rows = jQuery.extend(true, [], RetinaConfig.pipelines);
	for (var i=0; i<RetinaConfig.pipelines.length; i++) {
	    rows[i] += ' submitted';
	    rows.push(RetinaConfig.pipelines[i] + ' completed');
	}
	for (var i=0; i<days.length; i++) {
	    var rowa1 = [];
	    var rowb1 = [];
	    for (var h=0; h<RetinaConfig.pipelines.length; h++) {
		rowa1.push(submitted_jobs.hasOwnProperty(days[i]) ? submitted_jobs[days[i]][h+1] : 0);
		rowb1.push(submitted_bases.hasOwnProperty(days[i]) ? parseInt(submitted_bases[days[i]][h+1] / 1000000000) : 0);
	    }
	    for (var h=0; h<RetinaConfig.pipelines.length; h++) {
		rowa1.push(0);
		rowb1.push(0);
	    }
	    daydata.push(rowa1);
	    daycdata.push(rowb1);
	    var rowa2 = [];
	    var rowb2 = [];
	    for (var h=0; h<RetinaConfig.pipelines.length; h++) {
		rowa2.push(0);
		rowb2.push(0);
	    }
	    for (var h=0; h<RetinaConfig.pipelines.length; h++) {
		rowa2.push(completed_jobs.hasOwnProperty(days[i]) ? completed_jobs[days[i]][h+1] : 0);
		rowb2.push(completed_bases.hasOwnProperty(days[i]) ? parseInt(completed_bases[days[i]][h+1] / 1000000000) : 0);
	    }
	    daydata.push(rowa2);
	    daycdata.push(rowb2);
	}

	daydata = Retina.transpose(daydata);
	daycdata = Retina.transpose(daycdata);

	var settings7 = jQuery.extend(true, {}, widget.graphs.stackedBar);
	settings7.width = 1800;
	settings7.items[4].parameters.width = 15;
	settings7.items[1].parameters.spaceMajor = 25;
	settings7.items[1].parameters.shift = 70;
	settings7.target = document.getElementById('day_graph');
	settings7.data = { "data": daydata, "rows": rows, "cols": daylabels, "itemsX": daylabels.length, "itemsY": RetinaConfig.pipelines.length, "itemsProd": daylabels.length * RetinaConfig.pipelines.length };
	Retina.Renderer.create("svg2", settings7).render();
	
	var settings8 = jQuery.extend(true, {}, widget.graphs.stackedBar);
	settings8.width = 1800;
	settings8.items[4].parameters.width = 15;
	settings8.items[1].parameters.spaceMajor = 25;
	settings8.items[1].parameters.shift = 70;
	settings8.target = document.getElementById('dayc_graph');
	settings8.data = { "data": daycdata, "rows": rows, "cols": daylabels, "itemsX": daylabels.length, "itemsY": RetinaConfig.pipelines.length, "itemsProd": daylabels.length * RetinaConfig.pipelines.length };
	Retina.Renderer.create("svg2", settings8).render();
    };

    // SHORT TERM DATA
    widget.getJobData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	widget.graphs = {};
	stm.DataStore.jobs30 = {};
	stm.DataStore.templates = {};

	var timestamp = widget.dateString(1000 * 60 * 60 * 24 * 30);
	var promises = [];
	var graphs = ['bar','stackedBar'];
	for (var i=0; i<graphs.length; i++) {
	    var prom = jQuery.Deferred();
	    promises.push(prom);
	    jQuery.ajax({ url: 'data/graphs/'+graphs[i]+'.json',
			  contentType: 'application/json',
			  graph: graphs[i],
			  p: prom,
			  complete: function (xhr) {
			      var widget = Retina.WidgetInstances.admin_statistics[1];
			      
			      widget.graphs[this.graph] = JSON.parse(xhr.responseText);
			      this.p.resolve();
			  }
			});
	}
	for (var i=0; i<RetinaConfig.pipelines.length; i++) {
	    var prom = jQuery.Deferred();
	    promises.push(prom);
	    promises.push(jQuery.ajax( { dataType: "json",
					 url: RetinaConfig['mgrast_api'] + "/pipeline?date_start="+timestamp+"&info.pipeline="+RetinaConfig.pipelines[i]+"&verbosity=minimal&state=completed&limit=100000&userattr=bp_count",
					 headers: stm.authHeader,
					 p: prom,
					 pipeline: RetinaConfig.pipelines[i],
					 success: function(data) {
					     for (var h=0; h<data.data.length; h++) {
						 data.data[h].pipeline = this.pipeline;
						 stm.DataStore.jobs30[data.data[h].id] = data.data[h];
					     }
					     if (!data.data.length) {
						 this.p.resolve();
						 return;
					     }
					     jQuery.ajax( { dataType: "json",
					     		    url: RetinaConfig['mgrast_api'] + "/pipeline/"+data.data[0].name,
					     		    headers: stm.authHeader,
							    p: this.p,
							    pipeline: this.pipeline,
					     		    success: function(data) {
					     			stm.DataStore.templates[this.pipeline] = data.data[0].tasks;
								this.p.resolve();
					     		    },
					     		    error: function (xhr) {
					     			Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
					     		    }
					     		  } );
					 },
					 error: function (xhr) {
					     Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
					 }
				       } ) );
	    promises.push(jQuery.ajax( { dataType: "json",
					 url: RetinaConfig['mgrast_api'] + "/pipeline?info.pipeline="+RetinaConfig.pipelines[i]+"&verbosity=minimal&active&limit=100000&userattr=bp_count",
					 headers: stm.authHeader,
					 p: prom,
					 pipeline: RetinaConfig.pipelines[i],
					 success: function(data) {
					     for (var h=0; h<data.length; h++) {
						 data[h].pipeline = this.pipeline;
						 stm.DataStore.jobs30[data[h].id] = data[h];
					     }
					 },
					 error: function (xhr) {
					     Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
					 }
				       } ) );
	}

	jQuery.when.apply(this, promises).then(function() {
	    Retina.WidgetInstances.admin_statistics[1].showJobData();
	});
    };

    // LONG TERM DATA
    widget.getLongTermJobData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	stm.DataStore.longTermJobData = {};

	jQuery.ajax( { url: RetinaConfig['mgrast_api'] + "/server/jobcount",
		       success: function(data) {
			   for (var i=0; i<data.length; i++) {
			       stm.DataStore.longTermJobData[data[i][1]] = { id: data[i][1], num: data[i][0], bp: data[i][2], min: data[i][3], max: data[i][4], avg: data[i][5] };
			   }
			   Retina.WidgetInstances.admin_statistics[1].showLongTermJobData();
		       },
		       error: function (xhr) {
			   Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
			   alert('there was an error retrieving the long term job data');
		       }
		     } );
    };

    widget.showLongTermJobData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	var d = stm.DataStore.longTermJobData;
	var months = Retina.keys(d).sort();
	var longdata = [];
	var sumbp = 0;
	for (var i=months.length-widget.params.startMonth; i<months.length; i++) {
	    var item = d[months[i]];
	    longdata.push([ parseFloat(item.bp) / 1000000000, parseFloat(item.avg) / 1000000 ]);
	}
	months = months.slice(months.length - widget.params.startMonth);
	
	var settings = jQuery.extend(true, {}, widget.graphs.bar);
	settings.target = document.getElementById('longtermgraph');
	settings.items[4].parameters.width = 10;
	settings.width = 1200;
	settings.data = { "data": longdata, "rows": months, "cols": ["data submitted (Gbp)","average jobsize (Mbp)"], "itemsX": months.length, "itemsY": 2, "itemsProd": months.length * 2 };
	Retina.Renderer.create("svg2", settings).render();
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
	
	var last12 = labels.slice(labels.length - widget.params.startMonth);
	var d = [];
	for (var i=0;i<last12.length;i++) {
	    d.push([stm.DataStore.userCounts[last12[i]].count]);
	}

	var settings = jQuery.extend(true, {}, widget.graphs.bar);
	settings.target = document.getElementById('userCountGraph');
	settings.width = 1200;
	settings.items[4].parameters.width = 20;
	settings.data = { "data": d, "rows": last12, "cols": ["new users"], "itemsX": last12.length, "itemsY": 1, "itemsProd": last12.length };
	Retina.Renderer.create("svg2", settings).render();
    };

    widget.getUserData = function () {
	var widget = Retina.WidgetInstances.admin_statistics[1];

	if (! stm.DataStore.hasOwnProperty('userCounts')) {
	    stm.DataStore.userCounts = {};
	}
	
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig['mgrast_api'] + "/server/usercount",
		       headers: stm.authHeader,
		       success: function(data) {
			   for (var i=0; i<data.length; i++) {
			       if (i + 1 < data.length) {
				   stm.DataStore.userCounts[data[i][1]] = { "count": data[i][0] };
			       } else {
				   Retina.WidgetInstances.admin_statistics[1].currentUserCount = data[i][0];
			       }
			   }
			   Retina.WidgetInstances.admin_statistics[1].showUserData();
		       },
		       error: function (xhr) {
			   Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		       } 
		     });
    };

    // HELPER FUNCTIONS
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
