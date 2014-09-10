(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Metagenome Administrator Widget",
            name: "metagenome_admin",
            author: "Tobias Paczian",
            requires: []
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
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
        <h3>Statistics</h3>\
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
	    widget.statistics();

	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.dataManipulation = function (data) {
	
	for (var i=0; i<data.length; i++) {
	    data[i].email = "<a href='mailto:"+data[i].email+"'>"+data[i].email+"</a>";
	    data[i].login = "<a onclick='Retina.WidgetInstances.metagenome_admin[1].userDetails(\""+data[i].id+"\");' style='cursor: pointer;'>"+data[i].login+"</a>";
	}

	return data;
    };

    widget.statistics = function () {
	var widget = Retina.WidgetInstances.metagenome_admin[1];
	var now = new Date();
	var thirty = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 30));
	jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/?verbosity=minimal&limit=1000&entry_date=" + encodeURIComponent("["+Retina.dateString(thirty)),
		      dataType: "json",
		      success: function(data) {
			  var html = "users registered in the last 30 days: "+data.data.length;
			  document.getElementById('statistics').innerHTML = html;
		      },
		      error: function(jqXHR, error) {
			  console.log("error: unable to connect to API server");
			  console.log(error);
		      },
		      headers: widget.authHeader
		    });
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
	} else {
	    widget.user = null;
	    widget.authHeader = {};
	}
	widget.display();
    };

})();