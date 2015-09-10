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

	    content.innerHTML = "<div class='alert alert-info'><img src='Retina/images/waiting.gif' style='width: 16px; margin-right: 10px; position: relative; bottom: 2px;'> loading your data</div>";

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
		details.push('<div class="tabbable"><ul class="nav nav-tabs"><li class="active"><a data-toggle="tab" href="#project'+i+'tab1">Metagenomes</a></li><li class=""><a data-toggle="tab" href="#project'+i+'tab2">Details</a></li><li class=""><a data-toggle="tab" href="#project'+i+'tab3">Access</a></li></ul><div class="tab-content" style="padding-left: 10px;"><div id="project'+i+'tab1" class="tab-pane active">');
		
		if (project.metagenomes.length) {
		    details.push("<table class='table table-condensed table-hover'><tr><th>ID</th><th>name</th><th>basepairs</th><th>sequences</th></tr>");
		    for (var h=0; h<project.metagenomes.length; h++) {
			details.push("<tr><td>"+project.metagenomes[h].metagenome_id+"</td><td>"+project.metagenomes[h].name+"</td><td>"+project.metagenomes[h].basepairs+"</td><td>"+project.metagenomes[h].sequences+"</td></tr>");
		    }
		    details.push("</table>");
		} else {
		    details.push("<div class='alert alert-info'>This project has no metagenomes.</div>");
		}
		
		details.push('</div><div id="project'+i+'tab2" class="tab-pane">');
		details.push(project.description);
		details.push('</div><div id="project'+i+'tab3" class="tab-pane">');
		details.push('access');
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
	    url: RetinaConfig.mgrast_api+'/project?edit=1&verbosity=summary&limit='+widget.projectsPerPage+'&offset='+widget.current,
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
    
})();