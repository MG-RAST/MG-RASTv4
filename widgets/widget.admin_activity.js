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

	html.push('<div><span style="position: relative; bottom: 4px;">start date</span> <div class="input-append"><input type="text" value="'+widget.startDate+'" onchange="Retina.WidgetInstances.admin_activity[1].startDate=this.value;"><button class="btn" onclick="Retina.WidgetInstances.admin_activity[1].getData();">load</button></div><div><input type="checkbox" style="margin-top: 0px;" '+(widget.grouped ? 'checked ' : '')+'onchange="Retina.WidgetInstances.admin_activity[1].grouped=this.checked;Retina.WidgetInstances.admin_activity[1].showData();"> group projects</div></div><h3>completed</h3><div id="completed_table" style="width: 80%;"></div><h3>ebi submissions</h3><div id="ebi_table" style="width: 80%;"></div><h3>published</h3><div id="published_table" style="width: 80%;"></div><h3>submitted</h3><div id="submitted_table" style="width: 80%;"></div>');

	widget.main.innerHTML = html.join('');

	var header = [ 'date', 'size', 'job', 'project' ];
	var grouped = '';
	if (widget.grouped) {
	    header = [ 'date', 'size', 'project' ];
	    grouped = '_grouped';
	}

	Retina.RendererInstances.table.splice(1);
	
	Retina.Renderer.create("table", { "target": document.getElementById('completed_table'), "data": { "header": header, "data": stm.DataStore.activitydata['completed'+grouped] } }).render();
	Retina.Renderer.create("table", { "target": document.getElementById('ebi_table'), "data": { "header": header, "data": stm.DataStore.activitydata['ebi'+grouped] } }).render();
	Retina.Renderer.create("table", { "target": document.getElementById('published_table'), "data": { "header": header, "data": stm.DataStore.activitydata['published'+grouped] } }).render();
	Retina.Renderer.create("table", { "target": document.getElementById('submitted_table'), "data": { "header": header, "data": stm.DataStore.activitydata['submitted'+grouped] } }).render();
    };

    widget.getData = function () {
	var widget = this;

	widget.main.innerHTML = "<div style='width: 100%; text-align: center; margin-top: 100px;'><img src='Retina/images/waiting.gif'></div>";
	
	jQuery.ajax({ url: RetinaConfig.mgrast_api + "/server/activity?startdate=" + widget.startDate,
		      contentType: 'application/json',
		      headers: stm.authHeader,
		      success: function (data) {
			  var widget = Retina.WidgetInstances.admin_activity[1];
			  stm.DataStore.activitydata = { "completed": data[0], "ebi": data[1], "published": data[2],  "submitted": data[3], "completed_grouped": [], "ebi_grouped": [], "published_grouped": [],  "submitted_grouped": [] };

			  var temp = {};
			  
			  for (var i=0; i<stm.DataStore.activitydata.completed.length; i++) {
			      var x = stm.DataStore.activitydata.completed[i];
			      if (! temp.hasOwnProperty(x[5])) {
				  temp[x[5]] = [ x[0], 0, x[3] ];
			      }
			      temp[x[5]][1] += parseInt(x[1]);
			      stm.DataStore.activitydata.completed[i] = [ x[0], parseInt(x[1]).baseSize(), "<a href='mgmain.html?mgpage=overview&metagenome=mgm"+x[4]+"' target=_blank>"+x[2]+"</a>", "<a href='mgmain.html?mgpage=project&project=mgp"+x[5]+"' target=_blank>"+x[3]+"</a>" ];
			  }
			  var k = Retina.keys(temp);
			  for (var i=0; i<k.length; i++) {
			      stm.DataStore.activitydata.completed_grouped.push([ temp[k[i]][0], temp[k[i]][1].baseSize(), "<a href='mgmain.html?mgpage=project&project=mgp"+k[i]+"' target=_blank>"+temp[k[i]][2]+"</a>" ]);
			  }
			  temp = {};
		      
			  for (var i=0; i<stm.DataStore.activitydata.ebi.length; i++) {
			      var x = stm.DataStore.activitydata.ebi[i];
			      if (! temp.hasOwnProperty(x[5])) {
				  temp[x[5]] = [ x[0], 0, x[3] ];
			      }
			      temp[x[5]][1] += parseInt(x[1]);
			      stm.DataStore.activitydata.ebi[i] = [ x[0], parseInt(x[1]).baseSize(), "<a href='mgmain.html?mgpage=overview&metagenome=mgm"+x[4]+"' target=_blank>"+x[2]+"</a>", "<a href='mgmain.html?mgpage=project&project=mgp"+x[5]+"' target=_blank>"+x[3]+"</a>" ];
			  }
			  var k = Retina.keys(temp);
			  for (var i=0; i<k.length; i++) {
			      stm.DataStore.activitydata.ebi_grouped.push([ temp[k[i]][0], temp[k[i]][1].baseSize(), "<a href='mgmain.html?mgpage=project&project=mgp"+k[i]+"' target=_blank>"+temp[k[i]][2]+"</a>" ]);
			  }
			  temp = {};
			  
			  for (var i=0; i<stm.DataStore.activitydata.published.length; i++) {
			      var x = stm.DataStore.activitydata.published[i];
			      if (! temp.hasOwnProperty(x[5])) {
				  temp[x[5]] = [ x[0], 0, x[3] ];
			      }
			      temp[x[5]][1] += parseInt(x[1]);
			      stm.DataStore.activitydata.published[i] = [ x[0], parseInt(x[1]).baseSize(), "<a href='mgmain.html?mgpage=overview&metagenome=mgm"+x[4]+"' target=_blank>"+x[2]+"</a>", "<a href='mgmain.html?mgpage=project&project=mgp"+x[5]+"' target=_blank>"+x[3]+"</a>" ];
			  }
			  var k = Retina.keys(temp);
			  for (var i=0; i<k.length; i++) {
			      stm.DataStore.activitydata.published_grouped.push([ temp[k[i]][0], temp[k[i]][1].baseSize(), "<a href='mgmain.html?mgpage=project&project=mgp"+k[i]+"' target=_blank>"+temp[k[i]][2]+"</a>" ]);
			  }
			  temp = {};
			  
			  for (var i=0; i<stm.DataStore.activitydata.submitted.length; i++) {
			      var x = stm.DataStore.activitydata.submitted[i];
			      if (! temp.hasOwnProperty(x[5])) {
				  temp[x[5]] = [ x[0], 0, x[3] ];
			      }
			      temp[x[5]][1] += parseInt(x[1]);
			      stm.DataStore.activitydata.submitted[i] = [ x[0], parseInt(x[1]).baseSize(), "<a href='mgmain.html?mgpage=overview&metagenome=mgm"+x[4]+"' target=_blank>"+x[2]+"</a>", "<a href='mgmain.html?mgpage=project&project=mgp"+x[5]+"' target=_blank>"+x[3]+"</a>" ];
			  }
			  var k = Retina.keys(temp);
			  for (var i=0; i<k.length; i++) {
			      stm.DataStore.activitydata.submitted_grouped.push([ temp[k[i]][0], temp[k[i]][1].baseSize(), "<a href='mgmain.html?mgpage=project&project=mgp"+k[i]+"' target=_blank>"+temp[k[i]][2]+"</a>" ]);
			  }
			  temp = {};
			  
			  widget.showData();
		      }
		    });
    };

})();
