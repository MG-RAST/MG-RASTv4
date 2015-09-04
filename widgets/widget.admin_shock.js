(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Administrator SHOCK Widget",
            name: "admin_shock",
            author: "Tobias Paczian",
            requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table"),
		 Retina.load_widget({ name: "shockbrowse", resource: "Retina/widgets" }) ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_shock[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "";
	widget.main.style.marginLeft = "30px";

	if (stm.user) {
	    widget.main.innerHTML = "<div><div class='input-append'><input type='text'><buton class='btn' onclick='Retina.WidgetInstances.admin_shock[1].impersonateUser(this.previousSibling.value);'>switch user</button></div><div id='currentUser' style='float: right; margin-right: 85px;'>You are "+stm.user.firstname + " " + stm.user.lastname +" ("+stm.user.login+" | "+stm.user.email+" | "+stm.user.id+")</div><div id='shock'></div>";
	    widget.browser = Retina.Widget.create('shockbrowse', {
		"target": document.getElementById('shock'),
		"order": "created_on",
		"direction": "desc",
		"querymode": "full",
		"allowMultiselect": true,
		"width": 1500,
		"height": 730,
		"fileSectionColumns": [
		    { "path": "file.name", "name": "Name", "width": "50%", "type": "file", "sortable": true },
		    { "path": "file.size", "name": "Size", "width": "25%", "type": "size", "align": "right", "sortable": true },
		    { "path": "created_on", "name": "Date Created", "width": "25%", "type": "date", "align": "left", "sortable": true },
		]
	    });
	    widget.browser.loginAction({ "action": "login", "result": "success", "user": stm.user, "authHeader": stm.authHeader });

	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.impersonateUser = function (login) {
	document.getElementById('currentUser').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 24px;'>";
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/user/impersonate/'+login,
	    success: function (d) {
		Retina.WidgetInstances.shockbrowse[1].authHeader = { "Authorization": "mgrast "+d.token }
		document.getElementById('currentUser').innerHTML = "You are "+d.firstname + " " + d.lastname +" ("+d.login+" | "+d.email+" | "+d.id+")";
		Retina.WidgetInstances.shockbrowse[1].updateData();
	    }}).fail(function(xhr, error) {
		alert('impersonation failed');
	    });
    };

})();