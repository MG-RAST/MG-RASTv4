(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Administrator Maps Widget",
            name: "admin_maps",
            author: "Tobias Paczian",
            requires: [ "rgbcolor.js", "markerclusterer.js" ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("graph") ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_maps[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "span10 offset1";

	if (stm.user) {

            var html = '<div id="myWorld" style="width: 1000px; height: 700px;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;

	    widget.showTheWorld();

	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.showTheWorld = function () {
	var widget = Retina.WidgetInstances.admin_maps[1];
	
	jQuery.getJSON("data/gmap.json").then( function(data) {
	    var mgdata = data;
	    var map = new google.maps.Map(document.getElementById('myWorld'), {
		center: { lat: 40, lng: 5},
		zoom: 2
	    });
	    var markers = [];
	    for (var id in mgdata) {
	    	var mg = mgdata[id];
	    	mg.latitude = parseFloat(mg.latitude);
	    	mg.longitude = parseFloat(mg.longitude);
	    	var marker = new google.maps.Marker({
	    	    position: new google.maps.LatLng(mg.latitude, mg.longitude),
	    	    icon: {
	    		path: google.maps.SymbolPath.CIRCLE,
	    		scale: 5
	    	    }
	    	});
		markers.push(marker);
	    }
	    var mc = new MarkerClusterer(map, markers);
	});
    };
})();