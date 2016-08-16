(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Library Widget",
                name: "metagenome_library",
                author: "Tobias Paczian",
                requires: []
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
	
	document.getElementById("pageTitle").innerHTML = "library";

	widget.id = widget.id || Retina.cgiParam('library');
	if (! widget.id || ! widget.id.match(/^mgl/)) {
	    content.innerHTML = '<div class="alert alert-error">invalid id</div>';
	    return;
	}
	
	var html = ["<h3>library "+widget.id+"</h3><div style='width: 34px; margin-left: auto; margin-right: auto; margin-top: 100px;'><img src='Retina/images/waiting.gif' style='width: 32px;'></div>"];
	
	content.innerHTML = html.join('');

	// check if required data is loaded
	if (! ( stm.DataStore.hasOwnProperty('library') && stm.DataStore.library.hasOwnProperty(widget.id))) {
	    jQuery.ajax({
		dataType: "json",
		headers: stm.authHeader, 
		url: RetinaConfig.mgrast_api+'/library/'+widget.id+'?verbosity=full',
		success: function (data) {
		    if (! stm.DataStore.hasOwnProperty('library')) {
			stm.DataStore.library = {};
		    }
		    stm.DataStore.library[data.id] = data;
		    Retina.WidgetInstances.metagenome_library[1].display();
		}}).fail(function(xhr, error) {
		    content.innerHTML = "<div class='alert alert-danger' style='width: 500px;'>the library could not be loaded.</div>";
		    console.log(error);
		});
	    return;
        }

	var lib = stm.DataStore.library[widget.id];
	
	html = ['<h3>library '+widget.id+'<div class="btn-group pull-right"><a href="?mgpage=project&project='+lib.project[0]+'" class="btn">project</a><a href="?mgpage=sample&sample='+lib.sample[0]+'" class="btn">sample</button><a href="?mgpage=overview&metagenome='+lib.metagenome[0]+'" class="btn">metagenome</a></div></h3>'];

	
	html.push('<table>');
	var k = Retina.keys(lib.metadata).sort();
	for (var i=0; i<k.length; i++) {
	    html.push('<tr><td style="padding-right: 20px;"><b>'+k[i].replace(/_/ig, ' ')+'</b></td><td>'+lib.metadata[k[i]]+'</td></tr>');
	}
	html.push('<tr><td style="padding-right: 20px;"><b>created</b></td><td>'+lib.created+'</td></tr>');
	html.push('</table>');
	
	content.innerHTML = html.join('');
    };

    widget.authenticatedDownload = function (url, button) {
	var widget = this;

	button.setAttribute('disabled', 'disabled');
	jQuery.ajax( { url: url+"&link=1",
		       headers: stm.authHeader,
		       success: function(data) {
			   button.removeAttribute('disabled');
			   window.location = data.url;
		       },
		       error: function () {
			   button.removeAttribute('disabled');
			   alert('download failed');
		       }
		     } );
    };
    
})();
