(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Sample Widget",
                name: "metagenome_sample",
                author: "Tobias Paczian",
                requires: [ "rgbcolor.js", "markerclusterer.js" ]
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
	
	document.getElementById("pageTitle").innerHTML = "sample";
	
	widget.id = widget.id || Retina.cgiParam('sample');
	if (! widget.id || ! widget.id.match(/^mgs/)) {
	    content.innerHTML = '<div class="alert alert-error">invalid id</div>';
	    return;
	}
	
	var html = ["<h3>sample "+widget.id+"</h3><div style='width: 34px; margin-left: auto; margin-right: auto; margin-top: 100px;'><img src='Retina/images/waiting.gif' style='width: 32px;'></div>"];
	
	content.innerHTML = html.join('');

	// check if required data is loaded
	if (! ( stm.DataStore.hasOwnProperty('sample') && stm.DataStore.sample.hasOwnProperty(widget.id))) {
	    jQuery.ajax({
		dataType: "json",
		headers: stm.authHeader, 
		url: RetinaConfig.mgrast_api+'/sample/'+widget.id+'?verbosity=full',
		success: function (data) {
		    if (! stm.DataStore.hasOwnProperty('sample')) {
			stm.DataStore.sample = {};
		    }
		    stm.DataStore.sample[data.id] = data;
		    Retina.WidgetInstances.metagenome_sample[1].display();
		}}).fail(function(xhr, error) {
		    content.innerHTML = "<div class='alert alert-danger' style='width: 500px;'>the sample could not be loaded.</div>";
		    console.log(error);
		});
	    return;
        }

	var sample = stm.DataStore.sample[widget.id];
	
	html = ['<h3>sample '+widget.id+'<div class="btn-group pull-right"><a href="?mgpage=project&project='+sample.project[0]+'" class="btn">project</a></div></h3>'];

	
	html.push('<table>');
	var k = Retina.keys(sample.metadata).sort();
	for (var i=0; i<k.length; i++) {
	    html.push('<tr><td style="padding-right: 20px;"><b>'+k[i].replace(/_/ig, ' ')+'</b></td><td>'+sample.metadata[k[i]]+'</td></tr>');
	}
	k = Retina.keys(sample.env_package.metadata).sort();
	for (var i=0; i<k.length; i++) {
	    if (k[i] == 'env_package' || k[i] == 'sample_name') { continue; }
	    html.push('<tr><td style="padding-right: 20px;"><b>'+k[i].replace(/_/ig, ' ')+'</b></td><td>'+sample.env_package.metadata[k[i]]+'</td></tr>');
	}
	html.push('<tr><td style="padding-right: 20px;"><b>created</b></td><td>'+sample.created+'</td></tr>');
	html.push('</table>');
	
	content.innerHTML = html.join('');
    };
    
})();
