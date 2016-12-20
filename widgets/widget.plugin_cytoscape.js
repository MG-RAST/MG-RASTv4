(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "MG-RAST v4 plugin for Cytoscape",
            name: "plugin_cytoscape",
            author: "Tobias Paczian",
            requires: [ 'cytoscape.min.js', 'cola.min.js', 'cytoscape-cola.js', 'cytoscape-ngraph.forcelayout.js' ]
        }
    });
    
    widget.setup = function () {
	return [];
    };

    widget.pushCircles = function () {
	var widget = this;

	widget.cy.layout({'name': 'cola', 'maxSimulationTime': 2000 });
    };
    
    widget.display = function (wparams) {
        widget = this;

	var content = widget.content = wparams ? wparams.main : widget.content;

	document.getElementById('pageTitle').innerHTML = '<div style="float: left; color: white; font-weight: lighter; margin-right: 10px;">plugin-hub | </div><img src="images/cytoscape_logo.png" style="height: 50px; position: relative; bottom: 9px;"><span style="position: relative; bottom: 9px; margin-left: 10px;">Cytoscape.js</span><div style="float: right; font-size: 12px; font-weight: normal; position: relative; top: 14px; margin-left: 10px;">by '+stm.DataStore.info.authors+(stm.DataStore.info.publication ? ' - <a href="'+stm.DataStore.info.publication+'" target=_blank>citation</a>' : '')+'</div>';

	var html = [];
	html.push("<h3 style='width: 100%; text-align: center;'>"+stm.DataStore.transfer.title+"</h3>");
	html.push("<div id='controls' style='width: 1000px; margin-bottom: 5px; margin-left: auto; margin-right: auto;'>");
	html.push("<div class='input-append input-prepend' style='margin-bottom: 0px; margin-right: 20px;'><button class='btn' onclick='Retina.WidgetInstances.plugin_cytoscape[1].cy.layout({\"name\": \"cola\", \"maxSimulationTime\": parseInt(document.getElementById(\"simtime\").value)*1000 });'>push</button><input style='width: 30px' type='text' value='2' id='simtime'><span class='add-on'>sec</span></div>");
	html.push("<div class='input-prepend input-append' style='margin-bottom: 0px; margin-right: 20px;'><button class='btn' onclick='document.getElementById(\"cy\").style.width=document.getElementById(\"width\").value+\"px\";'>set width</button><input style='width: 75px' type='text' id='width' value='1000'><span class='add-on'>px</span></div><div class='input-append input-prepend' style='margin-bottom: 0px; margin-right: 20px;'><button class='btn' onclick='document.getElementById(\"cy\").style.height=document.getElementById(\"height\").value+\"px\";'>set height</button><input style='width: 75px' type='text' id='height' value='800'><span class='add-on'>px</span></div>");
	html.push("<button class='btn' onclick='stm.saveAs(Retina.WidgetInstances.plugin_cytoscape[1].cy.jpg(), \""+stm.DataStore.transfer.title+".jpg\", true);'><img src='Retina/images/cloud-download.png' style='width: 16px;'> jpeg</button>");
	html.push("<button class='btn' onclick='stm.saveAs(Retina.WidgetInstances.plugin_cytoscape[1].cy.png(), \""+stm.DataStore.transfer.title+".png\", true);'><img src='Retina/images/cloud-download.png' style='width: 16px;'> png</button>");
	html.push("<button class='btn' onclick='stm.saveAs(JSON.stringify(Retina.WidgetInstances.plugin_cytoscape[1].cy.json(), \""+stm.DataStore.transfer.title+".json\"));'><img src='Retina/images/cloud-download.png' style='width: 16px;'> JSON</button>");
	html.push("</div><div id='cy' style='width: 1000px; height: 800px; border: 1px solid black; margin-left: auto; margin-right: auto;'></div>");
content.innerHTML = html.join("");
	var cy = widget.cy = cytoscape({

	    container: document.getElementById('cy'),
	    
	    elements: widget.data,
	    
	    style: [
		{
		    selector: 'node',
		    style: {
			'background-color': 'data(color)',
			'width': 'data(weight)',
			'height': 'data(weight)',
			'label': 'data(name)'
		    }
		},
		
		{
		    selector: 'edge',
		    style: {
			'width': 1,
			'line-color': 'black',
			'target-arrow-color': 'black',
			'target-arrow-shape': 'triangle'
		    }
		}
	    ],
	    
	    layout: {
		name: 'cytoscape-ngraph.forcelayout', iterations: 100000
	    }
	    
	});
	cy.ready( function () {
	    Retina.WidgetInstances.plugin_cytoscape[1].cy.layout({"name": "cola", "maxSimulationTime": 2000});
	});
    };

    widget.data = jQuery.extend(true, [], stm.DataStore.transfer.elements);
})();
