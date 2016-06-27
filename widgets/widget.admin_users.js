(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Administrator Users Widget",
            name: "admin_users",
            author: "Tobias Paczian",
            requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_users[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	if (stm.user) {
	    widget.sidebar.style.display = "";
	    widget.main.parentNode.style.right = "660px";
	    widget.sidebar.innerHTML = "<div id='details' style='padding-left: 10px; padding-right: 10px;'><h4>User Details</h4><p>click on a user in the lefthand table to view the details here.</p></div>";

	    var html = '<h3>Account Requests</h3><div id="requests"><img src="Retina/images/waiting.gif" style="width: 20px;"></div><h3>Users</h3><div id="usertable" style="margin-top: 2px;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    // create the user table
	    var result_columns = [ "login", "firstname", "lastname", "email", "email2", "entry_date", "id" ];

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
		    rows_per_page: 20,
		    filter_autodetect: false,
		    filter: result_table_filter,
		    sort_autodetect: true,
		    synchronous: false,
		    sort: "lastname",
		    default_sort: "lastname",
		    headers: stm.authHeader,
		    invisible_columns: { 5: true },
		    data_manipulation: Retina.WidgetInstances.admin_users[1].dataManipulation,
		    minwidths: [150,150,150,80,150,150,85,1],
		    navigation_url: RetinaConfig.mgrast_api+'/user?verbosity=minimal',
		    data: { data: [], header: result_columns }
		});
	    } else {
		widget.result_table.settings.target = document.getElementById('usertable');
	    }
	    widget.result_table.render();
	    widget.result_table.update({},1);

	    // check for account requests
	    jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/?verbosity=request_access",
			  dataType: "json",
			  success: function(data) {
			      Retina.WidgetInstances.admin_users[1].showRequests(data);
			  },
			  error: function (xhr) {
			      Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
			  },
			  headers: stm.authHeader
			});

	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.showRequests = function (data) {
	var widget = Retina.WidgetInstances.admin_users[1];

	var target = document.getElementById('requests');

	widget.account_requests = data;

	var html = "";
	
	if (data && data.length) {
	    html = "<button class='btn btn-small' style='position: relative; float: right; bottom: 35px;' onclick='Retina.WidgetInstances.admin_users[1].handleRequests();'>handle requests</button><table class='table table-condensed'><tr><td><b>firstname</b></td><td><b>lastname</b></td><td><b>login</b></td><td><b>email</b></td><td><b>request time</b></td><td style='text-align: center;'><b>accept</b></td><td style='text-align: center;'><b>deny</b></td><td style='text-align: center;'><b>defer</b></td></tr>";
	    for (var i=0; i<data.length; i++) {
		html += "<tr><td>"+data[i].firstname+"</td><td>"+data[i].lastname+"</td><td>"+data[i].login+"</td><td>"+data[i].email+"</td><td>"+data[i].entry_date+"</td><td style='text-align: center;'><input type='radio' name='requestaction_"+data[i].login+"' id='requestaction_accept_"+data[i].login+"'></td><td style='text-align: center;'><input type='radio' name='requestaction_"+data[i].login+"' id='requestaction_deny_"+data[i].login+"'></td><td style='text-align: center;'><input type='radio' name='requestaction_"+data[i].login+"' id='requestaction_defer_"+data[i].login+"' checked></td></tr>";
	    }
	    html += "</table>";
	} else {
	    html = "<p> - no pending requests - </p>";
	}

	target.innerHTML = html;
    };

    widget.handleRequests = function () {
	var widget = Retina.WidgetInstances.admin_users[1];
	
	var data = widget.account_requests;

	var promises = [];
	for (var i=0; i<data.length; i++) {
	    if (document.getElementById("requestaction_deny_"+data[i].login).checked) {
		var reason = prompt("reason to deny "+data[i].firstname+" "+data[i].lastname+" ("+data[i].login+")?", "-");
		promises.push(jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/"+data[i].login+"/deny?reason="+encodeURIComponent(reason),
					    dataType: "json",
					    success: function(data) {
						Retina.WidgetInstances.admin_users[1].showRequests(data);
					    },
					    error: function (xhr) {
						Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
					    },
					    headers: stm.authHeader
					  }));
	    }
	    else if (document.getElementById("requestaction_accept_"+data[i].login).checked) {
		promises.push(jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/"+data[i].login+"/accept",
					    dataType: "json",
					    success: function(data) {
						Retina.WidgetInstances.admin_users[1].showRequests(data);
					    },
					    error: function (xhr) {
						Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
					    },
					    headers: stm.authHeader
					  }));
	    }
	}
	if (promises.length) {
	    jQuery.when.apply(this, promises).then(function() {
		widget.display();
	    });
	}
    };

    /*
      USERS
     */
    widget.dataManipulation = function (data) {
	for (var i=0; i<data.length; i++) {
	    data[i].email = "<a href='mailto:"+data[i].email+"'>"+data[i].email+"</a>";
	    data[i].email2 = data[i].email2 ? "<a href='mailto:"+data[i].email2+"'>"+data[i].email2+"</a>" : "-";
	    data[i].login = "<a onclick='Retina.WidgetInstances.admin_users[1].userDetails(\""+data[i].id+"\");' style='cursor: pointer;'>"+data[i].login+"</a>";
	}

	return data;
    };

    widget.userDetails = function (id) {
	var widget = Retina.WidgetInstances.admin_users[1];
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
				  data_id = '<a href="mgmain.html?mgpage=overview&metagenome='+Retina.idmap(data_id)+'" target=_blank>'+data_id+'</a>';
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
		      error: function (xhr) {
			  Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		      },
		      headers: stm.authHeader
		    });
    };
})();
