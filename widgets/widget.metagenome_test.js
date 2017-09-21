(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 Test Widget",
                name: "metagenome_test",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [
	    Retina.load_renderer("arranger"),
	];
    };
 
    widget.display = function (wparams) {
        widget = this;

	var container = widget.container = wparams ? wparams.main : widget.container;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;

	container.innerHTML = '<div id="hans"></div>';

	widget.arranger = Retina.Renderer.create("arranger", { target: document.getElementById("hans") }).render();
    };

})();
