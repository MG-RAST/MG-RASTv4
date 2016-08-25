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
	widget.sidebar.parentNode.className = "span3 sidebar affix";
	widget.sidebar.parentNode.style = "right: 8%; background-color: white;";

	document.getElementById("pageTitle").innerHTML = "processing receipt";

	container.innerHTML = '<div style="text-align: center; padding-top: 150px;"><img src="Retina/images/waiting.gif" style="width: 24px;"></div>';

	// get the requested metagenome id
	if (Retina.cgiParam('metagenome')) {
	    var id = Retina.cgiParam('metagenome');
	    if (id.length < 15 && ! id.match(/^mgm/)) {
		id = "mgm"+id;
	    }
	    widget.id = id.match(/^mgm/) ? id : Retina.idmap(id);
	    if (! widget.id.match(/^mgm/)) {
		widget.id = "mgm"+widget.id;
	    }
	}

	// check if we have data, if not, get it first
	if (! widget.hasOwnProperty('submission')) {
	    widget.getData();
	    return;
	}

	var d = widget.dataExtractor();
	var errors = [];
	if (d.oldstats) {
	    errors[8] = true;
	}
	Retina.Renderer.create('notebook', { target: container, showTOC: true, errors: errors, tocTarget: sidebar, flow: widget.flow, dataContainer: d }).render();

    };

    widget.dataExtractor = function () {
	var widget = this;

	var mg = null;
	for (var i=0; i<widget.submission.status.metagenomes.length; i++) {
	    if (widget.submission.status.metagenomes[i].info.userattr.id == widget.id) {
		mg = widget.submission.status.metagenomes[i];
		break;
	    }
	}
	if (! mg) {
	    alert("metagenome not found in data");
	    return;
	}
	var filename = mg.tasks[0].inputs[0].filename;
	var inputfile = null;
	for (var i=0; i<widget.submission.status.submission.input.files.length; i++) {
	    if (widget.submission.status.submission.input.files[i].filename == filename) {
		mg.stats = widget.submission.status.submission.input.files[i].stats_info;
		break;
	    }
	}
	
	mg.submission = widget.submission.id;
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

	if (mg.stats) {
	    mg.stats.file_size = mg.stats.file_size.byteSize();
	    mg.stats.bp_count = parseInt(mg.stats.bp_count).formatString();
	    mg.stats.sequence_count = parseInt(mg.stats.sequence_count).formatString();
	    mg.stats.unique_id_count = parseInt(mg.stats.unique_id_count).formatString();
	    mg.stats.ambig_char_count = parseInt(mg.stats.ambig_char_count).formatString();
	    mg.stats.ambig_sequence_count = parseInt(mg.stats.ambig_sequence_count).formatString();
	} else {
	    mg.oldstats = true;
	}
	
	mg.details = widget.metagenome;
	var screens = {  "h_sapiens": "H. sapiens, NCBI v36",
			 "m_musculus": "M. musculus, NCBI v37",
			 "r_norvegicus": "R. norvegicus, UCSC rn4",
			 "b_taurus": "B. taurus, UMD v3.0",
			 "d_melanogaster": "D. melanogaster, Flybase, r5.22",
			 "a_thaliana": "A. thaliana, TAIR, TAIR9",
			 "e_coli": "E. coli, NCBI, st. 536",
			 "s_scrofa": "Sus scrofa, NCBI v10.2",
			 "none": "none" };
	mg.details.pipeline_parameters.screen_indexes = screens[mg.details.pipeline_parameters.screen_indexes];
	
	return mg;
    };

    widget.getData = function () {
	var widget = this;

	// get the data
	jQuery.ajax({
	    method: "GET",
	    headers: stm.authHeader,
	    url: RetinaConfig.mgrast_api+'/metagenome/'+widget.id,
	    success: function (data) {
		var widget = Retina.WidgetInstances.metagenome_receipt[1];
		widget.metagenome = data;
		if (! data.hasOwnProperty('submission')) {
		    widget.target.innerHTML = "<div class='alert'>The processing receipt is only available for metagenomes processed after May 1st 2016.</div>";
		    return;
		}
		
	    	jQuery.ajax({
	    	    method: "GET",
	    	    headers: stm.authHeader,
	    	    url: RetinaConfig.mgrast_api+'/submission/'+data.submission+'?full=1',
	    	    success: function (data) {
	    	    	var widget = Retina.WidgetInstances.metagenome_receipt[1];
	    	    	widget.submission = data;
			
			// get the flow
			jQuery.getJSON("data/flows/submission_receipt"+(widget.metagenome.pipeline_parameters.hasOwnProperty('filter_ambig') ? "_fasta" : "")+".flow.json").complete(function(d) {
			    var widget = Retina.WidgetInstances.metagenome_receipt[1];
			    widget.flow = JSON.parse(d.responseText);
	    	    	    widget.display();
			});
	    	    }}).fail(function(xhr, error) {
	    	    	Retina.WidgetInstances.metagenome_receipt[1].target.innerHTML = "<div class='alert alert-error'>There was an error retrieving the data for your processing receipt.</div>";
	    	    });
	    }}).fail(function(xhr, error) {
	    	console.log(error);
	    });
    };
    
})();

