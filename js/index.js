function initWebApp () {

    (function () {
	var k = Retina.keys(RetinaConfig);
	Retina.traverse(RetinaConfig, function (str) {
	    if (str.match(/^http\:/) && window.location.toString().substr(0, 5) == 'https') {
		str = str.replace(/^http\:/, 'https\:');
	    }
	    return str;
	});
    }).call(this);

    // check if the browser is compatible
    var features = { //"async": feature.asynch,
		     "addEventListener": feature.addEventListener,
		     "canvas": feature.canvas,
		     "classList": feature.classList,
		     "cors": feature.cors,
		     "css3Dtransform": feature.css3Dtransform,
		     "cssTransform": feature.cssTransform,
		     "cssTransition": feature.cssTransition,
		     "defer": feature.defer,
		     "localStorage": feature.localStorage,
		     "matchMedia": feature.matchMedia,
		     //"pictureElement": feature.pictureElement,
		     "querySelectorAll": feature.querySelectorAll,
		     "svg": feature.svg,
		     "viewportUnit": feature.viewportUnit,
		     "webGL": feature.webGL
		   };
    var allFeaturesAvailable = true;
    for (var i in features) {
	if (features.hasOwnProperty(i)) {
	    if (! features[i]) {
		console.log(i);
		allFeaturesAvailable = false;
	    }
	}
    }
    if (! allFeaturesAvailable) {
	var html = "<b>Warning</b><p>Your browser does not support all functionality used by this site. Please consider upgrading to a current version.</p><p style='text-align: center;'><a href='http://www.mozilla.org/firefox' target=_blank>Firefox</a> | <a href='http://www.google.com/chrome' target=_blank>Chrome</a> | <a href='http://www.apple.com/safari' target=_blank>Safari</a></p>";
	document.getElementById('warning').innerHTML = html;
	document.getElementById('warning').style.display = '';
    }
    
    // keybind for searchbox
    document.getElementById('searchtext').addEventListener("keypress", function(event){
	event=event || window.event;
	if(event.keyCode=='13') {
	    document.getElementById('searchbutton').click();
	}
    });
    
    // server status info
    jQuery.getJSON(RetinaConfig.mgrast_api+"/server/MG-RAST", function (data) {
	// check if the server is down
	if (data.status != "ok") {
	    document.getElementById('searchdiv').style.display = "none";
	    document.getElementById('error').innerHTML = data.info;
	    document.getElementById('error').style.display = "";
	}
	// check if there is an info message
	else if (data.info) {
	    document.getElementById('info').innerHTML = data.info;
	    document.getElementById('info').style.display = "";
	}
	
	// print server version
	document.getElementById('version').innerHTML = "version "+(RetinaConfig.serverVersion ?RetinaConfig.serverVersion : data.version);
	
	// print server stats
	var bp = (parseInt(data.basepairs) / 1000000000000).formatString(2);
	var seq = parseInt(parseInt(data.sequences) / 1000000000).formatString();
	document.getElementById('load').innerHTML = parseInt(data.metagenomes).formatString()+" metagenomes containing "+seq+" billion sequences and<br>"+bp+" Tbp processed for "+parseInt(data.usercount).formatString()+" registered users.";
    });
    
    // webapp initialization
    stm.init({});
    stm.add_repository({ url: stm.Config.mgrast_api, name: "MG-RAST"});
    Retina.init({});
    Retina.load_widget({"name": "login", "resource": "Retina/widgets"}).then( function() {
	var loginAction = function (data) {
	    if (data.action != "logout" && data.result == "success") {
		if (data.user.hasOwnProperty('tos') && data.user.tos == RetinaConfig.tos) {
		    if (! Retina.cgiParam('stay')) {
			window.location = 'mgmain.html?mgpage=mydata';
		    }
		} else {
		    window.location = 'legal.html';
		}
	    } else {
		stm.user = null;
		stm.authHeader = {};
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
    
    jQuery('.carousel').carousel({"interval": 8000});

    // tell the user we are using cookies
    window.cookiebar = new jQuery.peekABar();
    setTimeout(function () {
	cookiebar.show({
	    html: 'This site uses cookies to improve the user experience. By continuing to use the site you consent to the use of cookies.<button class="btn btn-mini pull-right" onclick="cookiebar.hide();" style="float: right; margin-right: 50px;">OK</button>'
	});
    }, 3000);

    jQuery.getJSON(RetinaConfig.mgrast_api+'/server/twitter', function(data) {
	showNews(data);
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
