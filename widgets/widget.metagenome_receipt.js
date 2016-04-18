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
	}

	// test id
	widget.id = "mgm4696981.3";

	// check if we have data, if not, get it first
	if (! widget.hasOwnProperty('data')) {
	    widget.getData();
	    return;
	}

	Retina.Renderer.create('notebook', { target: container, showTOC: true, tocTarget: sidebar, flow: widget.flow, dataContainer: widget.dataExtractor(widget.data) }).render();

    };

    widget.dataExtractor = function (data) {
	var widget = this;

	// var mg = null;
	// var mgindex = 0;
	// for (var i=0; i<data.status.metagenomes.length; i++) {
	//     if (data.status.metagenomes[i].info.userattr.id == widget.id) {
	// 	mg = data.status.metagenomes[i];
	// 	mgindex = i;
	// 	break;
	//     }
	// }
	// if (! mg) {
	//     alert("metagenome not found in data");
	//     return;
	// }

	var mg = data;
	
	mg.submission = "14708008-df35-48cf-9649-e800df0c519b";//data.id;
	mg.submitted = Retina.dateString(mg.tasks[0].createddate);
	mg.completed = Retina.dateString(mg.tasks[mg.tasks.length - 1].completeddate);
	mg.totaltime = (new Date(mg.tasks[mg.tasks.length - 1].completeddate).valueOf() - new Date(mg.tasks[0].createddate).valueOf()).timestring(1, true);

	// calculate the actual compute time
	mg.computetime = 0;
	for (var i=0; i<mg.tasks.length; i++) {
	    mg.computetime += new Date(mg.tasks[i].completeddate).valueOf() - new Date(mg.tasks[i].createddate).valueOf();
	}
	mg.computetime = mg.computetime.timestring(1);
	
	mg.tasks[0].inputs[0].size = mg.tasks[0].inputs[0].size.byteSize();
	mg.numstages = mg.tasks.length;
	//mg.stats = data.status.sequences[mgindex].stats_info;

	//mg.stats.file_size = mg.stats.file_size.byteSize();

	return mg;
    };

    widget.getData = function () {
	var widget = this;

	// get the flow
	jQuery.getJSON("data/submission_receipt.flow.json").complete(function(d) {
	    var widget = Retina.WidgetInstances.metagenome_receipt[1];
	    widget.flow = JSON.parse(d.responseText);

	    jQuery.getJSON("data/receipt.json").complete(function(d) {
		widget.data = JSON.parse(d.responseText).job["14708008-df35-48cf-9649-e800df0c519b"];
		widget.display();
		console.log(widget.data);
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

