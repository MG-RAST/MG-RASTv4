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
			   headers: stm.authHeader,
			   success: function(data) {
			       var did = data.id.substr(3);
			       document.getElementById('mginfo').innerHTML = data.name+" ("+did+")";
			   }
			 } );

	    jQuery.ajax( { dataType: "json",
			   url: RetinaConfig['mgrast_api']+"/download/"+mgid,
			   headers: stm.authHeader,
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
	    table.settings.headers = stm.authHeader;
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
		if (d.file_size == null || ! pipelinedata.hasOwnProperty(d.stage_id)) {
		    continue;
		}
		var sname = d.stage_name;
		var offset = "";
		var p = pipelinedata[d.stage_id];
		var files = Retina.keys(p.output).sort();
		if (d.stage_name == files[0]) {
		    html += "<div class='span12' style='margin-left: 0px; margin-top: 20px;'><h4>"+p.title+"</h4>";
		    offset = " offset6";
		    html += "<div class='span6'>";
		    html += "<p>"+p.input+"</p>";
		    html += "<p>"+p.description+"</p>";
		    for (var h=0; h<files.length; h++) {
			html += "<p>"+p.output[files[h]].description+"</p>";
			if (p.output[files[h]].hasOwnProperty('fields')) {
			    html += "<p>Column fields are as follows:</p><ul><li>";
			    html += p.output[files[h]].format.join("</li><li>");
			    html += "</li></ul>";
			}
		    }
		    html += "</div>";
		}
		
		var stats = "";
		var statsbutton = "";
		if (d.hasOwnProperty('statistics')) {
		    statsbutton = "<button class='btn pull-right btn-mini' onclick='if(document.getElementById(\"stats_"+sname+"\").style.display==\"none\"){document.getElementById(\"stats_"+sname+"\").style.display=\"\";}else{document.getElementById(\"stats_"+sname+"\").style.display=\"none\";}'>statistics</button>";
		    stats += "<div style='display:none;' id='stats_"+sname+"' class='span5"+offset+"'><table class='table table-condensed' style=''>";
		    var keys = Retina.keys(d.statistics).sort();
		    for (var h=0; h<keys.length; h++) {
			var desc = keys[h].replace(/_/g, " ");
			stats += "<tr><td><b>"+desc+"</b></td><td>"+d.statistics[keys[h]]+"</td>";	
		    }		    
		    stats += "</table></div>";
		}
		
		html += "<div class='span5'><table class='table table-condensed'>";
		html += "<tr><td colspan=2><b>"+d.file_name+"</b></td></tr>";
		html += "<tr><td><b>filesize</b></td><td>"+d.file_size.byteSize()+statsbutton+"<button class='btn btn-primary btn-mini' style='float: right; margin-right: 10px;' onclick='Retina.WidgetInstances.metagenome_download[1].authenticatedDownload(this, \""+d.url+"\");'>download</button></td></tr>";
		html += "<tr><td><b>sequence format</b></td><td>"+d.seq_format+"</td></tr>";
		html += "<tr><td><b>file format</b></td><td>"+d.file_format+"</td></tr>";
		html += "<tr><td><b>MD5</b></td><td>"+d.file_md5+"</td></tr>";
		html += "</table></div>";
		html += stats;
		html += "</div>";
	    }
	    html += widget.apiDownloadHTML();

	    target.innerHTML = html;
	});
    };

    widget.apiDownload = function () {
	var widget = Retina.WidgetInstances.metagenome_download[1];

	document.getElementById('download_progress').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 25px; position: relative; bottom: 5px; margin-left: 15px;'>";

	var ann = document.getElementById('ann_type').options[document.getElementById('ann_type').selectedIndex].value;
	var ont = document.getElementById('ont_source').options[document.getElementById('ont_source').selectedIndex].value;
	var org = document.getElementById('org_source').options[document.getElementById('org_source').selectedIndex].value;
	var url = RetinaConfig.mgrast_api + "/annotation/similarity/"+Retina.cgiParam('metagenome')+"?type="+ann+"&source="+(ann == "ontology" ? ont : org);
	var filename = Retina.cgiParam('metagenome')+"_"+ann+"_"+(ann == "ontology" ? ont : org)+".tab";

	jQuery.ajax( { url: url,
		       headers: stm.authHeader,
		       success: function(data) {
			   stm.saveAs(data, filename);
			   document.getElementById('download_progress').innerHTML = "";
		       },
		       error: function () {
			   alert('there was an error retrieving the data');
			   document.getElementById('download_progress').innerHTML = "";
		       }
		     } );
    };

    widget.authenticatedDownload = function (button, url) {
	var widget = Retina.WidgetInstances.metagenome_download[1];
	console.log(url);
	button.setAttribute('disabled', 'true');
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
    };
    
    widget.apiDownloadHTML = function () {
	return "<div class='span12' style='margin-left: 0px; margin-top: 20px;'><h4>Annotation Download</h4>\
    <table width='100%'><tr><td align='left'>\
      <p>Annotated reads are available through the <a href='"+RetinaConfig.mgrast_api+"' target='_blank'>MG-RAST API</a>.<br>\
         They are built dynamicly based on the chosen annotation type and source.<br>\
         Column fields are as follows:<ol>\
           <li>Query / read id, e.g. mgm4441681.3|12342588</li>\
           <li>Hit id / md5, e.g. afcfe216e7d39b7c789d6760194b6deb</li>\
           <li>percentage identity, e.g. 100.00</li>\
           <li>alignment length, e.g. 107</li>\
           <li>number of mismatches, e.g. 0</li>\
           <li>number of gap openings, e.g. 0</li>\
           <li>q.start, e.g. 1</li>\
           <li>q.end, e.g. 107</li>\
           <li>s.start, e.g. 1262</li>\
           <li>s.end, e.g. 1156</li>\
           <li>e-value, e.g. 1.7e-54</li>\
           <li>score in bits, e.g. 210.0</li>\
           <li>semicolon seperated list of annotation text(s) for the given type and source</li>\
         </ol></p>\
      <table>\
        <tr><td>Annotation Type</td><td>&nbsp;&nbsp;&nbsp;&nbsp;</td><td>Data Source</td><td></td><td></td></tr>\
        <tr>\
          <td>\
            <select id='ann_type' onchange='\
                var sel_type = this.options[this.selectedIndex].value;\
                if (sel_type == \"ontology\") {\
                  document.getElementById(\"ont_source\").style.display=\"\";\
                  document.getElementById(\"org_source\").style.display=\"none\";\
                } else {\
                  document.getElementById(\"org_source\").style.display=\"\";\
                  document.getElementById(\"ont_source\").style.display=\"none\";\
                }'>\
              <option>organism</option>\
              <option>function</option>\
              <option>ontology</option>\
              <option>feature</option>\
            </select></td>\
          <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>\
          <td>\
            <select id='org_source'>\
              <option>RefSeq</option>\
              <option>GenBank</option>\
              <option>IMG</option>\
              <option>SEED</option>\
              <option>TrEMBL</option>\
              <option>SwissProt</option>\
              <option>PATRIC</option>\
              <option>KEGG</option>\
              <option>RDP</option>\
              <option>Greengenes</option>\
              <option>LSU</option>\
              <option>SSU</option>\
            </select>\
            <select id='ont_source' style='display:none;'>\
              <option>Subsystems</option>\
              <option>NOG</option>\
              <option>COG</option>\
              <option>KO</option>\
            </select></td>\
          <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>\
          <td><button class='btn btn-primary' style='position: relative; bottom: 5px;' onclick='Retina.WidgetInstances.metagenome_download[1].apiDownload();'>download</button><span id='download_progress'></span></td>\
        </tr>\
      </table>\
    </td></tr></table></div>";
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