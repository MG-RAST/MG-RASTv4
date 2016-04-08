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
						{ "title": "<img src='Retina/images/envelop.png' style='width: 16px; position: relative; bottom: 1px; margin-right: 5px;'>  feedback", "url": "contact.html" }
					    ],
					    "forgotEnabled": true,
					    "forgotLink": "mgmain.html?mgpage=register&forgot=1",
					    "myDataEnabled": true,
					    "myDataLink": "mgmain.html?mgpage=mydata" });
	});
	Retina.load_widget({"name": "session", "resource": "Retina/widgets"}).then( function() {
	    Retina.Widget.create('session', { "target": document.getElementById("session_space"), "noInfo": true });
	});
    });
};

function showNewsFeed () {
    var feed = new google.feeds.Feed("http://press.igsb.anl.gov/mg-rast/feed/");
    feed.load(function(result) {
	if (Retina.WidgetInstances.hasOwnProperty('metagenome_mydata') && document.getElementById('newsfeed')) {
	    Retina.WidgetInstances.metagenome_mydata[1].showNews(result);
	} else {
	    window.newsFeedResult = result;
	}
    });
}
