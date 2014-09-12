(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Downlaod Widget",
                name: "metagenome_download",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.authHeader = {};
    widget.user = null;

    widget.display = function (wparams) {
        widget = Retina.WidgetInstances.metagenome_download[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;
	content.className = "span10 offset1";
	sidebar.parentNode.style.display = 'none';
	
	var html = "";

	if (Retina.cgiParam('metagenome')) {
	    var mgid = Retina.cgiParam('metagenome');
	    html += "<h3>Metagenome Datasets for <span id='mginfo'></span></h3><p>Data are available from each step in the <a target=_blank href='http://blog.metagenomics.anl.gov/howto/quality-control'>MG-RAST pipeline</a>. Each section below corresponds to a step in the processing pipeline. Each of these sections includes a description of the input, output, and procedures implemented by the indicated step. They also include a brief description of the output format, buttons to download data processed by the step and detailed statistics (click on &ldquo;show stats&rdquo; to make collapsed tables visible).</p><div id='metagenome_download'><img src='Retina/images/waiting.gif' style='left: 40%; position: relative; margin-top: 100px;'></div>";
	    content.innerHTML = html;

	    jQuery.ajax( { dataType: "json",
			   url: RetinaConfig['mgrast_api']+"/metagenome/"+mgid,
			   headers: widget.authHeader,
			   success: function(data) {
			       var did = data.id.substr(3);
			       document.getElementById('mginfo').innerHTML = data.name+" ("+did+")";
			   }
			 } );

	    jQuery.ajax( { dataType: "json",
			   url: RetinaConfig['mgrast_api']+"/download/"+mgid,
			   headers: widget.authHeader,
			   success: function(data) {
			       Retina.WidgetInstances.metagenome_download[1].displayMetagenomeDownloads(data);
			   },
			   error: function (xhr, data) {

			   }
			 } );
	} else {
	    html += "<h3>Available Projects</h3><p>The following data sets are available for analysis and download. Note that downloading complete analysis might take significant time.</p><div id='projects_table'></div>";

	    content.innerHTML = html;

	    var table = Retina.Renderer.create("table", { target: document.getElementById('projects_table'), data: {}, filter_autodetect: true, sort_autodetect: true });
	    table.settings.headers = widget.authHeader;
	    table.settings.synchronous = false;
	    table.settings.query_type = 'prefix';
	    table.settings.data_manipulation = Retina.WidgetInstances.metagenome_download[1].dataManipulation,
	    table.settings.navigation_url = RetinaConfig["mgrast_api"]+"/project?verbosity=full";
	    table.settings.rows_per_page = 10;
	    table.settings.filter_autodetect = false;
	    table.settings.sort_autodetect = false;
	    table.settings.invisible_columns = { 0: true };
	    table.settings.filter = { 0: { type: "text" },
				      1: { type: "text" },
				      2: { type: "text" },
				      3: { type: "text" },
				      5: { type: "text" } };
	    table.settings.asynch_column_mapping = { "Project ID": "id",
						     "Project": "name",
						     "Contact": "pi",
						     "status": "status",
						     "NCBI ID": "metadata.ncbi_id" };
	    table.settings.data = { data: [], header: [ "Project ID",
							"Project",
							"Contact",
							"NCBI ID",
							"# Metagenomes",
							"status",
							"Download" ] };
	    table.render();
	    table.update({}, table.index);
	}
    };

    widget.displayMetagenomeDownloads = function (data) {
	jQuery.getJSON("data/pipeline.json", function (pipelinedata) {
	    var widget = Retina.WidgetInstances.metagenome_download[1];
	    var target = document.getElementById('metagenome_download');

	    var html = "";
	    
	    for (var i=0; i<data.data.length; i++) {
		var d = data.data[i];
		if (d.file_size == null) {
		    continue;
		}
		var sname = d.stage_name;
		var subtitle = "";
		if (d.stage_name.match(/\.passed$/)) {
		    sname = d.stage_name.substr(0, d.stage_name.indexOf('.'));
		    subtitle = "<p><b>passed</b></p>";
		}
		if (d.stage_name.match(/\.removed$/)) {
		    subtitle = "<p><b>removed</b></p>";		
		} else {
		    html += "<div><h4>"+sname+"</h4>"+subtitle;
		    if (pipelinedata.hasOwnProperty(d.stage_id)) {
			var p = pipelinedata[d.stage_id];
			html += "<p>"+p.input+"</p>";
			html += "<p>"+p.description+"</p>";
			for (var h=0; h<p.output.length; h++) {
			    if (typeof p.output[h] == "string") {
				html += "<p>"+p.output[h]+"</p>";
			    } else {
				html += "<p>"+p.output[h].description+"<br>Column fields are as follows:</p><ul><li>";
				p.output[h].format.join("</li><li>");
				html += "</li></ul>";
			    }
			}
		    }
		}
		
		html += "<a href='"+d.url+"' class='btn btn-primary'><img src='Retina/images/download.png' style='width: 16px; opacity: 0.5;'> download</a>"; 
		
		html += "<table class='table'>";
		html += "<tr><td><b>filesize</b></td><td>"+d.file_size.byteSize()+"</td></tr>";
		html += "<tr><td><b>sequence format</b></td><td>"+d.seq_format+"</td></tr>";
		html += "<tr><td><b>file format</b></td><td>"+d.file_format+"</td></tr>";
		html += "<tr><td><b>MD5</b></td><td>"+d.file_md5+"</td></tr>";
		html += "</table>";
		
		if (d.hasOwnProperty('statistics')) {
		    html += "<button class='btn pull-right' onclick='if(this.innerHTML==\"show statistics\"){this.innerHTML=\"hide statistics\";this.nextSibling.style.display=\"\";}else{this.innerHTML=\"show statistics\";this.nextSibling.style.display=\"none\";}'>show statistics</button><div style='display:none;'>";
		    html += "<h5>statistics</h5>";
		    html += "<table class='table table-condensed'>";
		    var keys = Retina.keys(d.statistics).sort();
		    for (var h=0; h<keys.sort; h++) {
			var desc = keys[h].replace(/_/g, " ");
			html += "<tr><td><b>"+desc+"</b></td><td>"+d.statistics[keys[h]]+"</td>";	
		    }		    
		    html += "</table></div>";
		}
		html += "</div>";
	    }
	    target.innerHTML = html;
	});
    };

    widget.dataManipulation = function (data) {
	var widget = Retina.WidgetInstances.metagenome_download[1];
	var result_data = [];
	for (var i=0;i<data.length;i++) {
	    var obj = data[i];
	    var pid = obj.id.substr(3);
	    var ncbi = obj.metadata.ncbi_id || "";
	    if (ncbi.length > 0) {
		var ncbi_arr = ncbi.split(", ");
		for (var h=0; h<ncbi_arr.length; h++) {
		    ncbi_arr[h] = "<a href='http://www.ncbi.nlm.nih.gov/bioproject/?term="+ncbi_arr[h]+"' target=_blank>"+ncbi_arr[h]+"</a>";
		}
		ncbi = ncbi_arr.join(", ");
	    } else {
		ncbi = "-";
	    }
	    result_data.push( { "Project ID": obj.id,
				"Project": obj.name,
				"Contact": obj.pi,
				"NCBI ID": ncbi,
				"# Metagenomes": obj.metagenomes.length,
				"status": obj.status,
				"Download": "<a href='"+RetinaConfig.mgrast_ftp+"/projects/"+pid+"' target=_blank title='download all submitted and derived metagenome data for this project'><img src='Retina/images/download.png' style='position: relative; bottom: 3px; width: 16px;'> metagenomes</a> <a href='"+RetinaConfig.mgrast_ftp+"/projects/"+pid+"/metadata.project-"+pid+".xlsx' title='download project metadata'><br><img src='Retina/images/download.png' style='position: relative; bottom: 3px; width: 16px;'> metadata</a>"
			      } );
	    
	}
	if (! result_data.length) {
	    result_data.push({ "Project ID": "-",
			       "Project": "-",
			       "Contact": "-",
			       "NCBI ID": "-",
			       "# Metagenomes": "-",
			       "status": "-",
			       "Download": "-" });
	}
	return result_data;
    };

    // login widget sends an action (log-in or log-out)
    widget.loginAction = function (params) {
	var widget = Retina.WidgetInstances.metagenome_download[1];
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