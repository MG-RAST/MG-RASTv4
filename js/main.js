function initWebApp () {
    stm.init({});
    stm.add_repository({ url: stm.Config.mgrast_api, name: "MG-RAST"});
    Retina.init({});
    
    var page  = Retina.cgiParam("mgpage") || "search";
    
    changeLocation = function(event, loc) {
	event = event || window.event;
	if (event.shiftKey) {
	    window.open(loc);
	} else {
	    window.location = loc;
	}
    };
    Retina.load_widget("metagenome_"+page).then( function() {
	var mgp = Retina.Widget.create('metagenome_'+page, { "main": document.getElementById("content"),
							     "sidebar": document.getElementById("sidebar") }, true);
	
	Retina.load_widget({"name": "login", "resource": "Retina/widgets"}).then( function() {
	    var loginAction = function (data) {
		if (data.action != "logout" && data.result == "success") {
		    if (! (data.user.hasOwnProperty('tos') && data.user.tos == RetinaConfig.tos)) {
			window.location = 'legal.html';
			return;
		    }
		    if (stm.user && stm.user.hasOwnProperty("preferences")) {
			mgp.display({ "main": document.getElementById("content"),
				      "sidebar": document.getElementById("sidebar") });
			return;
		    }
		    stm.user = data.user;
		    stm.authHeader = { "Authorization": "mgrast "+data.token};
		    mgp.display({ "main": document.getElementById("content"),
				  "sidebar": document.getElementById("sidebar") });
		} else {
		    stm.user = null;
		    stm.authHeader = {};
		    mgp.display({ "main": document.getElementById("content"),
				  "sidebar": document.getElementById("sidebar") });
		}
	    };
	    Retina.Widget.create('login', { "target": document.getElementById("login_space"),
		    			    "callback": loginAction,
					    "registerEnabled": true,
					    "registerLink": "mgmain.html?mgpage=register",
					    "helpEnabled": true,
					    "helpMenu": [
						{ "title": "<img src='Retina/images/pencil.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'> blog", "url": "http://blog.metagenomics.anl.gov/howto/" },
						{ "title": "<img src='Retina/images/file-pdf.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'> handbook", "url": "ftp://ftp.metagenomics.anl.gov/data/manual/mg-rast-manual.pdf" },
						{ "title": "<img src='Retina/images/youtube.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'> video tutorials", "url": "https://www.youtube.com/channel/UCoBKJ-yYJu5HK1szy3my91A" },
						{ "title": "<img src='Retina/images/bubbles.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'> forum", "url": "https://groups.google.com/forum/#!forum/mg-rast" },
						{ "title": "<img src='Retina/images/envelop.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'>  feedback", "url": "mailto:mg-rast@rt.mcs.anl.gov" }
					    ],
					    "forgotEnabled": true,
					    "forgotLink": "mgmain.html?mgpage=register&forgot=1",
					    "myDataEnabled": true,
					    "myDataLink": "mgmain.html?mgpage=mydata" });
	});
	if (page == 'analysis') {
	    Retina.load_widget({"name": "profileManager", "resource": "Retina/widgets"}).then( function() {
		Retina.Widget.create('profileManager', { "target": document.getElementById("session_space") });
		if (Retina.WidgetInstances.metagenome_analysis && Retina.WidgetInstances.metagenome_analysis.length == 2) {
		    Retina.WidgetInstances.profileManager[1].callback = Retina.WidgetInstances.metagenome_analysis[1].enableLoadedProfiles;
		}
	    });
	}

	if (page == 'mydata') {
	    jQuery.getJSON(RetinaConfig.mgrast_api+'/server/twitter', function(data) {
		showNews(data);
	    });
	}
    });
};

function showNews (result) {
    var html = '<table class="table table-condensed" style="width: 100%; font-size: 12px;">';
    for (var i=0; i<result.length; i++) {
    	var entry = result[i];
	entry.date = entry.created_at.substr(0, 11) + entry.created_at.substr(-4);
	entry.link = "https://twitter.com/mg_rast/status/"+entry.id_str;
	if (!((entry.in_reply_to_screen_name == 'mg_rast') || (entry.in_reply_to_screen_name == null))) {
	    continue;
	}
    	html += '<tr><td style="white-space: nowrap;">'+entry.date+'</td><td><a href="'+entry.link+'" target=_blank>'+entry.text+'</a></td></tr>';
    }
    html += "</table>";
    document.getElementById("newsfeed").innerHTML = html;
};

