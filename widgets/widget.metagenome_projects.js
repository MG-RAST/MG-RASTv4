(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Projects Widget",
                name: "metagenome_projects",
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

	document.getElementById("pageTitle").innerHTML = "private studies";

	// check if we have a user
	if (! stm.user) {
	    content.innerHTML = '<div class="alert alert-error">you need to be logged in to see this page</div>';
	    return;
	}

	// create the html
	var html = [ "<h3>Your Private Studies</h3>" ];
	html.push("<p>Below is a table of all projects you have access to.</p>");
	html.push("<div id='projectsDiv'><img src='Retina/images/waiting.gif' style='margin-left: 40%;margin-top: 100px;'></div>");
	    
	content.innerHTML = html.join("");
	
	// load the required data
	widget.getProjects();
    };

    widget.displayProjectsTable = function () {
	var widget = this;

	// create the projects table
	var rows = [];
	for (var i=0; i<widget.data.length; i++) {
	    var p = widget.data[i];
	    var row = [ "<a href='?mgpage=project&project="+p.id+"'>"+p.name+"</a>", p.description, p.metagenomes.length || "0", p.pi, p.metadata.hasOwnProperty('PI_organization') ? p.metadata.PI_organization : "-", p.funding_source, p.id ];
	    rows.push(row);
	}
	
	Retina.Renderer.create("table", {
	    target: document.getElementById('projectsDiv'),
	    rows_per_page: 15,
	    filter_autodetect: true,
	    sort_autodetect: true,
	    synchronous: true,
	    sort: "name",
	    show_export: true,
	    export_filename: "projects.csv",
	    minwidths: [125, 125, 80, 125, 125, 90, 80],
	    data: { data: rows, header: [ "name", "description", "# mgs", "PI", "organization", "funding", "ID" ] }
	}).render();
    };
    
    widget.getProjects = function () {
	jQuery.ajax({
	    method: "GET",
	    dataType: "json",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/project?private=1&verbosity=summary&limit=999&offset=0',
	    success: function (data) {
		var widget = Retina.WidgetInstances.metagenome_projects[1];
		widget.data = data.data;
		if (data.hasOwnProperty('total_count') && data.total_count > 999) {
		    console.log('you have WAY too many projects...');
		}
		widget.displayProjectsTable();
	    },
	    error: function (xhr) {
		Retina.WidgetInstances.login[1].handleAuthFailure(xhr);
		document.getElementById('projectsDiv').innerHTML = "<div class='alert alert-error'>There was an error accessing your data</div>";
	    }
	});
    };

})();
