(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Project Widget",
                name: "metagenome_project",
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

	document.getElementById('icon_publications').lastChild.innerHTML = "Project";
	sidebar.parentNode.style.display = "none";
	content.className = "span10 offset1";

	// check if we have a project parameter
	if (Retina.cgiParam('project')) {
	    widget.id = Retina.cgiParam('project');
	    if (! widget.id.match(/^mgp/)) {
		widget.id = "mgp"+widget.id;
	    }
	}

	// if there is a project, show it
        if (widget.id) {
	    content.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div>';

	    // check if required data is loaded
	    if (! ( stm.DataStore.hasOwnProperty('project') &&
	            stm.DataStore.project.hasOwnProperty(widget.id))) {
		jQuery.ajax({
		    dataType: "json",
		    headers: widget.authHeader, 
		    url: RetinaConfig.mgrast_api+'/project/'+widget.id+'?verbosity=full',
		    success: function (data) {
			if (! stm.DataStore.hasOwnProperty('project')) {
			    stm.DataStore.project = {};
			}
			stm.DataStore.project[Retina.WidgetInstances.metagenome_project[1].id] = data;
			Retina.WidgetInstances.metagenome_project[1].display();
		    }}).fail(function(xhr, error) {
			content.innerHTML = "<div class='alert alert-danger' style='width: 500px;'>the project could not be loaded.</div>";
			console.log(error);
		    });
		return;
            }

	    var project = stm.DataStore.project[widget.id];
	    var id_no_prefix = widget.id.substr(3);
	    var html = "<h3>"+project.name+" ("+widget.id+")<a style='margin-left: 10px; margin-right: 10px;' target=_blank href='"+RetinaConfig["mgrast_ftp"]+"/projects/"+id_no_prefix+"/' class='btn btn-mini' title='download all submitted and derived metagenome data for this project'><i class='icon-download'></i> metagenomes</a><a target=_blank href='"+RetinaConfig["mgrast_ftp"]+"/projects/"+id_no_prefix+"/metadata.project-"+id_no_prefix+".xlsx' class='btn btn-mini' title='download project metadata'><i class='icon-download'></i> project metadata</a></h3>";
	    html += "<table>";
	    html += "<tr><td style='padding-right: 10px;'><b>principle investigator</b></td><td>"+project.pi+"</td></tr>";
	    html += "<tr><td><b>visibility</b></td><td>"+project.status+"</td></tr>";
	    html += "</table>";
	    html += "<h4>description</h4><p>"+project.description+"</p>";
	    html += "<h4>funding source</h4><p>"+project.funding_source+"</p>";
	    html += "<h4>contact</h4><address><strong>Administrative</strong><br>";
	    html += (project.metadata["PI_firstname"]||"-")+" "+(project.metadata["PI_lastname"]||"-")+" ("+(project.metadata["PI_email"]||"-")+")<br>"+(project.metadata["PI_organization"]||"-")+" ("+(project.metadata["PI_organization_url"]||"-")+")<br>";
	    html += (project.metadata["PI_organization_address"]||"-")+", "+(project.metadata["PI_organization_country"]||"-")+"</address>";
	    html += "<address><strong>Technical</strong><br>"+(project.metadata.firstname||"-")+" "+(project.metadata.lastname||"-")+" ("+(project.metadata.email||"-")+")<br>"+(project.metadata.organization||"-")+" ("+(project.metadata.organization_url||"-")+")<br>"+(project.metadata.organization_address||"-")+", "+(project.metadata.organization_country||"-")+"</address>";
	    html += "<h4>metagenomes</h4><div id='metagenome_table'><img src='Retina/images/waiting.gif' style='margin-left: 40%;margin-top: 100px;'></div>";
	    
	    if (! stm.DataStore.hasOwnProperty('metagenome')) {
		stm.DataStore.metagenome = {};
	    }
	    var promises = [];
	    for (var i=0; i<project.metagenomes.length; i++) {
		if (! stm.DataStore.metagenome.hasOwnProperty(project.metagenomes[i][0])) {
		    promises.push(jQuery.ajax({
			dataType: "json",
			headers: widget.authHeader, 
			url: RetinaConfig.mgrast_api+'/metagenome/'+project.metagenomes[i][0]+'?verbosity=full',
			success: function (data) {
			    stm.DataStore.metagenome[data.id] = data;
			}}));
		}
	    }
	    content.innerHTML = html;
	    jQuery.when.apply(this, promises).then(function() {
		Retina.WidgetInstances.metagenome_project[1].showMetagenomeInfo();
	    });
        }
	// else show the project select
	else {
	    content.innerHTML = '<h3>select a project to view</h3><div id="project_table"></div>';

	    // create the job table
	    var columns = [ "name", "pi", "status" ];

	    var table_filter = { 0: { "type": "text" },
				 1: { "type": "text" },
				 2: { "type": "text" } };
	    if (! widget.hasOwnProperty('table')) {
		widget.table = Retina.Renderer.create("table", {
		    target: document.getElementById('project_table'),
		    rows_per_page: 20,
		    filter_autodetect: false,
		    filter: table_filter,
		    sort_autodetect: true,
		    synchronous: false,
		    sort: "name",
		    query_type: "equal",
		    default_sort: "name",
		    headers: widget.authHeader,
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

    widget.showMetagenomeInfo = function () {
	var widget = Retina.WidgetInstances.metagenome_project[1];

	var id_no_prefix = widget.id.substr(3);
	var url = RetinaConfig["mgrast_ftp"]+"/projects/"+id_no_prefix+"/";
	var mgs = stm.DataStore.project[widget.id].metagenomes;
	var rows = [];
	for (var i=0; i<mgs.length; i++) {
	    var mg = stm.DataStore.metagenome[mgs[i][0]];
	    var id = mg.id.substr(3);
	    var row = [ "<a href='?mgpage=overview&metagenome="+mg.id+"' target=_blank>"+mg.id+"</a>",
			"<a href='?mgpage=overview&metagenome="+mg.id+"' target=_blank>"+mg.name+"</a>",
			mg.statistics ? parseInt(mg.statistics.sequence_stats.bp_count_raw).baseSize() : "unknown",
			mg.statistics ? parseInt(mg.statistics.sequence_stats.sequence_count_raw).formatString() : "unknown",
			mg.mixs ? (mg.mixs.biome || "-") : "-",
			mg.mixs ? (mg.mixs.feature || "-") : "-",
			mg.mixs ? (mg.mixs.material || "-") : "-",
			mg.mixs ? (mg.mixs.location || "-") : "-",
			mg.mixs ? (mg.mixs.country || "-") : "-",
			mg.mixs ? (mg.mixs.latitude ? (mg.mixs.latitude+" lat, "+mg.mixs.longitude+" long") : "-") : "-",
			mg.mixs ? (mg.mixs.sequence_type || "-") : "-",
			mg.mixs ? (mg.mixs.seq_method || "-") : "-",
			'<button class="btn btn-mini" onclick="stm.saveAs(JSON.stringify(stm.DataStore.metagenome[\''+mg.id+'\'].metadata, null, 1), \''+mg.id+'.metadata.txt\');"><i class="icon-download"></i> metadata</button><a href="'+url+id+'/raw" class="btn btn-mini" target=_blank><i class="icon-download"></i> submitted</a> <a href="'+url+id+'/processed" class="btn btn-mini" target=_blank><i class="icon-download"></i> processed</a>'
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
	    headers: widget.authHeader,
	    invisible_columns: { 0: true },
	    minwidths: [125,175,105,110,85,95,95,100,95,120,70,90,110],
	    data: { data: rows, header: [ "MG-RAST ID", "name", "bp count", "seq. count", "biome", "feature", "material", "location", "country", "coordinates", "type", "method", "download" ] }
	}).render();
    };

    widget.tableManipulation = function (data) {
	for (var i=0; i<data.length; i++) {
	    data[i].name = "<a href='?mgpage=project&project="+data[i].id+"'>"+data[i].name+"</a>";
	}
	return data;
    };

     // login widget sends an action (log-in or log-out)
    widget.loginAction = function (params) {
	var widget = Retina.WidgetInstances.metagenome_project[1];
	if (params.token) {
	    widget.user = params.user;
	    widget.authHeader = { "Auth": params.token };
	} else {
	    widget.user = null;
	    widget.authHeader = {};
	}
	widget.display();
    };
})();