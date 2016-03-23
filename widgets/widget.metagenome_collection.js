(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Project Widget",
                name: "metagenome_collection",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.display = function (params) {
        widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	sidebar.parentNode.style.display = "none";
	content.className = "span10 offset1";

	document.getElementById("pageTitle").innerHTML = "private collection";

	// check if we have a collection parameter
	if (Retina.cgiParam('collection') !== undefined) {
	    widget.id = Retina.cgiParam('collection');
	} else {
	    content.innerHTML = '<div class="alert alert-error">collection page called without a collection id</div>';
	    return;
	}

	if (! stm.user) {
	    content.innerHTML = '<div class="alert alert-error">you need to be logged in to see this page</div>';
	    return;
	}

	content.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div>';
	
	if (! stm.user.hasOwnProperty('preferences')) {
	    stm.loadPreferences().then(function() {
		Retina.WidgetInstances.metagenome_collection[1].display();
	    });
	    return;
	}

	// check if required data is loaded
	if (! (stm.user.preferences.hasOwnProperty('collections') && stm.user.preferences.collections.hasOwnProperty(widget.id))) {
	    content.innerHTML = '<div class="alert alert-error">the requested collection was not found</div>';
	    return;
	}

	var collection = stm.user.preferences.collections[widget.id];

	var html = [ "<h3>"+collection.name+"</h3>" ];
	html.push("<p>"+collection.description+"</p>");
	html.push("<h4>metagenomes</h4><div id='metagenome_table'><img src='Retina/images/waiting.gif' style='margin-left: 40%;margin-top: 100px;'></div>");
	    
	content.innerHTML = html.join("");

	// get the data for the metagenome table
	jQuery.ajax( { url: RetinaConfig.mgrast_api+"/metagenome?match=any&verbosity=seqstats&limit=999&id="+Retina.keys(collection.metagenomes).join("&id="),
		       headers: stm.authHeader,
		       success: function(data) {
			   var widget = Retina.WidgetInstances.metagenome_collection[1];
			   widget.data = data.data.sort(Retina.propSort('name'));
			   widget.displayMetagenomeTable();
		       },
		       error: function () {
			   alert('unable to get metagenomes');
		       }
		     });
    };

    widget.displayMetagenomeTable = function () {
	var widget = this;

	// create the metagenome table
	var rows = [];
	var url = RetinaConfig.mgrast_ftp+"/metagenome/";
	for (var i=0; i<widget.data.length; i++) {
	    var mg = widget.data[i];
	    var row = [ "<a href='?mgpage=overview&metagenome="+mg.id+"' target=_blank>"+mg.id+"</a>",
			"<a href='?mgpage=overview&metagenome="+mg.id+"' target=_blank>"+mg.name+"</a>",
			"<a href='?mgpage=project&project="+mg.project_id+"' target=_blank>"+mg.project_name+"</a>",
			mg.bp_count_preprocessed_l,
			mg.sequence_count_preprocessed_l,
			mg.biome,
			mg.location,
			mg.sequence_type,
			mg.seq_method,
			'<button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_collection[1].authenticatedDownload(this, \''+mg.id+'\', \'metadata\');"><i class="icon-download"></i> metadata</button><button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_collection[1].authenticatedDownload(this, \''+mg.id+'\', \'submitted\');"><i class="icon-download"></i> submitted</button><button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_collection[1].authenticatedDownload(this, \''+mg.id+'\', \'processed\');"><i class="icon-download"></i> results</button>'
		      ];
	    rows.push(row);
	}
	Retina.Renderer.create("table", {
	    target: document.getElementById('metagenome_table'),
	    rows_per_page: 10,
	    filter_autodetect: true,
	    sort_autodetect: true,
	    synchronous: true,
	    sort: "name",
	    invisible_columns: { 0: true },
	    minwidths: [125,175,85,95,95,100,95,120,70,90],
	    data: { data: rows, header: [ "MG-RAST ID", "name", "study", "basepairs", "sequences", "biome", "location", "type", "method", "download" ] }
	}).render();
    };
    
    widget.authenticatedDownload = function (button, id, type) {
	var widget = Retina.WidgetInstances.metagenome_collection[1];
	button.setAttribute('disabled', 'true');
	var url = RetinaConfig.mgrast_api + "/";
	if (type == "metadata") {
	    url += "metagenome/"+id+"?verbosity=metadata";
	    jQuery.ajax( { url: url,
			   headers: stm.authHeader,
			   success: function(data) {
			       button.removeAttribute('disabled');
			       stm.saveAs(JSON.stringify(data, null, 2), id+"_metadata.json");
			   },
			   error: function () {
			       button.removeAttribute('disabled');
			       alert('download failed');
			   }
			 } );
	} else {
	    url += "download/"+id+"?file=";
	    if (type == "submitted") {
		url += "050.1";
	    } else {
		url += "700.1";
	    }
	    jQuery.ajax( { url: url+"&link=1",
			   headers: stm.authHeader,
			   success: function(data) {
			       button.removeAttribute('disabled');
			       window.location = data.url;
			   },
			   error: function () {
			       button.removeAttribute('disabled');
			       alert('download failed');
			   }
			 } );
	}
    };

})();
