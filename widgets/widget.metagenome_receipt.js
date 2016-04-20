(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Submission Receipt Widget",
                name: "metagenome_receipt",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [
	    Retina.load_renderer('notebook'),
	    Retina.load_renderer('svg')
	];
    };
        
    widget.display = function (wparams) {
        widget = this;

	var container = widget.target = wparams ? wparams.main : widget.target;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;

	container.innerHTML = '<div style="text-align: center; padding-top: 150px;"><img src="Retina/images/waiting.gif" style="width: 24px;"></div>';

	// get the requested metagenome id
	if (Retina.cgiParam('metagenome')) {
	    widget.id = Retina.cgiParam('metagenome');
	    if (! widget.id.match(/^mgm/)) {
		widget.id = "mgm"+widget.id;
	    }
	} else {
	    widget.id = "mgm4698514.3";
	}

	// check if we have data, if not, get it first
	if (! widget.hasOwnProperty('data')) {
	    widget.getData();
	    return;
	}

	Retina.Renderer.create('notebook', { target: container, showTOC: true, tocTarget: sidebar, flow: widget.flow, dataContainer: widget.dataExtractor(widget.data) }).render();

    };

    widget.dataExtractor = function (data) {
	var widget = this;

	var mg = null;
	var mgindex = 0;
	for (var i=0; i<data.status.metagenomes.length; i++) {
	    if (data.status.metagenomes[i].info.userattr.id == widget.id) {
		mg = data.status.metagenomes[i];
		mgindex = i;
		break;
	    }
	}
	if (! mg) {
	    alert("metagenome not found in data");
	    return;
	}
	
	mg.submission = data.id;
	mg.submitted = Retina.dateString(mg.tasks[0].createddate);
	mg.completed = Retina.dateString(mg.tasks[mg.tasks.length - 1].completeddate);
	mg.totaltime = (new Date(mg.tasks[mg.tasks.length - 1].completeddate).valueOf() - new Date(mg.tasks[0].createddate).valueOf()).timestring(1, true);

	mg.pipeline_stages = [];
	
	// calculate the actual compute time
	mg.computetime = 0;
	for (var h=0; h<mg.tasks.length; h++) {
	    var task = mg.tasks[h];
	    mg.computetime += new Date(task.completeddate).valueOf() - new Date(task.createddate).valueOf();
	    mg.pipeline_stages.push((h+1)+". "+task.cmd.description);
	    mg.pipeline_stages.push([ "<b>created</b>", Retina.dateString(task.createddate) ]);
	    mg.pipeline_stages.push([ "<b>completed</b>", Retina.dateString(task.completeddate) ]);
	    mg.pipeline_stages.push([ "<b>duration</b>", (new Date(task.completeddate).valueOf() - new Date(task.createddate).valueOf()).timestring(1, true) ]);
	    
	    var inputs = [];
	    for (var i in task.inputs) {
		if (task.inputs.hasOwnProperty(i)) {
		    if (task.inputs[i].nofile || task.inputs[i].filename == "mysql.tar" || task.inputs[i].filename == "postgresql.tar") {
			continue;
		    }
		    var from = "uploaded by user";
		    if (task.inputs[i].origin.length) {
			from = " output from stage "+(task.inputs[i].origin + 1)+" - "+mg.tasks[parseInt(task.inputs[i].origin)].cmd.description;
		    }
		    inputs.push(task.inputs[i].filename+" ("+task.inputs[i].size.byteSize()+"), "+from);
		}
	    }
	    inputs = inputs.join('<br>');
	    var outputs = [];
	    for (var i in task.outputs) {
		if (task.outputs.hasOwnProperty(i)) {
		    if (task.outputs[i].type == "update") {
			continue;
		    }
		    outputs.push(task.outputs[i].filename+" ("+task.outputs[i].size.byteSize()+")"+(task.outputs[i]["delete"] ? " <i>temporary</i>" : ""));
		}
	    }
	    outputs = outputs.join('<br>');
	    
	    mg.pipeline_stages.push([ "<b>inputs</b>", inputs ]);
	    mg.pipeline_stages.push([ "<b>outputs</b>", outputs ]);
	}
	mg.computetime = mg.computetime.timestring(1, true);
	
	mg.tasks[0].inputs[0].size = mg.tasks[0].inputs[0].size.byteSize();
	mg.numstages = mg.tasks.length;

	mg.stats = data.status.sequences[mgindex].stats_info;

	mg.stats.file_size = mg.stats.file_size.byteSize();
	mg.stats.bp_count = parseInt(mg.stats.bp_count).formatString();
	mg.stats.sequence_count = parseInt(mg.stats.sequence_count).formatString();
	mg.stats.unique_id_count = parseInt(mg.stats.unique_id_count).formatString();
	mg.stats.ambig_char_count = parseInt(mg.stats.ambig_char_count).formatString();
	mg.stats.ambig_sequence_count = parseInt(mg.stats.ambig_sequence_count).formatString();
	
	return mg;
    };

    widget.getData = function () {
	var widget = this;

	// get the flow
	jQuery.getJSON("data/submission_receipt.flow.json").complete(function(d) {
	    var widget = Retina.WidgetInstances.metagenome_receipt[1];
	    widget.flow = JSON.parse(d.responseText);

	    jQuery.getJSON("data/receipt.json").complete(function(d) {
	    	widget.data = JSON.parse(d.responseText).save;
	    	console.log(widget.data);
	    	widget.display();
	    });
	    
	    // // get the data
	    // jQuery.ajax({
	    // 	method: "GET",
	    // 	headers: stm.authHeader,
	    // 	url: RetinaConfig.mgrast_api+'/metagenome/'+widget.id,
	    // 	success: function (data) {
	    // 	    jQuery.ajax({
	    // 		method: "GET",
	    // 		headers: stm.authHeader,
	    // 		url: RetinaConfig.mgrast_api+'/submission/'+data.submission+'?full=1',
	    // 		success: function (data) {
	    // 		    var widget = Retina.WidgetInstances.metagenome_receipt[1];
	    // 		    stm.DataStore.save = data;
	    // 		    widget.data = data;
	    // 		    widget.display();
	    // 		}}).fail(function(xhr, error) {
	    // 		    console.log(error);
	    // 		});
	    // 	}}).fail(function(xhr, error) {
	    // 		console.log(error);
	    // 	});
	});
    };
    
})();

