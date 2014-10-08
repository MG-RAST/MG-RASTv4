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
	return [ Retina.load_widget("shockbrowse") ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_system[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	if (widget.user) {
	    widget.sidebar.style.display = "";
	    widget.sidebar.style.padding = "10px";
	    widget.sidebar.style.paddingTop = "20px";
	    var html = "";

	    html += "<h3>System Components</h3>";

	    html += "<button class='btn btn-mini' title='refresh' style='margin-bottom: 15px;' onclick='Retina.WidgetInstances.admin_system[1].test_components();'><i class='icon-refresh'></i></button>";

	    html += "<table>";
	    html += "<tr><td style='width: 150px;'><b>API</b></td><td id='system_api'></td></tr>";
	    html += "<tr><td><b>SHOCK</b></td><td id='system_shock'></td></tr>";
	    html += "<tr><td><b>AWE</b></td><td id='system_awe'></td></tr>";
	    html += "</table>";

	    html += "<h4>AWE Details</h4><div id='awe_details'>-</div>";

	    html += "<h4>API Details</h4><div id='api_details'>-</div>";

	    html += "<h4>SHOCK Details</h4><div id='shock_details'>-</div>";

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
		      headers: widget.authHeader,
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  widget.apiDetails(data);
			  var t = new Date().getTime();
			  document.getElementById('system_api').innerHTML = widget.status('success') + "OK in "+(t - widget.startTime)+" ms";
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_api').innerHTML = Retina.WidgetInstances.admin_system[1].status('error') + "failed in "+(t - widget.startTime)+"ms";
		      }
		    });

	jQuery.ajax({ url: RetinaConfig.awe_url+"/client",
		      headers: widget.shockAuthHeader,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  widget.aweClientData = data.data;
			  widget.aweDetails();
			  var t = new Date().getTime();
			  document.getElementById('system_awe').innerHTML = Retina.WidgetInstances.admin_system[1].status('success') + "OK in "+(t - widget.startTime)+"ms";
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  var t = new Date().getTime();
			  document.getElementById('system_awe').innerHTML = Retina.WidgetInstances.admin_system[1].status('error') + "failed in "+(t - widget.startTime)+"ms";
		      }
		    });

	jQuery.ajax({ url: RetinaConfig.shock_url+"/node",
		      headers: widget.shockAuthHeader,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.admin_system[1];
			  widget.shockDetails(data);
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

    widget.aweDetails = function () {
	var widget = Retina.WidgetInstances.admin_system[1];

	var target = document.getElementById('awe_details');

	var data = widget.aweClientData;

	var html = "client nodes registered";

	var stats = { stati: {} };
	for (var i=0; i<data.length; i++) {
	    if (! stats.stati.hasOwnProperty(data[i].Status)) {
		stats.stati[data[i].Status] = 0;
	    }
	    stats.stati[data[i].Status]++;
	}

	html += "<table style='margin-bottom: 25px;'><tr><td style='padding-right: 25px;'>total</td><td>"+data.length+"</td></tr>";
	for (var i in stats.stati) {
	    if (stats.stati.hasOwnProperty(i)) {
		html += "<tr><td style='padding-right: 25px;'>"+i+"</td><td>"+stats.stati[i]+"</td></tr>";
	    }
	}
	html += "</table>";

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

	html += "<div style='clear: both;'></div>";

	target.innerHTML = html;
    };

    widget.aweNode = function (status, id) {
	return "<div class='alert alert-"+status+"' style='width: 16px; height: 16px; padding: 0px; margin-bottom: 5px; margin-right: 5px; float: left; cursor: pointer;' onclick='Retina.WidgetInstances.admin_system[1].aweNodeDetail("+id+");'></div>";
    };

    widget.aweNodeDetail = function (id) {
	var widget = Retina.WidgetInstances.admin_system[1];

	var html = "<pre>"+JSON.stringify(widget.aweClientData[id], null, 2)+"</pre>";
	
	widget.sidebar.innerHTML = html;
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
								   "authHeader": widget.shockAuthHeader,
								   "shockBase": RetinaConfig.shock_url});
	}
    };

    widget.apiDetails = function (data) {
	var widget = Retina.WidgetInstances.admin_system[1];

	var target = document.getElementById('api_details');

	var html = data.resources.length+" resources available";

	target.innerHTML = html;
    };

    // login callback
    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.admin_system[1];
	if (data.user) {
	    widget.user = data.user;
	    widget.authHeader = { "Auth": data.token };
	    widget.shockAuthHeader = { "Authorization": "OAuth "+data.token };
	} else {
	    widget.user = null;
	    widget.authHeader = {};
	    widget.shockAuthHeader = {};
	}
	widget.display();
    };

})();