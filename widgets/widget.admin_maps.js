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
	return [ Retina.load_renderer("slider") ];
    };

    widget.dataType = "all samples";
    widget.year = 2010;
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_maps[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	if (stm.user) {

            var html = '<h3>MG-RAST Jobs with valid location metadata</h3><div id="yearSlider" style="margin-bottom: 20px;"></div><div id="myWorld" style="width: 1000px; height: 700px;"></div>';

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

	    Retina.Renderer.create('slider', { target: document.getElementById("yearSlider"), current: widget.year, min: 2007, max: 2017, callback: function (year) {
		var widget = Retina.WidgetInstances.admin_maps[1];
		widget.year = year;
		widget.showMap();
	    }}).render()
	    
	} else {
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.showMap = function () {
	var widget = Retina.WidgetInstances.admin_maps[1];

	document.getElementById('myWorld').innerHTML = '<img src="Retina/images/waiting.gif" style="width: 32px;margin-left: 50%;margin-top: 200px;">';

	var cd = {};
	var rat = {};
	var d = stm.DataStore.JobData;
	for (var i=0; i<d.length; i++) {
	    if (! d[i].hasOwnProperty('country')) {
		continue;
	    }
	    d[i].country = d[i].country.toLowerCase();
	    if (widget.countryMap.hasOwnProperty(d[i].country)) {
		d[i].country = widget.countryMap[d[i].country];
	    }
	    if (! widget.validMap.hasOwnProperty(d[i].country)) {
		continue;
	    }
	    if (! cd.hasOwnProperty(d[i].country)) {
		cd[d[i].country] = 0;
		rat[d[i].country] = 0;
	    }
	    if (widget.singleYear && parseInt(d[i].created.substring(0,4)) != widget.year) {
		continue;
	    }
	    if (! widget.singleYear && parseInt(d[i].created.substring(0,4)) > widget.year) {
		continue;
	    }
	    if (widget.dataType == '454 vs illumina') {
		if (d[i].seq_meth == '454') {
		    cd[d[i].country]++;
		} else if (d[i].seq_meth == 'illumina') {
		    rat[d[i].country]++;
		}
		continue;
	    }
	    if (widget.dataType == 'WGS') {
		if (d[i].sequence_type == 'WGS') {
		    cd[d[i].country]++;
		} else if (d[i].sequence_type == 'Amplicon') {
		    rat[d[i].country]++;
		}
		continue;
	    }
	    cd[d[i].country]++;
	}

	var gd = [ ['Country', 'Samples'] ];
	var k = Retina.keys(cd);
	for (var i=0; i<k.length; i++) {
	    var d = cd[k[i]];
	    if (widget.dataType == '454 vs illumina' || widget.dataType == 'WGS') {
		if (cd[k[i]] + rat[k[i]] == 0) {
		    continue;
		}
		d = (cd[k[i]] / (cd[k[i]] + rat[k[i]]) * 100) - 50;
	    } else if (d == 0) {
		continue;
	    }
	    gd.push([k[i], widget.log ? Retina.log10(d) : d ]);
	}
	
	var data = google.visualization.arrayToDataTable(gd);
	
        var options = {};

	if (widget.dataType !== 'all samples') {
	    options.colorAxis = {colors: ['green', 'red']}
	}
	
        var chart = new google.visualization.GeoChart(document.getElementById('myWorld'));
	
        chart.draw(data, options);
    };

    widget.countryMap = {
	'u.s.a.': 'usa',
	'united states of america': 'usa',
	'uk': 'united kingdom',
	'the netherlands': 'netherlands',
	'the bahamas': 'bahamas',
	'fr': 'france',
	'french republic': 'france',
	'gaz:united states of america': 'usa',
	'great britain': 'united kingdom',
	"people's republic of china": 'china',
	'republic of korea': 'south korea',
	'viet nam': 'vietnam'
    };
    
    widget.showControls = function () {
	var widget = Retina.WidgetInstances.admin_maps[1];

	var target = document.getElementById('controls');

	var html = "<table>";
	html += "<tr><td style='padding-bottom: 5px; padding-right: 5px;'>log</td><td><input type='checkbox' onchange='Retina.WidgetInstances.admin_maps[1].log=this.checked;'></td></tr>";
	html += "<tr><td style='padding-bottom: 5px; padding-right: 5px;'>single year</td><td><input type='checkbox' onchange='Retina.WidgetInstances.admin_maps[1].singleYear=this.checked;'></td></tr>";
	html += "<tr><td style='padding-bottom: 5px; padding-right: 5px;'>data type</td><td><select style='margin-bottom: 0px;' onchange='Retina.WidgetInstances.admin_maps[1].dataType=this.options[this.selectedIndex].value;'><option>all samples</option><option>WGS</option><option>454 vs illumina</option></select></td></tr>";
	html += "</table><button class='btn' onclick='Retina.WidgetInstances.admin_maps[1].makeScreen();'>screen</button><button class='btn pull-right' onclick='Retina.WidgetInstances.admin_maps[1].showMap();'>show</button>";

	target.innerHTML = html;
    };

    widget.makeScreen = function () {
	var widget = this;

	var resultDiv = document.createElement('div');
	resultDiv.setAttribute('style', 'display: none;');
	resultDiv.setAttribute('id', 'canvasResult');
	document.body.appendChild(resultDiv);

	Retina.svg2png(null, resultDiv, 1000, 700).then(
	    function() {
		var href = document.createElement('a');
		var canvas = document.getElementById('canvasResult').children[0];
		href.setAttribute('href', canvas.toDataURL());
		href.setAttribute('download', Retina.WidgetInstances.admin_maps[1].year+".png");
		href.setAttribute('style', 'display: none;');
		document.body.appendChild(href);
		href.click();

		// remove the elements
		document.body.removeChild(href);
		document.body.removeChild(document.getElementById('canvasResult'));
	    });
    };

    widget.updateData = function () {
	var widget = Retina.WidgetInstances.admin_maps[1];

    };

    widget.loadData = function () {
	jQuery.getJSON("data/admindata.json").then( function(data) {
	    stm.DataStore.JobData = data;
	    Retina.WidgetInstances.admin_maps[1].showControls();
	    Retina.WidgetInstances.admin_maps[1].updateData();
	});
    };
    
    widget.validMap = { "afghanistan": true,
			"angola": true,
			"anguilla": true,
			"antarctica": true,
			"argentina": true,
			"armenia": true,
			"australia": true,
			"austria": true,
			"azerbaijan": true,
			"bahamas": true,
			"bahrain": true,
			"bangladesh": true,
			"barbados": true,
			"belgium": true,
			"belize": true,
			"bermuda": true,
			"bolivia": true,
			"botswana": true,
			"brazil": true,
			"brunei": true,
			"bulgaria": true,
			"burkina faso": true,
			"cambodia": true,
			"cameroon": true,
			"canada": true,
			"cape verde": true,
			"caribbean sea": true,
			"cayman islands": true,
			"central african republic": true,
			"chad": true,
			"chile": true,
			"china": true,
			"colombia": true,
			"costa rica": true,
			"cote d'ivoire": true,
			"croatia": true,
			"cuba": true,
			"cyprus": true,
			"czech republic": true,
			"democratic republic of the congo": true,
			"denmark": true,
			"dominican republic": true,
			"ecuador": true,
			"egypt": true,
			"england": true,
			"estonia": true,
			"ethiopia": true,
			"faroe islands": true,
			"fiji": true,
			"finland": true,
			"france": true,
			"french guiana": true,
			"french polynesia": true,
			"gabon": true,
			"germany": true,
			"ghana": true,
			"greece": true,
			"greenland": true,
			"guam": true,
			"guatemala": true,
			"haiti": true,
			"hawaii": true,
			"honduras": true,
			"hong kong": true,
			"hungary": true,
			"iceland": true,
			"india": true,
			"indonesia": true,
			"iran": true,
			"ireland": true,
			"israel": true,
			"italy": true,
			"jamaica": true,
			"japan": true,
			"jarvis island": true,
			"kazakhstan": true,
			"kenya": true,
			"kiribati": true,
			"korea": true,
			"korea (south)": true,
			"kuwait": true,
			"kyrgyzstan": true,
			"libya": true,
			"luxembourg": true,
			"madagascar": true,
			"malawi": true,
			"malaysia": true,
			"mali": true,
			"mexico": true,
			"micronesia": true,
			"mongolia": true,
			"montenegro": true,
			"morocco": true,
			"myanmar": true,
			"namibia": true,
			"nepal": true,
			"netherlands": true,
			"new caledonia": true,
			"new zealand": true,
			"nicaragua": true,
			"niger": true,
			"nigeria": true,
			"norway": true,
			"oman": true,
			"pakistan": true,
			"panama": true,
			"papua new guinea": true,
			"paraguay": true,
			"peru": true,
			"philippines": true,
			"poland": true,
			"portugal": true,
			"puerto rico": true,
			"qatar": true,
			"republic of the congo": true,
			"romania": true,
			"russia": true,
			"saudi arabia": true,
			"scotland": true,
			"senegal": true,
			"serbia": true,
			"seychelles": true,
			"singapore": true,
			"slovakia": true,
			"slovenia": true,
			"solomon islands": true,
			"somalia": true,
			"south africa": true,
			"south korea": true,
			"south sudan": true,
			"spain": true,
			"sri lanka": true,
			"svalbard": true,
			"sweden": true,
			"switzerland": true,
			"taiwan": true,
			"tanzania": true,
			"thailand": true,
			"tonga": true,
			"trinidad and tobago": true,
			"turkey": true,
			"uganda": true,
			"united arab emirates": true,
			"united kingdom": true,
			"uruguay": true,
			"usa": true,
			"venezuela": true,
			"vietnam": true,
			"zambia": true,
			"zimbabwe": true };
})();
