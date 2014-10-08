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
	return [ ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_system[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	if (widget.user) {
	    var html = "";

	    html += "<h3>System Components</h3>";

	    html += "<button class='btn btn-mini' title='refresh' style='margin-bottom: 15px;' onclick='Retina.WidgetInstances.admin_system[1].test_components();'><i class='icon-refresh'></i></button>";

	    html += "<table>";
	    html += "<tr><td style='width: 150px;'><b>API</b></td><td id='system_api'></td></tr>";
	    html += "<tr><td><b>SHOCK</b></td><td id='system_shock'></td></tr>";
	    html += "<tr><td><b>AWE</b></td><td id='system_awe'></td></tr>";
	    html += "</table>";

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
	
	widget.startTime = new Date().getTime();

	document.getElementById('system_api').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";
	document.getElementById('system_shock').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";
	document.getElementById('system_awe').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";

	jQuery.ajax({ url: RetinaConfig.mgrast_api,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_api').innerHTML = widget.status('success') + "OK in "+(t - widget.startTime)+" ms";
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_shock').innerHTML = Retina.WidgetInstances.admin_system[1].status('error') + "failed in "+(t - widget.startTime)+"ms";
		      }
		    });

	jQuery.ajax({ url: RetinaConfig.awe_url,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_awe').innerHTML = Retina.WidgetInstances.admin_system[1].status('success') + "OK in "+(t - widget.startTime)+"ms";
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_shock').innerHTML = Retina.WidgetInstances.admin_system[1].status('error') + "failed in "+(t - widget.startTime)+"ms";
		      }
		    });

	jQuery.ajax({ url: RetinaConfig.shock_url,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_shock').innerHTML = Retina.WidgetInstances.admin_system[1].status('success') + "OK in "+(t - widget.startTime)+"ms";
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_shock').innerHTML = Retina.WidgetInstances.admin_system[1].status('error') + "failed in "+(t - widget.startTime)+"ms";
		      }
		    });
    };

    // login callback
    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.admin_system[1];
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