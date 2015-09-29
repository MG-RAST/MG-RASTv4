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
	return [ ];
    };

    widget.offset = 0;
    widget.total = 0;
    widget.current = 0;
    widget.projectsPerPage = 10;
    widget.projectRightsLocked = true;
    widget.metagenomeRightsLocked = true;
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.metagenome_share[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	document.getElementById('icon_pipeline').lastChild.innerHTML = "Manage Projects";
	
	var content = widget.main;
	var sidebar = widget.sidebar;

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

	if (! stm.DataStore.hasOwnProperty('project')) {

	    content.innerHTML = "<div style='height: 200px;'></div>";

	    widget.loadProjects();
	    
	    return;
	}
	
	
    };

    widget.showProjects = function () {
	var widget = Retina.WidgetInstances.metagenome_share[1];

	var html = "<h3>Your Projects</h3>";

	var pre = '<div class="tabbable tabs-left"><ul class="nav nav-tabs" style="width: 300px; word-wrap: break-word; margin-right: 0px;">';
	var mid = '</ul><div class="tab-content" style="position: relative; right: 11px; bottom: 37px;">';
	var post = '</div></div>';
	var links = [];
	var details = [];
	for (var i=widget.current; i<(widget.current + widget.projectsPerPage); i++) {
	    if (stm.DataStore.project.hasOwnProperty(i)) {
		var project = stm.DataStore.project[i];
		links.push('<li'+(i==widget.current ? ' class="active"' : '')+'><a href="#project'+i+'" data-toggle="tab">'+project.name+'</a></li>');
		details.push('<div class="tab-pane'+(i==widget.current ? ' active' : '')+'" id="project'+i+'">');
		details.push('<div class="tabbable"><ul class="nav nav-tabs" style="margin-bottom: 0px;"><li class="active"><a data-toggle="tab" href="#project'+i+'tab2">Details</a></li><li class=""><a data-toggle="tab" href="#project'+i+'tab1">Metagenomes</a></li><li class=""><a data-toggle="tab" href="#project'+i+'tab3" onclick="Retina.WidgetInstances.metagenome_share[1].showPermissions(\''+project.id+'\', this.parentNode.parentNode.nextSibling.lastChild);">Access</a></li></ul><div class="tab-content" style="padding-left: 10px;"><div id="project'+i+'tab1" class="tab-pane" style="padding-top: 10px;">');
		
		if (project.metagenomes.length) {
		    details.push("<p>The project "+project.name+" contains "+project.metagenomes.length+" metagenome"+(project.metagenomes.length>1 ? "s" : "")+" listed below.</p><table class='table table-condensed table-hover'><tr><th>ID</th><th>name</th><th>basepairs</th><th>sequences</th></tr>");
		    for (var h=0; h<project.metagenomes.length; h++) {
			details.push("<tr><td>"+project.metagenomes[h].metagenome_id+"</td><td>"+project.metagenomes[h].name+"</td><td>"+project.metagenomes[h].basepairs+"</td><td>"+project.metagenomes[h].sequences+"</td></tr>");
		    }
		    details.push("</table>");
		} else {
		    details.push("<div class='alert alert-info'>This project has no metagenomes.</div>");
		}
		
		details.push('</div><div id="project'+i+'tab2" class="tab-pane active">');
		details.push("<h5>status</h5><div class='alert alert-"+(project.status == "public" ? "success" : "info")+"'>"+project.status+"</div><h5>name</h5><p>"+project.name+"</p><h5>ID</h5><p>"+project.id+"</p><h5>PI</h5><p>"+project.pi+"</p><h5>funding</h5><p>"+project.funding_source+"</p><h5>description</h5><p>"+project.description+"</p>");
		details.push('</div><div id="project'+i+'tab3" class="tab-pane">');
		details.push('</div></div></div></div>');
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
	    var html = "<button class='btn btn-mini' style='float: right;' onclick='Retina.WidgetInstances.metagenome_share[1].addReviewerToken(\""+stm.DataStore.project[found].id+"\", this.parentNode);'>add reviewer token</button><button class='btn btn-mini' style='float: right; margin-left: 5px; margin-right: 5px;'>make public</button><button class='btn btn-mini' style='float: right;' onclick='var email = prompt(\"Please enter the email address to share this project with.\");if(email) { Retina.WidgetInstances.metagenome_share[1].addUser(\""+stm.DataStore.project[found].id+"\", this.parentNode, email);}'>add user</button><h4>project</h4><table class='table table-condensed'><tr><th>user / group</th><th>edit</th><th>view<img src='Retina/images/"+(widget.projectRightsLocked ? "lock" : "unlocked")+".png' style='cursor: pointer; width: 16px; float: right;' title='click to "+(widget.projectRightsLocked ? "unlock" : "lock")+"' onclick='Retina.WidgetInstances.metagenome_share[1].unlockProjectRights(this, \""+project+"\", "+(widget.projectRightsLocked ? "false" : "true")+");'></th></tr>";
	    var okIcon = '<div style="border: 1px solid black; width: 10px; height: 10px;'+(widget.projectRightsLocked ? "" : ' cursor: pointer;" onclick="Retina.WidgetInstances.metagenome_share[1].updateRight(this.parentNode, \'remove\');')+'"><i class="icon icon-ok" style="position: relative; bottom: 6px; right: 1px;"></i></div>';
	    var noIcon = '<div style="border: 1px solid black; width: 10px; height: 10px;'+(widget.projectRightsLocked ? "" : ' cursor: pointer;" onclick="Retina.WidgetInstances.metagenome_share[1].updateRight(this.parentNode, \'add\');')+'"></div>';
	    for (var i=0; i<uarray.length; i++) {
		html += "<tr><td>"+uarray[i].firstname+" "+(uarray[i].hasOwnProperty('claimed') ? "(claimed "+uarray[i].claimed+" times)" : uarray[i].lastname)+"</td><td righttype='project' rightid='"+uarray[i].id+"' rightname='edit' rightscope='"+uarray[i].scope+"' rightindex='"+found+"'>"+(uarray[i].edit ? okIcon : noIcon)+"</td><td righttype='project' rightid='"+uarray[i].id+"' rightname='view' rightscope='"+uarray[i].scope+"' rightindex='"+found+"'>"+(uarray[i].view ? okIcon : noIcon)+"</td></tr>";
	    }
	    html += "</table><h4>metagenomes</h4><table class='table table-condensed'><tr><th>ID</th><th>user / group</th><th>edit</th><th>view<img src='Retina/images/"+(widget.metagenomeRightsLocked ? "lock" : "unlocked")+".png' style='cursor: pointer; width: 16px; float: right;' title='click to "+(widget.metagenomeRightsLocked ? "unlock" : "lock")+"' onclick='Retina.WidgetInstances.metagenome_share[1].unlockMetagenomeRights(this, \""+project+"\", "+(widget.metagenomeRightsLocked ? "false" : "true")+");'></th></tr>";

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
		url: RetinaConfig.mgrast_api+'/project/'+project+'?verbosity=permissions',
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
		    for (var i=0; i<stm.DataStore.project.length; i++) {
			if (stm.DataStore.project[i] && stm.DataStore.project[i].id == this.pid) {
			    
			    break;
			}
		    }
		    
		    console.log(data);
		    return;

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