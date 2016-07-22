(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 plugin for KEGG Mapper",
                name: "plugin_kegg",
                author: "Tobias Paczian",
            requires: ["rgbcolor.js","jquery.svg-new.js"]
        }
    });
    
    widget.setup = function () {
	return [];
    };

    widget.differentiateColors = true;
    widget.scaling = 1;
    
    widget.display = function (wparams) {
        widget = this;

	var content = widget.content = wparams ? wparams.main : widget.content;

	document.getElementById('pageTitle').innerHTML = '<div style="float: left; color: white; font-weight: lighter; margin-right: 10px;">plugin-hub | </div><img src="images/kegg.png" style="height: 50px; position: relative; bottom: 9px;"><span style="position: relative; bottom: 9px; margin-left: 10px;">KEGG Mapper</span><div style="float: right; font-size: 12px; font-weight: normal; position: relative; top: 14px;">by '+stm.DataStore.info.authors+(stm.DataStore.info.publication ? ' - <a href="'+stm.DataStore.info.publication+'" target=_blank>citation</a>' : '')+'</div>';

	if (! stm.DataStore.hasOwnProperty('keggdata')) {
	    content.innerHTML = "<img src='Retina/images/waiting.gif' style='width: 24px;'> loading kegg data...";
	    stm.DataStore.keggdata = { "ids": {}, "maps": {} };
	    jQuery.getJSON("data/kegg/kegg_ids.json", function(data) {
		stm.DataStore.keggdata.ids = data;
		jQuery.getJSON("data/kegg/kegg_maps.json", function(data) {
		    stm.DataStore.keggdata.maps = data;
		    Retina.WidgetInstances.plugin_kegg[1].display();
		});
	    });
	    return;
	}

	var html = "<div class='span2' style='margin-left: 20px;'><div id='mapcontrols'></div><hr><div id='maplist'></div><hr><div id='download'></div></div><div class='span8' id='maptarget'></div>";

	content.innerHTML = html;

	widget.colors = GooglePalette();
	widget.showControls();
	widget.fillMaplist();
	widget.showDownload();
	widget.showCurrentMap(stm.DataStore.transfer.maps.rows[0].slice(0, 5));
    };

    widget.showControls = function () {
	var widget = this;

	var html = [  ];
	
	html.push('<h4>map controls</h4>');

	html.push('differentiate datasets by color <input type="checkbox" style="position: relative; bottom: 2px; left: 5px;" checked="checked" onchange="Retina.WidgetInstances.plugin_kegg[1].colorize(this.checked)">');

	html.push('image size <select onchange="Retina.WidgetInstances.plugin_kegg[1].scale(this.options[this.selectedIndex].value);" style="width: 90px"><option value="1">100%</option><option value="0.9">90%</option><option value="0.8">80%</option><option value="0.7">70%</option><option value="0.6">60%</option><option value="0.5">50%</option><option value="0.4">40%</option><option value="0.3">30%</option><option value="0.2">20%</option><option value="0.1">10%</option></select>');

	document.getElementById('mapcontrols').innerHTML = html.join("");
    };

    widget.showDownload = function () {
	var widget = this;

	var html = [];

	html.push('<h4>download</h4>')
	html.push("<div style='width: 55px; margin-left: auto; margin-right: auto;'><img src='Retina/images/cloud-download.png' class='tool' onclick='Retina.WidgetInstances.plugin_kegg[1].downloadData();' title='download'></div>");

	document.getElementById('download').innerHTML = html.join("");
    };

    widget.downloadData = function () {
	var widget = this;

	var data = [ [ "ID", "function" ] ];
	for (var i=0; i<stm.DataStore.transfer.functions.cols.length; i++) {
	    data[0].push(stm.DataStore.transfer.functions.cols[i]);
	}
	data[0] = data[0].join("\t");
	for (var i=0; i<stm.DataStore.transfer.functions.rows.length; i++) {
	    var row = [];
	    row.push(stm.DataStore.keggdata.ids[stm.DataStore.transfer.functions.rows[i]]);
	    row.push(stm.DataStore.transfer.functions.rows[i]);
	    for (var h=0; h<stm.DataStore.transfer.functions.data[i].length; h++) {
		row.push(stm.DataStore.transfer.functions.data[i][h]);
	    }
	    data.push(row.join("\t"));
	}

	stm.saveAs(data.join("\n"), "KEGG.csv");
    };

    widget.scale = function (factor) {
	var widget = this;

	widget.scaling = factor;
	widget.showCurrentMap();
    };

    widget.colorize = function (doit) {
	var widget = this;

	widget.differentiateColors = doit;
	widget.showCurrentMap();
    };

    widget.fillMaplist = function () {
	var widget = this;

	var html = [];

	html.push('<h4>maps with hits</h4>');
	
	html.push('<select onchange="Retina.WidgetInstances.plugin_kegg[1].showCurrentMap(this.options[this.selectedIndex].value);">');

	widget.maplist = {};
	
	var maps = stm.DataStore.transfer.maps.rows;
	for (var i=0; i<maps.length; i++) {
	    var mapID = maps[i].slice(0, 5);
	    widget.maplist[mapID] = maps[i];
	    if (! widget.hasOwnProperty('currentMap')) {
		widget.currentMap = mapID;
	    }
	    html.push('<option value="'+mapID+'">'+maps[i]+'</option>');
	}
	     
	html.push('</select>');

	html.push('<div id="hittable"></div>');

	document.getElementById('maplist').innerHTML = html.join("");
    };

    widget.showCurrentMap = function (mapID) {
	var widget = this;

	var newMap = false;
	if (mapID) {
	    newMap = true;
	    widget.currentMap = mapID;
	} else {
	    mapID = widget.currentMap;
	}

	document.getElementById('maptarget').innerHTML = '<img src="data/kegg/pathway/map/map'+mapID+'.png" style="max-width: none;" id="currentImage" onload="Retina.WidgetInstances.plugin_kegg[1].mapLoaded(\''+mapID+'\','+(newMap ? "true" : "false")+');"><div id="SVGdiv"></div>';
    };

    widget.mapLoaded = function (mapID, newMap) {
	if (newMap) {
	    widget.imageWidth = document.getElementById('currentImage').width;
	    widget.imageHeight = document.getElementById('currentImage').height;
	}
	document.getElementById('currentImage').style.width = (widget.imageWidth * parseFloat(widget.scaling))+"px";
	document.getElementById('currentImage').style.height = (widget.imageHeight * parseFloat(widget.scaling))+"px";
	document.getElementById('SVGdiv').setAttribute('style', "width: "+(widget.imageWidth * parseFloat(widget.scaling))+"px; height: "+(widget.imageHeight * parseFloat(widget.scaling))+"px; position: relative; bottom: "+(widget.imageHeight * parseFloat(widget.scaling))+"px;");
	widget.svg = jQuery('#SVGdiv').svg().svg('get');
	document.getElementById('SVGdiv').firstChild.setAttribute('viewBox', '0 0 '+widget.imageWidth+' '+widget.imageHeight);
	
	var html = ['<table class="table table-condensed" style="text-align: left; width: 100%;"><tr><th>dataset</th><th style="text-align: center;">color</th></tr>'];
	var maps = stm.DataStore.transfer.maps;
	for (var i=0; i<maps.rows.length; i++) {
	    if (maps.rows[i] == widget.maplist[widget.currentMap]) {
		for (var h=0; h<maps.cols.length; h++) {
		    html.push('<tr><td style="padding-right: 5px;">'+maps.cols[h]+'</td><td style="padding-right: 5px;"><div style="width: 10px; height: 10px; background-color: '+widget.colors[h]+'; opacity: 0.5; position: relative; top: 6px; margin: auto;"></div></td></tr>');
		}
		break;
	    }
	}
	html.push('</table>');

	document.getElementById('hittable').innerHTML = html.join("");

	var hits = [];
	var drawn = {};
	var funcs = stm.DataStore.transfer.functions;
	for (var i=0; i<funcs.rows.length; i++) {
	    var id = stm.DataStore.keggdata.ids[funcs.rows[i]];
	    if (id) {
		if (stm.DataStore.keggdata.maps[mapID].hasOwnProperty(id)) {
		    var item = stm.DataStore.keggdata.maps[mapID][id];
		    var colors = [];
		    var abutitle = [];
		    for (var j=0; j<funcs.cols.length; j++) {
			if (funcs.data[i][j]) {
			    colors.push(widget.colors[j]);
			    abutitle.push(funcs.cols[j]+' - '+funcs.data[i][j].formatString()+" hits");
			}
		    }
		    var g = widget.svg.group(null, i);
		    g.setAttribute('onclick', "window.open('http://www.genome.jp/dbget-bin/www_bget?ko:"+id+"');");
		    g.setAttribute('style', 'cursor: pointer;');
		    widget.svg.doctitle(g, abutitle.join(", "));
		    for (var h=0; h<item.length; h++) {
			var coords = item[h].coords.split(",");
			for (var j=0; j<coords.length; j++) {
			    coords[j] = parseInt(coords[j]);
			}
			if (! drawn.hasOwnProperty(coords[0]+"-"+coords[1])) {
			    if (item[h].shape == "rect") {
				var w = (coords[2] - coords[0]) / colors.length;
				var x = coords[0];
				for (var j=0; j<colors.length; j++) {
				    widget.svg.rect(g, x, coords[1], w, coords[3] - coords[1], null, null, { "fill": widget.differentiateColors ? colors[j] : "gray", "opacity": 0.5 });
				    x += w;
				}
			    } else {
				console.log(item[h].shape);
				console.log(stm.DataStore.keggdata.maps[mapID][id]);
			    }
			    drawn[coords[0]+"-"+coords[1]] = true;
			}
		    }
		}
	    } else {
		console.log('id not found for '+funcs.rows[i]);
	    }
	}
    };
    
})();
