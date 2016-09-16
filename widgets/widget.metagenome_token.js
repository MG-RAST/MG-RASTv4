(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Token Widget",
                name: "metagenome_token",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ ];
    };
    
    widget.display = function (params) {
        widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;
	
	sidebar.parentNode.style.display = "none";
	content.className = "span10 offset1";
	
	document.getElementById("pageTitle").innerHTML = "claim token";

	var html = [];
	
	// check if we have a project parameter
	if (Retina.cgiParam('token')) {
	    var token = Retina.cgiParam('token');
	    
	    if (stm.user) {
		html.push('<div style="width: 34px; margin-left: auto; margin-right: auto; margin-top: 250px; text-align: center;"><img src="Retina/images/waiting.gif" style="width: 32px;"></div>');
		widget.checkToken();
	    } else {
		html.push('<div class="alert alert-info" style="width: 400px; margin-left: auto; margin-right: auto;">To claim your invitation, please log in. You can find the login button at the top right corner of the screen.<br><br>If you do not yet have an account, please register using the register button, also located at the top right. Once your account is created, you can claim your invitation.</div>');
	    }
	} else {
	    html.push('<div class="alert alert-danger" style="width: 400px; margin-left: auto; margin-right: auto;">Error: No token detected</div>');
	}
	
	content.innerHTML = html.join("");
    };

    widget.checkToken = function () {
	var widget = this;

	jQuery.ajax({ url: RetinaConfig.mgrast_api + "/user/claimtoken/" + Retina.cgiParam('token'),
		      headers: stm.authHeader,
		      contentType: 'application/json',
		      complete: function (data) {
			  var html = "";
			  if (data) {
			      if (data.ERROR) {
				  html = '<div class="alert alert-danger" style="width: 400px; margin-left: auto; margin-right: auto;">ERROR: '+data.error+'</div>';
			      } else if (data.OK) {
				  html = '<div class="alert alert-success" style="width: 400px; margin-left: auto; margin-right: auto;">You have successfully claimed the token. You can proceed to the shared resource by clicking <a href="mgmain.html?mgpage='+(data.type == 'project' ? 'project&project=' : 'overview&metagenome=')+data.id+'">here</a></div>';
			      } else {
				  html = '<div class="alert alert-danger" style="width: 400px; margin-left: auto; margin-right: auto;">An error occurred contacting the server.</div>';
			      }
			  } else {
			      html = '<div class="alert alert-danger" style="width: 400px; margin-left: auto; margin-right: auto;">An error occurred contacting the server.</div>';
			  }
			  document.getElementById('content').innerHTML = html;
		      }
		    });
    };
    
})();
