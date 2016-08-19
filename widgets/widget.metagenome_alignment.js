(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Alignment Widget",
                name: "metagenome_alignment",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [];
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
	
	document.getElementById("pageTitle").innerHTML = "alignment";

	widget.md5 = widget.md5 || Retina.cgiParam('md5');
	widget.metagenome = widget.metagenome || Retina.cgiParam('metagenome');
	if (! widget.md5 && widget.metagenome) {
	    content.innerHTML = '<div class="alert alert-error">no md5 given</div>';
	    return;
	}
	
	var html = ["<h3>alignment for " + widget.metagenome + " - " + widget.md5 + "</h3><div id='ali'><div style='width: 34px; margin-left: auto; margin-right: auto; margin-top: 100px;'><img src='Retina/images/waiting.gif' style='width: 32px;'></div></div>"];
	
	content.innerHTML = html.join('');

	jQuery.ajax({
	    method: "get",
	    headers: stm.authHeader, 
	    url: RetinaConfig.mgrast_api+'/compute/blast/'+widget.metagenome+'?md5='+widget.md5,
	    success: function (data) {
		Retina.WidgetInstances.metagenome_alignment[1].showAlignment(data);
	    }}).fail(function(xhr, error) {
		content.innerHTML = "<div class='alert alert-danger' style='width: 500px;'>Computation of the alignment failed.</div>";
		console.log(error);
	    });
    };

    widget.showAlignment = function (data) {
	var widget = this;

	document.getElementById('ali').innerHTML = "<pre>"+data.data.alignment+"</pre>";
    };
    
})();
