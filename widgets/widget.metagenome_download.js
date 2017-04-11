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

	document.getElementById("pageTitle").innerHTML = "metagenome download";

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
	    var id = Retina.cgiParam('metagenome');
	    widget.id = id;
	    if (id.length < 15 && ! id.match(/^mgm/)) {
		id = "mgm"+id;
	    }
	    id = id.match(/^mgm/) ? id : Retina.idmap(id);
	    if (! id.match(/^mgm/)) {
		id = "mgm"+id;
	    }
	    
	    html += "<h2 style='font-weight: normal;'>Processing Information and Downloads for <a class='btn btn-small pull-right' title='show metagenome overview' href='mgmain.html?mgpage=overview&metagenome="+Retina.idmap(id)+"'><i class='icon icon-eye-open'></i> metagenome overview</a><br><span id='mginfo'></span></h2><p>The three sections below provide thorough information about your dataset in MG-RAST. The <a href='#generalInfo'>general information</a> lists the details of your submission, the environment it was run in and the options you chose. The <a href='#processingSteps'>processing steps</a> lists each step of the pipeline with detailed information and offers downloads of its data products. The <a href='#annotationDownloads'>annotation downloads</a> section offers downloads for all annotation databases available in MG-RAST.</p><div id='metagenome_download'><img src='Retina/images/waiting.gif' style='left: 40%; position: relative; margin-top: 100px;'></div>";
	    content.innerHTML = html;

	    jQuery.ajax( { dataType: "json",
			   url: RetinaConfig['mgrast_api']+"/metagenome/"+id,
			   headers: stm.authHeader,
			   success: function(data) {
			       var widget = Retina.WidgetInstances.metagenome_download[1];
			       var did = data.id.substr(3);
			       document.getElementById('mginfo').innerHTML = data.name+(data.status=="public" ? " ("+data.id+")" : " (Temporary ID "+Retina.idmap(data.id)+")");
			       widget.metagenomeInfo = data;
			       if (data.submission) {
				   jQuery.ajax( { dataType: "json",
						  url: RetinaConfig['mgrast_api']+"/submission/"+data.submission,
						  headers: stm.authHeader,
						  success: function(data) {
						      var widget = Retina.WidgetInstances.metagenome_download[1];
						      widget.pipelineInfo = data;
						      if (widget.hasOwnProperty('downloadInfo')) {
							  widget.displayMetagenomeDownloads();
						      }
						  },
						  error: function (xhr, data) {
						      
						  }
						} );
			       } else {
				   widget.pipelineInfo = false;
				   if (widget.hasOwnProperty('downloadInfo')) {
				       widget.displayMetagenomeDownloads();
				   }
			       }
			   }
			 } );

	    jQuery.ajax( { dataType: "json",
			   url: RetinaConfig['mgrast_api']+"/download/history/"+id,
			   headers: stm.authHeader,
			   success: function(data) {
			       var widget = Retina.WidgetInstances.metagenome_download[1];
			       widget.downloadInfo = data.data;
			       if (widget.hasOwnProperty('pipelineInfo')) {
				   widget.displayMetagenomeDownloads();
			       }
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

    widget.displayMetagenomeDownloads = function () {
	var widget = this;
	var download = widget.downloadInfo;
	var pipeline = widget.pipelineInfo;
	
	var html = [];

	var psubmit = pipeline && pipeline.error == null ? pipeline.info.submittime : download.info.submittime;
	var pstarted = pipeline && pipeline.error == null ? pipeline.info.startedtime : download.info.startedtime;
	var pcompleted = pipeline && pipeline.error == null ? pipeline.info.completedtime : download.info.completedtime;

	html.push('<a name="generalInfo" style="position: relative; bottom: 60px;"></a><h3>General Information</h3>');
	
	html.push('<p>Your '+widget.metagenomeInfo.pipeline_parameters.file_type+' dataset of '+parseInt(download.info.userattr.bp_count).baseSize()+' was submitted to version '+download.info.userattr.pipeline_version+' of the MG-RAST pipeline at '+psubmit+' with priority '+download.info.priority+'.');
	if (pstarted && pcompleted) {
	    html.push(' It started to compute at '+pstarted+' and finished computation at '+pcompleted+'.')
	}
	html.push('</p>');

	if (pipeline && pipeline.inputs && pipeline.inputs.length > 1) {
	    var mbp = 0;
	    for (var i=0; i<pipeline.inputs.length; i++) {
		mbp += parseInt(pipeline.inputs[i].stats_info.bp_count);
	    }
	    html.push('<p>This dataset was part of a submission of a total of '+pipeline.inputs.length+' datasets with '+mbp.baseSize()+'.');
	    //html.push('<button class="btn btn-mini" style="margin-left: 20px;" onclick="this.innerHTML==\'show\' ? this.innerHTML=\'hide\' : this.innerHTML=\'show\'; jQuery(\'#submissionInfo\').toggle();">show</button>');
	    html.push('</p><div id="submissionInfo"><table class="table table-condensed table-hover"><tr><th>dataset</th><th>filesize</th><th>basepairs</th><th>sequences</th><th>length</th></tr>');//style="display: none;" 
	    for (var i=0; i<pipeline.outputs.length; i++) {
		var id = Retina.idmap(pipeline.outputs[i].metagenome_id);
		html.push('<tr><td style="padding-right: 50px;"><a href="?mgpage=download&metagenome='+id+'">'+pipeline.outputs[i].metagenome_name+'</a></td><td>'+pipeline.inputs[i].stats_info.file_size.byteSize()+'</td><td>'+parseInt(pipeline.inputs[i].stats_info.bp_count).baseSize()+'</td><td>'+parseInt(pipeline.inputs[i].stats_info.sequence_count).formatString()+'</td><td>'+pipeline.inputs[i].stats_info.average_length+'bp ('+pipeline.inputs[i].stats_info.length_min+'bp - '+pipeline.inputs[i].stats_info.length_max+'bp)</td></tr>');
	    }
	    html.push('</table></div>');
	}
	
	html.push('<p>You chose the following pipeline options for this submission:</p>');

	var filterMapping = {
	    "h_sapiens_asm": "H. sapiens, NCBI v36",
	    "h_sapiens": "H. sapiens, NCBI v36",
	    "m_musculus": "M. musculus, NCBI v37",
	    "r_norvegicus": "R. norvegicus, UCSC rn4",
	    "b_taurus": "B. taurus, UMD v3.0",
	    "d_melanogaster": "D. melanogaster, Flybase, r5.22",
	    "a_thaliana": "A. thaliana, TAIR, TAIR9",
	    "e_coli": "E. coli, NCBI, st. 536",
	    "s_scrofa": "Sus scrofa, NCBI v10.2",
	    "none": "none" };
	html.push('<table style="text-align: left; margin-left: 100px; margin-bottom: 20px; margin-top: 20px;">');
	html.push('<tr><th>assembled</th><td>'+widget.metagenomeInfo.pipeline_parameters.assembled+'</td></tr>');
	html.push('<tr><th>dereplication</th><td>'+widget.metagenomeInfo.pipeline_parameters.dereplicate+'</td></tr>');
	html.push('<tr><th>screening</th><td>'+filterMapping[widget.metagenomeInfo.pipeline_parameters.screen_indexes]+'</td></tr>');
	html.push('<tr><th>publication</th><td>'+widget.metagenomeInfo.pipeline_parameters.priority+'</td></tr>');
	if (widget.metagenomeInfo.pipeline_parameters.file_type == 'fastq') {
	    html.push('<tr><th>dynamic trimming</th><td>'+widget.metagenomeInfo.pipeline_parameters.dynamic_trim+'</td></tr>');
	    html.push('<tr><th>minimum quality</th><td>'+widget.metagenomeInfo.pipeline_parameters.min_qual+'</td></tr>');
	    html.push('<tr><th style="padding-right: 20px;">maximum low quality basepairs</th><td>'+widget.metagenomeInfo.pipeline_parameters.max_lqb+'</td></tr>');
	} else {
	    html.push('<tr><th>length filtering</th><td>'+widget.metagenomeInfo.pipeline_parameters.filter_ln+'</td></tr>');
	    html.push('<tr><th style="padding-right: 20px;">length filter deviation multiplicator</th><td>'+widget.metagenomeInfo.pipeline_parameters.filter_ln_mult+'</td></tr>');
	    html.push('<tr><th>ambiguous base filtering</th><td>'+widget.metagenomeInfo.pipeline_parameters.filter_ambig+'</td></tr>');
	    html.push('<tr><th>maximum ambiguous basepairs</th><td>'+widget.metagenomeInfo.pipeline_parameters.max_ambig+'</td></tr>');
	}
	html.push('</table>');
	html.push('<p>The computational environment and workflow can be downloded below:</p><ul style="margin-left: 100px;"><li><a href="'+download.enviroment+'" target=_blank>environment</a></li><li><a href="'+download.template+'" target=_blank>workflow document</a></li></ul>');

	html.push('<a name="processingSteps" style="position: relative; bottom: 60px;"></a><h3>Processing Steps</h3><p>Data are available from each step in the MG-RAST pipeline. Each section below corresponds to a step in the processing pipeline. Each of these sections includes a description of the input, output, and procedures implemented by the indicated step. Buttons to download data processed by the step and detailed statistics (click on &ldquo;show stats&rdquo; to make collapsed tables visible).</p>');
	
	for (var i=0; i<download.tasks.length; i++) {
	    var t = download.tasks[i];

	    html.push("<div class='span12' style='margin-left: 0px; margin-top: 20px;'><h4>"+i+'. '+t.title+"</h4>");
	    html.push("<div class='span6'>");
	    if (t.hasOwnProperty('starteddate') && t.hasOwnProperty('completeddate')) {
		html.push('<p><i>started '+t.starteddate+' - completed '+t.completeddate+'</i></p>');
	    }
	    html.push("<p>"+t.description+"</p>");

	    var files = t.outputs;
	    if (i==0) {
		files = t.inputs;
	    } else {
		html.push('<p>The script executed at this step is available <a href="'+t.link+'" target=_blank>here</a>.'+(t.uses.length ? ' It uses the following software:' : '' )+'</p>');
		for (var h=0; h<t.uses.length; h++) {
		    html.push('<div style="margin-top: 15px;"><b>'+t.uses[h].name+'</b><a href="'+t.uses[h].link+'" target=_blank class="btn btn-mini" style="margin-left: 25px; margin-right: 25px; position: relative; bottom: 2px;">download</a><a style="position: relative; bottom: 2px;" class="btn btn-mini" href="'+t.uses[h].paper+'" target=_blank>citation</a><br/><pre style="margin-top: 10px;">'+t.uses[h].cmd.replace(/\</g, "&lt;")+'</pre></div>');
		}
	    }
	    
	    html.push("</div><div class='span5'>");

	    for (var h=0; h<files.length; h++) {
		var downloadButton;
		if (files[h].hasOwnProperty('node_id')) {
		    downloadButton = "<button class='btn btn-mini' style='float: right;' onclick='Retina.WidgetInstances.metagenome_download[1].authenticatedDownload(\""+files[h].url+"\");'><img src='Retina/images/cloud-download.png' style='width: 16px;'> download</button>";
		} else {
		    downloadButton = " <i>(temporary)</i>";
		}
		var stats = "";
		var statsbutton = "";
		if (files[h].hasOwnProperty('statistics') && Retina.keys(files[h].statistics).length) {
	    	    statsbutton = "<button class='btn pull-right btn-mini' onclick='if(document.getElementById(\"stats_"+i+"_"+h+"\").style.display==\"none\"){document.getElementById(\"stats_"+i+"_"+h+"\").style.display=\"\";}else{document.getElementById(\"stats_"+i+"_"+h+"\").style.display=\"none\";}'>statistics</button>";
	    	    stats += "<div style='display:none;' id='stats_"+i+"_"+h+"'><table class='table table-condensed' style=''>";
	    	    var keys = Retina.keys(files[h].statistics).sort();
	    	    for (var j=0; j<keys.length; j++) {
	    		var desc = keys[j].replace(/_/g, " ");
	    		stats += "<tr><td><b>"+desc+"</b></td><td>"+files[h].statistics[keys[j]]+"</td>";	
	    	    }		    
	    	    stats += "</table></div>";
		}
		html.push("<div><table class='table table-condensed'>");
		html.push("<tr><td colspan=2><b>"+files[h].file_name+"</b>"+downloadButton+"</td></tr>");
		html.push("<tr><td><b>filesize</b></td><td>"+parseInt(files[h].file_size).byteSize()+statsbutton+"</td></tr>");
		if (files[h].hasOwnProperty('node_id')) {
		    html.push("<tr><td><b>MD5</b></td><td>"+(files[h].file_md5 ? files[h].file_md5 : "-")+"</td></tr>");
		}
		html.push("</table>"+stats);
		html.push(stats);
		html.push("</div>");
	    }
	    
	    html.push("</div></div>");
	}
	html.push(widget.apiDownloadHTML());
	
	document.getElementById('metagenome_download').innerHTML = html.join("");
    };

    widget.apiDownload = function () {
	var widget = Retina.WidgetInstances.metagenome_download[1];

	document.getElementById('download_progress').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 25px; position: relative; bottom: 5px; margin-left: 15px;'>";

	var ann = document.getElementById('ann_type').options[document.getElementById('ann_type').selectedIndex].value;
	var ont = document.getElementById('ont_source').options[document.getElementById('ont_source').selectedIndex].value;
	var org = document.getElementById('org_source').options[document.getElementById('org_source').selectedIndex].value;
	var id = Retina.cgiParam('metagenome');
	if (! id.match(/^mgm/)) {
	    id = Retina.idmap(id);
	}
	var url = RetinaConfig.mgrast_api + "/annotation/similarity/"+id+"?type="+ann+"&source="+(ann == "ontology" ? ont : org)+"&auth="+stm.authHeader.Authorization+"&browser=1";
	window.open(url);
    };

    widget.authenticatedDownload = function (url) {
	window.location = url+"&auth="+stm.authHeader.Authorization+"&browser=1";
    };
    
    widget.apiDownloadHTML = function () {
	return "<div class='span12' style='margin-left: 0px; margin-top: 20px;'><a name='annotationDownloads' style='position: relative; bottom: 60px;'></a><h3>Annotation Downloads</h3>\
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
          <td><button class='btn' style='position: relative; bottom: 5px;' onclick='Retina.WidgetInstances.metagenome_download[1].apiDownload();'><img src='Retina/images/cloud-download.png' style='width: 16px;'> download</button><span id='download_progress'></span></td>\
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
