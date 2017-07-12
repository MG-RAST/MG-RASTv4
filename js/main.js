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
    Retina.errorCallback = function (jqXHR, textStatus, errorThrown) {
	var c = document.getElementById("content");
	c.setAttribute('class', 'span8 offset2');
	document.getElementById('sidebar').parentNode.parentNode.removeChild(document.getElementById('sidebar').parentNode);
	c.innerHTML = '<div style="font-size: 100px; margin-top: 200px; text-align: center;">404</div><div style="font-size: 50px; margin-top: 100px; text-align: center; line-height: normal;">The page you are requesting could not be found.</div>';
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
						{ "title": "<img src='Retina/images/pencil.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'> blog", "url": "http://blog.mg-rast.org" },
						{ "title": "<img src='Retina/images/file-pdf.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'> handbook", "url": "ftp://ftp.metagenomics.anl.gov/data/manual/mg-rast-manual.pdf" },
						{ "title": "<img src='Retina/images/youtube.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'> video tutorials", "url": "https://www.youtube.com/channel/UCoBKJ-yYJu5HK1szy3my91A" },
						{ "title": "<img src='Retina/images/bubbles.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'> forum", "url": "https://groups.google.com/forum/#!forum/mg-rast" },
						{ "title": "<img src='Retina/images/envelop.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'>  feedback", "url": "mailto:help@mg-rast.org" }
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

	if (page == 'search') {
	    document.getElementById('headerSearch').style.display = 'none';
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

function search (term) {
    if (term.toLowerCase() == 'webkey') {
	if (stm.user) {
	    alert('Your current webkey is:\n\n'+stm.user.token);
	} else {
	    alert('you must log in to view your webkey');
	}
    } else if (term.match(/^mgp\d+$/)) {
	window.location = 'mgmain.html?mgpage=project&project='+term;
    } else if (term.match(/^mgm\d+\.\d+$/)) {
	window.location = 'mgmain.html?mgpage=overview&metagenome='+term;
    } else {
	window.location = 'mgmain.html?mgpage=search&search='+term;
    }
};
