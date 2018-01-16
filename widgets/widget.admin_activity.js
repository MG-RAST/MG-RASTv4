(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Administrator Activity Widget",
            name: "admin_activity",
            author: "Tobias Paczian",
            requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("table") ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.admin_activity[1];

	var t = new Date();
	widget.startDate = t.toISOString().substr(0,10);

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	widget.sidebar.parentNode.style.display = "none";
	widget.main.className = "";
	widget.main.style.marginLeft = "30px";

	if (stm.user) {
	    widget.getData();
	} else {
	    widget.sidebar.style.display = "none";
	    widget.main.innerHTML = "<h3>Authentication required</h3><p>You must be logged in to view this page.</p>";
	}
    };

    widget.showData = function () {
	var widget = this;

	var html = [];

	html.push('<div><span style="position: relative; bottom: 4px;">start date</span> <div class="input-append"><input type="text" value="'+widget.startDate+'" onchange="Retina.WidgetInstances.admin_activity[1].startDate=this.value;"><button class="btn" onclick="Retina.WidgetInstances.admin_activity[1].getData();">load</button></div></div><h3>completed</h3><div id="completed_table" style="width: 80%;"></div><h3>ebi submissions</h3><div id="ebi_table" style="width: 80%;"></div><h3>published</h3><div id="published_table" style="width: 80%;"></div><h3>submitted</h3><div id="submitted_table" style="width: 80%;"></div>');

	widget.main.innerHTML = html.join('');
	
	Retina.Renderer.create("table", { "target": document.getElementById('completed_table'), "data": { "header": [ 'date', 'size', 'job', 'project' ], "data": stm.DataStore.activitydata.completed } }).render();
	Retina.Renderer.create("table", { "target": document.getElementById('ebi_table'), "data": { "header": [ 'date', 'size', 'job', 'project' ], "data": stm.DataStore.activitydata.ebi } }).render();
	Retina.Renderer.create("table", { "target": document.getElementById('published_table'), "data": { "header": [ 'date', 'size', 'job', 'project' ], "data": stm.DataStore.activitydata.published } }).render();
	Retina.Renderer.create("table", { "target": document.getElementById('submitted_table'), "data": { "header": [ 'date', 'size', 'job', 'project' ], "data": stm.DataStore.activitydata.submitted } }).render();
    };

    widget.getData = function () {
	var widget = this;

	widget.main.innerHTML = "<div style='width: 100%; text-align: center; margin-top: 100px;'><img src='Retina/images/waiting.gif'></div>";
	
	jQuery.ajax({ url: RetinaConfig.mgrast_api + "/server/activity?startdate=" + widget.startDate,
		      contentType: 'application/json',
		      headers: stm.authHeader,
		      success: function (data) {
			  var widget = Retina.WidgetInstances.admin_activity[1];
			  stm.DataStore.activitydata = { "completed": data[0], "ebi": data[1], "published": data[2],  "submitted": data[3] };

			  for (var i=0; i<stm.DataStore.activitydata.completed.length; i++) {
			      var x = stm.DataStore.activitydata.completed[i];
			      stm.DataStore.activitydata.completed[i] = [ x[0], parseInt(x[1]).baseSize(), "<a href='mgmain.html?mgpage=overview&metagenome=mgm"+x[4]+"' target=_blank>"+x[2]+"</a>", "<a href='mgmain.html?mgpage=project&project=mgp"+x[5]+"' target=_blank>"+x[3]+"</a>" ];
			  }
			  for (var i=0; i<stm.DataStore.activitydata.ebi.length; i++) {
			      var x = stm.DataStore.activitydata.ebi[i];
			      stm.DataStore.activitydata.ebi[i] = [ x[0], parseInt(x[1]).baseSize(), "<a href='mgmain.html?mgpage=overview&metagenome=mgm"+x[4]+"' target=_blank>"+x[2]+"</a>", "<a href='mgmain.html?mgpage=project&project=mgp"+x[5]+"' target=_blank>"+x[3]+"</a>" ];
			  }
			  for (var i=0; i<stm.DataStore.activitydata.published.length; i++) {
			      var x = stm.DataStore.activitydata.published[i];
			      stm.DataStore.activitydata.published[i] = [ x[0], parseInt(x[1]).baseSize(), "<a href='mgmain.html?mgpage=overview&metagenome=mgm"+x[4]+"' target=_blank>"+x[2]+"</a>", "<a href='mgmain.html?mgpage=project&project=mgp"+x[5]+"' target=_blank>"+x[3]+"</a>" ];
			  }
			  for (var i=0; i<stm.DataStore.activitydata.submitted.length; i++) {
			      var x = stm.DataStore.activitydata.submitted[i];
			      stm.DataStore.activitydata.submitted[i] = [ x[0], parseInt(x[1]).baseSize(), "<a href='mgmain.html?mgpage=overview&metagenome=mgm"+x[4]+"' target=_blank>"+x[2]+"</a>", "<a href='mgmain.html?mgpage=project&project=mgp"+x[5]+"' target=_blank>"+x[3]+"</a>" ];
			  }
			  
			  widget.showData();
		      }
		    });
    };

})();
