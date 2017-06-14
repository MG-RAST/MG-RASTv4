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

	    var month_selection = '<span style="margin-left: 20px;"></span> how many months back <input type="text" value="30" style="width: 50px; margin-bottom: 0px;" onchange="Retina.WidgetInstances.admin_statistics[1].params.startMonth=this.value;Retina.WidgetInstances.admin_statistics[1].showJobData();"><span style="margin-left: 20px;"></span> how many days back <input type="text" value="30" style="width: 50px; margin-bottom: 0px;" onchange="Retina.WidgetInstances.admin_statistics[1].params.startDay=this.value;Retina.WidgetInstances.admin_statistics[1].showJobData();">';

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
	    taskcount[i] = [ 0, 0, 0, 0 ];
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
	var inprogress = [];
	
	// initialize state counter
	var states = { "in-progress": 0,
		       "pending": 0,
		       "queued": 0,
		       "suspend": 0,
		       "unknown": 0 };

	var num_in_pipeline = 0;
	var size_in_pipeline = 0;

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
		    completed_jobs[completed_day] = 0;
		    completed_bases[completed_day] = 0;
		}
		completed_jobs[completed_day]++;
		completed_bases[completed_day] += job.size;
		if (job.completedtime >= month) {
		    num_completed_month++;
		    completed_month += job.size;
		}
		if (job.completedtime >= week) {
		    num_completed_week++;
		    completed_week += job.size;
		}
		if (job.completedtime >= day) {
		    num_completed_today++;
		    completed_today += job.size;
		}
		if (job.completedtime >= chicagoDayStart) {
		    completed_chicago_day += job.size;
		}
	    }

	    // in progress
	    else {
		num_in_pipeline++;
		size_in_pipeline += job.size;
		inprogress.push(job);
		
		// count the current tasks
		for (var h=0; h<job.state.length; h++) {

		    if (states.hasOwnProperty(job.state[h])) {
			states[job.state[h]]++;
		    } else {
			states.unknown ++;
		    }

		    
		    if (job.state[h] == "in-progress") {
			if (! taskcount.hasOwnProperty(job.task[h])) {
			    taskcount[job.task[h]] = [ 0, 0, 0, 0 ];
			}
			taskcount[job.task[h]][0]++;
			taskcount[job.task[h]][2] += job.size;
		    } else {
			if (! taskcount.hasOwnProperty(job.task[h])) {
			    taskcount[job.task[h]] = [ 0, 0, 0, 0 ];
			}
			taskcount[job.task[h]][1]++;
			taskcount[job.task[h]][3] += job.size;
		    }
		}
	    }

	    var submitted_day = job.submitChicago.substr(0,10);
	    if (! submitted_jobs.hasOwnProperty(submitted_day)) {
		submitted_jobs[submitted_day] = 0;
		submitted_bases[submitted_day] = 0;
	    }
	    submitted_jobs[submitted_day]++;
	    submitted_bases[submitted_day] += job.size;
	    if (job.submittime >= month) {
		num_submitted_month++;
		submitted_month += job.size;
	    }
	    if (job.submittime >= week) {
		num_submitted_week++;
		submitted_week += job.size;
	    }
	    if (job.submittime >= day) {
		num_submitted_today++;
		submitted_today += job.size;
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
	    html += "<tr><td><a onclick='window.open(\"mgmain.html?mgpage=pipeline&admin=1&job="+inprogress[i].name+"\");' style='cursor: pointer;'>"+inprogress[i].name+"</a></td><td>"+(inprogress[i].userattr.bp_count ? parseInt(inprogress[i].userattr.bp_count).baseSize() : inprogress[i].size.baseSize())+"</td><td>"+inprogress[i].state[0]+"</td><td style='text-align: center;'>"+daysInQueue+"</td><td>"+ts.join(", ")+"</td></tr>";
	}
	html += "</table>";

	html += "<h4>currently running stages</h4><div id='task_graph_running'></div><h4>currently pending stages</h4><div id='task_graph_pending'></div><h4>currently running data in stages in GB</h4><div id='task_graph_running_GB'></div><h4>currently pending data in stages in GB</h4><div id='task_graph_pending_GB'></div><h4>number of <span style='color: blue;'>submitted</span> and <span style='color: red;'>completed</span> jobs</h4><div id='day_graph'></div><h4><span style='color: blue;'>submitted</span> and <span style='color: red;'>completed</span> GB</h4><div id='dayc_graph'></div><h4>current job states</h4><div id='state_graph'></div><div>";
	html += "<h4>backlog graph in Gbp</h4><div id='graph_target'></div></div>";

	target.innerHTML = html;

	// backlog graph
	var days = Retina.keys(submitted_bases).sort().slice(-1 * params.startDay).reverse();
	var graphData = [];
	var labels = [];
	var backlogs = [];
	var btemp = size_in_pipeline;
	for (var i=0; i<params.startDay; i++) {
	    var b = String(btemp / 1000000000);
	    backlogs[i] = parseFloat(b.substr(0, b.indexOf('.')+3));
	    btemp += submitted_bases[days[i]] - completed_bases[days[i]];
	}
	labels = days;
	backlogs = backlogs.reverse();
	days = days.reverse();
	for (var i=0; i<backlogs.length; i++) {
	    graphData.push([ backlogs[i] ]);
	}

	// draw the backlog graph
	document.getElementById('graph_target').innerHTML = "";

	var settings1 = jQuery.extend(true, {}, widget.graphs.bar);
	settings1.target = document.getElementById('graph_target');
	settings1.width = 1200;
	settings1.items[4].parameters.width = 20;
	settings1.data = { "data": graphData, "rows": labels, "cols": ["backlog"], "itemsX": labels.length, "itemsY": 1, "itemsProd": labels.length };
	Retina.Renderer.create("svg2", settings1).render();

	// gauges
	var gauges = ['day','week','month'];
	for (var i=0; i<gauges.length; i++) {
	    var val = parseInt(((i == 1) ? completed_week_per_day : (i == 2 ? completed_month_per_day : completed_today)) / 1000000000);
	    var tick =  parseInt(((i == 1) ? submitted_week_per_day : (i == 2 ? submitted_month_per_day : submitted_today)) / 1000000000);
	    var gauge_data = google.visualization.arrayToDataTable([ ['Label', 'Value'], [gauges[i] == 'day' ? "24h" : gauges[i], val] ]);
	    var mt = ["0",75,150,225,300,375,450,525,600];
	    if (val > 600 || tick > 600) {
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
		max: val > tick ? (val > 600 ? val : 600) : (tick > 600 ? tick : 600)
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
		sdata.push([ states[i] ]);
		slabels.push(i);
	    }
	}
	var settings2 = jQuery.extend(true, {}, widget.graphs.bar);
	settings2.items[4].parameters.width = 20;
	settings2.target = document.getElementById('state_graph');
	settings2.data = { "data": sdata, "rows": slabels, "cols": ["currently running stages"], "itemsX": sdata[0].length, "itemsY": sdata.length, "itemsProd": sdata[0].length * sdata.length };
	Retina.Renderer.create("svg2", settings2).render();
	
	// task graph s
	var tdatar = [];
	for (var i=0; i<template.length; i++) {
	    tdatar.push([ taskcount[i][0] ]);
	}
	var settings3 = jQuery.extend(true, {}, widget.graphs.bar);
	settings3.target = document.getElementById('task_graph_running');
	settings3.items[4].parameters.width = 20;
	settings3.data = { "data": tdatar, "rows": tasklabels, "cols": ["running"], "itemsX": tdatar[0].length, "itemsY": tdatar.length+1, "itemsProd": tdatar[0].length * (tdatar.length+1) };
	Retina.Renderer.create("svg2", settings3).render();
	
	var tdatap = [];
	for (var i=0; i<template.length; i++) {
	    tdatap.push([taskcount[i][1]]);
	}
	var settings4 = jQuery.extend(true, {}, widget.graphs.bar);
	settings4.target = document.getElementById('task_graph_pending');
	settings4.items[4].parameters.width = 20;
	settings4.data = { "data": tdatap, "rows": tasklabels, "cols": ["pending"], "itemsX": tdatap[0].length, "itemsY": tdatap.length+1, "itemsProd": tdatap[0].length * (tdatap.length+1) };
	Retina.Renderer.create("svg2", settings4).render();

	// task GB graph s
	var tdatars = [];
	for (var i=0; i<template.length; i++) {
	    tdatars.push([parseInt(taskcount[i][2] / 1000000000)]);
	}
	var settings5 = jQuery.extend(true, {}, widget.graphs.bar);
	settings5.target = document.getElementById('task_graph_running_GB');
	settings5.items[4].parameters.width = 20;
	settings5.data = { "data": tdatars, "rows": tasklabels, "cols": ["running"], "itemsX": tdatars[0].length, "itemsY": tdatars.length+1, "itemsProd": tdatars[0].length * (tdatars.length+1) };
	Retina.Renderer.create("svg2", settings5).render();

	var tdataps = [];
	for (var i=0; i<template.length; i++) {
	    tdataps.push([parseInt(taskcount[i][3] / 1000000000)]);
	}
	var settings6 = jQuery.extend(true, {}, widget.graphs.bar);
	settings6.items[4].parameters.width = 20;
	settings6.target = document.getElementById('task_graph_pending_GB');
	settings6.data = { "data": tdataps, "rows": tasklabels, "cols": ["pending"], "itemsX": tdataps[0].length, "itemsY": tdataps.length+1, "itemsProd": tdataps[0].length * (tdataps.length+1) };
	Retina.Renderer.create("svg2", settings6).render();

	// daygraph
	days = [];
	var one_day = 1000 * 60 * 60 * 24;
	for (var i=0; i<params.startDay; i++) {
	    days.push(widget.dateString((params.startDay - i - 1) * one_day).substr(0,10));
	}
	var daydata = [];
	var daycdata = [];
	for (var i=0; i<days.length; i++) {
	    daydata.push([ submitted_jobs.hasOwnProperty(days[i]) ? submitted_jobs[days[i]] : 0, completed_jobs.hasOwnProperty(days[i]) ? completed_jobs[days[i]] : 0 ] );
	    daycdata.push([ submitted_bases.hasOwnProperty(days[i]) ? parseInt(submitted_bases[days[i]] / 1000000000) : 0, completed_bases.hasOwnProperty(days[i]) ? parseInt(completed_bases[days[i]] / 1000000000) : 0 ]);
	}

	var settings7 = jQuery.extend(true, {}, widget.graphs.bar);
	settings7.items[4].parameters.width = 10;
	settings7.width = 1200;
	settings7.target = document.getElementById('day_graph');
	settings7.data = { "data": daydata, "rows": days, "cols": ["# submitted","# completed"], "itemsX": 2, "itemsY": daydata.length, "itemsProd": 2 * daydata.length };
	Retina.Renderer.create("svg2", settings7).render();
	
	var settings8 = jQuery.extend(true, {}, widget.graphs.bar);
	settings8.items[4].parameters.width = 10;
	settings8.width = 1200;
	settings8.target = document.getElementById('dayc_graph');
	settings8.data = { "data": daydata, "rows": days, "cols": ["submitted GB","completed GB"], "itemsX": 2, "itemsY": daycdata.length, "itemsProd": 2 * daycdata.length };
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
	var graphs = ['bar'];
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
					 url: RetinaConfig['mgrast_api'] + "/pipeline?info.pipeline="+RetinaConfig.pipelines[i]+"&verbosity=minimal&state=suspend&state=in-progress&state=queued&limit=100000&userattr=bp_count",
					 headers: stm.authHeader,
					 p: prom,
					 pipeline: RetinaConfig.pipelines[i],
					 success: function(data) {
					     for (var h=0; h<data.data.length; h++) {
						 data.data[h].pipeline = this.pipeline;
						 stm.DataStore.jobs30[data.data[h].id] = data.data[h];
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
