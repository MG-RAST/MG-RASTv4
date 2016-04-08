function initWebApp () {
    stm.init({});
    stm.add_repository({ url: stm.Config.mgrast_api, name: "MG-RAST"});
    Retina.init({});
    Retina.load_widget({"name": "login", "resource": "Retina/widgets"}).then( function() {
	var loginAction = function (data) {
	    if (data.action != "logout" && data.result == "success") {
		stm.user = data.user;
		stm.token = data.token;
		if (! (data.user.hasOwnProperty('tos') && data.user.tos == RetinaConfig.tos)) {
		    // show the accept button
		    var html = '<button class="btn" onclick="sendAgreement();">I agree to the above terms of service</button>';
		    document.getElementById('agreement').innerHTML = html;
		}
	    } else {
		stm.user = null;
		stm.authHeader = {};
	    }
	};
	Retina.Widget.create('login', { "target": document.getElementById("login_space"), "callback": loginAction });
    });
};

function sendAgreement () {
    document.getElementById('agreement').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 24px;'>";
    jQuery.ajax({
	method: "GET",
	dataType: "json",
	headers: { "Authorization": "mgrast "+stm.token },
	url: RetinaConfig.mgrast_api+'/user/agreetos/'+RetinaConfig.tos,
	success: function (data) {
	    jQuery.cookie('mgauth', JSON.stringify({ "user": { firstname: stm.user.firstname,
							       lastname: stm.user.lastname,
							       email: stm.user.email,
							       login: stm.user.login,
							       tos: data.tos,
							       id: stm.user.id },
						     "token": stm.token }), { expires: 7 });
	    window.location = "mgmain.html?mgpage=mydata";
	},
	error: function (xhr) {
	    document.getElementById('agreement').innerHTML = "<div class='alert alert-error'>There was an error sending your data</div>";
	}
    });
};
