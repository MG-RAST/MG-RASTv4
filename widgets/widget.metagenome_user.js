(function () {
    widget = Retina.Widget.extend({
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

	if (widget.user) {
	    widget.sidebar.style.display = "";
	    
	    widget.loadUser();

	    widget.main.innerHTML = "<div id='user_detail'><img src='Retina/images/waiting.gif' style='position: relative; left: 40%; top: 200px;'></div>";
	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.loadUser = function () {
	var widget = Retina.WidgetInstances.metagenome_user[1];

	jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/" + widget.user.login + "?verbosity=full",
		      dataType: "json",
		      success: function(data) {
			  var html = '<h4>'+data.firstname+' '+data.lastname+'</h4>\
<table style="margin-bottom: 50px;">\
  <tr><td style="width: 200px;"><b>firstname</b></td><td><input id="user_firstname" type="text" value="'+data.firstname+'"></td></tr>\
  <tr><td><b>lastname</b></td><td><input id="user_lastname" type="text" value="'+data.lastname+'"></td></tr>\
  <tr><td style="height: 40px;"><b>login</b></td><td>'+data.login+'</td></tr>\
  <tr><td style="height: 40px;"><b>email</b></td><td>'+data.email+'</td></tr>\
  <tr><td><b>secondary email</b></td><td><input id="user_email2" type="text" value="'+(data.email2 || "")+'" placeholder="enter secondary email"></td></tr>\
  <tr><td><b>change password</b></td><td><input id="user_password" type="text" placeholder="enter new password" style="margin-bottom: 0px; margin-right: 25px;"></td><td><button class="btn btn-small" onclick="Retina.WidgetInstances.metagenome_user[1].updateUser();">save changes</button></td></tr>\
  <tr><td style="height: 40px;"><b>entry date</b></td><td>'+data.entry_date+'</td></tr>\
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

			  document.getElementById('user_detail').innerHTML = html;
		      },
		      error: function(jqXHR, error) {
			  console.log("error: unable to connect to API server");
			  console.log(error);
		      },
		      headers: widget.authHeader
		    });
    };

    widget.updateUser = function () {
	var widget = Retina.WidgetInstances.metagenome_user[1];

	var password = document.getElementById('user_password').value;
	var firstname = document.getElementById('user_firstname').value;
	var lastname = document.getElementById('user_lastname').value;
	var email = document.getElementById('user_email2').value;

	jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/" + widget.user.login,
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
		      headers: widget.authHeader
		    });
	
	if (password.length) {
	    jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/" + widget.user.login+"/setpassword?dwp="+password,
			  method: "GET",
			  dataType: "json",
			  success: function(data) {
			      alert('password changed');
			  },
			  error: function(jqXHR, error) {
			      console.log("error: unable to connect to API server");
			      console.log(error);
			  },
			  headers: widget.authHeader
			});
	    
	}
    };

    widget.loginAction = function (data) {
	var widget = Retina.WidgetInstances.metagenome_user[1];
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