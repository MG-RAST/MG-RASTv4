(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Administrator System Widget",
            name: "admin_system",
            author: "Tobias Paczian",
            requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_widget({ name: "shockbrowse", resource: "Retina/widgets" }) ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_system[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	if (stm.user) {
	    widget.sidebar.style.display = "";
	    widget.sidebar.style.padding = "10px";
	    widget.sidebar.style.paddingTop = "20px";
	    var html = "";

	    html += "<h3>System Components</h3>";

	    html += "<button class='btn btn-mini' title='refresh' style='margin-bottom: 15px;' onclick='Retina.WidgetInstances.admin_system[1].test_components();'><i class='icon-refresh'></i></button>";

	    html += "<div id='serverstatus' class='alert alert-info' style='text-align: center;'>checking server status... <img src='Retina/images/waiting.gif' style='width: 16px;'></div>";
	    
	    html += "<table>";
	    html += "<tr><td style='width: 150px;'><b>Website</b></td><td id='system_website'></td></tr>";
	    html += "<tr><td style='width: 150px;'><a href='#awe'><b>AWE</b></a></td><td id='system_AWE'></td></tr>";
	    html += "<tr><td><a href='#shock'><b>SHOCK</b></a></td><td id='system_SHOCK'></td></tr>";
	    html += "<tr><td><a href='#api'><b>API</b></a></td><td id='system_api'></td></tr>";
	    html += "<tr><td><b>m5nr solr</b></td><td id='system_M5NR'></td></tr>";
	    html += "<tr><td><b>metagenome solr</a></td><td id='system_solr'></td></tr>";
	    html += "<tr><td><b>mySQL</a></td><td id='system_mySQL'></td></tr>";
	    html += "<tr><td><b>Cassandra</a></td><td id='system_cassandra'></td></tr>";
	    html += "</table>";

	    html += "<h4 style='margin-top: 50px;'><a name='awe'></a>AWE Details</h4><div id='awe_details'>-</div>";
	    html += "<h4 style='margin-top: 50px;'><a name='shock'></a>SHOCK Details</h4><div id='shock_details'>-</div>";
	    html += "<h4 style='margin-top: 50px;'><a name='api'></a>API Details</h4><div id='api_details'>-</div>";

	    widget.main.innerHTML = html;

	    widget.test_components();
	    
	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.status = function (status) {
	return "<div class='alert alert-"+status+"' style='width: 16px; height: 16px; padding: 0px; margin-bottom: 0px; margin-right: 5px; float: left;'></div>";
    };

    widget.test_components = function () {
	var widget = Retina.WidgetInstances.admin_system[1];

	// get api details
	document.getElementById('system_api').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";
	jQuery.ajax({ url: RetinaConfig.mgrast_api,
		      dataType: "json",
		      headers: stm.authHeader,
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_api').innerHTML = widget.status('success') + "OK in "+(t - widget.startTime)+" ms";
			  widget.apiDetails(data);
		      },
		      error: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_api').innerHTML = widget.status('error') + "failed in "+(t - widget.startTime)+" ms";
		      }
		    });
	
	// iterate over services to check
	widget.startTime = new Date().getTime();
	var sites = ['website',
		     'SHOCK',
		     'AWE',
		     'M5NR',
		     'solr',
		     'mySQL',
		     'cassandra' ];

	for (var i=0; i<sites.length; i++) {
	    document.getElementById('system_'+sites[i]).innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";
	    jQuery.getJSON(RetinaConfig.mgrast_api+"/heartbeat/"+sites[i], function(data) {
		var widget = Retina.WidgetInstances.admin_system[1];
		var t = new Date().getTime();
		document.getElementById('system_'+data.service).innerHTML = (data.status ? widget.status('success') + "OK in " : widget.status('error') + "failed in ")+(t - widget.startTime)+" ms";
	    });
	}

	// get awe details
	jQuery.ajax({ url: RetinaConfig.awe_url+"/client",
		      headers: stm.authHeader,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  widget.aweClientData = data.data;
			  widget.aweDetails();
		      }
		    });
	
	// get shock details
	jQuery.ajax({ url: RetinaConfig.shock_url+"/node",
		      headers: stm.authHeader,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  widget.shockDetails(data);
		      }
		    });

	// get the server resource information
	jQuery.ajax({ url: RetinaConfig.mgrast_api+"/server/MG-RAST",
		      dataType: "json",
		      headers: stm.authHeader,
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var html = [];
			  html.push("<p>MG-RAST server running version "+data.version+"</p>");
			  html.push("<p>hosting "+parseInt(data.public_metagenomes).formatString()+" public and "+parseInt(data.metagenomes).formatString()+" total metagenomes with "+parseInt(parseInt(data.basepairs) / 1000000000000).formatString(2)+" Tbp and "+parseInt(parseInt(data.sequences) / 1000000000).formatString()+" billion sequences.</p>");
			  html.push("<p>Server status is "+data.status+", "+(data.info ? " the server message is: '"+data.info+"'" : " there is no server message")+".<button class='btn btn-small pull-right' onclick='Retina.WidgetInstances.admin_system[1].editSystemMessage();'>edit</button></p>");
			  html.push("<div id='editMessage' style='display: none; margin-top: 20px; padding: 10px; border-radius: 3px; border: 1px solid;'></div>");
			  document.getElementById('serverstatus').innerHTML = html.join("");
		      },
		      error: function(data) {
			  document.getElementById('serverstatus').innerHTML = "<div class='alert alert-error'>could not access MG-RAST server resource</div>";
		      }
		    });
    };

    widget.editSystemMessage = function () {
	var widget = this;

	var html = [];
	html.push("<table style='text-align: left;'><tr><td style='padding-right: 50px;'>message</td><td><input type='text' id='serverMessageText'></td></tr><tr><td>message is</td><td><select id='messageStatus'><option>active</option><option>inactive</option></select></td></tr><tr><td>message severity</td><td><select id='severity'><option>info</option><option>down</option></select></td></tr><tr><td colspan=2><button class='btn btn-small' onclick='Retina.WidgetInstances.admin_system[1].setSystemMessage();'>update</button></td></tr></table>");

	document.getElementById('editMessage').innerHTML = html.join("");

	jQuery('#editMessage').toggle();
    };

    widget.setSystemMessage = function () {
	var widget = this;
	
	// impersonate mgrast
	jQuery.ajax({ url: RetinaConfig.mgrast_api+"/user/impersonate/mgrast",
		      dataType: "json",
		      headers: stm.authHeader,
		      success: function(data) {
			  var newNodeAttributes = { "message": document.getElementById('serverMessageText').value,
						    "severity": document.getElementById('severity').options[document.getElementById('severity').selectedIndex].value,
						    "status": document.getElementById('messageStatus').options[document.getElementById('messageStatus').selectedIndex].value,
						    "type": "server" };
			  document.getElementById('serverstatus').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";
			  var fd = new FormData();
			  fd.append('attributes', new Blob([ JSON.stringify(newNodeAttributes) ], { "type" : "text\/json" }));
			  jQuery.ajax({ url: RetinaConfig.shock_url+"/node/7ed4f9af-ed76-4de9-9dfe-42bfe4e354e8",
					headers: { "Authorization": "mgrast "+data.token},
					contentType: false,
					processData: false,
					data: fd,
					crossDomain: true,
					type: "PUT",
					success: function(data) {
					    var widget = Retina.WidgetInstances.admin_system[1];
					    document.getElementById('serverstatus').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";
					    widget.test_components();
					},
					error: function(data) {
					    var widget = Retina.WidgetInstances.admin_system[1];
					    document.getElementById('serverstatus').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";
					    alert('could not set message');
					    widget.test_components();
					}
				      });
		      },
		      error: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  alert('could not impersonate mgrast');
			  widget.test_components();
		      }
		    });
    };
    
    widget.aweDetails = function () {
	var widget = Retina.WidgetInstances.admin_system[1];

	var target = document.getElementById('awe_details');

	var data = widget.aweClientData;

	var stats = { stati: {} };
	for (var i=0; i<data.length; i++) {
	    if (! stats.stati.hasOwnProperty(data[i].Status)) {
		stats.stati[data[i].Status] = 0;
	    }
	    stats.stati[data[i].Status]++;
	}
	var clientData = { all: data.length };
	for (var i in stats.stati) {
	    if (stats.stati.hasOwnProperty(i)) {
		clientData[i] = stats.stati[i];
	    }
	}
	
	var html = "<div id='aweExtended' style='width: 200px; float: left;'></div>";
	html += "<button class='btn btn-small' style='float: right; position: relative; bottom: 30px;' onclick='if(this.nextSibling.style.display==\"none\"){this.nextSibling.style.display=\"\";}else{this.nextSibling.style.display=\"none\";}'><i class='icon-fullscreen'></i> error summary</button><div id='awe_errors' style='float: left; width: 600px; margin-left: 50px; display: none;'><img src='Retina/images/waiting.gif' style='margin-left: 50%; margin-top: 50px; margin-bottom: 50px; width: 32px;'></div>";
	html += "<div style='float: left; margin-left: 50px; margin-bottom: 25px;'><button class='btn btn-small' onclick='Retina.WidgetInstances.admin_system[1].resumeAllClients();'>resume clients</button> <button class='btn btn-small' onclick='Retina.WidgetInstances.admin_system[1].resumeAllJobs();'>resume jobs</button></div>";
	html += "<div style='float: left; width: 600px; margin-left: 50px;'>";

	for (var i=0; i<data.length; i++) {
	    if (data[i].Status == "active-idle") {
		html += widget.aweNode('info', i);
	    } else if (data[i].Status == "active-busy") {
		html += widget.aweNode('success', i);
	    } else if (data[i].Status == "suspend") {
		html += widget.aweNode('danger', i);
	    } else if (data[i].Status == "deleted") {
		html += widget.aweNode('warning', i);
	    }
	}

	html += "</div><div style='clear: both;'></div>";

	target.innerHTML = html;

	// get the overview data
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig["awe_url"]+"/queue",
		       headers: stm.authHeader,
		       clients: clientData,
		       success: function(data) {
			   var result = data.data;
			   var rows = result.split("\n");
			   
			   return_data = { "total clients": this.clients,
					   "total jobs": { "all": rows[1].match(/\d+/)[0],
							   "in-progress": rows[2].match(/\d+/)[0],
							   "suspended": rows[3].match(/\d+/)[0] },
					   "total tasks": { "all": rows[4].match(/\d+/)[0],
							    "queuing": rows[5].match(/\d+/)[0],
							    "in-progress": rows[6].match(/\d+/)[0],
							    "pending": rows[7].match(/\d+/)[0],
							    "completed": rows[8].match(/\d+/)[0],
							    "suspended": rows[9].match(/\d+/)[0] },
					   "total workunits": { "all": rows[11].match(/\d+/)[0],
								"queueing": rows[12].match(/\d+/)[0],
								"checkout": rows[13].match(/\d+/)[0],
								"suspended": rows[14].match(/\d+/)[0] } };
			   
			   var html = '<table class="table">';
			   for (h in return_data) {
			       if (return_data.hasOwnProperty(h)) {
				   html += '<tr><th colspan=2>'+h+'</th><th>'+return_data[h]['all']+'</th></tr>';
				   for (j in return_data[h]) {
				       if (return_data[h].hasOwnProperty(j)) {
					   if (j == 'all') {
					       continue;
					   }
					   html += '<tr><td></td><td>'+j+'</td><td>'+return_data[h][j]+'</td></tr>';
				       }
				   }
			       }
			   }
			   html += '</table>';
			   document.getElementById('aweExtended').innerHTML = html;
		       }
		     });

	// get the errors from the suspended jobs
	jQuery.ajax( { dataType: "json",
		       url: RetinaConfig["awe_url"]+"/job?suspend&limit=100&offset=0",
		       headers: stm.authHeader,
		       success: function(data) {
			   Retina.WidgetInstances.admin_system[1].parseAWEErrors(data);
		       }
		     } );
    };

    widget.parseAWEErrors = function (data) {
	var widget = Retina.WidgetInstances.admin_system[1];

	var errors = {};
	var promises = [];
	widget.worknotes = [];
	for (var i=0; i<data.data.length; i++) {
	    var err = data.data[i].notes;

	    // parse out ids
	    err = err.replace(/[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}_/g, "");
	    
	    // check if a stage failed
	    if (err.match(/failed i?n? ?enqueuing task/)) {
		var parts = /failed i?n? ?enqueuing task (\d+), err=(.+)$/.exec(err);
		if (parts) {
		    if (! errors.hasOwnProperty(parts[1])) {
			errors[parts[1]] = [];
		    }
		    errors[parts[1]].push(parts[2]);
		}
	    }
	    // check if a workunit failed
	    else if (err.match(/^workunit.+failed/)) {
		var promise = jQuery.Deferred();
		promises.push(promise);
		jQuery.ajax( { dataType: "json",
			       url:RetinaConfig["awe_url"]+"/work/"+data.data[i].lastfailed+"?report=worknotes",
			       headers: stm.authHeader,
			       promise: promise,
			       success: function(data) {
				   Retina.WidgetInstances.admin_system[1].worknotes.push(data.data);
				   this.promise.resolve();
			       }
			     } );
	    }

	    else {
		console.log(data.data[i]);
	    }
	}
	if (promises.length) {
	    jQuery.when.apply(this, promises).then(function() {
		var d = Retina.WidgetInstances.admin_system[1].worknotes;
		var errs = {};
		for (var i=0; i<d.length; i++) {
		    if (! errs.hasOwnProperty(d[i])) {
			errs[d[i]] = 0;
		    }
		    errs[d[i]]++;
		}
		var errslist = [ "<tr><td><b>worknode error</b></td><td><b>occurrences</b></td></tr>" ];
		for (var i in errs) {
		    if (errs.hasOwnProperty(i)) {
			errslist.push("<tr><td>"+i+"</td><td>"+errs[i]+"</td></tr>");
		    }
		}
		document.getElementById('awe_errors').innerHTML += "<table class='table table-condensed'>"+errslist.join("")+"</table>";
	    });
	}

	var html = "<table class='table table-condensed'><tr><td><b>task error</b></td><td><b>task</b></td><td><b>occurrences</b></td></tr>";
	for (var i in errors) {
	    if (errors.hasOwnProperty(i)) {
		html += "<tr><td>"+errors[i][0]+"</td><td style='width: 100px;'>"+i+"</td><td style='width: 100px;'>"+errors[i].length+"</td></tr>";
	    }
	}
	html += "</table>";
	
	document.getElementById('awe_errors').innerHTML = html;
    };

    widget.aweNode = function (status, id) {
	return "<div class='alert alert-"+status+"' style='width: 16px; height: 16px; padding: 0px; margin-bottom: 5px; margin-right: 5px; float: left; cursor: pointer;' onclick='Retina.WidgetInstances.admin_system[1].aweNodeDetail("+id+");'></div>";
    };

    widget.aweNodeDetail = function (id) {
	var widget = Retina.WidgetInstances.admin_system[1];

	var html = "<pre>"+JSON.stringify(widget.aweClientData[id], null, 2)+"</pre>";
	
	widget.sidebar.innerHTML = html;
    };

    widget.resumeAllJobs = function () {
	var widget = Retina.WidgetInstances.admin_system[1];
	jQuery.ajax({
	    method: "PUT",
	    dataType: "json",
	    headers: stm.authHeader, 
	    url: RetinaConfig["awe_url"]+"/job?resumeall",
	    success: function (data) {
		Retina.WidgetInstances.admin_system[1].test_components();
		alert('all jobs resumed');
	    }}).fail(function(xhr, error) {
		alert('failed to resume all jobs');
	    });
    };

    widget.resumeAllClients = function () {
	var widget = Retina.WidgetInstances.admin_system[1];
	jQuery.ajax({
	    method: "PUT",
	    dataType: "json",
	    headers: stm.authHeader, 
	    url: RetinaConfig["awe_url"]+"/client?resumeall",
	    success: function (data) {
		Retina.WidgetInstances.admin_system[1].test_components();
		alert('all clients resumed');
	    }}).fail(function(xhr, error) {
		alert('failed to resume all clients');
	    });
    };

    widget.shockDetails = function (data) {
	var widget = Retina.WidgetInstances.admin_system[1];

	var target = document.getElementById('shock_details');

	if (widget.hasOwnProperty('browser')) {
	    widget.browser.target = target;
	    widget.browser.display();
	} else {
	    widget.browser = Retina.Widget.create("shockbrowse", { "target": document.getElementById("browser"),
								   "width": Retina.WidgetInstances.shockbrowse[0].sizes.small[0],
								   "height": Retina.WidgetInstances.shockbrowse[0].sizes.small[1],
								   "target": target,
								   "authHeader": stm.authHeader,
								   "shockBase": RetinaConfig.shock_url});
	}
    };

    widget.apiDetails = function (data) {
	var widget = Retina.WidgetInstances.admin_system[1];

	var target = document.getElementById('api_details');

	widget.apiData = data;

	var html = data.resources.length+" resources available ";
	html += "<button class='btn btn-mini' onclick='Retina.WidgetInstances.admin_system[1].apiDetailsExtended();'>details</button><div id='apiExtended'></div>";

	target.innerHTML = html;
    };
    
    widget.apiDetailsExtended = function () {
	var widget = Retina.WidgetInstances.admin_system[1];

	var target = document.getElementById('apiExtended');
	var data = widget.apiData;
	var html = "";
	for (var i=0; i<data.resources.length; i++) {
	    html += "<div id='api_resources_"+data.resources[i].name+"'></div>";
	}
	target.innerHTML += html;

	for (var i=0; i<data.resources.length; i++) {
	    jQuery.ajax({ url: data.resources[i].url,
			  res: data.resources[i].name,
			  dataType: "json",
			  success: function(data) {
			      var html = "<b>"+this.res+": </b>"+(data.requests.length - 1)+" requests available, testing examples...";
			      for (var h=1; h<data.requests.length; h++) {
				  if (data.requests[h].hasOwnProperty('example')) {
				      if (data.requests[h].example[0].match(/^http/)) {
					  html += "<div id='api_resource_"+this.res+"_request_"+h+"' style='margin-left: 50px;'><a href='"+data.requests[h].example[0]+"' target=_blank>"+data.requests[h].name+"</a> - <img src='Retina/images/waiting.gif' style='width: 16px;'></div>";
				      } else {
					  html += "<div style='margin-left: 50px;'>"+data.requests[h].name+" - no http example:</div><br><pre>"+data.requests[h].example[0]+"</pre>";
				      }
				  } else {
				      html += "<div style='margin-left: 50px;'>"+data.requests[h].name+" - no example available</div>";
				  }
			      }
			      document.getElementById("api_resources_"+this.res).innerHTML = html;
			      for (var h=1; h<data.requests.length; h++) {
				  if (! data.requests[h].hasOwnProperty('example') || ! data.requests[h].example[0].match(/^http/)) {
				      continue;
				  }
				  jQuery.ajax({ url: data.requests[h].example[0],
						res: "api_resource_"+this.res+"_request_"+h,
						req: data.requests[h].name,
						time: new Date().getTime(),
						dataType: "json",
						success: function(data) {
						    document.getElementById(this.res).innerHTML = "<a href='"+this.url+"' target=_blank>"+this.req+"</a> - <span style='color: green;'>OK</span> in "+((new Date().getTime() - this.time) / 1000).formatString(3)+" seconds";
						},
						error: function(jqXHR, error) {
						    document.getElementById(this.res).innerHTML = "<a href='"+this.url+"' target=_blank>"+this.req + "</a> - <span style='color: red;'>failed</span> in "+((new Date().getTime() - this.time) / 1000).formatString(3)+" seconds";
						},
						timeout: 30000
					      });
			      }
			  },
			  error: function(jqXHR, error) {
			      document.getElementById("api_resources_"+this.res).innerHTML = this.res + " - <span style='color: red;'>failed</span>";
			  }
			});
	}

    };
})();
