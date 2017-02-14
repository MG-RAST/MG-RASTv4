(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "MyData Widget",
            name: "metagenome_mydata",
            author: "Tobias Paczian",
            requires: [ "jquery.masonry.min.js" ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };

    widget.sections = {
	'tasks': { 'name': 'tasks', 'icon': 'clock', 'active': true, "html": null, "order": 0 },
	'news': { 'name': 'news', 'icon': 'bubbles', 'active': true, "html": null, "order": 3 },
	'jobs': { 'name': 'jobs', 'icon': 'settings3', 'active': true, "html": null, "order": 2 },
	'studys': { 'name': 'studys', 'icon': 'dna', 'active': true, "html": null, "order": 1 },
	'collections': { 'name': 'collections', 'icon': 'cart', 'active': false, "html": null, "order": 4 },
	'profile': { 'name': 'profile', 'icon': 'user', 'active': false, "html": null, "order": 5 },
	'analyses': { 'name': 'analyses', 'icon': 'bar-chart', 'active': false, "html": null, "order": 6 },
    };
    
    widget.display = function (wparams) {
        widget = this;
	
	var container = widget.target = wparams ? wparams.main : widget.target;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;
	sidebar.parentNode.style.display = 'none';
	container.className = "span10 offset1";
	document.getElementById("pageTitle").innerHTML = "my data";
	
	if (stm.user) {
	    var html = [ '<h3 style="width: 94.7%;">Welcome back, '+stm.user.firstname+' '+stm.user.lastname+'<div id="toggleBar" style="float: right;"></div><div class="input-append pull-right" style="margin-top: 7px; width: 250px; margin-right: 10px;"><input type="text" class="search" style="padding-left: 10px;border-radius: 14px 0 0 14px; width: 144px;" placeholder="search string" id="searchtext"><button class="btn search-button" style="border-radius: 0 14px 14px 0;" onclick="Retina.WidgetInstances.metagenome_mydata[1].search(document.getElementById(\'searchtext\').value);" id="searchbutton">search <img src="Retina/images/search.png" style="width: 16px; position: relative; bottom 2px;"></button></div></h3>' ];

	    // add the status
	    html.push(widget.serverStatusSection());

	    // add tip of the day
	    html.push(widget.tipSection());

	    // create the section html
	    widget.sections["tasks"].html = widget.tasksSection();
	    widget.sections["news"].html = widget.newsSection();
	    widget.sections["jobs"].html = widget.jobsSection();
	    widget.sections["studys"].html = widget.studysSection();
	    widget.sections["collections"].html = widget.collectionsSection();
	    widget.sections["profile"].html = widget.profileSection();
	    widget.sections["analyses"].html = widget.analysesSection();

	    var order = [];
	    for (var i in widget.sections) {
		if (widget.sections.hasOwnProperty(i)) {
		    order[widget.sections[i].order] = widget.sections[i];
		}
	    }

	    // the visible elements
	    html.push('<div id="masonry">');
	    
	    for (var i=0; i<order.length; i++) {
		html.push(order[i].html);
	    }
	    
	    html.push('</div>');
	    
	    container.innerHTML = html.join("\n");
	    
	    // keybind for searchbox
	    document.getElementById('searchtext').addEventListener("keypress", function(event){
		event=event || window.event;
		if(event.keyCode=='13') {
		    document.getElementById('searchbutton').click();
		}
	    });
	    
	    for (var i=0; i<order.length; i++) {
		if (order[i].active) {
		    document.getElementById(order[i].name+'Section').className = "box";
		} else {
		    document.getElementById(order[i].name+'Section').style.display = "none";
		}
	    }
	    
	    jQuery("#masonry").masonry({ itemSelector : '.box' });
	    
	    if (window.hasOwnProperty('newsFeedResult')) {
		jQuery.getJSON(RetinaConfig.mgrast_api+'/server/twitter', function(data) {
		    window.newsFeedResult.feed.entries = data.concat(window.newsFeedResult.feed.entries);
		    Retina.WidgetInstances.metagenome_mydata[1].showNews(window.newsFeedResult);
		});
	    }
	    
	    widget.toggleBar();
	    
	    widget.getCollections();
	    widget.getProfile();
	    widget.getProjects();
	    widget.getPriorities();
	    widget.getAnalyses();
	    
	    widget.getServerStatus();
	    widget.getTip();
	    
	} else {
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.search = function (term) {
	var widget = this;

	if (term.match(/^mgp\d+$/)) {
	    window.location = 'mgmain.html?mgpage=project&project='+term;
	} else if (term.match(/^mgm\d+\.\d+$/)) {
	    window.location = 'mgmain.html?mgpage=overview&metagenome='+term;
	} else {
	    window.location = 'mgmain.html?mgpage=search&search='+term;
	}
    };
    
    /*
      TOGGLE BAR
    */
    widget.toggleBar = function (box) {
	var widget = this;
	
	var html = [ '<div class="btn-group" data-toggle="buttons-checkbox">' ];

	var order = [];
	for (var i in widget.sections) {
	    if (widget.sections.hasOwnProperty(i)) {
		order[widget.sections[i].order] = widget.sections[i];
	    }
	}
	
	for (var i=0; i<order.length; i++) {
	    html.push('<button type="button" class="btn btn-small'+(order[i].active ? " active" : "")+'" onclick="Retina.WidgetInstances.metagenome_mydata[1].toggleBox(\''+order[i].name+'\');" title="'+order[i].name+'"><img src="Retina/images/'+order[i].icon+'.png" style="width: 16px;"></button>');
	}
	
	html.push('</div>');
	
	document.getElementById('toggleBar').innerHTML = html.join("\n");
    };
    
    widget.toggleBox = function (box) {
	var widget = this;

	if (widget.sections[box].active) {
	    widget.sections[box].active = false;
	    document.getElementById(box+"Section").style.display = "none";
	    document.getElementById(box+"Section").className = "";
	} else {
	    widget.sections[box].active = true;
	    document.getElementById(box+"Section").style.display = "";
	    document.getElementById(box+"Section").className = "box";
	}
	jQuery("#masonry").masonry('reloadItems');
	jQuery("#masonry").masonry({ itemSelector : '.box' });
    };
    
    /*
      SECTIONS
    */
    widget.tipSection = function () {
	return '<div style="padding: 5px; border-radius: 3px; border: 1px solid rgb(204, 204, 204); margin-bottom: 10px; width: 94%;"><img src="Retina/images/bulb.png" style="width: 24px;"><span style="margin-left: 10px; position: relative; top: 1px;"><b>Did you know: </b><span id="tipoftheday"></span></span></div>';
    }
    
    widget.jobsSection = function () {
	var html = [ '<div id="jobsSection"><h4 style="margin-top: 0px;"><img src="Retina/images/settings3.png" style="margin-right: 5px; width: 16px; position: relative; bottom: 2px;">my jobs<a class="btn btn-mini" style="float: right;" title="show all jobs in detail" href="mgmain.html?mgpage=pipeline"><i class="icon icon-eye-open"></i> view</a><a class="btn btn-mini" style="float: right; margin-right: 5px;" title="upload new job" href="mgmain.html?mgpage=upload"><img src="Retina/images/cloud-upload.png" style="width: 16px;"></i></a></h4>' ];
	
	html.push('<div id="jobDiv"><div style="text-align: center;"><img src="Retina/images/waiting.gif" style="margin-top: 25px; margin-bottom: 25px;"></div></div>')
	
	html.push('</div>');
	
	return html.join("\n");
    };
    
    widget.tasksSection = function () {
	var html = [ '<div id="tasksSection"><h4 style="margin-top: 0px;"><img src="Retina/images/clock.png" style="margin-right: 5px; width: 16px; position: relative; bottom: 2px;">my tasks</h4><hr style="margin-top: 2px; margin-bottom: 5px;">' ];
	
	html.push('<div id="tasksDiv"><div style="text-align: center;"><img src="Retina/images/waiting.gif" style="margin-top: 25px; margin-bottom: 25px;"></div></div>')
	
	html.push('</div>');
	
	return html.join("\n");
    };
    
    widget.studysSection = function () {
	var html = [ '<div id="studysSection"><h4 style="margin-top: 0px;"><img src="Retina/images/dna.png" style="margin-right: 5px; width: 16px; position: relative; bottom: 2px;">my studies<a class="btn btn-mini" style="float: right; margin-left: 5px;" title="show my private studies" href="mgmain.html?mgpage=projects"><i class="icon icon-eye-open"></i> view</a><a class="btn btn-mini" style="float: right;" title="show study editor" href="mgmain.html?mgpage=share"><i class="icon icon-edit"></i> edit</a></h4><hr style="margin-top: 2px; margin-bottom: 5px;">' ];
	
	html.push('<div id="projectDiv"><p align=center><img src="Retina/images/waiting.gif" style="margin-top: 25px; margin-bottom: 25px;"></p></div>')
	
	html.push('</div>');
	
	return html.join("\n");
    };
    
    widget.collectionsSection = function () {
	return '<div id="collectionsSection"><h4 style="margin-top: 0px;"><img src="Retina/images/cart.png" style="margin-right: 5px; width: 16px; position: relative; bottom: 2px;">my collections</h4><div id="collectionDiv"><p align=center><img src="Retina/images/waiting.gif" style="margin-top: 25px; margin-bottom: 25px;"></p></div></div>';
    };
    
    widget.profileSection = function () {
	return '<div id="profileSection"><h4 style="margin-top: 0px;"><img src="Retina/images/user.png" style="margin-right: 5px; width: 16px; position: relative; bottom: 2px;">my profile<button class="btn btn-mini" style="float:right;" onclick="alert(stm.authHeader.Authorization);">show webkey</button></h4><hr style="margin-top: 2px; margin-bottom: 5px;"><div id="profileDiv"><p align=center><img src="Retina/images/waiting.gif" style="margin-top: 25px; margin-bottom: 25px;"></p></div></div>'
    };
    
    widget.newsSection = function () {
	var html = '<div id="newsSection"><h4 style="margin-top: 0px;"><img src="Retina/images/bubbles.png" style="margin-right: 5px; width: 16px; position: relative; bottom: 2px;">MG-RAST News</h4><div id="newsfeed"><p align=center><img src="Retina/images/waiting.gif" style="margin-top: 25px; margin-bottom: 25px;"></p></div></div>';
	
	return html;
    };

    widget.analysesSection = function () {
	var html = '<div id="analysesSection"><h4 style="margin-top: 0px;"><img src="Retina/images/bar-chart.png" style="margin-right: 5px; width: 16px; position: relative; bottom: 2px;">my analyses</h4><div id="analyses"><p align=center><img src="Retina/images/waiting.gif" style="margin-top: 25px; margin-bottom: 25px;"></p></div></div>';

	return html;
    };

    widget.serverStatusSection = function () {
	return '<div id="serverStatusSection"></div><div style="clear: both;"></div>';
    };
    
    /*
      HELPER FUNCTIONS
    */
    widget.prettyAWEdate = function (date) {
	if (date == "0001-01-01T00:00:00Z") {
	    return "-";
	}
	var pdate = new Date(Date.parse(date)).toLocaleString();
	return pdate;
    };
    
    widget.status = function (state) {
	if (state == "completed") {
	    return '<img class="miniicon" src="Retina/images/ok.png"><span class="green">completed</span>';
	} else if (state == "in-progress") {
	    return '<img class="miniicon" src="Retina/images/settings3.png"><span class="blue">in-progress</span>';
	} else if (state == "queued") {
	    return '<img class="miniicon" src="Retina/images/clock.png"><span class="orange">queued</span>';
	} else if (state == "pending") {
	    return '<img class="miniicon" src="Retina/images/clock.png"><span class="gray">pending</span>';
	} else if (state == "error") {
	    return '<img class="miniicon" src="Retina/images/remove.png"><span class="red">error</span>';
	} else if (state == "suspend") {
	    return '<img class="miniicon" src="Retina/images/remove.png"><span class="red">suspend</span>';
	} else {
	    console.log("unhandled state: "+state);
	    return "";
	}
    };
    
    /*
      ACTION FUNCTIONS
    */
    widget.updateUser = function () {
	var widget = Retina.WidgetInstances.metagenome_mydata[1];
	
	var password = document.getElementById('user_password').value;
	var password2 = document.getElementById('user_password_repeat').value;
	var firstname = document.getElementById('user_firstname').value;
	var lastname = document.getElementById('user_lastname').value;
	var email = document.getElementById('user_email').value;
	var email2 = document.getElementById('user_email2').value;
	if (email != stm.user.email) {
	    alert("You will receive a link at the new email address to activate it.\nUntil you have done so, your email will remain unchanged.");
	}
	if (email2 != stm.user.email2) {
	    alert("You will receive a link at the new email address to activate it.\nUntil you have done so, your email will remain unchanged.");
	}

	var promises = [];

	if (firstname != stm.user.firstname || lastname != stm.user.lastname || email2 != stm.user.email2 || email != stm.user.email) {
	    var p1 = jQuery.Deferred();
	    promises.push(p1);
	    jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/" + stm.user.login,
			  method: "PUT",
			  dataType: "json",
			  p: p1,
			  data: "firstname="+firstname+"&lastname="+lastname+"&email2="+email2+"&email="+email,
			  error: function(jqXHR, error) {
			      console.log("error: unable to connect to API server");
			      console.log(error);
			  },
			  completed: function (jqXHR) {
			      this.p.resolve();
			  },
			  headers: stm.authHeader
			});
	}
	
	if (password.length) {
	    if (password != password2) {
		alert("password and repeat password do not match");
	    } else {
		var p2 = jQuery.Deferred();
		promises.push(p2);
		jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/" + stm.user.login+"/setpassword?dwp="+password,
			      method: "GET",
			      dataType: "json",
			      success: function(data) {
				  alert('password changed');
			      },
			      error: function(jqXHR, error) {
				  console.log("error: unable to connect to API server");
				  console.log(error);
			      },
			      headers: stm.authHeader
			    });
	    }
	    
	}

	if (promises.length) {
	    document.getElementById('profileDiv').innerHTML = '<div style="text-align: center;"><img src="Retina/images/waiting.gif" style="margin-top: 25px; margin-bottom: 25px;"></div>';
	    
	    jQuery.when.apply(this, promises).then(function() {
		Retina.WidgetInstances.metagenome_mydata[1].getProfile();
	    });
	}
    };
    
    /* 
       DATA RETRIEVAL
    */
    widget.getTip = function () {
	jQuery.getJSON("data/tipoftheday.json", function (data) {
	    Retina.WidgetInstances.metagenome_mydata[1].showTip(data[Math.floor((Math.random() * data.length))]);
	});
    };
    
    widget.getServerStatus = function () {
	// server status info
	jQuery.getJSON(RetinaConfig.mgrast_api+"/server/MG-RAST", function (data) {
	    Retina.WidgetInstances.metagenome_mydata[1].showServerStatus(data);
	});
	
    };
    
    widget.getProfile = function () {
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig["mgrast_api"]+"/user/"+stm.user.login+"?verbosity=full",
		       headers: stm.authHeader,
		       success: function(data) {
			   data.oldPreferences = data.preferences.slice();
			   delete data.preferences;
			   jQuery.extend(true, stm.user, data);
			   var widget = Retina.WidgetInstances.metagenome_mydata[1];
			   widget.showProfile();
			   if (! widget.hasOwnProperty('job_table')) {
			       widget.getJobs();
			   }
		       },
		       error: function () {
			   Retina.WidgetInstances.metagenome_mydata[1].target.innerHTML = "<div class='alert alert-error' style='width: 50%;'>You do not have the permisson to view this data.</div>";
		       }
		     } );		   
    }
    
    widget.getProjects = function () {
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project?private=1&edit=1&verbosity=summary&limit=10&offset=0',
	    success: function (data) {
		var widget = Retina.WidgetInstances.metagenome_mydata[1];
		widget.showProjects(data);
	    },
	    error: function (xhr) {
		Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		document.getElementById('projectDiv').innerHTML = "<div class='alert alert-error'>There was an error accessing your data</div>";
	    }
	});
    };

    widget.getPriorities = function () {
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/user/'+stm.user.login+'?verbosity=priorities',
	    success: function (data) {
		var widget = Retina.WidgetInstances.metagenome_mydata[1];
		widget.priorities = data.priorities;
		widget.showTasks();
	    },
	    error: function (xhr) {
		Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		document.getElementById('projectDiv').innerHTML = "<div class='alert alert-error'>There was an error accessing your data</div>";
	    }
	});
    };
    
    widget.getCollections = function () {
	stm.loadPreferences().then(function() {
	    Retina.WidgetInstances.metagenome_mydata[1].showCollections();
	});
    };
    
    widget.getJobs = function () {
	var widget = this;
	
	// create the job table
	var job_columns = [ "job", "stage", "status" ];
	if (! widget.hasOwnProperty('job_table')) {
	    widget.job_table = Retina.Renderer.create("table", {
		target: document.getElementById('jobDiv'),
		rows_per_page: 8,
		hide_options: true,
		filter_autodetect: false,
		sort_autodetect: true,
		synchronous: false,
		sort: "updatetime",
		query_type: "equal",
		asynch_column_mapping: { "job": "info.name",
					 "status": "state" },
		headers: stm.authHeader,
		data_manipulation: widget.showJobs,
		minwidths: [1,1,1],
		navigation_url: RetinaConfig['mgrast_api'] + "/pipeline?info.pipeline=mgrast-prod-4.0&state=suspend&state=in-progress&state=checkout&state=queued&info.user="+stm.user.id,
		data: { data: [], header: job_columns }
	    });
	} else {
	    widget.job_table.settings.target = document.getElementById('jobtable');
	}
	widget.job_table.render();
	jQuery("#masonry").masonry({ itemSelector : '.box' });
	widget.job_table.update({},1).then(function(){ jQuery("#masonry").masonry({ itemSelector : '.box' }); });
    };

    widget.deleteAnalysis = function (nodeid) {
	var url = RetinaConfig.shock_url + "/node/"+nodeid;
	jQuery.ajax({ url: url,
		      method: 'DELETE',
		      success: function(data) {
			  alert('analysis deleted');
			  Retina.WidgetInstances.metagenome_mydata[1].getAnalyses();
		      },
		      error: function(jqXHR, error) {
			  alert('deletion failed');
		      },
		      crossDomain: true,
		      headers: stm.authHeader
		    });
    };

    widget.getAnalyses = function () {
	var widget = this;

	var url = RetinaConfig.shock_url + "/node?querynode&attributes.type=analysisObject&attributes.hasVisualization=1&owner=" + stm.user.login;
	jQuery.ajax({ url: url,
		      dataType: "json",
		      success: function(data) {
			  if (data != null) {
			      if (data.error != null) {
				  document.getElementById('analyses').innerHTML = '<div class="alert alert-error">could not access your myData space</div>';
			      } else {
				  if (data.data.length) {
				      var html = ['<table>'];
				      for (var i=0; i<data.data.length; i++) {
					  html.push('<tr><td style="padding-right: 20px;vertical-align: top;">'+data.data[i].file.name+'<br><button class="btn btn-mini btn-danger" onclick="if(confirm(\'Really delete this analysis?\')){Retina.WidgetInstances.metagenome_mydata[1].deleteAnalysis(\''+data.data[i].id+'\');}">delete</button></td><td id="analysis'+i+'"><img src="Retina/images/waiting.gif" style="width: 24px;"></td></tr>');
				      }
				      html.push('</table>');
				      document.getElementById('analyses').innerHTML = html.join("");
				      for (var i=0; i<data.data.length; i++) {
					  jQuery.ajax({ url: RetinaConfig.shock_url+'/node/'+data.data[i].id+'?download',
							tid: i,
							success: function(data) {
							    document.getElementById('analysis'+this.tid).innerHTML = '<div style="width: 400px;">'+data+'</div>';
							}
					  });
				      }
				  } else {
				      document.getElementById('analyses').innerHTML = '<div class="alert alert-info">you currently have no images in your myData space</div>';
				  }
			      }
			  } else {
			      document.getElementById('analyses').innerHTML = '<div class="alert alert-error">there was an error connecting to your myData space</div>';
			  }
		      },
		      error: function(jqXHR, error) {
			  document.getElementById('analyses').innerHTML = '<div class="alert alert-error">could not access your myData space</div>';
		      },
		      crossDomain: true,
		      headers: stm.authHeader
		    });
    };
    
    /*
      DATA RENDERING
    */
    widget.showTip = function (data) {
	var widget = this;

	document.getElementById('tipoftheday').innerHTML = data;
    };
    
    widget.showServerStatus = function (data) {
	var widget = this;

	var html = "";

	// print server version
	html += "<div style='position: relative; bottom: 20px;'><div style='font-size: 11px; position: absolute;'>MG-RAST server running version "+(RetinaConfig.serverVersion ? RetinaConfig.serverVersion : data.version)+". ";
	
	// print server stats
	var bp = (parseInt(data.basepairs) / 1000000000000).formatString(2);
	var seq = parseInt(parseInt(data.sequences) / 1000000000).formatString();
	html += "Hosting " + parseInt(data.public_metagenomes).formatString() + " public and " + parseInt(data.metagenomes).formatString() + " total metagenomes containing "+seq+" billion sequences and "+bp+" Tbp.";

	html += '</div></div>';
	
	html += data.info ? '<div style="width: 91%; margin-bottom: 10px;" class="alert' : '';

	// check if the server is down
	if (data.status != "ok") {
	    html += ' alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>';
	}
	// check if there is an info message
	else if (data.info) {
	    html += ' alert-info"><button type="button" class="close" data-dismiss="alert">&times;</button>';
	}

	html += data.info ? data.info + '</div>' : '';

	

	document.getElementById('serverStatusSection').innerHTML = html;
    };
    
    widget.showProjects = function (result) {
	var html = [ ];
	if (result.hasOwnProperty('data') && result.data.length) {
	    for (var i=0; i<result.data.length; i++) {
		var item = result.data[i];
		if (item.status == "private") {
		    item.id = Retina.idmap(item.id);
		}
		html.push('<a href="mgmain.html?mgpage=project&project='+item.id+'" target=_blank>'+item.name+'</a>');
		html.push('<p>a '+item.status+' study by '+item.pi+' including '+item.metagenomes.length+' metagenomes</p>');
		html.push('<p>'+item.description+'</p>');
		html.push('<hr style="margin-top: 0px; margin-bottom: 0px;">');
	    }
	    if (result.total_count > result.data.length) {
		html.push('<div style="text-align: center;"><a class="btn btn-mini" href="mgmain.html?mgpage=share" style="width: 90%">show all '+result.total_count+' studies</a></div>');
	    }
	} else {
	    html.push("<p style='margin-bottom: 30px;'>You currently do not have access to any projects. For help on uploading, try the tutorial below.</p>");
	    html.push('<div style="text-align: center;"><iframe width="420" height="315" src="https://www.youtube.com/embed/Bcle_ujyMq0" frameborder="0" allowfullscreen></iframe></div>');
	}
	document.getElementById('projectDiv').innerHTML = html.join("\n");
	jQuery("#masonry").masonry({ itemSelector : '.box' });
    };
    
    widget.showNews = function (result) {
    	if (!result.error) {
    	    var html = '<table class="table table-condensed" style="width: 100%; font-size: 12px;">';
	    for (var i = 0; i<result.feed.entries.length; i++) {
		var entry = result.feed.entries[i];
		// twitter
		if (entry.hasOwnProperty("created_at")) {
		    entry.date = entry.created_at.substr(0, 11) + entry.created_at.substr(-4);
		    entry.title = entry.text;
		    entry.link = "https://twitter.com/mg_rast/status/"+entry.id_str;
		}
		// blog
		else {
		    entry.date = entry.publishedDate.replace(/^(\w+),\s(\d+)\s(\w+)\s(\d+).+$/, "$1, $3 $2 $4");
		}
	    }
    	    for (var i=0; i<result.feed.entries.length; i++) {
    		var entry = result.feed.entries[i];
		if (entry.hasOwnProperty('in_reply_to_screen_name')) {
		    if (!((entry.in_reply_to_screen_name == 'mg_rast') || (entry.in_reply_to_screen_name == null))) {
			continue;
		    }
		}
    		html += '<tr><td style="white-space: nowrap;">'+entry.date+'</td><td><a href="'+entry.link+'" target=_blank>'+entry.title+'</a></td></tr>';
    	    }
    	    html += "</table>";
    	    document.getElementById("newsfeed").innerHTML = html;
	    jQuery("#masonry").masonry({ itemSelector : '.box' });
    	}
    };
    
    widget.showCollections = function () {
	var html = [];
	
	if (stm.user.preferences && stm.user.preferences.collections) {
	    html.push('<table class="table table-condensed">');
	    var sses = Retina.keys(stm.user.preferences.collections).sort();
	    for (var i=0; i<sses.length; i++) {
		var collection = stm.user.preferences.collections[sses[i]];
		html.push('<tr><td style="padding-bottom: 20px;"><table style="width: 100%;"><tr><td colspan=2 style="border: none;"><a href="mgmain.html?mgpage=collection&collection='+collection.name+'"><b>'+collection.name+'</b></a> ('+Retina.keys(collection.metagenomes).length+' metagenomes)<button class="btn btn-mini btn-danger" style="float: right;" title="delete collection" onclick="if (confirm(\'Really delete this collection?\')) {Retina.WidgetInstances.metagenome_mydata[1].deleteCollection(\''+collection.name+'\');}"><i class="icon icon-trash"></i></button></td></tr>');
		html.push('<tr><td colspan=2 style="border: none;">'+(collection.description || '- no description available -')+'</td></tr>');
		html.push('</table></td></tr>');
	    }
	    html.push('</table>');
	} else {
	    html.push('<p>- you currently have no collections -</p>')
	}
	
	document.getElementById('collectionDiv').innerHTML = html.join("\n");
	jQuery("#masonry").masonry({ itemSelector : '.box' });

    };

    widget.deleteCollection = function (cname) {
	var widget = this;

	delete stm.user.preferences.collections[cname];
	stm.storePreferences("collection deleted", "there was an error deleting your collection");
	widget.showCollections();
    };
    
    widget.showTasks = function () {
	var widget = this;
	var html = [];

	var tasks = [];
	var projects = widget.projectData;

	// get all preferences tasks
	if (stm.user.preferences && stm.user.preferences.tasks) {
	    tasks = tasks.concat(stm.user.preferences.tasks);
	}

	// get all jobs to be made public
	if (widget.priorities && widget.priorities.length) {
	    var project_prios = {};
	    for (var i=0; i<widget.priorities.length; i++) {
		var task = widget.priorities[i];
		if (task.tag == "completedtime"){
		    var co = task.value.substr(0,10).split(/-/);
		    var c = new Date(parseInt(co[0]), parseInt(co[1])-1, parseInt(co[2])).valueOf();
		    var n = Date.now();
		    if (task.value == 'date') {
			c += 1000 * 60 * 60 * 24 * 360;		    
		    } else if (task.value == '3months') {
			c += 1000 * 60 * 60 * 24 * 90;
		    } else if (task.value == '6months') {
			c += 1000 * 60 * 60 * 24 * 180;
		    }
		    var grace = 1000 * 60 * 60 * 24 * 21; // three weeks grace period
		    c += grace;
		    task.rawdate = c;
		    task.duedate = new Date(c);
		    task.duedate = task.duedate.toDateString();
		    if (c < n) {
			task.overdue = parseInt((n - c) / 1000 / 60 / 60 / 24);
			task.overdue > 0 ? task.overdue = "You are " + task.overdue + " days overdue with this task." : null;
		    }
		    task.status = task.overdue ? "error": "info";
		    task.mgs = {};
		    task.incomplete = 0;
		    task.mgs[task.metagenome_id] = true;
		
		    if (project_prios.hasOwnProperty(task.project_id)) {
			if (project_prios[task.project_id].mgs.hasOwnProperty(task.metagenome_id)) {
			    project_prios.incomplete--;
			}
			if (task.rawdate > project_prios[task.project_id].rawdate) {
			    task.mgs = project_prios[task.project_id].mgs;
			    project_prios[task.project_id] = task;
			}
			project_prios[task.project_id].mgs[task.metagenome_id] = true;
		    } else {
			project_prios[task.project_id] = task;
		    }
		} else {
		    if (! project_prios.hasOwnProperty(task.project_id)) {
			project_prios[task.project_id] = { "incomplete": 1, "mgs": {} };
			project_prios[task.project_id].mgs[task.metagenome_id] = true;
		    } else {
			if (! project_prios[task.project_id].mgs.hasOwnProperty(task.metagenome_id)) {
			    project_prios[task.project_id].mgs[task.metagenome_id] = true;
			    project_prios[task.project_id].incomplete++;
			}
		    }
		}
	    }
	    var k = Retina.keys(project_prios);
	    for (var i=0; i<k.length; i++) {
		var task = project_prios[k[i]];
		if (! task.incomplete) {
		    task.title = "project publication";
		    task.link = "?mgpage=share&project=mgp"+task.project_id;
		    task.message = "The project "+task.project+" has "+Retina.keys(project_prios[k[i]].mgs).length+" metagenomes "+(task.overdue ? "over" : "")+"due for publication."+(task.overdue ? "<br>"+task.overdue : "");
		    tasks.push(task);
		}
	    }
	}

	if (tasks.length) {
	    tasks = tasks.sort(Retina.propSort('duedate'));
	    html.push('<ul style="list-style: outside none none; margin-left: 0px;">');
	    for (var i=0; i<tasks.length; i++) {
		var task = tasks[i];
		html.push('<li'+(task.hasOwnProperty('status') ? ' style="padding: 5px; border: 1px solid; margin-bottom: 5px;" class="alert-'+task.status+'"' : '')+'><b>'+task.title+'</b><a href="'+task.link+'" class="btn btn-mini pull-right"><i class="icon icon-edit"></i> edit</a><br>'+task.message+'</li>');
	    }
	    html.push('</ul>');
	} else {
	    html.push('<p>- you currently have no tasks -</p>')
	}
	
	document.getElementById('tasksDiv').innerHTML = html.join("\n");
	jQuery("#masonry").masonry({ itemSelector : '.box' });
    };
    
    
    widget.showProfile = function () {
	var html = [];
	
	html.push('<table style="margin-bottom: 50px;">\
<tr><td style="width: 200px;"><b>firstname</b></td><td><input id="user_firstname" type="text" value="'+stm.user.firstname+'"></td></tr>\
<tr><td><b>lastname</b></td><td><input id="user_lastname" type="text" value="'+stm.user.lastname+'"></td></tr>');
	
	if (stm.user.hasOwnProperty('organization')) {
	    html.push('<tr><td><b>organization</b></td><td>'+stm.user.organization.name+'</td></tr>');
	} else {
	    html.push('<tr><td><b></b></td><td></td></tr>');
	}
	
	html.push('<tr><td style="height: 40px;"><b>login</b></td><td>'+stm.user.login+'</td></tr>\
<tr><td style="height: 40px;"><b>email</b></td><td><input id="user_email" type="text" value="'+(stm.user.email || "")+'" placeholder="enter primary email"></td></tr>\
<tr><td><b>secondary email</b></td><td><input id="user_email2" type="text" value="'+(stm.user.email2 || "")+'" placeholder="enter secondary email"></td></tr>\
<tr><td><b>change password</b></td><td><input id="user_password" type="text" placeholder="enter new password" style="margin-bottom: 0px; margin-right: 25px;"></td></tr>\
<tr><td><b>repeat password</b></td><td><input id="user_password_repeat" type="text" placeholder="repeat new password" style="margin-bottom: 0px; margin-right: 25px;"></td></tr>\
<tr><td></td><td align=right><button class="btn btn-small" onclick="Retina.WidgetInstances.metagenome_mydata[1].updateUser();">save changes</button></td></tr>\
</table>');
	
	document.getElementById('profileDiv').innerHTML = html.join("\n");
	jQuery("#masonry").masonry({ itemSelector : '.box' });
    };
    
    widget.showJobs = function (data) {
	var widget = Retina.WidgetInstances.metagenome_mydata[1];
	
	var result_data = [];
	
	// check if there is submission data and prepend it
	if (widget.submissionData) {
	    for (var i=0; i<widget.submissionData.length; i++) {
		var d = widget.submissionData[i];
		var action = "";
		if (d.status == "suspend" || d.status == "error") {
		    d.status = "error";
		    action = " <button class='btn btn-mini' onclick='alert(\"Please report this error to mg-rast@rt.mcs.anl.gov and paste the submission id: "+d.id+"\");'>?</button>";
		}
		result_data.push({ "job": "<a href='#'>-</a>",
				   "stage": "submission",
				   "status": widget.status(d.status) + action
				 });
	    }
	}
	
	// iterate over data rows
	if (data) {
	    for (var i=0; i<data.length; i++) {
		if (data[i].state == "deleted") {
		    result_data.push({ "job": data[i].info.name,
				       "stage": "-",
				       "status": "deleted"
				     });
		} else {
		    result_data.push({ "job": "<a href='?mgpage=pipeline&job="+data[i].info.name+"' target=_blank title='Metagenome\n"+data[i].info.userattr.name+"\nProject\n"+data[i].info.userattr.project_name+"'>"+data[i].info.name+"</a>",
				       "stage": data[i].remaintasks > 0 ? data[i].tasks[data[i].tasks.length - data[i].remaintasks].cmd.description : "complete",
				       "status": widget.status(data[i].state)
				     });
		}
	    }
	}
	
	return result_data;
    };
    
})();
