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

	if (stm.user) {

            var html = '<h3>MG-RAST Jobs with valid location metadata</h3><div id="myWorld" style="width: 1000px; height: 700px;"></div>';

	    // set the main content html
	    widget.main.innerHTML = html;
	    widget.main.className = "span8 offset1";
	    widget.sidebar.parentNode.style.display = "none";
	    var d = document.createElement('div');
	    d.innerHTML = '<div id="controls" style="margin-bottom: 20px;"></div><div id="data"></div>';
	    d.setAttribute('style', 'padding: 10px; position: absolute; right: 20px; top: 100px;');
	    d.setAttribute('id', 'summary');
	    document.body.appendChild(d);
	    widget.loadData();
	    
	} else {
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.showMap = function () {
	var widget = Retina.WidgetInstances.admin_maps[1];

	document.getElementById('myWorld').innerHTML = '<img src="Retina/images/waiting.gif" style="width: 32px;margin-left: 50%;margin-top: 200px;">';

	var map = new google.maps.Map(document.getElementById('myWorld'), {
	    center: { lat: 40, lng: 5},
	    zoom: 2
	});
	var markers = [];
	var mgdata = stm.DataStore.JobDataFiltered;
	for (var i=0; i<mgdata.length; i++) {
	    var mg = mgdata[i];
	    var marker = new google.maps.Marker({
		position: new google.maps.LatLng(mg.latitude, mg.longitude),
		value: mg.size,
		title: mg.created+" - "+parseInt(mg.size).byteSize(),
	    	icon: {
	    	    path: google.maps.SymbolPath.CIRCLE,
	    	    scale: 5
	    	}
	    });
	    markers.push(marker);
	}
	var mc = new MarkerClusterer(map, markers);
    };

    widget.showControls = function () {
	var widget = Retina.WidgetInstances.admin_maps[1];

	var target = document.getElementById('controls');

	var html = "<table>";
	html += "<tr><td style='padding-bottom: 20px; padding-right: 5px;'><input type='checkbox' id='setLowDate'></td><td style='padding-bottom: 15px; padding-right: 5px;'>min. date</td><td><input type='text' id='lowDate'></td></tr>";
	html += "<tr><td style='padding-bottom: 20px; padding-right: 5px;'><input type='checkbox' id='setHighDate'></td><td style='padding-bottom: 15px; padding-right: 5px;'>max. date</td><td><input type='text' id='highDate'></td></tr>";
	html += "<tr><td style='padding-bottom: 20px; padding-right: 5px;'><input type='checkbox' id='setLowSize'></td><td style='padding-bottom: 15px; padding-right: 5px;'>min. size</td><td><input type='text' id='lowSize'></td></tr>";
	html += "<tr><td style='padding-bottom: 20px; padding-right: 5px;'><input type='checkbox' id='setHighSize'></td><td style='padding-bottom: 15px; padding-right: 5px;'>max. size</td><td><input type='text' id='highSize'></td></tr>";
	html += "</table><button class='btn' onclick='Retina.WidgetInstances.admin_maps[1].updateData();'>set</button><button class='btn pull-right' onclick='Retina.WidgetInstances.admin_maps[1].showMap();'>show</button>";

	target.innerHTML = html;
    };

    widget.updateData = function () {
	var widget = Retina.WidgetInstances.admin_maps[1];
	
	var allData = stm.DataStore.JobData;
	var data = [];
	var minDate = null;
	var maxDate = null;
	var minSize = null;
	var maxSize = null;
	var dateLow = document.getElementById('setLowDate').checked ? document.getElementById('lowDate').value : null;
	var dateHigh = document.getElementById('setHighDate').checked ? document.getElementById('highDate').value : null;
	var sizeLow = document.getElementById('setLowSize').checked ? document.getElementById('lowSize').value : null;
	var sizeHigh = document.getElementById('setHighSize').checked ? document.getElementById('highSize').value : null;
	for (var i=0; i<allData.length; i++) {
	    var d = allData[i];
	    if ((dateLow == null || dateLow < d.created) && (dateHigh == null || dateHigh > d.created) && (sizeLow == null || sizeLow < d.size) && (sizeHigh == null || sizeHigh > d.size)) {
		if (! minDate || d.created < minDate) {
		    minDate = d.created;
		}
		if (! maxDate || d.created > maxDate) {
		    maxDate = d.created;
		}
		if (! minSize || d.size < minSize) {
		    minSize = d.size;
		}
		if (! maxSize || d.size > maxSize) {
		    maxSize = d.size;
		}
		data.push(d);
	    }
	}


	var html = "<table class='table table-bordered'>";
	html += "<tr><td><b>all jobs</b></td><td>"+allData.length.formatString()+"</td></tr>";
	html += "<tr><td><b>filtered jobs</b></td><td>"+data.length.formatString()+"</td></tr>";
	html += "<tr><td><b>min. date</b></td><td>"+minDate+"</td></tr>";
	html += "<tr><td><b>max. date</b></td><td>"+maxDate+"</td></tr>";
	html += "<tr><td><b>min. size</b></td><td>"+minSize.formatString()+"</td></tr>";
	html += "<tr><td><b>max. size</b></td><td>"+maxSize.formatString()+"</td></tr>";
	html += "</table>";
	
	document.getElementById('data').innerHTML = html;

	stm.DataStore.JobDataFiltered = data;
    };

    widget.loadData = function () {
	jQuery.getJSON("data/gmap.json").then( function(data) {
	    var valid = [];
	    for (var id in data) {
		var mg = data[id];
		mg.latitude = parseFloat(mg.latitude);
		mg.longitude = parseFloat(mg.longitude);
		mg.size = parseInt(mg.size) || 0;
		if (mg.latitude > 85 || mg.latitude < -85 || mg.longitude > 180 || mg.longitude < -180) {
		    continue;
		}
		valid.push(mg);
	    }
	    stm.DataStore.JobData = valid;
	    stm.DataStore.JobDataFiltered = valid;
	    Retina.WidgetInstances.admin_maps[1].showControls();
	    Retina.WidgetInstances.admin_maps[1].updateData();
	});
    };
})();