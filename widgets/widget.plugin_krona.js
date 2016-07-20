(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 plugin for Krona",
                name: "plugin_krona",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [ ];
    };
        
    widget.display = function (wparams) {
        widget = this;

	var content = wparams.main;

	document.getElementById('pageTitle').innerHTML = '<div style="float: left; color: white; font-weight: lighter; margin-right: 10px;">plugin-hub | </div><a href="https://github.com/marbl/Krona/wiki" target=_blank><img src="http://marbl.github.io/Krona/img/logo.png" style="height: 59px; position: relative; bottom: 15px;"></a><div style="float: right; font-size: 12px; font-weight: normal; position: relative; top: 14px;">by '+stm.DataStore.info.authors+(stm.DataStore.info.publication ? ' - <a href="'+stm.DataStore.info.publication+'" target=_blank>citation</a>' : '')+'</div>';

	content.innerHTML = '<div id="kronaFrameDiv" style="width: '+window.innerWidth+'px; height: '+(window.innerHeight-80)+'px; overflow: hidden;"><iframe src="mg-rast.krona.html" style="border: none; width: 100%; height: 100%;" id="kronaFrame" onload="Retina.WidgetInstances.plugin_krona[1].showContent();"></iframe></div>';

	
	
	window.onresize = function (event) {
	    var d = document.getElementById('kronaFrameDiv');
	    d.style.height = (window.innerHeight-80)+"px";
	    d.style.width = window.innerWidth+"px";
	};
    };

    widget.showContent = function () {
	var widget = this;

	document.getElementById('kronaFrame').contentDocument.body.children[4].innerHTML = widget.data2krona(stm.DataStore.transfer);
	window.frames[0].load();
    };

    widget.data2krona = function (data) {
	var widget = this;

	// generate a tree from the table data
	var tree = {};
	var ranks = data.ranks;
	var datasetNames = data.names;
	widget.numdatasets = datasetNames.length;
	var set = 0;
	var minE = data.data[0][0][ranks.length + 1];
	var maxE = data.data[0][0][ranks.length + 1];

	for (var i=0; i<data.data.length; i++) {
	    var input = data.data[i];

	    for (var h=0; h<input.length; h++) {
		var magnitude = input[h][ranks.length];
		var score = input[h][ranks.length + 1];
		var lineage = input[h].slice(0, ranks.length);
		var evalue = input[h][ranks.length + 1];
		if (evalue > maxE) {
		    maxE = evalue;
		}
		if (evalue < minE) {
		    minE = evalue;
		}

		widget.addByLineage(tree, set, lineage, null, magnitude, score, ranks, 0, 0);
	    }
	    set++;
	}

	widget.setScores(tree);
	
	// generate XML from the tree
	var attributesHash = { "magnitude": "Abundance",
			       "magnitudeUnassigned": "Unassigned",
			       "score": "Avg. log e-value",
			       "rank": "Rank" };

	
	
	var html = widget.dataHeader('magnitude', attributesHash, datasetNames, minE, maxE) + widget.toStringXML(tree, data.containerName, 0, attributesHash, 0) + '</krona>';

	return html;
    };
    
    widget.addByLineage = function (node, dataset, lineage, queryID, magnitude, scores, ranks, index, depth) {
	var widget = this;

	if (! node.hasOwnProperty('children')) {
	    node.children = {};
	}
	
	if (! node.hasOwnProperty('magnitude')) {
	    node.magnitude = [];
	    for (var i=0; i<widget.numdatasets; i++) {
		node.magnitude.push(0);
	    }
	}
	node['magnitude'][dataset] += magnitude;

	if (! node.hasOwnProperty('count')) {
	    node.count = [];
	    for (var i=0; i<widget.numdatasets; i++) {
		node.count.push(0);
	    }
	}
	node['count'][dataset]++;
	
	var score = typeof scores == 'object' ? scores[index] : scores;
	
	if (index < lineage.length) {
	    var name = lineage[index];
	    var child;
	    
	    if (node['children'].hasOwnProperty(name)) {
		child = node['children'][name];
	    } else {
		child = node['children'][name] = { "scoreTotal": [], "scoreCount": [] };
		for (var i=0; i<widget.numdatasets; i++) {
		    node.children[name].scoreTotal.push(0);
		    node.children[name].scoreCount.push(0);
		}

		if (ranks) {
		    child['rank'] = [ ranks[index] ];
		}
	    }
	    
	    if (score !== null) {
		child['scoreTotal'][dataset] += score * magnitude;
		child['scoreCount'][dataset] += magnitude;
	    }
		
	    widget.addByLineage(child, dataset, lineage, queryID, magnitude, scores, ranks, index + 1, depth + 1);
	} else {
	    if (queryID) {
		node['members'][dataset].push(queryID);
	    }

	    if (! node.hasOwnProperty('unassigned')) {
		node.unassigned = [];
		node.magnitudeUnassigned = [];
		for (var i=0; i<widget.numdatasets; i++) {
		    node.unassigned.push(0);
		    node.magnitudeUnassigned.push(0);
		}
	    }
	    node['unassigned'][dataset]++;
	    node['magnitudeUnassigned'][dataset] += magnitude;
	}
    }

    widget.toStringXML = function (node, name, depth, attributesHash, nodeIDRef) {
	var widget = this;
	
	var string = '<node name="'+name+'">';
	var keys = Retina.keys(node);	

	for (var i=0; i<keys.length; i++) {
	    var key = keys[i];
	    if (key != 'children' && key != 'scoreCount' && key != 'scoreTotal' && key != 'href' &&
		( Retina.keys(node.children).length || (key != 'unassigned' && key != 'magnitudeUnassigned') ) &&
		( key == 'members' || attributesHash.hasOwnProperty(key) )) {
		string += "<"+key+">";
		for (var h=0; h<node[key].length; h++) {
		    var value = node[key][h];
		    if ( key == 'members' ) {
			string += "<vals>";
			for (var j=0; j<value.length; j++) {
			    string += "<val>"+value+"</val>";
			}
			string += "</vals>";
		    } else {
			string += "<val>"+value+"</val>";
		    }
		}			
		string += "</"+key+">";
	    }
	}
	
	nodeIDRef++;
	
	if (node.hasOwnProperty('children')) {
	    var keys = Retina.keys(node.children);
	    for (var i=0; i<keys.length; i++) {
		var child = keys[i];
		string += widget.toStringXML(node.children[child], child, depth + 1, attributesHash, nodeIDRef);
	    }
	}
	
	return string + "</node>";
    }	

    widget.dataHeader = function (magName, attributesHash, datasetNames, minE, maxE) {
	var widget = this;
	
	var header = '<krona collapse="true" key="true"><attributes magnitude="'+magName+'">';
	
	header += '<list>members</list>';
	for (var i in attributesHash) {
	    if (attributesHash.hasOwnProperty(i)) {
		header += '<attribute display="'+attributesHash[i]+'">'+i+'</attribute>';
	    }
	}
	header += '</attributes><datasets>';
	for (var i=0; i<datasetNames.length; i++) {
	    header += '<dataset>'+datasetNames[i].replace(/</g, "&lt;").replace(/>/g, "&gt;")+'</dataset>';
	}
	header += '</datasets>';

	header += '<color attribute="score" hueStart="120" hueEnd="0" valueStart="'+minE+'" valueEnd="'+maxE+'" default="false" ></color>';
	
	return header;
    };

    widget.setScores = function (node) {
	var widget = this;
	
	if (node.hasOwnProperty('scoreCount')) {
	    node.score = [];
	    for (var i=0; i<node.scoreCount.length; i++) {
		if (node.scoreCount[i]) {
		    node.score[i] = node.scoreTotal[i] / node.scoreCount[i];
		}
	    }
	}
	
	if ( node.hasOwnProperty('children') ) {
	    var keys = Retina.keys(node.children);
	    for (var i=0; i<keys.length; i++) {
		widget.setScores(node.children[keys[i]]);
	    }
	}	
    };
    
})();
