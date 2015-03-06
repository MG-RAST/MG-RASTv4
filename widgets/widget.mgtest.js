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
        
    widget.display = function (wparams) {
        widget = this;

	console.log('I am being called');

	var container = wparams.target;

	var html = "<h2>Hello World</h2>";

	container.innerHTML = html;

	jQuery.getJSON( "http://api.metagenomics.anl.gov/heartbeat/AWE", function(data) {
	    if (data.status != 1) {
		alert("Our submission pipeline is currently out of service. Please try again later.");
		return;
	    }
	    jQuery.getJSON( "http://api.metagenomics.anl.gov/heartbeat/SHOCK", function(data) {
		if (data.status != 1) {
		    alert("Our submission pipeline is currently out of service. Please try again later.");
		    return;
		}
		alert('all is well!');
	    });
	});

    };    
})();
