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
      <div id="statistics" style="margin-top: 2px;"></div>\
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
	    var result_columns = [ "login", "firstname", "lastname", "email", "entry_date" ];

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
		    invisible_columns: {},
		    data_manipulation: Retina.WidgetInstances.metagenome_admin[1].dataManipulation,
		    minwidths: [150,150,150,80,150,150,85],
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
	    taskcount[i] = 0;
	}
	tasknames["-1"] = "done";
	tasklabels.push("done");

	// all jobs
	var jobs = stm.DataStore.jobdata;

	// initialize counters
	var submitted = 0;
	var numsubmitted = 0;
	var completed = 0;
	var numcompleted = 0;
	var tot = 0;
	var totsize = 0;

	var dnum = {};
	var dnumc = {};
	var dsize = {};
	var dsizec = {};

	var states = { "completed": 0,
		       "in-progress": 0,
		       "pending": 0,
		       "queued": 0,
		       "suspend": 0,
		       "unknown": 0 };

	// iterate over the jobs
	for (var i=0; i<jobs.length; i++) {

	    // do not look at deleted jobs
	    if (jobs[i].state == "deleted") {
		continue;
	    }

	    // count the current task (leave out preprocess for now)
	    if (tasknames[jobs[i].task] != "preprocess") {
		taskcount[jobs[i].task]++;
	    }

	    // count the current state
	    states[jobs[i].state]++;

	    // count the total number of jobs
	    tot++;
	    
	    // count the total size
	    totsize += jobs[i].size;

	    // get the submittime date
	    var day = jobs[i].submittime.substr(0,10);
	    if (! dnum.hasOwnProperty(day)) {
		dnum[day] = 0;
		dsize[day] = 0;
	    }
	    dnum[day]++;
	    dsize[day] += jobs[i].size;

	    // get the completedtime date
	    if (jobs[i].completedtime == "0001-01-01T00:00:00Z") {
		numsubmitted++;
		submitted += jobs[i].size;
	    } else {
		var cday = jobs[i].completedtime.substr(0,10);
		if (! dnumc.hasOwnProperty(cday)) {
		    dnumc[cday] = 0;
		    dsizec[cday] = 0;
		}
		dnumc[cday]++;
		dsizec[cday] += jobs[i].size;
		numcompleted++;
		completed += jobs[i].size;
	    }
	}

	var html = "<table class='table'>";
	html += "<tr><td><b># submitted</b></td><td>"+tot+"</td></tr>";
	html += "<tr><td><b># in queue</b></td><td>"+numsubmitted+"</td></tr>";
	html += "<tr><td><b># completed</b></td><td>"+numcompleted+"</td></tr>";
	html += "<tr><td><b>submitted</b></td><td>"+totsize.byteSize()+"</td></tr>";
	html += "<tr><td><b>in queue</b></td><td>"+submitted.byteSize()+"</td></tr>";
	html += "<tr><td><b>completed</b></td><td>"+completed.byteSize()+"</td></tr>";

	html += "</table><h4>currently running stages</h4><div id='task_graph'></div><h4># of submitted and completed jobs</h4><div id='day_graph'></div><h4>submitted and completed GB</h4><div id='dayc_graph'></div><h4>current job states</h4><div id='state_graph'></div>";

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
	var data = [ { name: "count", data: [] } ];
	for (var i=0; i<template.tasks.length; i++) {
	    data[0].data.push(taskcount[i]);
	}
	data[0].data.push(taskcount["-1"]);
	Retina.Renderer.create("graph", { target: document.getElementById('task_graph'),
					  data: data,
					  x_labels: tasklabels,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();

	// daygraph
	var days = Retina.keys(dnum);
	for (var i in dnumc) {
	    if (dnumc.hasOwnProperty(i)) {
		if (! dnum.hasOwnProperty(i)) {
		    dnum[i] = 0;
		    dsize[i] = 0;
		    days.push(i);
		}
	    }
	}
	for (var i in dnum) {
	    if (dnum.hasOwnProperty(i)) {
		if (! dnumc.hasOwnProperty(i)) {
		    dnumc[i] = 0;
		    dsizec[i] = 0;
		}
	    }
	}
	days = days.sort();
	var daydata = [ { name: "#submitted", data: [] },
			{ name: "#completed", data: [] } ];
	var daycdata = [ { name: "submitted (GB)", data: [] },
			 { name: "completed (GB)", data: [] } ];
	for (var i=0; i<days.length; i++) {
	    daydata[0].data.push(parseInt(dnum[days[i]] / 1000000000));
	    daydata[1].data.push(parseInt(dnumc[days[i]] / 1000000000));
	    daycdata[0].data.push(parseInt(dsize[days[i]] / 1000000000));
	    daycdata[1].data.push(parseInt(dsizec[days[i]] / 1000000000));
	}
	Retina.Renderer.create("graph", { target: document.getElementById('day_graph'),
					  data: daydata,
					  x_labels: days,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
					  type: "column" }).render();
	Retina.Renderer.create("graph", { target: document.getElementById('dayc_graph'),
					  data: daycdata,
					  x_labels: days,
					  chartArea: [0.1, 0.1, 0.95, 0.7],
					  x_labels_rotation: "-25",
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

	var period = 1000 * 60 * 60 * 24 * 30; // 30 days
	var timestamp = widget.dateString(period);
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig['awe_url']+"/job?query&date_start="+timestamp+"&verbosity=minimal&limit=10000",
		       headers: widget.aweAuthHeader,
		       success: function(data) {
			   stm.DataStore.jobdata = data.data;
			   jQuery.ajax( { dataType: "json",
					  url: RetinaConfig['awe_url']+"/job/"+data.data[0].id,
					  headers: widget.aweAuthHeader,
					  success: function(data) {
					      stm.DataStore.jobtemplate = data.data;
					      var widget = Retina.WidgetInstances.metagenome_admin[1];
					      widget.showJobData();
					  },
					  error: function () {
					      alert('there was an error retrieving the data');
					  }
					} );
		       },
		       error: function () {
			   alert('there was an error retrieving the data');
		       }
		     } );
    };

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

    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.metagenome_admin[1];
	if (data.user) {
	    widget.user = data.user;
	    widget.authHeader = { "Auth": data.token };
	    widget.aweAuthHeader = { "Authorization": "OAuth "+data.token,
				     "Datatoken": "OAuth "+data.token };
	} else {
	    widget.user = null;
	    widget.authHeader = {};
	    widget.aweAuthHeader = {};
	}
	widget.display();
    };

})();