(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Pipeline Widget",
                name: "metagenome_pipeline",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.add_renderer({"name": "table", "resource": "./renderers/",  "filename": "renderer.table.js" }),
  		 Retina.load_renderer("table") ];
    };
    
    widget.display = function (wparams) {
        widget = Retina.WidgetInstances.metagenome_pipeline[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;
	
	// set the output area

	// check if we have a user
	if (widget.user) {
	    content.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="./images/waiting.gif"></div>';
	    
	    //jQuery.get('http://api.metagenomics.anl.gov/1/pipeline?verbosity=full&user=travis&auth=JusBm9T9FQPePNzdaZVgrVRpz', function(data) {
	    jQuery.get('http://140.221.84.145:8000/job?query&info.user=mgrastprod&recent=200', function(data) {
		Retina.WidgetInstances.metagenome_pipeline[1].showJobs(data);
	    });
	}
	// there is no user, show login required
	else {
	    content.innerHTML = '<h3>Login required</h3><p>You need to log in at the top right of the screen to view this page.</p><p>If you do not yet have an account, you can <button class="btn" style="margin-top: -5px;">register here</button></p>';
	}
    };

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
	    var stage = "complete";
	    if (data[i].remaintasks > 0) {
		stage = data[i].tasks[data[i].tasks.length - data[i].remaintasks].cmd.description;
	    }
	    html += "<tr style='cursor: pointer;' onclick='Retina.WidgetInstances.metagenome_pipeline[1].showJobDetails(\""+data[i].id+"\");'><td>"+data[i].info.name+"</td><td>"+stage+"</td><td>"+widget.status(data[i].tasks)+"</td><td>"+widget.dots(data[i].tasks)+"</td></tr>";
	}
	html += "</table>";

	content.innerHTML = html;
    };

    widget.loginAction = function (params) {
	if ((params.action == 'login') && (params.result == 'success')) {
	    Retina.WidgetInstances.metagenome_pipeline[1].user = true;
	    Retina.WidgetInstances.metagenome_pipeline[1].display();
	} else {
	    Retina.WidgetInstances.metagenome_pipeline[1].user = null;
	    Retina.WidgetInstances.metagenome_pipeline[1].display();
	}
    };
    
    widget.showJobDetails = function (id) {
	widget = Retina.WidgetInstances.metagenome_pipeline[1];
	
	// get the job data from the DataStore
	var job = stm.DataStore.job[id];

	// create the html
	var html = '\
<h3 style="margin-left: 10px;">'+job.info.name+' ('+job.info.project+')</h3>\
<ul class="nav nav-tabs" style="position: relative; left: -1px;">\
  <li>\
    <a href="#status" data-toggle="tab">Status</a>\
  </li>\
  <li class="active">\
    <a href="#stage" data-toggle="tab">Pipeline</a>\
  </li>\
  <li>\
    <a href="#settings" data-toggle="tab">Settings</a>\
  </li>\
  <li>\
    <a href="#visibility" data-toggle="tab">Visibility</a>\
  </li>\
  <li>\
    <a href="#priority" data-toggle="tab">Priority</a>\
  </li>\
</ul>\
<div class="tab-content">\
  <div id="visibility" class="tab-pane fade"></div>\
  <div id="status" class="tab-pane fade"></div>\
  <div id="stage" class="tab-pane fade active in">\
'+widget.stagePills(job)+'\
  </div>\
  <div id="settings" class="tab-pane fade"></div>\
  <div id="priority" class="tab-pane fade"></div>\
</div>';

	widget.sidebar.innerHTML = html;
    };
    
    widget.prettyAWEdate = function (date) {
	date = date.replace(/T/, " ");
	date = date.replace(/\.\d+\Z/, "");
	return date;
    };

    widget.stagePills = function (job) {

	var html = "<h4>this job has no tasks</h4>";
	if (job.tasks.length > 0) {
	    html = "";
	    for (var i=0; i<job.tasks.length; i++) {
		if (job.tasks[i].state == 'completed') {
		    html += '\
<div class="pill donepill">\
  <img class="miniicon" src="images/ok.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">'+Retina.WidgetInstances.metagenome_pipeline[1].prettyAWEdate(job.tasks[i].completeddate)+'</span>\
</div>';
		} else if (job.tasks[i].state == 'in-progress') {
		    html += '\
<div class="pill runningpill">\
  <img class="miniicon" src="images/settings3.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">'+Retina.WidgetInstances.metagenome_pipeline[1].prettyAWEdate(job.tasks[i].starteddate)+'</span>\
</div>';
		} else if (job.tasks[i].state == 'queued') {
		    html += '\
<div class="pill queuedpill">\
  <img class="miniicon" src="images/clock.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">(in queue)</span>\
</div>';
		} else if (job.tasks[i].state == 'error') {
		    html += '\
<div class="pill errorpill">\
  <img class="miniicon" src="images/remove.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">'+Retina.WidgetInstances.metagenome_pipeline[1].prettyAWEdate(job.tasks[i].createddate)+'</span>\
</div>';
		} else if (job.tasks[i].state == 'pending') {
		    html += '\
<div class="pill pendingpill">\
  <img class="miniicon" src="images/clock.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">(not started)</span>\
</div>';
		} else if (job.tasks[i].state == 'suspend') {
		    html += '\
<div class="pill errorpill">\
  <img class="miniicon" src="images/remove.png">\
  '+job.tasks[i].cmd.description+'\
  <span style="float: right;">'+Retina.WidgetInstances.metagenome_pipeline[1].prettyAWEdate(job.tasks[i].createddate)+'</span>\
</div>';
		} else {
		    console.log('unhandled state: '+job.tasks[i].state);
		}
	    }
	}

	return html;
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

    widget.status = function (stages) {
	if (stages.length > 0) {
	    var currentStage = 0;
	    for (var i=0;i<stages.length;i++) {
		if (stages[i].state == 'pending') {
		    currentStage--;
		    break;
		}
		currentStage++;
	    }
	    if (currentStage < 0) {
		currentStage = 0;
	    }
	    if (currentStage == stages.length) {
		currentStage--;
	    }
	    if (stages[currentStage].state == "completed") {
		return '<img class="miniicon" src="images/ok.png"><span class="green">completed</span>';
	    } else if (stages[currentStage].state == "in-progress") {
		return '<img class="miniicon" src="images/settings3.png"><span class="blue">running</span>';
	    } else if (stages[currentStage].state == "queued") {
		return '<img class="miniicon" src="images/clock.png"><span class="orange">queued</span>';
	    } else if (stages[currentStage].state == "pending") {
		return '<img class="miniicon" src="images/clock.png"><span class="gray">pending</span>';
	    } else if (stages[currentStage].state == "error") {
		return '<img class="miniicon" src="images/remove.png"><span class="red">error</span>';
	    } else if (stages[currentStage].state == "suspend") {
		return '<img class="miniicon" src="images/remove.png"><span class="red">suspended</span>';
	    } else {
		console.log("unhandled state: "+stages[currentStage].state);
		return "";
	    }
	}
    };

    widget.visibility = function (visibility) {

    };

})();