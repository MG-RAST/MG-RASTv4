(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Analysis Widget",
                name: "admin_debug",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    // load all required widgets and renderers
    widget.setup = function () {
	return [ Retina.load_widget("mgbrowse"),
		 Retina.load_renderer('table')
	       ];
    };

    widget.actionResult = {};

    // main display function called at startup
    widget.display = function (params) {
	widget = this;
        var index = widget.index;

	jQuery.extend(widget, params);

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "span10 offset1";

	var html = "<h3>Debugger</h3>";
	
//	html += "<div class='input-append'><input type='text' placeholder='enter name or id' id='findField'><button class='btn' onclick='Retina.WidgetInstances.admin_debug[1].loadInfo();'>find</button></div>";

	html += "<div id='queueMenu'></div><div id='actionResult'></div><div id='queueTable'><img src='Retina/images/waiting.gif'></div><div id='jobDetails'></div>";

	// set the output area
	widget.main.innerHTML = html;

	// load the queue data
	if (widget.user) {
	    widget.showQueue();
	} else {
	    widget.main.innerHTML = "<p>You need to log in to view this page.</p>";
	}
    };

    widget.loadInfo = function () {
	var widget = Retina.WidgetInstances.admin_debug[1];

	// get the output div
	var target = document.getElementById('result');

	// get the search string
	var input = document.getElementById('findField').value;
	
	// this is a project id
	if (input.match(/^mgp/)) {
	    jQuery.ajax( { dataType: "json",
			   url: RetinaConfig['mgrast_api'] + "/project/"+input+"?verbosity=full",
			   headers: widget.authHeader,
			   success: function(data) {
			       window.project = data;
			   },
			   error: function () {
			       alert('there was an error retrieving the data');
			   }
			 } );
	}
    };

    widget.showQueue = function () {
	var widget = Retina.WidgetInstances.admin_debug[1];

	// create the job table
	widget.queueTable = Retina.Renderer.create("table", { 
	    target: document.getElementById('queueTable'),
	    data: { header: [ "ID", "name", "project", "size", "status", "priority", "submitted" ], data: [] },
	    headers: widget.authHeader,
	    synchronous: false,
	    query_type: "prefix",
	    data_manipulation: Retina.WidgetInstances.admin_debug[1].queueTableDataManipulation,
	    navigation_url: RetinaConfig['mgrast_api'] + "/pipeline?userattr=bp_count",
	    minwidths: [ 60, 1, 1, 1, 1, 1, 1 ],
	    rows_per_page: 10,
	    filter_autodetect: false,
	    filter: { 0: { "type": "text" },
		      1: { "type": "text" },
		      2: { "type": "text" },
		      4: { "type": "premade-select",
			   "options": [ 
			       { "text": "show all", "value": "in-progress&state=queued&state=pending&state=suspend" },
			       { "text": "in-progress", "value": "in-progress" },
			       { "text": "queued", "value": "queued" },
			       { "text": "pending", "value": "pending" },
			       { "text": "suspend", "value": "suspend" }
			   ],
			   "searchword": "in-progress&state=queued&state=pending&state=suspend" } },
	    asynch_column_mapping: { "ID": "info.name",
				     "name": "info.userattr.name",
				     "project": "info.project",
				     "size": "info.userattr.bp_count",
				     "status": "state",
				     "priority": "info.priority",
				     "submitted": "info.submittime" },
	    
	});
	widget.queueTable.render();
	widget.queueTable.update({ query: { 4: { "searchword": "in-progress&state=queued&state=pending&state=suspend", "field": "status" } } }, widget.queueTable.index);

	// create the job menu
	var target = document.getElementById('queueMenu');

	var html = '\
<div class="input-append input-prepend">\
  <span class="add-on">priority</span>\
  <input type="text" value="100" id="jobPriorityField" class="span3">\
  <button class="btn" onclick="Retina.WidgetInstances.admin_debug[1].setPriority(\'table\');">set</button>\
</div>';

	target.innerHTML = html;
    };

    widget.setPriority = function (what) {
	var widget = Retina.WidgetInstances.admin_debug[1];

	var url = "?action=priority&level=" + document.getElementById('jobPriorityField').value;
	if (what == "table") {
	    what = widget.currentIDs;
	}

	var promises = [];
	for (var i=0; i<what.length; i++) {
	    var promise = jQuery.Deferred();
	    promises.push(promise);
	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		headers: widget.authHeader,
		prom: promise,
		jid: what[i],
		url: RetinaConfig.mgrast_api+'/pipeline/'+what[i]+url,
		success: function (data) {
		    Retina.WidgetInstances.admin_debug[1].actionResult[this.jid] = 'priority-success';
		    this.prom.resolve();
		}}).fail(function(xhr, error) {
		    Retina.WidgetInstances.admin_debug[1].actionResult[this.jid] = 'priority-error';
		    this.prom.resolve();
		});
	}
	jQuery.when.apply(this, promises).then(function() {
	    Retina.WidgetInstances.admin_debug[1].showActionResults();
	});
    };
    
    widget.showActionResults = function () {
	var widget = Retina.WidgetInstances.admin_debug[1];

	var prioSuccess = [];
	var prioError = [];
	for (var i in widget.actionResult) {
	    if (widget.actionResult.hasOwnProperty(i)) {
		if (widget.actionResult[i] == "priority-success") {
		    prioSuccess.push(i);
		} else if (widget.actionResult[i] == "priority-error") {
		    prioError.push(i);
		}
	    }
	}

	var html = "";
	
	if (prioSuccess.length) {
	    html += '<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>success - </strong>job priorities set for jobs '+prioSuccess.join(", ")+'</div>';
	}

	if (prioError.length) {
	    html += '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>error - </strong>failed to set job priorities for jobs '+prioError.join(", ")+'</div>';
	}

	document.getElementById('actionResult').innerHTML = html;

	Retina.WidgetInstances.admin_debug[1].actionResult = {};

	widget.queueTable.settings.navigation_callback({}, widget.queueTable.index);
    };

    widget.showJobDetails = function (id) {
	
    };

    widget.queueTableDataManipulation = function (data) {
	var result_data = [];

	widget.currentIDs = [];

	for (var i=0; i<data.length; i++) {
	    widget.currentIDs.push(data[i].info.userattr.id);
	    result_data.push( { "ID": "<a onclick='Retina.WidgetInstances.admin_debug[1].showJobDetails(\""+data[i].info.userattr.id+"\");' style='cursor: pointer;'>"+data[i].info.name+"</a>",
				"name": data[i].info.userattr.name,
				"project": data[i].info.project,
				"size": data[i].info.userattr.bp_count ? parseInt(data[i].info.userattr.bp_count).baseSize() : "-",
				"status": data[i].state,
				"priority": data[i].info.priority,
				"submitted": data[i].info.submittime } );
	}

	return result_data;
    };

    widget.showJobDetails = function (id) {

    };

     // login callback
    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.admin_debug[1];
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