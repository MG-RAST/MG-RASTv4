(function () {
    var widget = Retina.Widget.extend({
        about: {
            title: "Metagenome User Widget",
            name: "metagenome_user",
            author: "Tobias Paczian",
            requires: []
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.metagenome_user[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	if (stm.user) {
	    widget.main.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div>';
	    stm.loadPreferences().then(function () {
		jQuery.ajax( { dataType: "json",
			       url: RetinaConfig["mgrast_api"]+"/user/"+stm.user.login+"?verbosity=full",
			       headers: stm.authHeader,
			       success: function(data) {
				   Retina.WidgetInstances.metagenome_user[1].showUser(data);
			       },
			       error: function () {
				   Retina.WidgetInstances.metagenome_user[1].target.innerHTML = "<div class='alert alert-error' style='width: 50%;'>You do not have the permisson to view this data.</div>";
			       }
			     } );
	    });
	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}


	widget.main.innerHTML = "<div class='alert alert-error'>DEPRECATED</div>";
    };

    widget.showUser = function (data) {
	var widget = Retina.WidgetInstances.metagenome_user[1];

	widget.sidebar.style.display = "";

	// start accordion
	var html = '<div class="accordion" id="mainAccordion">';

	// personal information
	html += '<div class="accordion-group">\
  <div class="accordion-heading">\
    <a class="accordion-toggle" data-toggle="collapse" data-parent="#mainAccordion" href="#collapsePersonal">';
	html += '<h4>Personal Information</h4>\
    </a>\
  </div>\
  <div id="collapsePersonal" class="accordion-body collapse in">\
    <div class="accordion-inner">\
<table style="margin-bottom: 50px;">\
  <tr><td style="width: 200px;"><b>firstname</b></td><td><input id="user_firstname" type="text" value="'+data.firstname+'"></td></tr>\
  <tr><td><b>lastname</b></td><td><input id="user_lastname" type="text" value="'+data.lastname+'"></td></tr>\
  <tr><td style="height: 40px;"><b>login</b></td><td>'+data.login+'</td></tr>\
  <tr><td style="height: 40px;"><b>email</b></td><td>'+data.email+'</td></tr>\
  <tr><td><b>secondary email</b></td><td><input id="user_email2" type="text" value="'+(data.email2 || "")+'" placeholder="enter secondary email"></td></tr>\
  <tr><td><b>change password</b></td><td><input id="user_password" type="text" placeholder="enter new password" style="margin-bottom: 0px; margin-right: 25px;"></td><td><button class="btn btn-small" onclick="Retina.WidgetInstances.metagenome_user[1].updateUser();">save changes</button></td></tr>\
</table>\
    </div>\
  </div>\
</div>';

	// personal jobs
	html += '<div class="accordion-group">\
  <div class="accordion-heading">\
    <a class="accordion-toggle" data-toggle="collapse" data-parent="#mainAccordion" href="#collapseJobs">';
	html += '<h4>Your Jobs</h4>\
    </a>\
  </div>\
  <div id="collapseJobs" class="accordion-body collapse">\
<div class="accordion-inner"><div id="jobtable"></div></div></div></div>';

	// stored searches
	if (stm.user.preferences && stm.user.preferences.searches) {
	    html += '<div class="accordion-group">\
  <div class="accordion-heading">\
    <a class="accordion-toggle" data-toggle="collapse" data-parent="#mainAccordion" href="#collapseSearches">';
	    html += '<h4>Your Search Queries</h4>\
    </a>\
  </div>\
  <div id="collapseSearches" class="accordion-body collapse">\
    <div class="accordion-inner">';
	    html += '<table class="table table-condensed">';
	    var sses = Retina.keys(stm.user.preferences.searches).sort();
	    for (var i=0; i<sses.length; i++) {
		var search = stm.user.preferences.searches[sses[i]];
		html += '<tr><td style="padding-bottom: 20px;"><table><tr><td colspan=2 style="border: none;"><a href="mgmain.html?mgpage=search&stored='+i+'" target=_blank><b>'+search.name+'</b></a></td></tr>';
		html += '<tr><td colspan=2 style="border: none;">'+(search.description || '- no description available -')+'</td></tr>';
		html += '<tr><td style="border: none;">searchtype</td><td style="border: none;">'+search.querytypes.join(', ')+'</td></tr>';
		html += '<tr><td style="border: none;">searched terms</td><td style="border: none;">';
		for (var h in search.advancedOptions) {
		    if (search.advancedOptions.hasOwnProperty(h)) {
			html += "<i>"+h+"</i> - "+search.advancedOptions[h]+"<br>";
		    }
		}
		html += '</td></tr>';
		html += '</table></td></tr>';
	    }
	    html += '</table>\
    </div>\
  </div>\
</div>';
	}

	html += "</div>";
	    
	widget.main.innerHTML = html;

	// execute job table
	var job_columns = [ "job", "stage", "status", "tasks" ];
	var job_table_filter = { 0: { "type": "text" },
				 2: { "type": "text" } };
	widget.job_table = Retina.Renderer.create("table", {
	    target: document.getElementById('jobtable'),
	    rows_per_page: 15,
	    filter_autodetect: false,
	    filter: job_table_filter,
	    sort_autodetect: true,
	    synchronous: false,
	    sort: "job",
	    query_type: "equal",
	    default_sort: "job",
	    asynch_column_mapping: { "job": "info.name",
				     "status": "state" },
	    headers: stm.authHeader,
	    data_manipulation: Retina.WidgetInstances.metagenome_user[1].jobTable,
	    minwidths: [1,1,1,1],
	    navigation_url: RetinaConfig['mgrast_api'] + "/pipeline?info.pipeline=mgrast-prod&info.user="+stm.user.login,
	    data: { data: [], header: job_columns }
	});
	widget.job_table.render();
	widget.job_table.update({},1);

	// sidebar
	var side = '<div style="padding-left: 15px; padding-right: 15px;"><h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/info2.png">Personal Information</h3><p>In this section you can update your personal information.</p></div>';
	
	widget.sidebar.innerHTML = side;
    };

    widget.updateUser = function () {
	var widget = Retina.WidgetInstances.metagenome_user[1];

	var password = document.getElementById('user_password').value;
	var firstname = document.getElementById('user_firstname').value;
	var lastname = document.getElementById('user_lastname').value;
	var email = document.getElementById('user_email2').value;

	jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/" + stm.user.login,
		      method: "PUT",
		      dataType: "json",
		      data: "firstname="+firstname+"&lastname="+lastname+"&email2="+email,
		      success: function(data) {
			  Retina.WidgetInstances.metagenome_user[1].display();
		      },
		      error: function(jqXHR, error) {
			  console.log("error: unable to connect to API server");
			  console.log(error);
		      },
		      headers: stm.authHeader
		    });
	
	if (password.length) {
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
    };

    widget.jobTable = function (data) {
	var widget = Retina.WidgetInstances.metagenome_user[1];

	var result_data = [];
	// iterate over data rows
	for (var i=0; i<data.length; i++) {
	    if (data[i].state == "deleted") {
		result_data.push({ "job": data[i].info.name,
				   "stage": "-",
				   "status": "deleted",
				   "tasks": "-"
				 });
	    } else {
		result_data.push({ "job": "<a href='mgmain.html?mgpage=pipeline&job="+data[i].id+"' target=_blank>"+data[i].info.name+"</a>",
				   "stage": data[i].remaintasks > 0 ? data[i].tasks[data[i].tasks.length - data[i].remaintasks].cmd.description : "complete",
				   "status": widget.status(data[i].state),
				   "tasks": widget.dots(data[i].tasks)
				 });
	    }
	}

	return result_data;
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
})();
