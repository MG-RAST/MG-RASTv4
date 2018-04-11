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
	    Retina.load_renderer("table")
	];
    };
 
    widget.display = function (params) {
	var widget = this;
	var target = params.main;
	
	var rendererTarget = document.createElement('div');
	target.appendChild(rendererTarget);
	
	var myTable = Retina.Renderer.create('table',
					     { 'target': rendererTarget,
					       'data': Retina.RendererInstances.table[0].exampleData() } );

	myTable.settings.editable = { 0: true };
	myTable.render();
	
	return widget;
    };

})();
