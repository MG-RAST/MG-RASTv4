(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Metagenome Administrator Widget",
            name: "metagenome_admin",
            author: "Tobias Paczian",
            requires: [ "rgbcolor.js" ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table"),
		 Retina.load_renderer("graph") ];
    };

    widget.period = 1000 * 60 * 60 * 24 * 30; // 30 days
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.metagenome_admin[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	if (widget.user) {
	    widget.sidebar.style.width = "600px";
	    widget.sidebar.style.display = "";
	    widget.main.parentNode.style.right = "660px";
	    widget.sidebar.innerHTML = "<div id='details' style='padding-left: 10px; padding-right: 10px;'></div>";

	    // open content spaces
	    var html = '<div class="accordion" id="accordionParent">';

	     // statistics
	    html += '\
  <div class="accordion-group" style="border: none; margin-bottom: 0px;">\
    <div>\
      <a class="accordion-toggle" data-toggle="collapse" data-parent="#accordionParent" href="#collapseTwo" style="color: gray; text-decoration: none;">\
        <h3>Job Statistics for the last 30 days</h3>\
      </a>\
    </div>\
    <div id="collapseTwo" class="collapse in">\
      <div id="statistics" style="margin-top: 2px;"><img src="Retina/images/waiting.gif" style="margin-left: 40%;"></div>\
    </div>\
</div>';

	    // users
	    html += '\
  <div class="accordion-group" style="border: none; margin-bottom: 0px;">\
    <div>\
      <a class="accordion-toggle" data-toggle="collapse" data-parent="#accordionParent" href="#collapseOne" style="color: gray; text-decoration: none;">\
        <h3>Users</h3>\
      </a>\
    </div>\
    <div id="collapseOne" class="collapse">\
      <div id="usertable" style="margin-top: 2px;"></div>\
    </div>\
</div>';

	    // close content spaces
	    html += '</div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    // create the user table
	    var result_columns = [ "login", "firstname", "lastname", "email", "entry_date", "id" ];

	    var result_table_filter = widget.filter;
	    if (result_table_filter == null) {
		result_table_filter = {};
		for (var i=0;i<result_columns.length;i++) {
		    result_table_filter[i] = { "type": "text" };
		}
	    }
	    if (! widget.hasOwnProperty('result_table')) {
		widget.result_table = Retina.Renderer.create("table", {
		    target: document.getElementById('usertable'),
		    rows_per_page: 24,
		    filter_autodetect: false,
		    filter: result_table_filter,
		    sort_autodetect: true,
		    synchronous: false,
		    sort: "lastname",
		    default_sort: "lastname",
		    invisible_columns: { 5: true },
		    data_manipulation: Retina.WidgetInstances.metagenome_admin[1].dataManipulation,
		    minwidths: [150,150,150,80,150,150,85,1],
		    navigation_url: RetinaConfig.mgrast_api+'/user?verbosity=minimal',
		    data: { data: [], header: result_columns }
		});
	    } else {
		widget.result_table.settings.target = document.getElementById('usertable');
	    }
	    widget.result_table.render();
	    widget.result_table.update({},1);

	    // call statistics computation
	    widget.getJobData();
	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    /*
      USERS
     */
    widget.dataManipulation = function (data) {
	for (var i=0; i<data.length; i++) {
	    data[i].email = "<a href='mailto:"+data[i].email+"'>"+data[i].email+"</a>";
	    data[i].login = "<a onclick='Retina.WidgetInstances.metagenome_admin[1].userDetails(\""+data[i].id+"\");' style='cursor: pointer;'>"+data[i].login+"</a>";
	}

	return data;
    };

    widget.userDetails = function (id) {
	var widget = Retina.WidgetInstances.metagenome_admin[1];
	jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/" + id + "?verbosity=full",
		      dataType: "json",
		      success: function(data) {
			  var html = '<h4>'+data.firstname+' '+data.lastname+'</h4>\
<table>\
  <tr><td style="width: 100px;"><b>login</b></td><td>'+data.login+'</td></tr>\
  <tr><td><b>email</b></td><td>'+data.email+'</td></tr>\
  <tr><td><b>entry date</b></td><td>'+data.entry_date+'</td></tr>\
  <tr><td><b>active</b></td><td>'+data.active+'</td></tr>\
  <tr><td><b>id</b></td><td>'+data.id+'</td></tr>\
  <tr><td><b>comment</b></td><td>'+data.comment+'</td></tr>\
</table>\
<h4>Rights</h4>\
<table class="table table-hover">\
<tr><td><b>name</b></td><td><b>type</b></td><td><b>id</b></td><td><b>granted</b></td><td><b>del</b></td></tr>';
			  for (var i=0; i<data.rights.length; i++) {
			      var data_id = data.rights[i].data_id;
			      if (data.rights[i].data_type == 'metagenome') {
				  data_id = '<a href="mgmain.html?mgpage=overview&metagenome='+data_id+'" target=_blank>'+data_id+'</a>';
			      }
			      html += '<tr><td>'+data.rights[i].name+'</td><td>'+data.rights[i].data_type+'</td><td>'+data_id+'</td><td>'+data.rights[i].granted+'</td><td>'+data.rights[i].delegated+'</td></tr>';
			  }
			  html += '</table>\
<h4>Groups</h4>\
<table class="table table-hover">\
<tr><td><b>name</b></td><td><b>description</b></td></tr>';
			  for (var i=0; i<data.scopes.length; i++) {
			      html += '<tr><td>'+data.scopes[i].name+'</td><td>'+data.scopes[i].description+'</td></tr>';
			  }
			  html += '</table>\
<h4>Preferences</h4>\
<table class="table table-hover">\
<tr><td><b>name</b></td><td><b>value</b></td></tr>';
			  for (var i=0; i<data.preferences.length; i++) {
			      html += '<tr><td>'+data.preferences[i].name+'</td><td>'+data.preferences[i].value+'</td></tr>';
			  }
			  html += '</table>';

			  document.getElementById('details').innerHTML = html;
		      },
		      error: function(jqXHR, error) {
			  console.log("error: unable to connect to API server");
			  console.log(error);
		      },
		      headers: widget.authHeader
		    });

    };

    /*
      STATISTICS
     */
    widget.showJobData = function () {
	var widget = Retina.WidgetInstances.metagenome_admin[1];

	// the target div
	var target = document.getElementById('statistics');

	// the job template
	var template = stm.DataStore.jobtemplate;

	// get the names for the task ids and initialize the task counter
	var tasklabels = [];
	var tasknames = {};
	var taskcount = {};
	for (var i=0; i<template.tasks.length; i++) {
	    tasklabels[i] = template.tasks[i].cmd.description;
	    tasknames[i] = template.tasks[i].cmd.description;
	    taskcount[i] = [ 0, 0 ];
	}
	tasknames["-1"] = "done";
	tasklabels.push("done");

	// all jobs submitted within the last 30 days (initially only the inactive ones)
	var jobs30 = stm.DataStore.inactivejobs;

	// jobs currently active in the pipeline
	var jobsactive = stm.DataStore.activejobs;

	// timestamp of 30 days ago
	var month = widget.dateString(widget.period);
	var week = widget.dateString(1000 * 60 * 60 * 24 * 7);
	var day = widget.dateString(1000 * 60 * 60 * 24);

	// initialize state counter
	var states = { "in-progress": 0,
		       "pending": 0,
		       "queued": 0,
		       "suspend": 0,
		       "unknown": 0 };

	var size_in_pipeline = 0;

	// iterate over the active jobs
	for (var i=0; i<jobsactive.length; i++) {

	    // count the total size in the pipeline
	    size_in_pipeline += jobsactive[i].size;

	    // count the current state
	    states[jobsactive[i].state]++;

	    // count the current task (leave out preprocess for now)
	    //if (tasknames[jobsactive[i].task] != "preprocess") {
		if (jobsactive[i].state == "queued") {
		    taskcount[jobsactive[i].task][0]++;
		} else {
		    taskcount[jobsactive[i].task][1]++;
		}
	    //}

	    // get the active jobs for last 30 days
	    if (jobsactive[i].submittime > month) {
		jobs30.push(jobsactive[i]);
	    }
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

	// iterate over all jobs of the last month
	for (var i=0; i<jobs30.length; i++) {
	    var submitted_day = jobs30[i].submittime.substr(0,10);
	    var completed_day = jobs30[i].completedtime.substr(0,10);
	    if (! submitted_jobs.hasOwnProperty(submitted_day)) {
		submitted_jobs[submitted_day] = 0;
		submitted_bases[submitted_day] = 0;
	    }
	    submitted_jobs[submitted_day]++;
	    submitted_bases[submitted_day] += jobs30[i].size;
	    if (! completed_jobs.hasOwnProperty(completed_day)) {
		completed_jobs[completed_day] = 0;
		completed_bases[completed_day] = 0;
	    }
	    completed_jobs[completed_day]++;
	    completed_bases[completed_day] += jobs30[i].size;

	    if (jobs30[i].submittime > month) {
		num_submitted_month++;
		submitted_month += jobs30[i].size;
	    }
	    if (jobs30[i].submittime > week) {
		num_submitted_week++;
		submitted_week += jobs30[i].size;
	    }
	    if (jobs30[i].submittime > day) {
		num_submitted_today++;
		submitted_today += jobs30[i].size;
	    }
	    if (jobs30[i].completedtime > month) {
		num_completed_month++;
		completed_month += jobs30[i].size;
	    }
	    if (jobs30[i].completedtime > week) {
		num_completed_week++;
		completed_week += jobs30[i].size;
	    }
	    if (jobs30[i].completedtime > day) {
		num_completed_today++;
		completed_today += jobs30[i].size;
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

	var html = "<table class='table'>";
	html += "<tr><td><b>data currently in the pipeline</b></td><td>"+size_in_pipeline.baseSize()+" in "+num_in_pipeline+" jobs</td></tr>";
	html += "<tr><td><b>submitted today</b></td><td>"+submitted_today.baseSize()+" in "+num_submitted_today+" jobs</td></tr>";
	html += "<tr><td><b>completed today</b></td><td>"+completed_today.baseSize()+" in "+num_completed_today+" jobs</td></tr>";
	html += "<tr><td><b>submitted this week</b></td><td>"+submitted_week.baseSize()+" (avg. "+submitted_week_per_day.baseSize()+" per day) in "+num_submitted_week+" jobs (avg. "+num_submitted_week_per_day+" per day)</td></tr>";
	html += "<tr><td><b>completed this week</b></td><td>"+completed_week.baseSize()+" (avg. "+completed_week_per_day.baseSize()+" per day) in "+num_completed_week+" jobs (avg. "+num_completed_week_per_day+" per day)</td></tr>";
	html += "<tr><td><b>submitted this month</b></td><td>"+submitted_month.baseSize()+" (avg. "+submitted_month_per_day.baseSize()+" per day) in "+num_submitted_month+" jobs (avg. "+num_submitted_month_per_day+" per day)</td></tr>";
	html += "<tr><td><b>completed this month</b></td><td>"+completed_month.baseSize()+" (avg. "+completed_month_per_day.baseSize()+" per day) in "+num_completed_month+" jobs (avg. "+num_completed_month_per_day+" per day)</td></tr>";

	html += "</table><h4>currently <span style='color: blue;'>running</span> and <span style='color: red;'>pending</span> stages</h4><div id='task_graph'></div><h4>number of <span style='color: blue;'>submitted</span> and <span style='color: red;'>completed</span> jobs</h4><div id='day_graph'></div><h4><span style='color: blue;'>submitted</span> and <span style='color: red;'>completed</span> GB</h4><div id='dayc_graph'></div><h4>current job states</h4><div id='state_graph'></div>";

	target.innerHTML = html;

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
	
	// task graph
	var data = [ { name: "running", data: [] },
		     { name: "pending", data: [] } ];
	for (var i=0; i<template.tasks.length; i++) {
	    data[0].data.push(taskcount[i][0]);
	    data[1].data.push(taskcount[i][1]);
	}
	Retina.Renderer.create("graph", { target: document.getElementById('task_graph'),
					  data: data,
					  x_labels: tasklabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();

	// daygraph
	var days = [];
	var one_day = 1000 * 60 * 60 * 24;
	for (var i=0; i<30; i++) {
	    days.push(widget.dateString((29 - i) * one_day));
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

    widget.dateString = function (period) {
	var past = new Date(new Date().getTime() - period);
	var d = past.getDate();
	d = d < 10 ? "0" + d : d;
	var m = past.getMonth() + 1;
	m = m < 10 ? "0" + m : m;
	var timestamp = past.getFullYear() + "-" + m + "-" + d;
	return timestamp;
    };

    widget.getJobData = function () {
	var widget = Retina.WidgetInstances.metagenome_admin[1];


	var timestamp = widget.dateString(widget.period);
	var promises = [];
	var prom = jQuery.Deferred();
	promises.push(prom);
	promises.push(jQuery.ajax( { dataType: "json",
				     url: RetinaConfig['mgrast_api'] + "/pipeline?date_start="+timestamp+"&verbosity=minimal&limit=10000&state=completed&state=suspend",
				     headers: widget.authHeader,
				     success: function(data) {
					 stm.DataStore.inactivejobs = data.data;
					 jQuery.ajax( { dataType: "json",
					 		url: RetinaConfig['mgrast_api'] + "/pipeline/"+data.data[0].name,
					 		headers: widget.authHeader,
					 		success: function(data) {
					 		    stm.DataStore.jobtemplate = data.data[0];
					 		},
					 		error: function () {
					 		    alert('there was an error retrieving the data');
					 		}
					 	      } ).then(function(){ prom.resolve(); });
				     },
				     error: function () {
					 alert('there was an error retrieving the data');
				     }
				   } ) );
	
	promises.push(jQuery.ajax( { dataType: "json",
				     url: RetinaConfig['mgrast_api'] + "/pipeline?state=in-progress&state=queued&state=pending&verbosity=minimal&limit=10000",
				     headers: widget.authHeader,
				     success: function(data) {
					 stm.DataStore.activejobs = data.data;
				     },
				     error: function () {
					 alert('there was an error retrieving the data');
				     }
				   } ) );
	jQuery.when.apply(this, promises).then(function() { Retina.WidgetInstances.metagenome_admin[1].showJobData(); });
    };


    // login callback
    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.metagenome_admin[1];
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