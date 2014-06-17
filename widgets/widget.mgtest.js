(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 Test Widget",
                name: "mgtest",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [];
    };

    widget.zoom = 2;
    widget.center = [ 0, 0 ]
        
    widget.display = function (wparams) {
        widget = this;

	var container = wparams.target;

	var html = "<h2>Geolocation Demo</h2><div id='map-canvas' style='width: 1000px; height: 700px;'></div>";

	container.innerHTML = html;

	widget.map = new google.maps.Map(document.getElementById('map-canvas'), { zoom: widget.zoom,
										  center: new google.maps.LatLng(widget.center[0], widget.center[1]) } );

	widget.geocoder = new google.maps.Geocoder();

	jQuery.getJSON('http://api.metagenomics.anl.gov/metagenome/?match=all&verbosity=mixs&limit=10', function(data) {
	    var countries = {};
	    var datasets = [];
	    for (var i=0; i<data.data.length; i++) {
		var ds = data.data[i];
		if (ds.latitude != "" && ds.longitude != "") {
		    datasets.push(ds);
		}
		if (ds.country) {
		    if (! countries.hasOwnProperty(ds.country)) {
			countries[ds.country] = 0;
		    }
		    countries[ds.country]++;
		}
	    }

	    var countryList = [];
	    for (var i in countries) {
		if (countries.hasOwnProperty(i)) {
		    countryList.push(i);
		}
	    }
	    var countryLocations = {};
	    var promises = [];
	    // for (var i=0; i<countryList.length; i++) {
	    // 	var promise = jQuery.deferred;
	    // 	widget.geocoder.geocode( { 'address': countryList[i] }, function(results, status) {
	    // 	    console.log(this);
	    // 	    if (status == google.maps.GeocoderStatus.OK) {
	    // 		countryLocations[countryList[i]] = results[0].geometry.location;
	    // 	    }
	    // 	    promise.resolve();
	    // 	});
	    // 	promises.push(promise);
	    // }

	    // jQuery.when.apply(this, promises).then(function() {
	    // 	console.log(countryLocations);
	    // });

	    // console.log(countries);

	    widget.geocoder.geocode( { 'address': countryList[0] }, function(results, status) {
	    	if (status == google.maps.GeocoderStatus.OK) {
	    	    countryLocations[countryList[0]] = results[0].geometry.location;

		    var marker = new google.maps.Circle({
	    		strokeColor: '#FF0000',
	    		strokeOpacity: 0.8,
	    		strokeWeight: 2,
	    		fillColor: '#FF0000',
	    		fillOpacity: 0.35,
	    		map: widget.map,
	    		center: results[0].geometry.location,
	    		radius: countries[countryList[0]] * 10000,
	    	    });
	    	}
	    });

	    // for (var i=0; i<datasets.length; i++) {
	    // 	var ds = datasets[i];
			    
	    // 	// var populationOptions = {
	    // 	//     strokeColor: '#FF0000',
	    // 	//     strokeOpacity: 0.8,
	    // 	//     strokeWeight: 2,
	    // 	//     fillColor: '#FF0000',
	    // 	//     fillOpacity: 0.35,
	    // 	//     map: map,
	    // 	//     center: citymap[city].center,
	    // 	//     radius: citymap[city].population / 20
	    // 	// };
	    // 	// // Add the circle for this city to the map.
	    // 	// cityCircle = new google.maps.Circle(populationOptions);


	    // 	var marker = new google.maps.Marker({
	    // 	    position: new google.maps.LatLng(parseFloat(ds.latitude), parseFloat(ds.longitude)),
	    // 	    map: widget.map,
	    // 	    title: ds.project_name
	    // 	});
	    // }
	});
    };    
})();
