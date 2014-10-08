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

	if (widget.user) {
	    widget.sidebar.style.width = "600px";
	    widget.sidebar.style.display = "";
	    widget.main.parentNode.style.right = "660px";
	    widget.sidebar.innerHTML = "<div id='details' style='padding-left: 10px; padding-right: 10px;'></div>";

	    var html = '<h3>Users</h3><div id="usertable" style="margin-top: 2px;"></div>';

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

    // login callback
    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.admin_users[1];
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