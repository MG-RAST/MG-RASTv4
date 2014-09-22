(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Pipeline Widget",
                name: "metagenome_pipeline",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.authHeader = {};
    widget.aweAuthHeader = {};
    widget.user = null;

    widget.display = function (wparams) {
        widget = Retina.WidgetInstances.metagenome_pipeline[1];

	if (! stm.DataStore.hasOwnProperty('metagenome')) {
	    stm.DataStore.metagenome = {};
	}
	
	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;
	
	// set the output area
	sidebar.parentNode.className = "span5 sidebar";
	document.getElementById('sidebarResizer').style.display = "none";
	content.className = "span5 offset1";

	// check if we have a user
	if (widget.user) {
	    content.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div>';

	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		headers: widget.aweAuthHeader, 
		url: RetinaConfig.awe_url+'/job?query&info.user='+widget.user.id+'&recent=200',
		success: function (data) {
		    Retina.WidgetInstances.metagenome_pipeline[1].showJobs(data);
		}}).fail(function(xhr, error) {

		});
	}
	// there is no user, show login required
	else {
	    content.innerHTML = '<h3>Login required</h3><p>You need to log in at the top right of the screen to view this page.</p><p>If you do not yet have an account, you can <button class="btn" style="margin-top: -5px;">register here</button></p>';
	}
    };

    /*
      MAIN CONTENT
     */
    widget.showJobs = function (data) {
	widget = Retina.WidgetInstances.metagenome_pipeline[1];
	
	// get the html dom target
	var content = widget.main;

	// get the data
	data = data.data;

	// store the data in the DataStore
	if (! stm.DataStore.hasOwnProperty('job')) {
	    stm.DataStore.job = {};
	}
	for (var i=0; i<data.length; i++) {
	    stm.DataStore.job[data[i].id] = data[i];
	}

	// css
	var html = "<style>\
.miniicon {\
height: 16px;\
margin-right: 5px;\
}\
.red {\
color: red;\
}\
.blue {\
color: blue;\
}\
.green {\
color: #008000;\
}\
.orange {\
color: orange;\
}\
.gray {\
color: gray;\
}\
.pill {\
border-radius: 4px;\
color: #FFFFFF;\
height: 26px;\
margin-bottom: 2px;\
padding-left: 10px;\
padding-right: 10px;\
padding-top: 5px;\
}\
.donepill {\
background-image: linear-gradient(to bottom, #62C462, #51A351);\
}\
.runningpill {\
background-image: linear-gradient(to bottom, #0088CC, #0044CC);\
}\
.errorpill {\
background-image: linear-gradient(to bottom, #EE5F5B, #BD362F);\
}\
.queuedpill {\
background-image: linear-gradient(to bottom, #FBB450, #F89406);\
}\
.pendingpill {\
background-image: linear-gradient(to bottom, #BBBBBB, #666666);\
}\
</style>";

	// start table
	html += "<table class='table table-hover'>";

	// header row
	html += "<tr><th>job</th><th>stage</th><th>status</th><th></th></tr>";

	// iterate over data rows
	for (var i=0; i<data.length; i++) {
	    if (data[i].state == "deleted") {
		continue;
	    }
	    var stage = "complete";
	    if (data[i].remaintasks > 0) {
		stage = data[i].tasks[data[i].tasks.length - data[i].remaintasks].cmd.description;
	    }
	    html += "<tr style='cursor: pointer;' onclick='Retina.WidgetInstances.metagenome_pipeline[1].showJobDetails(\""+data[i].id+"\");'><td>"+data[i].info.name+"</td><td>"+stage+"</td><td>"+widget.status(data[i].state)+"</td><td>"+widget.dots(data[i].tasks)+"</td></tr>";
	}
	html += "</table>";

	content.innerHTML = html;
    };
    
    /*
      SIDEBAR CONTENT
     */
    widget.showJobDetails = function (id) {
	widget = Retina.WidgetInstances.metagenome_pipeline[1];

	widget.sidebar.innerHTML = "<img src='Retina/images/waiting.gif' style='margin-left: 40%; margin-top: 50px; margin-bottom: 50px;'>";
	
	// get the job data from the DataStore
	var job = stm.DataStore.job[id];
	var jobid = id;

	// get the metagenome data if available
	var metagenome;
	if (job.remaintasks == 0) {
	    if (stm.DataStore.metagenome.hasOwnProperty(job.info.userattr.id)) {
		metagenome = stm.DataStore.metagenome[job.info.userattr.id];
	    } else {
		jQuery.ajax({
		    method: "GET",
		    dataType: "json",
		    headers: widget.authHeader, 
		    url: RetinaConfig.mgrast_api+'/metagenome/'+job.info.userattr.id,
		    success: function (data) {
			stm.DataStore.metagenome[data.id] = data;
			Retina.WidgetInstances.metagenome_pipeline[1].showJobDetails(jobid);
		    }}).fail(function(xhr, error) {
			Retina.WidgetInstances.metagenome_pipeline[1].sidebar.innerHTML = "<div class='alert alert-error'>could not retrieve detail data</div>";
		    });
		return;
	    }
	}

	// create the html
	var html = '\
<h3 style="margin-left: 10px;">'+job.info.userattr.name+' ('+job.info.name+')</h3>\
<ul class="nav nav-tabs" style="position: relative; left: -1px;">\
  <li class="active">\
    <a href="#status" data-toggle="tab">Status</a>\
  </li>\
  <li>\
    <a href="#stage" data-toggle="tab" id="pheader">Pipeline</a>\
  </li>\
  <li>\
    <a href="#settings" data-toggle="tab" id="sheader">Settings</a>\
  </li>\
</ul>\
<div class="tab-content">\
  <div id="status" class="tab-pane fade active in">'+widget.statusDetails(job)+'</div>\
  <div id="stage" class="tab-pane fade">'+widget.stagePills(job)+'</div>\
  <div id="settings" class="tab-pane fade">'+widget.jobSettings(job)+'</div>\
</div>';

	widget.sidebar.innerHTML = html;
    };
    
    widget.jobSettings = function (job) {
	var widget = Retina.WidgetInstances.metagenome_pipeline[1];

	var html = "- fix stage availability before job completion -";

	if (stm.DataStore.metagenome.hasOwnProperty(job.info.userattr.id)) {
	    var settings = stm.DataStore.metagenome[job.info.userattr.id].pipeline_parameters;
	    html = "<table class='table table-condensed'>";
	    var s = Retina.keys(settings).sort();
	    for (var i=0; i<s.length; i++) {
		html += "<tr><td><b>"+s[i]+"</b></td><td>"+settings[s[i]]+"</td></tr>";
	    }
	    html += "</table>";
	}

	return html;
    };

    widget.statusDetails = function (job) {
	var widget = Retina.WidgetInstances.metagenome_pipeline[1];

	var average_wait_time = "10 days";

	var html = "<p>The job <b>"+job.info.userattr.name+" ("+job.info.name+")</b> was submitted as part of the project <b>"+job.info.project+"</b> at <b>"+widget.prettyAWEdate(job.info.submittime)+"</b>.</p>";

	html += "<p>The current status is <b>"+job.state+"</b>, ";
	if (job.state == "error") {
	    html += "<p>The error message is:</p>";
	    html += "<p>"+job.notes+"</p>";
	} else {
	    if (job.remaintasks > 0) {
		if (job.remaintasks < 25) {
		    html += job.remaintasks + " out of " + job.tasks.length + " tasks still need to run before it is complete. You can look at the details of the completed tasks in the <a href='#' onclick='document.getElementById(\"pheader\").click();'>Pipeline</a> tab.";
		} else {
		    html += "no task has started computation yet.";
		}
	    } else {
		// time from submission to completion
		var time_passed = widget.timePassed(Date.parse(job.info.submittime), Date.parse(job.info.completedtime));
		html += "the computation is finished. It took <b>"+time_passed+"</b> from job submission until completion.";
		html += "<p>The result data is available for download on the <a href='?mgpage=download&metagenome="+job.info.userattr.id+"' target=_blank>download page</a>. You can take a look at the overview analysis data on the <a href='?mgpage=overview&metagenome="+job.info.userattr.id+"' target=_blank>metagenome overview page</a>.</p>";
		
	    }
	    html += "</p>";
	    
	    if (job.remaintasks > 0) {
		// time since submission
		var time_passed = widget.timePassed(Date.parse(job.info.submittime), new Date().getTime());
		var jsize = 0;
		for (var i in job.tasks[0].inputs) {
		    if (job.tasks[0].inputs.hasOwnProperty(i)) {
			jsize = job.tasks[0].inputs[i].size.byteSize();
			break;
		    }
		}
		
		html += "<p>The job has been in the pipeline for <b>"+time_passed+"</b>. The input file of this job has a size of <b>"+jsize+"</b> and is running with a priority of <b>"+job.info.priority+"</b>. The average wait time for these parameters is currently <b>"+average_wait_time+"</b>.</p>";
		
		html += "<p>You can increase the priority of your job by altering the <a href='#' onclick='document.getElementById(\"sheader\").click();'>Settings</a>.</p>";
	    }
	}

	return html;
    };

    widget.stagePills = function (job) {
	var widget = Retina.WidgetInstances.metagenome_pipeline[1];

	var html = "<h4>this job has no tasks</h4>";
	if (job.tasks.length > 0) {
	    html = "";
	    for (var i=0; i<job.tasks.length; i++) {
		if (job.tasks[i].state == 'completed') {
		    html += '\
<div class="pill donepill clickable" onclick="if(document.getElementById(\'stageDetails'+i+'\').style.display==\'none\'){document.getElementById(\'stageDetails'+i+'\').style.display=\'\';}else{document.getElementById(\'stageDetails'+i+'\').style.display=\'none\';};">\
  <img class="miniicon" src="Retina/images/ok.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">'+widget.prettyAWEdate(job.tasks[i].completeddate)+'</span>\
</div><div style="display: none;" id="stageDetails'+i+'">'+widget.stageDetails(job.id, i)+'</div>';
		} else if (job.tasks[i].state == 'in-progress') {
		    html += '\
<div class="pill runningpill">\
  <img class="miniicon" src="Retina/images/settings3.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">'+widget.prettyAWEdate(job.tasks[i].starteddate)+'</span>\
</div>';
		} else if (job.tasks[i].state == 'queued') {
		    html += '\
<div class="pill queuedpill">\
  <img class="miniicon" src="Retina/images/clock.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">(in queue)</span>\
</div>';
		} else if (job.tasks[i].state == 'error') {
		    html += '\
<div class="pill errorpill">\
  <img class="miniicon" src="Retina/images/remove.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">'+widget.prettyAWEdate(job.tasks[i].createddate)+'</span>\
</div>';
		} else if (job.tasks[i].state == 'pending') {
		    html += '\
<div class="pill pendingpill">\
  <img class="miniicon" src="Retina/images/clock.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">(not started)</span>\
</div>';
		} else if (job.tasks[i].state == 'suspend') {
		    html += '\
<div class="pill errorpill">\
  <img class="miniicon" src="Retina/images/remove.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">'+widget.prettyAWEdate(job.tasks[i].createddate)+'</span>\
</div>';
		} else {
		    console.log('unhandled state: '+job.tasks[i].state);
		}
	    }
	}

	return html;
    };

    widget.stageDetails = function (jid, stage) {
	var widget = Retina.WidgetInstances.metagenome_pipeline[1];

	var task = stm.DataStore.job[jid].tasks[stage];

	var inputs = [];
	for (var i in task.inputs) {
	    if (task.inputs.hasOwnProperty(i)) {
		inputs.push("<a href='#' onclick='Retina.WidgetInstances.metagenome_pipeline[1].authenticatedDownload(\""+task.inputs[i].url+"_url&filename="+i+"\");'>"+i+"</a>");
	    }
	}
	inputs = inputs.join('<br>');
	var outputs = [];
	for (var i in task.outputs) {
	    if (task.outputs.hasOwnProperty(i)) {
		outputs.push("<a href='#' onclick='Retina.WidgetInstances.metagenome_pipeline[1].authenticatedDownload(\""+task.outputs[i].url+"_url&filename="+i+"\");'>"+i+"</a>");
	    }
	}
	outputs = outputs.join('<br>');

	var html = "<table class='table table-condensed'>";
	html += "<tr><td><b>started</b></td><td>"+widget.prettyAWEdate(task.createddate)+"</td></tr>";
	html += "<tr><td><b>completed</b></td><td>"+widget.prettyAWEdate(task.completeddate)+"</td></tr>";
	html += "<tr><td><b>duration</b></td><td>"+widget.timePassed(Date.parse(task.createddate), Date.parse(task.completeddate))+"</td></tr>";
	html += "<tr><td><b>inputs</b></td><td>"+inputs+"</td></tr>";
	html += "<tr><td><b>outputs</b></td><td>"+outputs+"</td></tr>";
	html += "</table>";
	
	return html;
    };
    
    /*
      HELPER FUNCTIONS
     */
    widget.prettyAWEdate = function (date) {
	var pdate = new Date(Date.parse(date)).toLocaleString();
	return pdate;
    };

    widget.dots = function (stages) {
	var dots = '<span>';
	if (stages.length > 0) {
	    for (var i=0;i<stages.length;i++) {
		if (stages[i].state == 'completed') {
		    dots += '<span style="color: green;font-size: 19px; cursor: default;" title="completed: '+stages[i].cmd.description+'">&#9679;</span>';
		} else if (stages[i].state == 'in-progress') {
		    dots += '<span style="color: blue;font-size: 19px; cursor: default;" title="in-progress: '+stages[i].cmd.description+'">&#9679;</span>';
		} else if (stages[i].state == 'queued') {
		    dots += '<span style="color: orange;font-size: 19px; cursor: default;" title="queued: '+stages[i].cmd.description+'">&#9679;</span>';
		} else if (stages[i].state == 'error') {
		    dots += '<span style="color: red;font-size: 19px; cursor: default;" title="error: '+stages[i].cmd.description+'">&#9679;</span>';
		} else if (stages[i].state == 'pending') {
		    dots += '<span style="color: gray;font-size: 19px; cursor: default;" title="pending: '+stages[i].cmd.description+'">&#9679;</span>';
		} else if (stages[i].state == 'suspend') {
		    dots += '<span style="color: red;font-size: 19px; cursor: default;" title="suspended: '+stages[i].cmd.description+'">&#9679;</span>';
		} else {
		    console.log("unhandled state: "+stages[i].state);
		}
	    }
	}
	
	dots += "</span>";
	
	return dots;
    };

    widget.status = function (state) {
	if (state == "completed") {
	    return '<img class="miniicon" src="Retina/images/ok.png"><span class="green">completed</span>';
	} else if (state == "in-progress") {
	    return '<img class="miniicon" src="Retina/images/settings3.png"><span class="blue">running</span>';
	} else if (state == "queued") {
	    return '<img class="miniicon" src="Retina/images/clock.png"><span class="orange">queued</span>';
	} else if (state == "pending") {
	    return '<img class="miniicon" src="Retina/images/clock.png"><span class="gray">pending</span>';
	} else if (state == "error") {
	    return '<img class="miniicon" src="Retina/images/remove.png"><span class="red">error</span>';
	} else if (state == "suspend") {
	    return '<img class="miniicon" src="Retina/images/remove.png"><span class="red">suspended</span>';
	} else {
	    console.log("unhandled state: "+state);
	    return "";
	}
    };

    widget.timePassed = function (start, end) {
	// time since submission
	var time_passed = end - start;
	var day = parseInt(time_passed / (1000 * 60 * 60 * 24));
	time_passed = time_passed - (day * 1000 * 60 * 60 * 24);
	var hour = parseInt(time_passed / (1000 * 60 * 60));
	time_passed = time_passed - (hour * 1000 * 60 * 60);
	var minute = parseInt(time_passed / (1000 * 60));
	var some_time = ((day > 0) ? day+" days " : "") + ((hour > 0) ? hour+" hours " : "") + minute+" minutes";
	return some_time;
    };

    widget.authenticatedDownload = function (url) {
	jQuery.ajax({ url: url,
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
		      headers: widget.aweAuthHeader
		    });
    };

    // login widget sends an action (log-in or log-out)
    widget.loginAction = function (params) {
	var widget = Retina.WidgetInstances.metagenome_pipeline[1];
	if (params.token) {
	    widget.main.innerHTML = "<img src='Retina/images/waiting.gif' style='margin-left: 45%; margin-top: 300px;'>";
	    widget.user = params.user;
	    widget.authHeader = { "Auth": params.token };
	    widget.aweAuthHeader = { "Authorization": "OAuth "+params.token };
	    
	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		headers: widget.authHeader, 
		url: RetinaConfig.mgrast_api+'/user/sonubioinfo', // widget.user.login
		success: function (data) {
		    Retina.WidgetInstances.metagenome_pipeline[1].user.id = data.id;
		    Retina.WidgetInstances.metagenome_pipeline[1].display();
		}}).fail(function(xhr, error) {
		    
		});
	} else {
	    widget.user = null;
	    widget.authHeader = {};
	    widget.aweAuthHeader = {};
	    widget.display();
	}
    };

})();