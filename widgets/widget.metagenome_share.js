(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Metagenome Job and Project sharing Widget",
            name: "metagenome_share",
            author: "Tobias Paczian",
            requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer('metadata') ];
    };

    widget.offset = 0;
    widget.total = 0;
    widget.current = 0;
    widget.projectsPerPage = 15;
    widget.projectRightsLocked = true;
    widget.metagenomeRightsLocked = true;
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.metagenome_share[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}
	
	var content = widget.main;
	var sidebar = widget.sidebar;

	widget.excelExport = Retina.Renderer.create("metadata", {});

	document.getElementById("pageTitle").innerHTML = "study editor";
	
	// help text
	sidebar.setAttribute('style', 'padding: 10px;');
	var sidehtml = '<style>.disable {\
  opacity: 0.4;\
  background-image: url("Retina/images/waiting.gif");\
  background-repeat: no-repeat;\
  background-position: center;\
}\
.disable div,\
.disable textarea {\
  overflow: hidden;\
}\
</style><h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/help.png">How to share data</h3>';
	sidehtml += '<p>Initially all data you upload for processing is accessible only by yourself. There are different levels of sharing your data with oters.</p>';
	
	sidehtml += '<dl>\
<dt>Individual Sharing</dt><dd>You can share your data with other users you specify. If the user you want to share with does not have an MG-RAST account yet, they will be sent a sharing token they can claim once they register. With individual sharing you can choose readonly or full access to share. You can revoke shared access at any time.<br><br></dd>\
<dt>Reviewer Access</dt><dd>For the purpose of publication review you can generate a reviewer access token. These tokens can be sent to your publisher who can pass them on to an anonymous reviewer. You will be able to see the generated reviewer tokens and whether they have been claimed or not. Reviewer access is restricted to readonly. You can revoke reviewer tokens at any time.<br><br></dd>\
<dt>Public Access</dt><dd>You can make your data public once you have provided the minimal amount of metadata. Public data can be viewed by any registered or anonymous user, obviously public access is readonly. Public access cannot be revoked.</dd>\
</dl>';

	sidebar.innerHTML = sidehtml;

	if (! stm.user) {
	    content.innerHTML = "<div class='alert alert-info'>You need to be logged in to use this page</div>";
	    return;
	}

	if (Retina.cgiParam('project')) {

	    widget.loadProjectNames().then(function() { Retina.WidgetInstances.metagenome_share[1].loadProject(Retina.cgiParam('project')); });
	    
	} else {
	
	    widget.loadProjectNames();
	    
	    content.innerHTML = "<div style='height: 200px;'></div>";
	    
	    widget.loadProjects();
	}
	
    };

    widget.showProjects = function () {
	var widget = Retina.WidgetInstances.metagenome_share[1];

	var html = "<h3>my studies</h3>";

	var pre = '<div class="tabbable tabs-left"><ul class="nav nav-tabs" style="width: 300px; word-wrap: break-word; margin-right: 0px;">';
	var mid = '</ul><div class="tab-content" style="position: relative; right: 11px; bottom: 37px;">';
	var post = '</div></div>';
	var links = [];
	var details = [];
	for (var i=widget.current; i<(widget.current + widget.projectsPerPage); i++) {
	    if (stm.DataStore.project.hasOwnProperty(i)) {
		var retval = widget.showProject(i);
		links.push(retval.link);
		details = details.concat(retval.details);
	    }
	}
	
	var pagination = '';
	if (widget.total > widget.projectsPerPage) {
	    pagination += '<div class="pagination"><ul>';
	    var pages = widget.total / widget.projectsPerPage;
	    var p = Math.floor(pages);
	    var last = "";
	    if (pages > p) {
		last = '<li><a href="#" onclick="Retina.WidgetInstances.metagenome_share[1].navigate('+(p * widget.projectsPerPage)+');">'+(p * widget.projectsPerPage)+".."+widget.total+'</a></li>';
	    }
	    if (widget.total / widget.projectsPerPage > 10) {
		pagination += '<li><a href="#" onclick="Retina.WidgetInstances.metagenome_share[1].navigate(\'prev\');">&laquo;</a></li>';
		for (var h=0; h<10; h++) {
		    var curr = '';
		    var off = widget.current - (5 * widget.projectsPerPage);
		    if (off < 0) {
			off = 0;
		    }
		    if (off + (10 * widget.projectsPerPage) > widget.total) {
			off = widget.total - (10 * widget.projectsPerPage);
		    }
		    if (widget.current == off + (h * widget.projectsPerPage)) {
			curr = ' class="disabled"';
		    }
		    pagination += '<li'+curr+'><a href="#" onclick="Retina.WidgetInstances.metagenome_share[1].navigate('+(off + (h * widget.projectsPerPage + 1))+');">'+(off + (h * widget.projectsPerPage + 1))+'..'+(off + ((h + 1) * widget.projectsPerPage))+'</a></li>';
		}
		pagination += '<li><a href="#" onclick="Retina.WidgetInstances.metagenome_share[1].navigate(\'next\');">&raquo;</a></li>';
	    } else {
		for (var h=0; h<p; h++) {
		    var curr = '';
		    if (widget.current == (h * widget.projectsPerPage)) {
			curr = ' class="disabled"';
		    }
		    pagination += '<li'+curr+'><a href="#" onclick="Retina.WidgetInstances.metagenome_share[1].navigate('+(h * widget.projectsPerPage + 1)+');">'+(h * widget.projectsPerPage + 1)+'..'+((h + 1) * widget.projectsPerPage)+'</a></li>';
		}
		pagination += last;
	    }
	    pagination += '</ul></div>';
	}
	
	html += pre + links.join("") + mid + details.join("") + post + pagination;
	
	widget.main.innerHTML = html;
    };

    widget.showProject = function (projectid) {
	var widget = this;

	var details = [];
	var project = stm.DataStore.project[projectid];
	var icon = "";
	if (project.status !== 'public') {
	    if (project.metagenomes.length) {
		var complete = true;
		for (var i=0; i<project.metagenomes.length; i++) {
		    if (! project.metagenomes[i].viewable) {
			complete = false;
			break;
		    }
		}
		if (complete) {
		    project.complete = true;
		    var overdue = widget.checkOverdue(project.metagenomes[0]);
		    if (overdue.overdue) {
			icon += '<img src="Retina/images/warning.png" style="width: 16px; margin-right: 5px; position: relative; bottom: 2px;" title="this project is overdue for publication">';
		    } else if (overdue.duedate) {
			icon += '<img src="Retina/images/info.png" style="width: 16px; margin-right: 5px; position: relative; bottom: 2px;" title="this project must be made public soon">';
		    }
		} else {
		    project.complete = false;
		}
	    }
	}
	var link = '<li'+(projectid==widget.current ? ' class="active"' : '')+'><a href="#project'+projectid+'" data-toggle="tab" class="tab-light">'+icon+project.name+'</a></li>';
	details.push('<div class="tab-pane'+(projectid==widget.current ? ' active' : '')+'" id="project'+projectid+'">');
	details.push('<div class="tabbable"><ul class="nav nav-tabs" style="margin-bottom: 0px; position: relative; right: 1px;"><li class="active"><a class="tab-light" data-toggle="tab" href="#project'+projectid+'tab2">Details</a></li><li class=""><a class="tab-light" data-toggle="tab" href="#project'+projectid+'tab1">Metagenomes</a></li><li class=""><a class="tab-light" data-toggle="tab" href="#project'+projectid+'tab3" onclick="Retina.WidgetInstances.metagenome_share[1].showPermissions(\''+project.id+'\', this.parentNode.parentNode.nextSibling.lastChild);">Access</a></li><li class=""><a class="tab-light" data-toggle="tab" href="#project'+projectid+'tab4" onclick="Retina.WidgetInstances.metagenome_share[1].showMetadata(\''+project.id+'\', document.getElementById(\'project'+projectid+'tab4\'));">Metadata</a></li><li class=""><a class="tab-light" data-toggle="tab" href="#project'+projectid+'tab5" onclick="Retina.WidgetInstances.metagenome_share[1].showCustom(\''+project.id+'\');">Customize Project Page</a></li></ul><div class="tab-content tab-content-inner" style="padding-left: 10px;"><div id="project'+projectid+'tab1" class="tab-pane" style="padding-top: 10px;">');
	
	if (project.metagenomes.length) {
	    if (project.status !== 'public') {
		details.push("<button class='btn btn-mini pull-right' name='movemetagenomesButton'"+(stm.DataStore.hasOwnProperty('projectnames') ? "" : " disabled")+" onclick='Retina.WidgetInstances.metagenome_share[1].moveMetagenomes(\""+projectid+"\");'>move metagenomes</button>");
	    }
	    details.push("<p>The project "+project.name+" contains "+project.metagenomes.length+" metagenome"+(project.metagenomes.length>1 ? "s" : "")+" listed below.</p>");
	    details.push("<div id='targetProject"+projectid+"' class='alert alert-info' style='display: none;'></div>");
	    details.push("<table class='table table-condensed table-hover'><tr><th style='display: none;' class='selectcolumn"+projectid+"'>select</th><th>ID</th><th class='namecolumn_"+projectid+"'>name<button class='btn btn-mini pull-right' style='margin-left: 5px;' onclick='Retina.WidgetInstances.metagenome_share[1].editMetagenomeNames(\""+projectid+"\");'>edit</button></th><th class='namecolumn2_"+projectid+"' style='display: none;'>name<button class='btn btn-mini pull-right' style='margin-left: 5px;' onclick='Retina.WidgetInstances.metagenome_share[1].canceleditMetagenomeNames(\""+projectid+"\");'>cancel</button><button class='btn btn-mini pull-right' style='margin-left: 5px;' onclick='Retina.WidgetInstances.metagenome_share[1].performeditMetagenomeNames(\""+projectid+"\");'>update</button></th><th>basepairs</th><th>sequences</th><th class='typecolumn_"+projectid+"'>sequence type<button class='btn btn-mini pull-right' style='margin-left: 5px;' onclick='Retina.WidgetInstances.metagenome_share[1].editSequenceTypes(\""+projectid+"\");'>edit</button></th><th class='typecolumn2_"+projectid+"' style='display: none;'>sequence type<button class='btn btn-mini pull-right' style='margin-left: 5px;' onclick='Retina.WidgetInstances.metagenome_share[1].canceleditSequenceTypes(\""+projectid+"\");'>cancel</button><button class='btn btn-mini pull-right' style='margin-left: 5px;' onclick='Retina.WidgetInstances.metagenome_share[1].performeditSequenceTypes(\""+projectid+"\");'>update</button></th></tr>");
	    for (var h=0; h<project.metagenomes.length; h++) {
		details.push("<tr><td style='display: none; text-align: center;' class='selectcolumn"+projectid+"'><input type='checkbox' style='position: relative; bottom: 3px;' data-id='"+project.metagenomes[h].metagenome_id+"' class='checkbox_"+projectid+"'></td><td>"+project.metagenomes[h].metagenome_id+"</td><td class='namecolumn_"+projectid+"'>"+project.metagenomes[h].name+"</td><td style='display: none;' class='namecolumn2_"+projectid+"'><input type='text' value='"+project.metagenomes[h].name+"' data-id='"+project.metagenomes[h].metagenome_id+"' data-name='"+project.metagenomes[h].name+"' class='textbox_"+projectid+"'></td><td>"+project.metagenomes[h].basepairs+"</td><td>"+project.metagenomes[h].sequences+"</td><td class='typecolumn_"+projectid+"'>"+project.metagenomes[h].sequence_type+"</td><td style='display: none;' class='typecolumn2_"+projectid+"'><select data-id='"+project.metagenomes[h].metagenome_id+"' data-type='"+project.metagenomes[h].sequence_type+"' class='selectbox_"+projectid+"'><option"+(project.metagenomes[h].sequence_type=='WGS' ? " selected=selected" : "")+">WGS</option><option"+(project.metagenomes[h].sequence_type=='Amplicon' ? " selected=selected" : "")+">Amplicon</option><option"+(project.metagenomes[h].sequence_type=='MT' ? " selected=selected" : "")+">MT</option></select></td></tr>");
	    }
	    details.push("</table>");
	} else {
	    details.push("<div class='alert alert-info'>This project has no metagenomes.</div>");
	    details.push("<div style='text-align: center;'><button class='btn btn-small btn-danger' onclick='if(confirm(\"Really delete this project?\")) { Retina.WidgetInstances.metagenome_share[1].deleteProject(\""+projectid+"\"); }'>delete project</button></div>");
	}
	
	details.push('</div><div id="project'+projectid+'tab2" class="tab-pane active">');
	
	details.push('<h4>status<a href="mgmain.html?mgpage=project&project='+project.id+'" class="btn btn-mini pull-right" title="view project page"><i class="icon icon-eye-open" style="margin-right: 5px; position: relative; top: 2px;"></i> view project page</a></h4>');
	if (project.status == "public") {
	    details.push("<div class='alert alert-success'>public</div>");
	} else {
	    if (project.metagenomes.length) {
		if (! project.complete) {
		    details.push("<div class='alert alert-info'><b>This project has not yet completed computation.</b></div>");
		} else {
		    var overdue = widget.checkOverdue(project.metagenomes[0]);
		    details.push("<div class='alert alert-"+(overdue.overdue ? "error" : "info")+"' id='statusDiv"+projectid+"'><b>private</b><button class='btn btn-mini pull-right' onclick='Retina.WidgetInstances.metagenome_share[1].makeProjectPublic(\""+projectid+"\");'>make public</button><br>");
		    if (overdue.overdue) {
			details.push("This project was to be made public at "+overdue.duedate+". It is "+overdue.overdue+" days overdue.");
		    } else {
			details.push("This project is due to be made public at "+overdue.duedate+".");
		    }
		    details.push("</div>");
		}
	    } else {
		details.push("<div class='alert alert-info'><b>private project without metagenomes</b></div>");
	    }
	}
	details.push(widget.projectDetails(projectid));
	details.push('</div><div id="project'+projectid+'tab4" class="tab-pane">');
	details.push('</div><div id="project'+projectid+'tab5" class="tab-pane">');
	details.push('</div><div id="project'+projectid+'tab3" class="tab-pane">');
	details.push('</div></div></div></div>');
	
	return { "details": details, "link": link };
    };

    widget.showCustomImage = function (nodeid, projectid) {
	var widget = this;

	document.getElementById('projectCustomImage'+projectid).innerHTML = '<div style="width: 26px; margin-left: auto; margin-right: auto; margin-top: 100px;"><img src="Retina/images/waiting.gif" style="width: 24px;"></div>';

	jQuery.get(RetinaConfig.shock_url+"/node/"+nodeid+"?download", function(data){
	    document.getElementById('projectCustomImage'+projectid).innerHTML = data;
	});
    };

    widget.selectCustomImage = function (nodeid, projectid, remove, oldid) {
	var widget = this;

	var projecttab = 0;
	if (projectid.match(/^mgp/)) {
	    for (var i=0; i<stm.DataStore.project.length; i++) {
		if (stm.DataStore.project[i].id == projectid) {
		    projecttab = i;
		    break;
		}
	    }
	} else {
	    projecttab = projectid;
	    projectid = stm.DataStore.project[projecttab].id;
	}
	var target = document.getElementById('project'+projecttab+'tab5');

	target.innerHTML = '<div style="width: 26px; margin-left: auto; margin-right: auto; margin-top: 100px;"><img src="Retina/images/waiting.gif" style="width: 24px;"></div>';

	// if the image was assigned to another project, remove it from there first
	if (oldid) {
	    var url = RetinaConfig.shock_url+'/node/'+oldid;
	    jQuery.ajax({ url: url,
			  dataType: "json",
			  success: function(data) {
			      var attributes = data.data.attributes;
			      delete attributes.inUseInProject;
			      var url = RetinaConfig.shock_url+'/node/'+data.data.id;
			      var fd = new FormData();
			      fd.append('attributes', new Blob([ JSON.stringify(attributes) ], { "type" : "text\/json" }));
			      jQuery.ajax(url, {
				  contentType: false,
				  processData: false,
				  data: fd,
				  success: function(data){
				      console.log('removed');
				  },
				  error: function(jqXHR, error){
				      console.log('removal failed');
				  },
				  crossDomain: true,
				  headers: stm.authHeader,
				  type: "PUT"
			      });
			  },
			  error: function(jqXHR, error) {
			      console.log('node retrieval failed');
			  },
			  crossDomain: true,
			  headers: stm.authHeader
			});
	}

	// get the node to set the project for and update the attributes
	var url = RetinaConfig.shock_url+'/node/'+nodeid;
	jQuery.ajax({ url: url,
		      pid: projectid,
		      rem: remove,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.metagenome_share[1];
			  var projectid = this.pid;
			  var projecttab = 0;
			  if (projectid.match(/^mgp/)) {
			      for (var i=0; i<stm.DataStore.project.length; i++) {
				  if (stm.DataStore.project[i].id == projectid) {
				      projecttab = i;
				      break;
				  }
			      }
			  } else {
			      projecttab = projectid;
			      projectid = stm.DataStore.project[projecttab].id;
			  }
			  var target = document.getElementById('project'+projecttab+'tab5');
			  if (data != null) {
			      if (data.error != null) {
				  target.innerHMTL = '<div class="alert alert-error">could not access your myData space</div>';
			      } else {
				  var attributes = data.data.attributes;
				  attributes.inUseInProject = projectid;
				  if (this.rem) {
				      delete attributes.inUseInProject;
				  }
				  var url = RetinaConfig.shock_url+'/node/'+data.data.id;
				  var fd = new FormData();
				  fd.append('attributes', new Blob([ JSON.stringify(attributes) ], { "type" : "text\/json" }));
				  jQuery.ajax(url, {
				      contentType: false,
				      processData: false,
				      pid: projectid,
				      data: fd,
				      success: function(data){
					  Retina.WidgetInstances.metagenome_share[1].showCustom(this.pid);
					  alert('image updated');
				      },
				      error: function(jqXHR, error){
					  var projecttab = 0;
					  var projectid = this.pid;
					  if (projectid.match(/^mgp/)) {
					      for (var i=0; i<stm.DataStore.project.length; i++) {
						  if (stm.DataStore.project[i].id == projectid) {
						      projecttab = i;
						      break;
						  }
					      }
					  } else {
					      projecttab = projectid;
					      projectid = stm.DataStore.project[projecttab].id;
					  }
					  var target = document.getElementById('project'+projecttab+'tab5');
					  target.innerHMTL = '<div class="alert alert-error">there was an error connecting to your myData space</div>';
				      },
				      crossDomain: true,
				      headers: stm.authHeader,
				      type: "PUT"
				  });
			      }
			  } else {
			      target.innerHMTL = '<div class="alert alert-error">there was an error connecting to your myData space</div>';
			  }
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.metagenome_share[1];
			  var target = document.getElementById('projectCustom'+this.pid);
			  target.innerHMTL = '<div class="alert alert-error">could not access your myData space</div>';
		      },
		      crossDomain: true,
		      headers: stm.authHeader
		    });
    };

    widget.showCustom = function (projectid) {
	var widget = this;

	var projecttab = 0;
	if (projectid.match(/^mgp/)) {
	    for (var i=0; i<stm.DataStore.project.length; i++) {
		if (stm.DataStore.project[i].id == projectid) {
		    projecttab = i;
		    break;
		}
	    }
	} else {
	    projecttab = projectid;
	    projectid = stm.DataStore.project[projecttab].id;
	}
	var target = document.getElementById('project'+projecttab+'tab5');

	var html = ['<h4>select custom analysis graphic</h4><p style="margin-bottom: 25px;">You can store analysis graphics on the <a href="?mgpage=analysis" target=_blank>analysis page</a> and export them to your myData space in MG-RAST using the <img src="Retina/images/cloud-upload.png" style="width: 24px; position: relative; bottom: 3px;"> button in the export section. You can then use these graphics to customize your project page.</p>'];

	html.push('<div id="projectCustom'+projectid+'"><div style="width: 26px; margin-left: auto; margin-right: auto;"><img src="Retina/images/waiting.gif" style="width: 25px;"></div></div>');

	target.innerHTML = html.join("");

	var url = RetinaConfig.shock_url + "/node?querynode&attributes.type=analysisObject&attributes.hasVisualization=1&owner=" + stm.user.login;
	jQuery.ajax({ url: url,
		      pid: projectid,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.metagenome_share[1];
			  var target = document.getElementById('projectCustom'+this.pid);
			  if (data != null) {
			      if (data.error != null) {
				  target.innerHMTL = '<div class="alert alert-error">could not access your myData space</div>';
			      } else {
				  if (data.data.length) {
				      var howmany = 0;
				      var imageIndex = null;
				      for (var i=0; i<data.data.length; i++) {
					  if (data.data[i].attributes.hasOwnProperty('inUseInProject')) {
					      howmany++;
					      if (data.data[i].attributes.inUseInProject == this.pid) {
						  imageIndex = i;
					      }
					  }
				      }
				      var html = ["<p>You have "+data.data.length+" image"+(data.data.length > 1 ? "s" : "")+" available. "+(howmany ? howmany : "None")+" "+(howmany == 1 ? "is used in a project" : "are used in projects")+".</p>"];
				      if (howmany < data.data.length || imageIndex !== null) {
					  html.push('<select style="margin-bottom: 0px;" id="projectCustomSelect'+this.pid+'" onchange="this.selectedIndex==0 ? document.getElementById(\'projectCustomImage'+this.pid+'\').innerHTML=\'<p>- no image -</p>\' : Retina.WidgetInstances.metagenome_share[1].showCustomImage(this.options[this.selectedIndex].value, \''+this.pid+'\');"><option value="'+(imageIndex == null ? 0 : data.data[imageIndex].id)+'">- none -</option>');
					  for (var i=0; i<data.data.length; i++) {
					      if (! data.data[i].attributes.hasOwnProperty('inUseInProject')) {
						  html.push('<option value="'+data.data[i].id+'">'+data.data[i].file.name+'</option>');
					      } else {
						  if (imageIndex !== null && imageIndex == i) {
						      html.push('<option selected="selected" value="'+data.data[i].id+'">'+data.data[i].file.name+'</option>');
						  }
					      }
					  }
					  html.push('</select> <button class="btn" onclick="var s=document.getElementById(\'projectCustomSelect'+this.pid+'\'); if(s.selectedIndex == 0 && s.options[s.selectedIndex].value !== 0) { Retina.WidgetInstances.metagenome_share[1].selectCustomImage(s.options[s.selectedIndex].value, \''+this.pid+'\',true) } else { Retina.WidgetInstances.metagenome_share[1].selectCustomImage(s.options[s.selectedIndex].value, \''+this.pid+'\''+(imageIndex == null ? "" : ', null, \''+data.data[imageIndex].id+'\'')+'); }">select</button>');
					  html.push('<h4>preview</h4>');
					  html.push('<div id="projectCustomImage'+this.pid+'"><p>- no image -</p></div>');
				      } else {
					  html.push('<p>You need to create additional graphics or de-select one in another project to choose one here.</p>');
				      }
				      target.innerHTML = html.join("");
				      var sel = document.getElementById('projectCustomSelect'+this.pid);
				      if (sel.selectedIndex > 0) {
					  widget.showCustomImage(sel.options[sel.selectedIndex].value, this.pid);
				      }
				  } else {
				      target.innerHMTL = '<div class="alert alert-info">you currently have no images in your myData space</div>';
				  }
			      }
			  } else {
			      target.innerHMTL = '<div class="alert alert-error">there was an error connecting to your myData space</div>';
			  }
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.metagenome_share[1];
			  var target = document.getElementById('projectCustom'+this.pid);
			  target.innerHMTL = '<div class="alert alert-error">could not access your myData space</div>';
		      },
		      crossDomain: true,
		      headers: stm.authHeader
		    });
    };
    
    widget.projectDetails = function (projectid) {
	var widget = this;

	var project = stm.DataStore.project[projectid];

	var html = '';

	html = 'name<br><input type="text" value="'+project.name+'" style="width: 465px;" id="md'+projectid+'project_name"><br><br>description<br><textarea style="width: 465px;" id="md'+projectid+'project_description">'+project.description+'</textarea><br><br>funding source<br><input type="text" id="md'+projectid+'project_funding" value="'+(project.funding_source || "")+'" style="width: 465px;"><br><br><h4>administrative contact</h4><table style="text-align: left;"><tbody><tr><td style="padding-bottom: 10px; padding-right: 20px;">eMail</td><td><input type="text" id="md'+projectid+'pi_email" value="'+(project.metadata.PI_email || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">firstname</td><td><input type="text" id="md'+projectid+'pi_firstname" value="'+(project.metadata.PI_firstname || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">lastname</td><td><input type="text" id="md'+projectid+'pi_lastname" value="'+(project.metadata.PI_lastname || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">organization</td><td><input type="text" id="md'+projectid+'pi_organization" value="'+(project.metadata.PI_organization || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">organization url</td><td><input type="text" id="md'+projectid+'pi_organization_url" value="'+(project.metadata.PI_organization_url || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">organization address</td><td><input type="text" id="md'+projectid+'pi_organization_address" value="'+(project.metadata.PI_organization_address || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">organization country</td><td><input type="text" id="md'+projectid+'pi_organization_country" value="'+(project.metadata.PI_organization_country || "")+'" style="width: 300px;"></td></tr></tbody></table><br><h4>technical contact</h4><table style="text-align: left;"><tbody><tr><td style="padding-bottom: 10px; padding-right: 20px;">eMail</td><td><input type="text" id="md'+projectid+'email" value="'+(project.metadata.email || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">firstname</td><td><input type="text" id="md'+projectid+'firstname" value="'+(project.metadata.firstname || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">lastname</td><td><input type="text" id="md'+projectid+'lastname" value="'+(project.metadata.lastname || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">organization</td><td><input type="text" id="md'+projectid+'organization" value="'+(project.metadata.organization || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">organization url</td><td><input type="text" id="md'+projectid+'organization_url" value="'+(project.metadata.organization_url || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">organization address</td><td><input type="text" id="md'+projectid+'organization_address" value="'+(project.metadata.organization_address || "")+'" style="width: 300px;"></td></tr><tr><td style="padding-bottom: 10px; padding-right: 20px;">organization country</td><td><input type="text" id="md'+projectid+'organization_country" value="'+(project.metadata.organization_country || "")+'" style="width: 300px;"></td></tr></tbody></table><button class="btn btn-small pull-right" onclick="Retina.WidgetInstances.metagenome_share[1].updateBasicProjectMetadata(\''+projectid+'\');">update</button>';

	if (project.metadata.hasOwnProperty('EBIstatus') && project.metadata.hasOwnProperty('EBIid')) {
	    if (project.metadata.EBIstatus == 'complete') {
		html += 'This project was submitted successfully to <a href="http://www.ebi.ac.uk/submission/" target=_blank>EBI</a>';
	    } else {
		if (project.metadata.EBIstatus == 'running') {
		    html += 'This project is currently progressing through the <a href="http://www.ebi.ac.uk/submission/" target=_blank>EBI pipeline</a>';
		} else {
		    html += 'This project had an error during <a href="http://www.ebi.ac.uk/submission/" target=_blank>EBI submission</a>';
		}
		html += '<div><button class="btn btn-small">re-submit this project to EBI</button></div>';
	    }
	} else {
	    if (Retina.cgiParam('admin')) {
		html += '<button class="btn btn-small pull-left" onclick="Retina.WidgetInstances.metagenome_share[1].submitToEBIModal(\''+project.name+'\',\''+project.id+'\');">submit to EBI</button>';
	    }
	}

	return html;
    };

    widget.submitToEBIModal = function (project_name, project_id) {
	var widget = this;

	var project;
	var projectid;
	for (var i=0; i<stm.DataStore.project.length; i++) {
	    if (stm.DataStore.project[i].id == project_id) {
		project = stm.DataStore.project[i];
		    projectid = i;
		break;
	    }
	}

	if (project.status != 'public') {
	    alert('You must make the project public before submitting to EBI');
	    return;
	}

	var promises = [ ];

	if (! widget.hasOwnProperty('ebi_biomes')) {
	    var p1 = jQuery.Deferred();
	    promises.push(p1);
	    jQuery.get('data/ebi.tsv').complete(function (xhr) {
		var data = xhr.responseText;
		var rows = data.split(/\n/).sort(function (a, b) {
		    return a.toLowerCase().localeCompare(b.toLowerCase());
		});
		Retina.WidgetInstances.metagenome_share[1].ebi_biomes = rows;
		p1.resolve();
	    });
	}
	
	if (! widget.hasOwnProperty('ebi_techs')) {
	    var p2 = jQuery.Deferred();
	    promises.push(p2);
	    jQuery.getJSON('data/ebi.json').complete(function (xhr) {
		var techs = xhr.responseJSON;
		Retina.WidgetInstances.metagenome_share[1].ebi_techs = techs;
		p2.resolve();
	    });
	}

	if (! stm.DataStore.hasOwnProperty('project_metadata')) {
	    stm.DataStore.project_metadata = {};
	}

	if (! stm.DataStore.project_metadata.hasOwnProperty(project_id)) {
	    promises.push(jQuery.ajax({
		method: "GET",
		dataType: "json",
		projectid: project_id,
		processData: false,
		headers: stm.authHeader,
		url: RetinaConfig.mgrast_api+'/metadata/export/'+project_id,
		success: function (data) {
		    var widget = Retina.WidgetInstances.metagenome_share[1];
		    stm.DataStore.project_metadata[this.projectid] = data;
		}
	    }));
	}

	jQuery.when.apply(this, promises).then(function() {
	    var widget = Retina.WidgetInstances.metagenome_share[1];
	    
	    // make option lists for biomes
	    var nopts = [];
	    var hopts = [];
	    for (var i=0; i<widget.ebi_biomes.length; i++) {
		var cells = widget.ebi_biomes[i].split(/\t/);
		if (cells.length > 1) {
		    if (cells[0] == "host") {
			hopts.push('<option value="'+cells[2]+'">'+cells[1]+'</option>');
		    } else {
			nopts.push('<option value="'+cells[2]+'">'+cells[1]+'</option>');
		    }
		}
	    }
	    
	    // get a hash of all biomes
	    var biomes = {};
	    for (var i=0; i<project.metagenomes.length; i++) {
		if (! biomes.hasOwnProperty(project.metagenomes[i].biome)) {
		    biomes[project.metagenomes[i].biome] = [];
		}
		biomes[project.metagenomes[i].biome].push(project.metagenomes[i].metagenome_id);
	    }
	    widget.biomes = biomes;
	    var biome_list = Retina.keys(biomes).sort();
	    var biome_selects = [];
	    for (var i=0; i<biome_list.length; i++) {
		if (biome_list[i].length) {
		    biome_selects.push('<tr><td><div style="margin-right: 10px; position: relative; bottom: 5px;">'+biome_list[i]+'</div></td><td><select id="biome_'+biome_list[i]+'">');
		    biome_selects.push('<optgroup label="host-associated">'+hopts.join('')+'</optgroup><optgroup label="non-host-associated">'+nopts.join('')+'</optgroup>');
		    biome_selects.push('</select></td></tr>');
		}
	    }
	    
	    // get a list of all techs
	    var techs = {};
	    for (var i=0; i<stm.DataStore.project_metadata[project_id].samples.length; i++) {
		for (var h=0; h<stm.DataStore.project_metadata[project_id].samples[i].libraries.length; h++) {
		    var lib = stm.DataStore.project_metadata[project_id].samples[i].libraries[h];
		    if (! lib.data.hasOwnProperty('seq_model')) {
			lib.data.seq_model = { "value": '0' };
		    }
		    if (! techs.hasOwnProperty(lib.data.seq_model.value)) {
			techs[lib.data.seq_model.value] = [];
		    }
		    techs[lib.data.seq_model.value].push(lib.data.metagenome_id.value);
		}
	    }
	    widget.techs = techs;

	    // make option lists for techs
	    var tech_list = Retina.keys(techs).sort();
	    var tech_selects = [];
	    var t = widget.ebi_techs;
	    var k = Retina.keys(t).sort();
	    for (var i=0; i<tech_list.length; i++) {
		var title = tech_list[i];
		if (title == '0') {
		    title = '<div style="text-align: center;"><img src="Retina/images/info.png" style="width: 16px; cursor: help;" title="You do not have any seq_models set in your library metadata.\nYou can update your metadata to supply these information."></div>';
		}
		tech_selects.push('<tr><td><div style="margin-right: 10px; position: relative; bottom: 5px;">'+title+'</div></td><td><select id="tech_'+tech_list[i]+'">');
		for (var i=0; i<k.length; i++) {
		    tech_selects.push('<optgroup label="'+k[i]+'">');
		    for (var h=0; h<t[k[i]].length; h++) {
			tech_selects.push('<option value="'+k[i]+'|'+t[k[i]][h]+'">'+t[k[i]][h]+'</option>');
		    }
		    tech_selects.push('</optgroup>');
		}
		tech_selects.push('</select></td></tr>');
	    }
	    
	    // create the modal
	    var html = [ '\
      <div class="modal-header">\
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
        <h3><img src="images/ENA-logo.png" style="width: 150px; margin-right: 10px;">submit to the ENA at EBI</h3>\
      </div>\
      <div class="modal-body">\
        <h4 style="margin-top: 0px;">'+project_name+'</h4>\
        <p>To submit your project to the European Nucleotide Archive at the EBI, you need to specify the biome and sequencing technology below.</p>\
        <table><tr><td colspan=2><div style="font-weight: bold;">sequencer model mapping</div></td></tr>'+tech_selects.join('') ];
	    
	    html.push('\
        <tr><td colspan=2><div style="font-weight: bold;">biome mapping</div></td></tr></tr>'+biome_selects.join('')+'</table>\
      </div>\
      <div class="modal-footer">\
        <button class="btn btn-danger pull-left" onclick="jQuery(\'#ebiModal\').modal(\'hide\')">cancel</button>\
        <button class="btn" onclick="Retina.WidgetInstances.metagenome_share[1].submitToEBI(\''+projectid+'\');">submit</button>\
      </div>');

	    var modal = document.createElement('div');
	    modal.setAttribute('id', 'ebiModal');
	    modal.setAttribute('class', 'modal hide fade');
	    document.body.appendChild(modal);
	    modal.innerHTML = html.join("");
	    jQuery('#ebiModal').modal('show');
	});
    };

    widget.submitToEBI = function (projectid) {
	var widget = this;

	var project = stm.DataStore.project[projectid];
	var fd = new FormData();
	
	var mg2biome = {};
	var biomes = Retina.keys(widget.biomes);
	for (var i=0; i<biomes.length; i++) {
	    for (var h=0; h<widget.biomes[biomes[i]].length; h++) {
		mg2biome[widget.biomes[biomes[i]][h]] = biomes[i];
	    }
	}
	var mg2tech = {};
	var techs = Retina.keys(widget.techs);
	for (var i=0; i<techs.length; i++) {
	    for (var h=0; h<widget.techs[techs[i]].length; h++) {
		mg2tech[widget.techs[techs[i]][h]] = techs[i];
	    }
	}

	for (var i=0; i<project.metagenomes.length; i++) {
	    var selname = 'biome_' + mg2biome[project.metagenomes[i].metagenome_id];
	    fd.append('biome'+project.metagenomes[i].metagenome_id, document.getElementById(selname).options[document.getElementById(selname).selectedIndex].value);
	    var selname2 = 'tech_' + mg2tech[project.metagenomes[i].metagenome_id];
	    fd.append('tech'+project.metagenomes[i].metagenome_id, document.getElementById(selname2).options[document.getElementById(selname2).selectedIndex].value);
	}
	
	jQuery.ajax({
	    method: "POST",
	    headers: stm.authHeader,
	    contentType: false,
	    processData: false,
	    data: fd,
	    crossDomain: true,
	    url: RetinaConfig.mgrast_api+'/project/'+project.id+"/submittoebi",
	    complete: function (jqXHR) {
		var data = JSON.parse(jqXHR.responseText);
		console.log(data);
	    }
	});

	jQuery('#ebiModal').modal('hide');
	document.body.removeChild(document.getElementById('ebiModal'));
    };

    widget.updateBasicProjectMetadata = function (projectid) {
	var widget = this;

	var project = stm.DataStore.project[projectid];
	var fd = new FormData();
	fd.append('project_name', document.getElementById("md"+projectid+"project_name").value);
	fd.append('project_description', document.getElementById("md"+projectid+"project_description").value);
	fd.append('project_funding', document.getElementById("md"+projectid+"project_funding").value);
	fd.append('pi_email', document.getElementById("md"+projectid+"pi_email").value);
	fd.append('pi_firstname', document.getElementById("md"+projectid+"pi_firstname").value);
	fd.append('pi_lastname', document.getElementById("md"+projectid+"pi_lastname").value);
	fd.append('pi_organization', document.getElementById("md"+projectid+"pi_organization").value);
	fd.append('pi_organization_country', document.getElementById("md"+projectid+"pi_organization_country").value);
	fd.append('pi_organization_url', document.getElementById("md"+projectid+"pi_organization_url").value);
	fd.append('pi_organization_address', document.getElementById("md"+projectid+"pi_organization_address").value);
	fd.append('email', document.getElementById("md"+projectid+"email").value);
	fd.append('firstname', document.getElementById("md"+projectid+"firstname").value);
	fd.append('lastname', document.getElementById("md"+projectid+"lastname").value);
	fd.append('organization', document.getElementById("md"+projectid+"organization").value);
	fd.append('organization_country', document.getElementById("md"+projectid+"organization_country").value);
	fd.append('organization_url', document.getElementById("md"+projectid+"organization_url").value);
	fd.append('organization_address', document.getElementById("md"+projectid+"organization_address").value);
	jQuery.ajax({
	    method: "POST",
	    headers: stm.authHeader,
	    contentType: false,
	    processData: false,
	    data: fd,
	    crossDomain: true,
	    url: RetinaConfig.mgrast_api+'/project/'+project.id+"/updatemetadata",
	    complete: function (jqXHR) {
		var data = JSON.parse(jqXHR.responseText);
		if (data.hasOwnProperty('ERROR')) {
		    alert('updating metadata failed.');
		} else {
		    alert('metadata updated');
		}
		window.location.reload();
	    }
	});

	return true;
    };

    widget.makeProjectPublic = function (projectid) {
	var widget = this;

	var project = stm.DataStore.project[projectid];
	var div = document.getElementById('statusDiv'+projectid);
	div.className = "alert alert-info";
	div.innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";

	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project/'+project.id+"/makepublic",
	    complete: function (jqXHR) {
		var data = JSON.parse(jqXHR.responseText);
		if (data.hasOwnProperty('ERROR')) {
		    var div = document.getElementById('statusDiv'+projectid);
		    div.className = "alert alert-error";
		    var html = [ "<b>"+data.ERROR+"</b>" ];
		    if (data.hasOwnProperty('errors')) {
			html.push("<br><br>The following problems were encountered:<br>");
			var k = Retina.keys(data.errors);
			for (var i=0; i<k.length; i++) {
			    html.push("<br><b>metagenome "+k[i] + "</b>:<br><ul><li>" + data.errors[k[i]].join("</li><li>")+"</li></ul>");
			}
		    }
		    div.innerHTML = html.join("");
		} else {
		    alert('project published');
		    window.location = "mgmain.html?mgpage=share";
		}
	    }
	});
    };

    widget.checkOverdue = function (metagenome) {
	var widget = this;

	if (! metagenome.hasOwnProperty('created_on')) {
	    return { "duedate": 0,
		     "overdue": null };
	}
	
	var co = metagenome.created_on.substr(0,10).split(/-/);
	var c = new Date(parseInt(co[0]), parseInt(co[1])-1, parseInt(co[2])).valueOf();
	var n = Date.now();
	var prio = metagenome.attributes.priority;
	if (prio == 'date') {
	    c += 1000 * 60 * 60 * 24 * 360;		    
	} else if (prio == '3months') {
	    c += 1000 * 60 * 60 * 24 * 90;
	} else if (prio == '6months') {
	    c += 1000 * 60 * 60 * 24 * 180;
	}
	var grace = 1000 * 60 * 60 * 24 * 21; // three weeks grace period
	c += grace;
	var duedate = new Date(c);
	duedate = duedate.toDateString();
	var overdue = null;
	if (c < n) {
	    overdue = parseInt((n - c) / 1000 / 60 / 60 / 24);
	}

	return { "duedate": duedate,
		 "overdue": overdue };
    };

    widget.editMetagenomeNames = function (projectid) {
	var widget = this;

	jQuery(".namecolumn_"+projectid).toggle();
	jQuery(".namecolumn2_"+projectid).toggle();
    };

    widget.performeditMetagenomeNames = function (projectid) {
	var widget = this;

	jQuery(".namecolumn_"+projectid).toggle();
	jQuery(".namecolumn2_"+projectid).toggle();

	var metagenomes = [];
	jQuery('.textbox_'+projectid).each(function(index) {
	    if (jQuery(this)[0].value != jQuery(this)[0].getAttribute('data-name')) {
		metagenomes.push( [ jQuery(this)[0].getAttribute('data-id'), jQuery(this)[0].value ] );
	    }
	});

	var alldone = jQuery.Deferred();
	var promises = [];
	for (var i=0; i<metagenomes.length; i++) {
	    var fd = new FormData();
	    fd.append('POSTDATA', JSON.stringify({ "metagenome_id": metagenomes[i][0], "name": metagenomes[i][1] }));
	    promises.push(jQuery.ajax({
		method: "POST",
		contentType: false,
		processData: false,
		data: fd,
		crossDomain: true,
		headers: stm.authHeader,
		url: RetinaConfig.mgrast_api+'/job/rename' }));
	}
	alldone.then(function () {
	    window.location.reload(true);
	});
	jQuery.when.apply(this, promises).then(function() {
	    alldone.resolve();
	});
    };

    widget.canceleditMetagenomeNames = function (projectid) {
	var widget = this;

	jQuery('.textbox_'+projectid).each(function(index) {
	    jQuery(this)[0].value = jQuery(this)[0].getAttribute('data-name');
	});
	
	jQuery(".namecolumn_"+projectid).toggle();
	jQuery(".namecolumn2_"+projectid).toggle();
    };
    
    widget.editSequenceTypes = function (projectid) {
	var widget = this;

	jQuery(".typecolumn_"+projectid).toggle();
	jQuery(".typecolumn2_"+projectid).toggle();
    };

    widget.performeditSequenceTypes = function (projectid) {
	var widget = this;

	var metagenomes = [];
	jQuery('.selectbox_'+projectid).each(function(index) {
	    if (jQuery(this)[0].options[jQuery(this)[0].selectedIndex].value != jQuery(this)[0].getAttribute('data-type')) {
		metagenomes.push( [ jQuery(this)[0].getAttribute('data-id'), jQuery(this)[0].options[jQuery(this)[0].selectedIndex].value ] );
	    }
	});

	var alldone = jQuery.Deferred();
	var promises = [];
	for (var i=0; i<metagenomes.length; i++) {
	    var fd = new FormData();
	    fd.append('POSTDATA', JSON.stringify({ "metagenome_id": metagenomes[i][0], "sequence_type": metagenomes[i][1] }));
	    promises.push(jQuery.ajax({
		method: "POST",
		contentType: false,
		processData: false,
		data: fd,
		crossDomain: true,
		headers: stm.authHeader,
		url: RetinaConfig.mgrast_api+'/job/changesequencetype' }));
	}
	alldone.then(function () {
	    window.location.reload(true);
	});
	jQuery.when.apply(this, promises).then(function() {
	    alldone.resolve();
	});

	jQuery(".typecolumn_"+projectid).toggle();
	jQuery(".typecolumn2_"+projectid).toggle();
    };

    widget.canceleditSequenceTypes = function (projectid) {
	var widget = this;

	jQuery('.selectbox_'+projectid).each(function(index) {
	    for (var i=0; i<jQuery(this)[0].options.length; i++) {
		if (jQuery(this)[0].options[i].value == jQuery(this)[0].getAttribute('data-type')) {
		    jQuery(this)[0].selectedIndex = i;
		    break;
		}
	    }
	});

	jQuery(".typecolumn_"+projectid).toggle();
	jQuery(".typecolumn2_"+projectid).toggle();
    };

    widget.moveMetagenomes = function (projectid) {
	var widget = this;

	jQuery(".selectcolumn"+projectid).toggle();
	jQuery("#targetProject"+projectid).toggle();
	var project = stm.DataStore.project[projectid];
	var target = document.getElementById('targetProject'+projectid);
	var html = [ '<table><tr><td style="padding-right: 10px; font-weight: bold;">target project</td><td><select id="targetProjectSelect'+projectid+'" style="margin-bottom: 0px; width: 100%;">' ];
	for (var i=0; i<stm.DataStore.projectnames.length; i++) {
	    if (stm.DataStore.projectnames[i].status == 'private') {
		html.push('<option value="'+stm.DataStore.projectnames[i].id+'">'+stm.DataStore.projectnames[i].name+'</option>');
	    }
	}
	html.push('<option value="0">- create new project -</option>');
	html.push('</select></td><td>');
	html.push('<button id="moveButton'+projectid+'" class="btn" onclick="Retina.WidgetInstances.metagenome_share[1].performMove(\''+projectid+'\');">move</button></td></tr></table>');
	target.innerHTML = html.join("");
    };

    widget.performMove = function (projectid) {
	var widget = this;
	var sourceProject = stm.DataStore.project[projectid];
	var sourceProjectId = sourceProject.id;
	var targetProjectId = document.getElementById('targetProjectSelect'+projectid).options[document.getElementById('targetProjectSelect'+projectid).selectedIndex].value;

	if (targetProjectId == "0") {
	    var name = prompt('Enter a name for the project');
	    if (name.length == 0) {
		alert('you must enter a project name');
		return;
	    }
	    var fd = new FormData();
	    fd.append('user', stm.user.login);
	    fd.append('name', name);
	    jQuery.ajax({
		method: "POST",
		contentType: false,
		processData: false,
		pname: name,
		pid: projectid,
		data: fd,
		crossDomain: true,
		headers: stm.authHeader,
		url: RetinaConfig.mgrast_api+'/project/create',
		complete: function (xhr) {
		    try {
			var pid = this.pid;
			var resp = JSON.parse(xhr.responseText);
			if (resp.hasOwnProperty('OK')) {
			    var opt = document.createElement('option');
			    opt.value = resp.project;
			    opt.text = this.pname;
			    document.getElementById('targetProjectSelect'+pid).appendChild(opt);
			    document.getElementById('targetProjectSelect'+pid).selectedIndex = document.getElementById('targetProjectSelect'+pid).options.length - 1;
			    Retina.WidgetInstances.metagenome_share[1].performMove(pid);
			} else if (resp.ERROR == 'project name taken') {
			    alert('that project name is already taken');
			} else {
			    alert('project creation failed');
			}
		    } catch (error) {
			alert('invalid server response');
		    }
		}});
	    return;
	}

	var metagenomes = [];
	jQuery('.checkbox_'+projectid).each(function(index) {
	    if (jQuery(this)[0].checked) {
		metagenomes.push( jQuery(this)[0].getAttribute('data-id'));
	    }
	});
	
	if (metagenomes.length == 0) {
	    alert('you did not select any metagenomes');
	    return;
	}
	
	var mgs = [];
	for (var i=0; i<metagenomes.length; i++) {
	    mgs.push("move="+metagenomes[i]);
	}

	var b = document.getElementById('moveButton'+projectid);
	b.setAttribute('disabled', 'disabled');
	b.innerHTML = "<img src='Retina/images/waiting.gif' style='width: 16px;'>";

	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    pid: projectid,
	    url: RetinaConfig.mgrast_api+'/project/'+sourceProjectId+"/movemetagenomes?target="+targetProjectId+"&"+mgs.join("&"),
	    success: function (data) {
		if (data.hasOwnProperty('ERROR')) {
		    alert(data.ERROR);
		} else {
		    alert('metagenomes moved');
		    window.location = "mgmain.html?mgpage=share";
		}
	    },
	    error: function (data) {
		alert('moving metagenomes failed');
		var b = document.getElementById('moveButton'+this.pid);
		b.removeAttribute('disabled');
		b.innerHTML = 'move';
	    }});
    };
    
    widget.deleteProject = function (projectid) {
	var widget = this;

	var project = stm.DataStore.project[projectid];
	var fd = new FormData();
	fd.append('id', project.id);
	jQuery.ajax({
	    method: "POST",
	    contentType: false,
	    processData: false,
	    data: fd,
	    crossDomain: true,
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project/delete',
	    success: function (data) {
		if (data.hasOwnProperty('OK')) {
		    alert('project deleted');
		} else {
		    alert(data.ERROR);
		}
		window.location = "mgmain.html?mgpage=share";
	    },
	    error: function (data) {
		alert('deleting project failed');
	    }});
	
    };

    widget.navigate = function (pos) {
	var widget = Retina.WidgetInstances.metagenome_share[1];

	if (pos == "prev") {
	    widget.current -= widget.projectsPerPage;
	    if (widget.current < 0) {
		widget.current = 0;
	    }
	} else if (pos == "next") {
	    widget.current += widget.projectsPerPage;
	    if (widget.current > widget.total - widget.projectsPerPage) {
		widget.current = widget.total - widget.projectsPerPage;
	    }
	} else {
	    widget.current = pos - 1;
	}

	if (! stm.DataStore.project.hasOwnProperty(widget.current + widget.projectsPerPage)) {
	    widget.loadProjects();
	} else {
	    widget.showProjects();
	}
    };

    widget.loadProjectNames = function () {
	var widget = this;

	// get the private projects this user has access to
	return jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project?private=1&edit=1&verbosity=minimal&limit=999',
	    success: function (data) {
		var widget = Retina.WidgetInstances.metagenome_share[1];
		if (! stm.DataStore.hasOwnProperty('projectnames')) {
		    stm.DataStore.projectnames = [];
		}
		for (var i=0; i<data.data.length; i++) {
		    stm.DataStore.projectnames[i] = data.data[i];
		}
		var btns = document.getElementsByName('movemetagenomesButton');
		for (var i=0; i<btns.length; i++) {
		    btns[i].removeAttribute("disabled");
		}
	    },
	    error: function (xhr) {
		Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		Retina.WidgetInstances.metagenome_share[1].main.innerHTML = "<div class='alert alert-error'>There was an error accessing your data</div>";
		widget.main.setAttribute('class','span7 offset1');
	    }
	});
    };
    
    widget.loadProjects = function () {
	var widget = Retina.WidgetInstances.metagenome_share[1];
	
	widget.main.setAttribute('class', 'span7 offset1 disable');

	// get the private projects this user has access to
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project?private=1&edit=1&verbosity=summary&limit='+widget.projectsPerPage+'&offset='+widget.current,
	    success: function (data) {
		var widget = Retina.WidgetInstances.metagenome_share[1];
		if (! stm.DataStore.hasOwnProperty('project')) {
		    stm.DataStore.project = [];
		}
		for (var i=0; i<data.data.length; i++) {
		    stm.DataStore.project[widget.current + i] = data.data[i];
		}
		widget.total = data.total_count;
		widget.main.setAttribute('class','span7 offset1');
		if (data.total_count > 0) {
		    widget.showProjects();
		} else {
		    widget.main.innerHTML = '<div class="alert alert-info">You currently do not have edit access to any projects.</div>';
		}
	    },
	    error: function (xhr) {
		Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		Retina.WidgetInstances.metagenome_share[1].main.innerHTML = "<div class='alert alert-error'>There was an error accessing your data</div>";
		widget.main.setAttribute('class','span7 offset1');
	    }
	});
    };

    widget.loadProject = function (projectid) {
	var widget = Retina.WidgetInstances.metagenome_share[1];

	var canEdit = false;
	for (var i=0; i<stm.DataStore.projectnames.length; i++) {
	    if (stm.DataStore.projectnames[i].id == projectid) {
		canEdit = true;
		break;
	    }
	    if (stm.user.admin) {
		canEdit = true;
	    }
	}

	if (canEdit) {
	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		processData: false,
		headers: stm.authHeader,
		url: RetinaConfig.mgrast_api+'/project/'+projectid+'?verbosity=summary&nocache=1',
		success: function (data) {
		    var widget = Retina.WidgetInstances.metagenome_share[1];
		    stm.DataStore.project = [ data ];
		    widget.main.innerHTML = widget.showProject(0).details.join("");
		},
		error: function (xhr) {
		    Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		    Retina.WidgetInstances.metagenome_share[1].main.innerHTML = "<div class='alert alert-error'>There was an error accessing your data</div>";
		    widget.main.setAttribute('class','span7 offset1');
		}
	    });
	} else {
	    widget.main.innerHTML = "<div class='alert alert-error'>You do not have the permissions to edit this project</div>";
	    widget.main.setAttribute('class','span7 offset1');
	}
    };

    widget.showPermissions = function (project, target) {
	var widget = Retina.WidgetInstances.metagenome_share[1];

	var found = null;
	for (var i=0; i<stm.DataStore.project.length; i++) {
	    if (stm.DataStore.project[i] && stm.DataStore.project[i].id == project) {
		found = i;
		break;
	    }
	}
	if (found !== null && stm.DataStore.project[found].hasOwnProperty('permissions')) {
	    // parse the permissions into a nicer format

	    // project permissions
	    var pperm = stm.DataStore.project[found].permissions.project;
	    var users = {};
	    for (var i=0; i<pperm.length; i++) {
		if (! users.hasOwnProperty(pperm[i][4])) {
		    // check what kind of scope this is
		    // this is a reviewer access token
		    if (pperm[i][5].match(/^Reviewer/)) {
			users[pperm[i][4]] = { "view": false, "edit": false, "delete": false, "firstname": "<button class='btn btn-mini' onclick='alert(\""+pperm[i][4].replace(/^token\:/, "")+"\");'>reviewer token</button>", "lastname": "", "sortorder": pperm[i][5], "scope": pperm[i][4], "id": pperm[i][3], "claimed": 0 };
		    }
		    // this is a user invitation token
		    else if (pperm[i][4].match(/^token/)) {
			users[pperm[i][4]] = { "view": false, "edit": false, "delete": false, "firstname": pperm[i][5].split(/\|/)[3].replace(/email\:/, ""), "lastname": "", "sortorder": pperm[i][5], "scope": pperm[i][4], "id": pperm[i][3] };
		    }
		    // this is a normal user
		    else if (pperm[i][4].match(/^user\:/)) {
			users[pperm[i][4]] = { "view": false, "edit": false, "delete": false, "firstname": pperm[i][1], "lastname": pperm[i][2], "sortorder": pperm[i][2]+", "+pperm[i][1], "scope": pperm[i][4], "id": pperm[i][3] };
		    }
		    // this is a group
		    else {
			users[pperm[i][4]] = { "view": false, "edit": false, "delete": false, "firstname": pperm[i][4], "lastname": "", "sortorder": pperm[i][4], "scope": pperm[i][4], "id": pperm[i][3] };
		    }
		}
		if (pperm[i][5].match(/^Reviewer/) && pperm[i][1] != null) {
		    users[pperm[i][4]].claimed++;
		}
		users[pperm[i][4]][pperm[i][0]] = true;
	    }
	    var uarray = [];
	    for (var i in users) {
		if (users.hasOwnProperty(i)) {
		    uarray.push(users[i]);
		}
	    }
	    uarray = uarray.sort(Retina.propSort("sortorder"));
	    var html = "<button class='btn btn-mini' style='float: right;' onclick='Retina.WidgetInstances.metagenome_share[1].addReviewerToken(\""+stm.DataStore.project[found].id+"\", this.parentNode);'>add reviewer token</button><button class='btn btn-mini' style='float: right;' onclick='var email = prompt(\"Please enter the email address to share this project with.\");if(email) { Retina.WidgetInstances.metagenome_share[1].addUser(\""+stm.DataStore.project[found].id+"\", this.parentNode, email);}'>add user</button><h4>project</h4><table class='table table-condensed'><tr><td>user / group</td><td>edit</td><td>view<img src='Retina/images/"+(widget.projectRightsLocked ? "lock" : "unlocked")+".png' style='cursor: pointer; width: 16px; float: right;' title='click to "+(widget.projectRightsLocked ? "unlock" : "lock")+"' onclick='Retina.WidgetInstances.metagenome_share[1].unlockProjectRights(this, \""+project+"\", "+(widget.projectRightsLocked ? "false" : "true")+");'></td></tr>";
	    var okIcon = '<div style="border: 1px solid black; width: 10px; height: 10px;'+(widget.projectRightsLocked ? "" : ' cursor: pointer;" onclick="Retina.WidgetInstances.metagenome_share[1].updateRight(this.parentNode, \'remove\');')+'"><i class="icon icon-ok" style="position: relative; bottom: 6px; right: 1px;"></i></div>';
	    var noIcon = '<div style="border: 1px solid black; width: 10px; height: 10px;'+(widget.projectRightsLocked ? "" : ' cursor: pointer;" onclick="Retina.WidgetInstances.metagenome_share[1].updateRight(this.parentNode, \'add\');')+'"></div>';
	    for (var i=0; i<uarray.length; i++) {
		html += "<tr><td>"+uarray[i].firstname+" "+(uarray[i].hasOwnProperty('claimed') ? "(claimed "+uarray[i].claimed+" times)" : uarray[i].lastname)+"</td><td righttype='project' rightid='"+uarray[i].id+"' rightname='edit' rightscope='"+uarray[i].scope+"' rightindex='"+found+"'>"+(uarray[i].edit ? okIcon : noIcon)+"</td><td righttype='project' rightid='"+uarray[i].id+"' rightname='view' rightscope='"+uarray[i].scope+"' rightindex='"+found+"'>"+(uarray[i].view ? okIcon : noIcon)+"</td></tr>";
	    }
	    html += "</table><h4>metagenomes</h4><table class='table table-condensed'><tr><td>ID</td><td>user / group</td><td>edit</td><td>view<img src='Retina/images/"+(widget.metagenomeRightsLocked ? "lock" : "unlocked")+".png' style='cursor: pointer; width: 16px; float: right;' title='click to "+(widget.metagenomeRightsLocked ? "unlock" : "lock")+"' onclick='Retina.WidgetInstances.metagenome_share[1].unlockMetagenomeRights(this, \""+project+"\", "+(widget.metagenomeRightsLocked ? "false" : "true")+");'></td></tr>";

	    // metagenome permissions
	    okIcon = '<div style="border: 1px solid black; width: 10px; height: 10px;'+(widget.metagenomeRightsLocked ? "" : ' cursor: pointer;" onclick="Retina.WidgetInstances.metagenome_share[1].updateRight(this.parentNode, \'remove\');')+'"><i class="icon icon-ok" style="position: relative; bottom: 6px; right: 1px;"></i></div>';
	    noIcon = '<div style="border: 1px solid black; width: 10px; height: 10px;'+(widget.metagenomeRightsLocked ? "" : ' cursor: pointer;" onclick="Retina.WidgetInstances.metagenome_share[1].updateRight(this.parentNode, \'add\');')+'"></div>';
	    var mperm = stm.DataStore.project[found].permissions.metagenome;
	    users = {};
	    for (var i=0; i<mperm.length; i++) {
		if (! users.hasOwnProperty(mperm[i][3]+mperm[i][4])) {
		    // check what kind of scope this is
		    // this is a reviewer access token
		    if (mperm[i][5].match(/^Reviewer/)) {
			users[mperm[i][3]+mperm[i][4]] = { "view": false, "edit": false, "delete": false, "firstname": "<button class='btn btn-mini' onclick='alert(\""+mperm[i][4].replace(/^token\:/, "")+"\");'>reviewer token</button>", "lastname": "", "sortorder": mperm[i][3]+mperm[i][5], "id": mperm[i][3], "scope": mperm[i][4], "claimed": 0 };
		    }
		    // this is a user invitation token
		    else if (mperm[i][4].match(/^token/)) {
			users[mperm[i][4]] = { "view": false, "edit": false, "delete": false, "firstname": mperm[i][5].split(/\|/)[3].replace(/email\:/, ""), "lastname": "", "sortorder": mperm[i][3]+mperm[i][5], "scope": mperm[i][4], "id": mperm[i][3] };
		    }
		    // this is a normal user
		    else if (mperm[i][4].match(/^user\:/)) {
			users[mperm[i][3]+mperm[i][4]] = { "view": false, "edit": false, "delete": false, "firstname": mperm[i][1], "lastname": mperm[i][2], "sortorder": mperm[i][3]+mperm[i][2]+", "+mperm[i][1], "id": mperm[i][3], "scope": mperm[i][4] };
		    }
		    // this is a group
		    else {
			if (mperm[i][4].match(/^MGRAST_project/)) {
			    continue;
			}
			users[mperm[i][3]+mperm[i][4]] = { "view": false, "edit": false, "delete": false, "firstname": mperm[i][4].replace(/_/g, " "), "lastname": "", "sortorder": mperm[i][3]+mperm[i][4], "id": mperm[i][3], "scope": mperm[i][4] };
		    }
		}
		if (mperm[i][5].match(/^Reviewer/) && mperm[i][1] != null) {
		    users[mperm[i][4]].claimed++;
		}
		users[mperm[i][3]+mperm[i][4]][mperm[i][0]] = true;
	    }
	    var uarray = [];
	    for (var i in users) {
		if (users.hasOwnProperty(i)) {
		    uarray.push(users[i]);
		}
	    }
	    uarray = uarray.sort(Retina.propSort("sortorder"));
	    var curr = "";
	    for (var i=0; i<uarray.length; i++) {
		var mg = "";
		if (uarray[i].id != curr) {
		    curr = uarray[i].id;
		    mg = "mgm"+uarray[i].id;
		}
		html += "<tr><td>"+mg+"</td><td>"+uarray[i].firstname+" "+(uarray[i].hasOwnProperty('claimed') ? "(claimed "+uarray[i].claimed+" times)" : uarray[i].lastname)+"</td><td righttype='metagenome' rightid='"+uarray[i].id+"' rightname='edit' rightscope='"+uarray[i].scope+"' rightindex='"+found+"'>"+(uarray[i].edit ? okIcon : noIcon)+"</td><td righttype='metagenome' rightid='"+uarray[i].id+"' rightname='view' rightscope='"+uarray[i].scope+"' rightindex='"+found+"'>"+(uarray[i].view ? okIcon : noIcon)+"</td></tr>";
	    }
	    html += "</table>";
	    target.innerHTML = html;
	} else {
	    target.innerHTML = '<div style="text-align: center; margin-top: 80px;"><img src="Retina/images/waiting.gif" style=""></div>';
	    jQuery.ajax({
		method: "GET",
		dataType: "json",
		space: target,
		headers: stm.authHeader,
		url: RetinaConfig.mgrast_api+'/project/'+project+'?verbosity=permissions&nocache=1',
		success: function (data) {
		    for (var i=0; i<stm.DataStore.project.length; i++) {
			if (stm.DataStore.project[i].id == project) {
			    stm.DataStore.project[i].permissions = data.permissions;
			    break;
			}
		    }
		    Retina.WidgetInstances.metagenome_share[1].showPermissions(data.id, this.space);
		},
		error: function (xhr) {
		    alert("oh noes!");
		}
	    });
	}
    };

    widget.showMetadata = function (project, target) {
	var widget = this;

	var found = null;
	for (var i=0; i<stm.DataStore.project.length; i++) {
	    if (stm.DataStore.project[i] && stm.DataStore.project[i].id == project) {
		found = i;
		project = stm.DataStore.project[i];
		break;
	    }
	}
	if (found == null) {
	    alert('invalid project id');
	    return;
	}
	
	var html = [];

	html.push('<br><h4>MetaZen</h4><p>MetaZen is our metadata editor that supports importing, exporting and editing of metadata.</p><p>Click the button below to open this project in the MetaZen editor.</p><div style="text-align: center;"><button class="btn" onclick="window.open(\'mgmain.html?mgpage=metazen2&project='+project.id+'\');">open MetaZen</button></div>');
	
	target.innerHTML = html.join('');
    };

    widget.uploadMetadata = function (event) {
	var widget = Retina.WidgetInstances.metagenome_share[1];

	var id = event.target.id.substr(14);
	var btn = document.getElementById('uploadMetadata'+id);

	document.getElementById('uploadMetadataButton'+id).setAttribute('disabled', 'disabled');
	document.getElementById('uploadMetadataDiv'+id).innerHTML = '<img src="Retina/images/waiting.gif" style="width: 16px;">';
	
	var fd = new FormData();
	fd.append('project', stm.DataStore.project[id].id);
	for (var i=0; i<stm.DataStore.project[id].metagenomes.length; i++) {
	    var mgid = stm.DataStore.project[id].metagenomes[i].metagenome_id;
	    if (! mgid.match(/^mgm/)) {
		mgid = "mgm"+mgid;
	    }
	    fd.append('metagenome', mgid);
	}
	fd.append('upload', btn.files[0], btn.files[0].name);
	jQuery.ajax({
	    method: "POST",
	    headers: stm.authHeader,
	    data: fd,
	    divid: id,
	    contentType: false,
	    processData: false,
	    url: RetinaConfig.mgrast_api+'/metadata/update',
	    complete: function(xhr) {
		var response = JSON.parse(xhr.responseText);
		if (response.hasOwnProperty('ERROR')) {
		    document.getElementById('uploadMetadataDiv'+this.divid).innerHTML = '<div class="alert alert-error">'+response.ERROR+'</div>';
		}
		else if (response.hasOwnProperty('errors') && response.errors.length) {
		    var html = "";
		    var added = "";
		    if (response.added && response.added.length > 0) {
			html += '<div class="alert alert-info">The following metagenomes had metadata added:<br>' + response.added.join('<br>')+'</div>';
		    }
		    html += '<div class="alert alert-error">' + response.errors.join('<br>')+'</div>';
		    document.getElementById('uploadMetadataDiv'+this.divid).innerHTML = html;
		}
		else {
		    document.getElementById('uploadMetadataDiv'+this.divid).innerHTML = '<div class="alert alert-success">The metadata for this project was successfully updated.</div>';
		}
		document.getElementById('uploadMetadataButton'+this.divid).removeAttribute('disabled');
	    }
	});
    };

    widget.exportMetadata = function (project, div, excel) {
	var widget = this;

	document.getElementById('exportMetadataButton'+div).setAttribute('disabled', 'disabled');
	document.getElementById('exportMetadataExcelButton'+div).setAttribute('disabled', 'disabled');
	document.getElementById('exportMetadataDiv'+div).innerHTML = '<img src="Retina/images/waiting.gif" style="width: 16px;">';
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    divid: div,
	    isExcel: excel,
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/metadata/export/'+project,
	    success: function (data) {
		if (this.isExcel) {
		    var rend = Retina.WidgetInstances.metagenome_share[1].excelExport;
		    rend.settings.filename = project+"_metadata.xlsx";
		    rend.settings.data = data;
		    rend.render();
		} else {
		    stm.saveAs(JSON.stringify(data, null, 2), project+"_metadata.json");
		}
	    },
	    error: function (xhr) {
		alert("could not retrieve metadata for this project");
	    },
	    complete: function(xhr) {
		document.getElementById('exportMetadataButton'+this.divid).removeAttribute('disabled');
		document.getElementById('exportMetadataExcelButton'+this.divid).removeAttribute('disabled');
		document.getElementById('exportMetadataDiv'+this.divid).innerHTML = '';
	    }
	});
    };
    
    widget.unlockProjectRights = function (btn, project, lock) {
	var widget = Retina.WidgetInstances.metagenome_share[1];
	
	if (lock) {
	    widget.projectRightsLocked = true;
	} else {
	    widget.projectRightsLocked = false;
	}

	while (btn.nodeName != "DIV") {
	    btn = btn.parentNode;
	}
	widget.showPermissions(project, btn);
    };
    
    widget.unlockMetagenomeRights = function (btn, project, lock) {
	var widget = Retina.WidgetInstances.metagenome_share[1];
	
	if (lock) {
	    widget.metagenomeRightsLocked = true;
	} else {
	    widget.metagenomeRightsLocked = false;
	}

	while (btn.nodeName != "DIV") {
	    btn = btn.parentNode;
	}
	widget.showPermissions(project, btn);
    };

    widget.updateRight = function (node, action) {
	var widget = Retina.WidgetInstances.metagenome_share[1];

	var type = node.getAttribute('righttype');
	var id = node.getAttribute('rightid');
	var name = node.getAttribute('rightname');
	var scope = node.getAttribute('rightscope');
	var rindex = node.getAttribute('rightindex');
	var projectID = stm.DataStore.project[rindex].id;
    
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    node: node,
	    action: action,
	    url: RetinaConfig.mgrast_api+'/project/'+projectID+'/updateright?type='+type+'&name='+name+'&scope='+scope+'&action='+action+'&id='+id,
	    success: function (data) {
		if (data.hasOwnProperty('OK')) {
		    var widget = Retina.WidgetInstances.metagenome_share[1];
		    var node = this.node;
		    var txt = node.parentNode.firstChild.innerHTML.split(/\s/);
		    var firstname = txt[0];
		    var lastname = txt[1] || "";
		    var type = node.getAttribute('righttype');
		    var id = node.getAttribute('rightid');
		    var name = node.getAttribute('rightname');
		    var scope = node.getAttribute('rightscope');
		    var rindex = node.getAttribute('rightindex');
		    var project = stm.DataStore.project[rindex];
		    var action = this.action;
		    while (node.nodeName != "DIV") {
			node = node.parentNode;
		    }
		    if (action == 'remove') {
			for (var i=0; i<project.permissions[type].length; i++) {
			    var p = project.permissions[type][i];
			    if (p[0] == name && p[3] == id && p[4] == scope) {
				project.permissions[type].splice(i, 1);
				break;
			    }
			}
		    } else {
			project.permissions[type].push([name, firstname, lastname, id, scope]);
		    }
		    widget.showPermissions(project.id, node);
		} else if (data.hasOwnProperty('ERROR')) {
		    alert('changing permissions failed: '+data.ERROR);
		} else {
		    alert('changing permissions failed');
		}
	    },
	    error: function (xhr, data) {
		try {
		    var resp = JSON.parse(xhr.responseText);
		    alert('changing permissions failed: '+resp.ERROR);
		} catch (error) {
		    alert('changing permissions failed');
		}
	    }
	});
    };

    widget.addReviewerToken = function (projectID, node) {
	var widget = Retina.WidgetInstances.metagenome_share[1];    
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    node: node,
	    pid: projectID,
	    url: RetinaConfig.mgrast_api+'/project/'+projectID+'/updateright?user=reviewer&type=project&name=view',
	    success: function (data) {
		if (data.hasOwnProperty('token')) {
		    var widget = Retina.WidgetInstances.metagenome_share[1];
		    var found = null;
		    for (var i=0; i<stm.DataStore.project.length; i++) {
			if (stm.DataStore.project[i] && stm.DataStore.project[i].id == this.pid) {
			    delete stm.DataStore.project[i].permissions;
			    break;
			}
		    }
		    widget.showPermissions(this.pid, this.node);
		} else if (data.hasOwnProperty('ERROR')) {
		    alert('adding reviewer token failed: '+data.ERROR);
		} else {
		    alert('adding reviewer token failed');
		}
	    },
	    error: function (xhr, data) {
		try {
		    var resp = JSON.parse(xhr.responseText);
		    alert('adding reviewer token failed: '+resp.ERROR);
		} catch (error) {
		    alert('adding reviewer token failed');
		}
	    }
	});
    };

    widget.addUser = function (projectID, node, email) {
	var widget = Retina.WidgetInstances.metagenome_share[1];    
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    node: node,
	    pid: projectID,
	    url: RetinaConfig.mgrast_api+'/project/'+projectID+'/updateright?user='+email+'&type=project&name=view',
	    success: function (data) {
		if (data.hasOwnProperty('project')) {
		    var widget = Retina.WidgetInstances.metagenome_share[1];
		    var found = null;
		    stm.DataStore.project.push(data.project[0]);
		    widget.showPermissions(this.pid, this.node);
		} else if (data.hasOwnProperty('ERROR')) {
		    alert('sharing with user failed: '+data.ERROR);
		} else {
		    alert('sharing with user failed');
		}
	    },
	    error: function (xhr, data) {
		try {
		    var resp = JSON.parse(xhr.responseText);
		    alert('sharing with user failed: '+resp.ERROR);
		} catch (error) {
		    alert('sharing with usern failed');
		}
	    }
	});
    };

})();
