(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Project Widget",
                name: "metagenome_project",
                author: "Tobias Paczian",
                requires: [ "rgbcolor.js", "markerclusterer.js" ]
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
	
	document.getElementById("pageTitle").innerHTML = "study";
	
	// check if we have a project parameter
	if (Retina.cgiParam('project')) {
	    var id = Retina.cgiParam('project');
	    if (id.length < 15 && ! id.match(/^mgp/)) {
		id = "mgp"+id;
	    }
	    widget.id = id.match(/^mgp/) ? id : Retina.idmap(id);
	    if (! widget.id.match(/^mgp/)) {
		widget.id = "mgp"+widget.id;
	    }
	}
	
	// if there is a project, show it
        if (widget.id) {
	    content.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="width: 24px;" src="Retina/images/waiting.gif"></div>';
	    
	    // check if required data is loaded
	    if (! ( stm.DataStore.hasOwnProperty('project') &&
	            stm.DataStore.project.hasOwnProperty(widget.id))) {
		jQuery.ajax({
		    dataType: "json",
		    headers: stm.authHeader, 
		    url: RetinaConfig.mgrast_api+'/project/'+widget.id+'?verbosity=full&nocache=1',
		    success: function (data) {
			if (! stm.DataStore.hasOwnProperty('project')) {
			    stm.DataStore.project = {};
			}
			stm.DataStore.project[Retina.WidgetInstances.metagenome_project[1].id] = data;
			Retina.WidgetInstances.metagenome_project[1].display();
		    }}).fail(function(xhr, error) {
			var msg = '';
			try {
			    msg = JSON.parse(xhr.responseText).ERROR;
			} catch (error) {
			    msg = 'the project could not be loaded';
			}
			content.innerHTML = "<div class='alert alert-danger' style='width: 500px;'>"+msg+"</div>";
		    });
		return;
            }
	    
	    var project = stm.DataStore.project[widget.id];
	    var id_no_prefix = widget.id.substr(3);
	    var html = "";
	    var canEdit = false;
	    if (stm.user && project.permissions) {
		for (var i=0; i<project.permissions.project.length; i++) {
		    if (project.permissions.project[i][4] == "user:"+stm.user.login) {
			canEdit = true;
			break;
		    }
		}
		if (stm.user.admin) {
		    canEdit = true;
		}
	    }
	    if (project.status == 'private' || canEdit) {
		html += "<h3 class='alert alert-info'><button class='btn' style='margin-right: 15px; position: relative; bottom: 3px;' onclick='window.location=\"mgmain.html?mgpage=share&project="+widget.id+"\";' title='edit / share project'><i class='icon icon-share'></i> edit / share project</button>"+(project.status == 'public' ? "" : "Private Study: ")+project.name+"</h3>";
	    } else {
		html += "<h3>"+project.name+" ("+widget.id+")</h3>";
	    }

	    html += "<div style='float: right; margin-left: 30px; margin-bottom: 20px;'><div id='myWorld' style='border: 1px solid black; width: 400px; height: 280px;'></div></div>";
	    
	    
	    html += "<table>";
	    html += "<tr><td style='padding-right: 10px;'><b>principle investigator</b></td><td>"+project.pi+", "+project.metadata.PI_organization+"</td></tr>";
	    html += "<tr><td><b>visibility</b></td><td>"+project.status+"</td></tr>";
	    html += "<tr><td><b>static link</b></td><td>"+(project.status == "public" ? "<a href='http://metagenomics.anl.gov/linkin.cgi?project="+project.id+"'>http://metagenomics.anl.gov/linkin.cgi?project="+project.id+"</a>" : "private projects cannot be linked")+"</td></tr>";
	    var invis = { 0: true, 4: true, 5: true };
	    if (project.metadata.hasOwnProperty('ebi_id')) {
		html += "<tr><td><b>ENA link</b></td><td><a href='http://www.ebi.ac.uk/ena/data/view/"+project.metadata.ebi_id+"' target=_blank>"+project.metadata.ebi_id+"</a></td></tr>";
	    } else {
		invis[9] = true;
	    }
	    html += "</table>";
	    var custom = "<span id='custom'></span>";
	    html += "<h4>description</h4>"+custom+"<p>"+project.description+"</p>";
	    html += "<h4>funding source</h4><p>"+project.funding_source+"</p>";
	    html += "<h4>contact</h4><address><strong>Administrative</strong><br>";
	    html += (project.metadata["PI_firstname"]||"-")+" "+(project.metadata["PI_lastname"]||"-")+" ("+(project.metadata["PI_email"]||"-")+")<br>"+(project.metadata["PI_organization"]||"-")+" ("+(project.metadata["PI_organization_url"]||"-")+")<br>";
	    html += (project.metadata["PI_organization_address"]||"-")+", "+(project.metadata["PI_organization_country"]||"-")+"</address>";
	    html += "<address><strong>Technical</strong><br>"+(project.metadata.firstname||"-")+" "+(project.metadata.lastname||"-")+" ("+(project.metadata.email||"-")+")<br>"+(project.metadata.organization||"-")+" ("+(project.metadata.organization_url||"-")+")<br>"+(project.metadata.organization_address||"-")+", "+(project.metadata.organization_country||"-")+"</address>";
	    html += "<h4>metagenomes</h4><div id='project2collection' style='float: right;'></div><div id='metagenome_table'><img src='Retina/images/waiting.gif' style='margin-left: 40%;margin-top: 100px;'></div>";
	    
	    content.innerHTML = html;

	    if (stm.user) {
		stm.loadPreferences().then(function(){
		    var widget = Retina.WidgetInstances.metagenome_project[1];
		    var project = stm.DataStore.project[widget.id];
		    if (! stm.user.preferences.collections.hasOwnProperty(project.name)) {
			document.getElementById('project2collection').innerHTML = '<button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_project[1].createCollection();" title="create a collection from the\nmetagenomes of this project">create collection</button>';
		    }
		});
	    }

	    // check if this project has a custom image and load it if so
	    jQuery.get(RetinaConfig.shock_url + "/node?querynode&attributes.inUseInProject="+widget.id, function(data){
		if (data && data.data && data.data.length) {
		    jQuery.get(RetinaConfig.shock_url + "/node/" + data.data[0].id + "?download", function(data) {
			document.getElementById('custom').innerHTML = data;
		    });
		}
	    });
	    
	    // create the metagenome table
	    var rows = [];
	    var url = RetinaConfig.mgrast_ftp+"/metagenome/";
	    widget.metagenomes = {};
	    for (var i=0; i<project.metagenomes.length; i++) {
		var mg = project.metagenomes[i];
		var mgid = mg.metagenome_id.match(/^mgm/) ? mg.metagenome_id : "mgm"+mg.metagenome_id;
		widget.metagenomes[mgid] = mg.name;
		var row = [ project.status == "private" ? "n/a" : "<a href='?mgpage=overview&metagenome="+mgid+"' target=_blank>"+mgid+"</a>",
			    mg.viewable ? ("<a href='?mgpage=overview&metagenome="+(project.status == "private" ? Retina.idmap(mgid) : mgid)+"' target=_blank>"+mg.name+"</a>") : "<a style='cursor: help;' title='This metagenome has not yet completed computation'>"+mg.name+"</a>",
			    mg.basepairs,
			    mg.sequences,
			    mg.biome,
			    mg.feature,
			    mg.material,
			    mg.sample ? "<a href='?mgpage=sample&sample="+mg.sample+"'>"+mg.sample+"</a>" : "-",
			    mg.library ? "<a href='?mgpage=library&library="+mg.library+"'>"+mg.library+"</a>" : "-",
			    mg.attributes && mg.attributes.ebi_id ? "<a href='http://www.ebi.ac.uk/ena/data/view/"+mg.attributes.ebi_id+"' target=_blank>"+mg.attributes.ebi_id+"</a>" : "-",
			    mg.location,
			    mg.country,
			    mg.coordinates,
			    mg.sequence_type,
			    mg.sequencing_method,
			    '<button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_project[1].authenticatedDownload(this, \''+mg.metagenome_id+'\', \'metadata\');"><img src="Retina/images/cloud-download.png" style="width: 16px;"> metadata</button><button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_project[1].authenticatedDownload(this, \''+mg.metagenome_id+'\', \'submitted\');"><img src="Retina/images/cloud-download.png" style="width: 16px;"> submitted</button>'+(mg.viewable ? '<button class="btn btn-mini" onclick="Retina.WidgetInstances.metagenome_project[1].authenticatedDownload(this, \''+mg.metagenome_id+'\', \'processed\');"><img src="Retina/images/cloud-download.png" style="width: 16px;"> results</button>' : '')
			  ];
		rows.push(row);
	    }
	    
	    Retina.Renderer.create("table", {
		target: document.getElementById('metagenome_table'),
		rows_per_page: 10,
		filter_autodetect: true,
		sort_autodetect: false,
		sorttype: { 2: "number", 3: "number" },
		synchronous: true,
		sort: "name",
		show_export: true,
		invisible_columns: invis,
		minwidths: [125,175,105,110,85,95,95,95,95,95,100,95,120,70,90,110],
		data: { data: rows, header: [ "MG-RAST ID", "name", "bp count", "seq. count", "biome", "feature", "material", "sample", "library", "ENA", "location", "country", "coordinates", "type", "method", "download" ] }
	    }).render();

	    // create a google map of the samples
	    var markers = [];
	    for (var i=0; i<project.metagenomes.length; i++) {
	    	var mg = project.metagenomes[i];
	    	if (mg.coordinates && mg.coordinates.split(/, /).length == 2) {
	    	    var coords = mg.coordinates.split(/, /);
	    	    var marker = new google.maps.Marker({
	    		position: new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1])),
	    		value: parseInt(mg.basepairs.replace(/,/g,"")),
	    		title: mg.name+" - "+parseInt(mg.basepairs.replace(/,/g,"")).baseSize(),
	    		icon: {
	    		    path: google.maps.SymbolPath.CIRCLE,
	    		    scale: 5
	    		}
	    	    });
	    	    markers.push(marker);
	    	}
	    }
	    if (markers.length) {
		var map = new google.maps.Map(document.getElementById('myWorld'), {
	    	    center: { lat: 40, lng: 5},
	    	    zoom: 1,
		    mapTypeId: google.maps.MapTypeId.HYBRID,
		    mapTypeControl: false,
		    streetViewControl: false
		});
		var mc = new MarkerClusterer(map, markers, { "imagePath": "Retina/images/m" });
	    } else {
		document.getElementById('myWorld').style.display = "none";
	    }
	}
	// else show the project select
	else {
	    content.innerHTML = '<h3>select a project to view</h3><div id="project_table"></div>';
	    
	    // create the job table
	    var columns = [ "name", "pi", "status" ];
	    
	    if (! widget.hasOwnProperty('table')) {
		widget.table = Retina.Renderer.create("table", {
		    target: document.getElementById('project_table'),
		    rows_per_page: 20,
		    filter_autodetect: false,
		    sort_autodetect: true,
		    synchronous: false,
		    query_type: "equal",
		    disable_sort: { 0: true, 1: true, 2: true},
		    headers: stm.authHeader,
		    data_manipulation: Retina.WidgetInstances.metagenome_project[1].tableManipulation,
		    navigation_url: RetinaConfig['mgrast_api'] + "/project",
		    data: { data: [], header: columns }
		});
	    } else {
		widget.table.settings.target = document.getElementById('project_table');
	    }
	    widget.table.render();
	    widget.table.update({},1);
	}
	
    };

    widget.createCollection = function () {
	var widget = this;
	
	var collection = { type: "collection",
			   metagenomes: widget.metagenomes,
			   name: stm.DataStore.project[widget.id].name,
			   description: "project "+stm.DataStore.project[widget.id].name + " metagenomes",
			 };

	if (! stm.user.preferences.hasOwnProperty('collections')) {
	    stm.user.preferences.collections = {};
	}

	stm.user.preferences.collections[stm.DataStore.project[widget.id].name] = collection;
	
	stm.storePreferences("collection stored", "there was an error storing your collection");

	document.getElementById('project2collection').innerHTML = "";
    };

    widget.authenticatedDownload = function (button, id, type) {
	var widget = Retina.WidgetInstances.metagenome_project[1];
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
    
    widget.tableManipulation = function (data) {
	for (var i=0; i<data.length; i++) {
	    data[i].name = "<a href='?mgpage=project&project="+data[i].id+"'>"+data[i].name+"</a>";
	}
	return data;
    };
    
})();
