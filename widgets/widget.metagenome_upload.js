(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Upload Widget",
                name: "metagenome_upload",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_widget("shockbrowse") ];
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

	var html = "<h4>upload data</h4><p>This is how you upload data</p><div id='browser'></div>";

	content.innerHTML = html;

	document.getElementById('icon_pipeline').lastChild.innerHTML = "Upload";
	sidebar.parentNode.style.display = "none";
	content.className = "span10 offset1";

	// check if we have a user
	if (widget.browser) {
	    widget.browser.display({ target: document.getElementById("browser") });
	} else {
	    widget.browser = Retina.Widget.create("shockbrowse", { "target": document.getElementById("browser"),
								   "width": 900,
								   "height": 450,
								   "enableUpload": true,
								   "customPreview": widget.filePreview,
								   "fileUploadCompletedCallback": widget.fileCompleted,
								   "detailType": "preview",
								   "showDetailBar": false,
								   "showFilter": false,
								   "showResizer": false,
								   "showStatusBar": false,
								   "showTitleBar": false,
								   "enableDownload": false,
								   "showUploadPreview": false,
								   "presetFilters": { "type": "inbox" },
								   "shockBase": RetinaConfig.shock_url});
	}
	if (! widget.user) {
	    document.getElementById("browser").innerHTML = "<div class='alert alert-info' style='width: 500px;'>You must be logged in to upload data.</div>";
	}
    };

    widget.filePreview = function (params) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var html = "<p>Hello World</p>";
	
	return html;
    };

    widget.fileCompleted = function (data) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	console.log(data);
    };

     // login widget sends an action (log-in or log-out)
    widget.loginAction = function (params) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];
	if (params.token) {
	    widget.user = params.user;
	    widget.browser.user = widget.user;
	    widget.browser.presetFilters.user = widget.user.login;
	    widget.browser.authHeader = { "Authorization": "OAuth "+params.token };
	    widget.authHeader = { "Auth": params.token };
	} else {
	    widget.user = null;
	    widget.browser.user = null;
	    delete widget.browser.presetFilters.user;
	    widget.browser.authHeader = {};
	    widget.authHeader = {};
	}
	widget.display();
    };
})();