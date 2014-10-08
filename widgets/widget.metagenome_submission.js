(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Submission Widget",
                name: "metagenome_submission",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [];
    };
    
    widget.display = function (params) {
        var widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	// help text
	sidebar.setAttribute('style', 'padding: 10px;');
	var sidehtml = '<h3><span style="border: 3px solid black; margin-right: 10px; border-radius: 20px; font-size: 16px; padding-left: 8px; padding-right: 8px; position: relative; bottom: 3px;">i</span>Hello World</h3>';

	sidebar.innerHTML = sidehtml;

	// title
	var html = "<div class='btn-group' data-toggle='buttons-checkbox' style='margin-bottom: 20px;'><a href='?mgpage=upload' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/upload.png'>upload data</a><a href='?mgpage=submission' class='btn btn-large active' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>perform submission</a><a href='?mgpage=pipeline' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a></div>";
	content.innerHTML = html;

	if (! widget.user) {
	    content.innerHTML = "<div class='alert alert-info' style='width: 500px;'>You must be logged in to upload data.</div>";
	}
    };

     // login widget sends an action (log-in or log-out)
    widget.loginAction = function (params) {
	var widget = Retina.WidgetInstances.metagenome_submission[1];
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