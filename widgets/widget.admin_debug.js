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

	var html = "";
	
	html += "<h4>User Table</h4><div id='usertable'><img src='Retina/images/waiting.gif'></div><h4>ID Finder</h4><div><div class='input-append'><input type='text' placeholder='enter ID' id='idFinderID'><button class='btn' onclick='Retina.WidgetInstances.admin_debug[1].idFinder();'>find</button><input type='button' value='deobfuscate' class='btn' onclick='document.getElementById(\"idFinderID\").value=Retina.idmap(document.getElementById(\"idFinderID\").value);'></div><div id='idFinderResult'></div></div><h4>Jobs in the Queue</h4><div id='queueMenu'></div><div id='actionResult'></div><div id='queueTable'><img src='Retina/images/waiting.gif'></div><div id='jobDetails'></div>";

//	html += "<div><h4>move metagenomes between projects</h4><table><tr><th style='padding-right: 55px;'>Source Project ID</th><td><div class='input-append'><input type='text' id='projectSel'><button class='btn' onclick='Retina.WidgetInstances.admin_debug[1].showProject(document.getElementById(\"projectSel\").value);'>select</button></div></td></tr></table></div><div id='projectSpace'></div>";

	html += "<h4>Change Sequence Type</h4><div class='input-append'><input type='text' id='mgid'><button class='btn' onclick='Retina.WidgetInstances.admin_debug[1].checkSequenceType();'>check</button></div><div class='input-append' style='margin-left: 25px;'><select id='seqtype'></select><button class='btn' onclick='Retina.WidgetInstances.admin_debug[1].changeSequenceType(document.getElementById(\"mgid\").value, document.getElementById(\"seqtype\").options[document.getElementById(\"seqtype\").selectedIndex].value);'>set</button></div>";

	// set the output area
	widget.main.innerHTML = html;

	// load the queue data
	if (stm.user) {
	    widget.createUserTable();
	    widget.showQueue();
	} else {
	    widget.main.innerHTML = "<p>You need to log in to view this page.</p>";
	}
    };

    widget.createUserTable = function () {
	var widget = Retina.WidgetInstances.admin_debug[1];

	if (! widget.hasOwnProperty('user_table')) {
	    widget.user_table = Retina.Renderer.create("table", {
		target: document.getElementById('usertable'),
		rows_per_page: 5,
		filter_autodetect: false,
		filter: { 0: { "type": "text" },
			  1: { "type": "text" },
			  2: { "type": "text" },
			  3: { "type": "text" },
			  4: { "type": "text" } },
		invisible_columns: {},
		sort_autodetect: true,
		synchronous: false,
		headers: stm.authHeader,
		sort: "lastname",
		default_sort: "lastname",
		data_manipulation: Retina.WidgetInstances.admin_debug[1].userTable,
		navigation_url: RetinaConfig.mgrast_api+'/user?verbosity=minimal',
		data: { data: [], header: [ "login", "firstname", "lastname", "email", "id", "impersonate" ] }
	    });
	} else {
	    widget.user_table.settings.target = document.getElementById('usertable');
	}
	widget.user_table.render();
	widget.user_table.update({},widget.user_table.index);
    };

    widget.idFinder = function () {
	var widget = Retina.WidgetInstances.admin_debug[1];

	var id = document.getElementById('idFinderID').value;
	if (id.length == 0) {
	    alert('you must enter an id');
	    return;
	}
	// mg-id
	if (id.match(/^mgm\d+\.\d+$/) || id.match(/^\d+\.\d+$/)) {
	    if (! id.match(/^mgm/)) {
		id = "mgm"+id;
	    }
	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		headers: stm.authHeader,
		url:RetinaConfig.mgrast_api+"/metagenome/"+id,
		success: function (data) {
		    if (data.error) {
			document.getElementById('idFinderResult').innerHTML = "ID not found";
		    } else {
			jQuery.ajax({
			    method: "GET",
			    dataType: "json",
			    headers: stm.authHeader,
			    mgdata: data,
			    url: RetinaConfig.awe_url+'/job?query&info.userattr.job_id='+data.job_id,
			    success: function (d) {
				var data = this.mgdata;
				var html = "<table>";
				html += "<tr><td><b>Metagenome</b></td><td>"+data.name+"</td></tr>";
				html += "<tr><td style='padding-right: 20px;'><b>metagenome ID</b></td><td>"+data.id+"</td></tr>";
				html += "<tr><td><b>job ID</b></td><td>"+data.job_id+"</td></tr>";
				if (d.total_count == 1) {
				    html += "<tr><td><b>AWE ID</b></td><td>"+d.data[0].id+"</td></tr>";
				    html += "<tr><td><b>AWE jid</b></td><td>"+d.data[0].jid+"</td></tr>";
				    html += "<tr><td><b>AWE user</b></td><td>"+d.data[0].info.user+"</td></tr>";
				} else {
				    html += "<tr><td><b>AWE ID</b></td><td>no AWE job found</td></tr>";
				}
				html += "</table>";
				document.getElementById('idFinderResult').innerHTML = html;
			    },
			    error: function (xhr) {
				Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
			    }
			});
		    }		
		},
		error: function (xhr) {
		    Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		}
	    });
	}
	// job id
	else if (id.match(/^\d+$/)) {
	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		headers: stm.authHeader,
		url: RetinaConfig.awe_url+'/job?query&info.userattr.job_id='+id,
		success: function (d) {
		    if (d.total_count == 1) {
			var html = "<table>";
			html += "<tr><td><b>Metagenome</b></td><td>"+d.data[0].info.userattr.name+"</td></tr>";
			html += "<tr><td style='padding-right: 20px;'><b>metagenome ID</b></td><td>"+d.data[0].info.userattr.id+"</td></tr>";
			html += "<tr><td><b>job ID</b></td><td>"+d.data[0].info.userattr.job_id+"</td></tr>";
			html += "<tr><td><b>AWE ID</b></td><td>"+d.data[0].id+"</td></tr>";
			html += "<tr><td><b>AWE jid</b></td><td>"+d.data[0].jid+"</td></tr>";
			html += "<tr><td><b>AWE user</b></td><td>"+d.data[0].info.user+"</td></tr>";
			html += "</table>";
			document.getElementById('idFinderResult').innerHTML = html;
		    } else {
			document.getElementById('idFinderResult').innerHTML = "AWE job not found";
		    }
		    
		},
		error: function (xhr) {
		    Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		}
	    });
	}
	// AWE ID
	else {
	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		headers: stm.authHeader,
		url: RetinaConfig.awe_url+'/job/'+id,
		success: function (data) {
		    if (data.error) {
			document.getElementById('idFinderResult').innerHTML = "AWE job not found";
		    } else {
			data = data.data;
			var html = "<table>";
			html += "<tr><td><b>Metagenome</b></td><td>"+data.info.userattr.name+"</td></tr>";
			html += "<tr><td style='padding-right: 20px;'><b>metagenome ID</b></td><td>"+data.info.userattr.id+"</td></tr>";
			html += "<tr><td><b>job ID</b></td><td>"+data.info.userattr.job_id+"</td></tr>";
			html += "<tr><td><b>AWE ID</b></td><td>"+data.id+"</td></tr>";
			html += "<tr><td><b>AWE jid</b></td><td>"+data.jid+"</td></tr>";
			html += "<tr><td><b>AWE user</b></td><td>"+data.info.user+"</td></tr>";
			html += "</table>";
			document.getElementById('idFinderResult').innerHTML = html;
		    }
		},
		error: function (xhr) {
		    Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		}
	    });
	}
    };

    widget.userTable = function (data) {
	var result_data = [];

	for (var i=0; i<data.length; i++) {
	    result_data.push( { "login": data[i].login,
				"firstname": data[i].firstname,
				"lastname": data[i].lastname,
				"email": data[i].email,
				"id": data[i].id,
				"impersonate": '<button class="btn btn-mini" onclick="Retina.WidgetInstances.admin_debug[1].impersonateUser(\''+data[i].login+'\');">impersonate</button>' } );
	}

	return result_data;
    };

    widget.impersonateUser = function (login) {
	var widget = Retina.WidgetInstances.admin_debug[1];
	
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/user/impersonate/'+login,
	    success: function (d) {
		stm.authHeader = { "Authorization": "mgrast "+d.token };
		jQuery.cookie(Retina.WidgetInstances.login[1].cookiename, JSON.stringify({ "user": { firstname: d.firstname,
												     lastname: d.lastname,
												     email: d.email,
												     tos: d.tos,
												     id: d.id,
												     login: d.login },
											   "token": d.token }), { expires: 7 });
		window.location = "mgmain.html?mgpage=pipeline";
	    }}).fail(function(xhr, error) {
		alert('impersonation failed');
	    });
    };

    widget.showQueue = function () {
	var widget = Retina.WidgetInstances.admin_debug[1];

	// create the job table
	widget.queueTable = Retina.Renderer.create("table", { 
	    target: document.getElementById('queueTable'),
	    data: { header: [ "Job ID", "MG-ID", "name", "project", "project ID", "size", "status", "user", "priority", "submitted" ], data: [] },
	    headers: stm.authHeader,
	    synchronous: false,
	    query_type: "prefix",
	    data_manipulation: Retina.WidgetInstances.admin_debug[1].queueTableDataManipulation,
	    navigation_url: RetinaConfig['mgrast_api'] + "/pipeline?userattr=bp_count&info.pipeline=mgrast-prod",
	    minwidths: [ 80, 1, 1, 1, 105, 50, 1, 1, 70, 1 ],
	    rows_per_page: 10,
	    filter_autodetect: false,
	    filter: { 0: { "type": "text" },
		      1: { "type": "text" },
		      2: { "type": "text" },
		      3: { "type": "text" },
		      4: { "type": "text" },
		      6: { "type": "premade-select",
			   "options": [ 
			       { "text": "show all", "value": "in-progress&state=queued&state=pending&state=suspend" },
			       { "text": "in-progress", "value": "in-progress" },
			       { "text": "queued", "value": "queued" },
			       { "text": "pending", "value": "pending" },
			       { "text": "suspend", "value": "suspend" }
			   ],
			   "searchword": "in-progress&state=queued&state=pending&state=suspend" },
		      7: { "type": "text" } },
	    asynch_column_mapping: { "Job ID": "info.name",
				     "MG-ID": "info.userattr.id",
				     "name": "info.userattr.name",
				     "project": "info.project",
				     "project ID": "info.userattr.project_id", 
				     "size": "info.userattr.bp_count",
				     "status": "state",
				     "user": "info.user",
				     "priority": "info.priority",
				     "submitted": "info.submittime" },
	    invisible_columns: { 2: true,
				 3: true }
	    
	});
	widget.queueTable.render();
	widget.queueTable.update({ query: { 6: { "searchword": "in-progress&state=queued&state=pending&state=suspend", "field": "status" } } }, widget.queueTable.index);

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
		headers: stm.authHeader,
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

    widget.showJobDetails = function (user, id) {
	var widget = Retina.WidgetInstances.admin_debug[1];

	window.open("mgmain.html?mgpage=pipeline&admin=1&user="+user+"&job="+id);
    };

    // widget.showProject = function (pid, data) {
    // 	var widget = Retina.WidgetInstances.admin_debug[1];

    // 	var html = "<b>loading project data for "+pid+"</b><img src'Retina/images/waiting.gif'>";

    // 	if (data) {
    // 	    html = "<div id='project_message_space'></div><table><tr><th style='text-align: left; vertical-align: top; padding-right: 20px;'>Source Project</th><td>"+data.name+" ("+data.id+")<button class='btn btn-mini pull-right' onclick='Retina.WidgetInstances.admin_debug[1].deleteProject(\""+data.id+"\");'>delete</button></td></tr>";
    // 	    html += "<tr><th style='text-align: left; vertical-align: top; padding-right: 20px;'>Metagenomes to move</th><td><select size=10 multiple id='project_a'>";
    // 	    for (var i=0; i<data.metagenomes.length; i++) {
    // 		html += "<option>"+data.metagenomes[i][0]+"</option>";
    // 	    }
    // 	    html += "</select></td></tr><tr><th style='text-align: left; padding-right: 20px;'>Target Project ID<button class='btn btn-mini pull-right' onclick='Retina.WidgetInstances.admin_debug[1].createProject();'>create</button></th><td><div class='input-append'><input type='text' id='project_b'><button class='btn' onclick='Retina.WidgetInstances.admin_debug[1].moveMetagenomes(\""+pid+"\");'>move metagenomes</button></div></td></tr></table>";
    // 	} else {
    // 	    if (pid.match(/^\d+$/)) {
    // 		pid = "mgp"+pid;
    // 		document.getElementById('projectSel').value = pid;
    // 	    }
    // 	    jQuery.ajax({
    // 		method: "GET",
    // 		dataType: "json",
    // 		headers: stm.authHeader,
    // 		url: RetinaConfig.mgrast_api+'/project/'+pid+"?verbosity=full",
    // 		success: function (data) {
    // 		    var widget = Retina.WidgetInstances.admin_debug[1];
    // 		    widget.showProject(data.id, data);
    // 		},
    // 		error: function (data) {
    // 		    document.getElementById('projectSpace').innerHTML = "<div class='alert alert-error'>retrieving project data failed, is the ID valid?</div>";
    // 		}});
    // 	}

    // 	document.getElementById('projectSpace').innerHTML = html;
    // };

    widget.deleteProject = function(id) {
	var widget = this;
	var fd = new FormData();
	fd.append('id', id);
	jQuery.ajax({
	    method: "POST",
	    contentType: false,
	    processData: false,
	    data: fd,
	    crossDomain: true,
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project/delete',
	    success: function (data) {
		if (data.hasOwnProperty('OK')) {
		    alert('project deleted');
		    document.getElementById('projectSel').value = "";
		    document.getElementById('projectSpace').innerHTML = "";
		} else {
		    alert(data.ERROR);
		}
	    },
	    error: function (data) {
		document.getElementById('projectSpace').innerHTML = "<div class='alert alert-error'>deleting project failed</div>";
	    }});
    };

    widget.createProject = function () {
	var widget = this;

	var name = prompt('select project name');
	var user = 'paczian';
	var fd = new FormData();
	fd.append('user', user);
	fd.append('name', name);
	jQuery.ajax({
	    method: "POST",
	    contentType: false,
	    processData: false,
	    data: fd,
	    crossDomain: true,
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project/create',
	    success: function (data) {
		document.getElementById('project_b').value = data.project;
	    },
	    error: function (data) {
		document.getElementById('projectSpace').innerHTML = "<div class='alert alert-error'>creating project failed</div>";
	    }});
    };

    widget.checkSequenceType = function () {
	var widget = Retina.WidgetInstances.admin_debug[1];

	var mgid = document.getElementById('mgid').value;

	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/metagenome/'+mgid,
	    success: function (data) {
		var types = [ "Amplicon", "MT", "WGS", "Unknown" ];
		var html = "";
		for (var i=0; i<types.length; i++) {
		    var sel = "";
		    if (types[i] == data.sequence_type) {
			sel = " selected=selected";
		    }
		    html += "<option"+sel+">"+types[i]+"</option>";
		}
		document.getElementById('seqtype').innerHTML = html;
	    }});
    };

    widget.changeSequenceType = function (mgid, type) {
	var widget = Retina.WidgetInstances.admin_debug[1];

	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/metagenome/'+mgid+"/changesequencetype/"+type,
	    success: function (data) {
		alert('sequence type changed.');
	    }});
    };

    // widget.moveMetagenomes = function (pid) {
    // 	var widget = Retina.WidgetInstances.admin_debug[1];

    // 	var mgs = [];
    // 	var sel = document.getElementById('project_a').options;
    // 	for (var i=0; i<sel.length; i++) {
    // 	    if (sel[i].selected) {
    // 		mgs.push("move="+sel[i].text);
    // 	    }
    // 	}

    // 	var pid_b = document.getElementById('project_b').value;
    // 	if (pid_b.match(/^\d$/)) {
    // 	    pid_b = "mgp" + pid_b;
    // 	}

    // 	jQuery.ajax({
    // 	    method: "GET",
    // 	    dataType: "json",
    // 	    headers: stm.authHeader,
    // 	    url: RetinaConfig.mgrast_api+'/project/'+pid+"/movemetagenomes?target="+pid_b+"&"+mgs.join("&"),
    // 	    success: function (data) {
    // 		Retina.WidgetInstances.admin_debug[1].showProject(pid);
    // 		document.getElementById('project_message_space').innerHTML = "<div class='alert alert-success'>metagenomes moved successfully</div>";
    // 	    },
    // 	    error: function (data) {
    // 		document.getElementById('projectSpace').innerHTML = "<div class='alert alert-error'>moving metagenomes failed, is the target ID valid?</div>";
    // 	    }});
    // };

    widget.queueTableDataManipulation = function (data) {
	var result_data = [];

	widget.currentIDs = [];

	for (var i=0; i<data.length; i++) {
	    widget.currentIDs.push(data[i].info.userattr.id);
	    result_data.push( { "Job ID": "<a onclick='window.open(\""+RetinaConfig['awe_url']+"/monitor/main.html?page=monitor&jobdetail="+data[i].id+"\")' style='cursor: pointer;'>"+data[i].info.name+"</a>",
				"MG-ID": "<a onclick='Retina.WidgetInstances.admin_debug[1].showJobDetails(\""+data[i].info.user+"\", \""+data[i].info.userattr.job_id+"\");' style='cursor: pointer;'>"+data[i].info.userattr.id+"</a>",
				"name": data[i].info.userattr.name+"</a>",
				"project": data[i].info.project,
				"project ID": data[i].info.userattr.project_id,
				"size": data[i].info.userattr.bp_count ? parseInt(data[i].info.userattr.bp_count).baseSize() : "-",
				"status": data[i].state,
				"user": data[i].info.user,
				"priority": data[i].info.priority,
				"submitted": data[i].info.submittime } );
	}

	return result_data;
    };
})();
