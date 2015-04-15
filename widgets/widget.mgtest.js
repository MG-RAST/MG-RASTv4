(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 Test Widget",
                name: "mgtest",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [
	    //Retina.load_renderer("svg")
	    Retina.load_renderer('notebook')
	];
    };
        
    widget.display = function (wparams) {
        widget = this;

	var container = wparams.target;
	var sidebar = wparams.sidebar;

	container.innerHTML = "<div id='notebook'></div>";

	var notebook = Retina.Renderer.create('notebook', { target: document.getElementById('notebook') }).render();
	
	sidebar.innerHTML = notebook.controller();
    };  
    
})();

// container.innerHTML = "<style>.d{ margin-right: 50px; margin-bottom: 50px; float: left; }</style><div id='a' class='d'></div><div id='b' class='d'></div><div id='c' class='d'></div><div id='d' class='d'></div><div id='e' class='d'></div><div id='f' class='d'></div>";
// Retina.Renderer.create('svg', { target: document.getElementById('a'), height: 400 }).render().barchart({ data: [ 
// 	    { label: "Hans", value: 100 },
// 	    { label: "Dieter", value: 50 },
// 	    { label: "Peter", value: 75 },
// 	    { label: "Klaus", value: 150 },
// 	    { label: "Stefan", value: 10 },
// 	    { label: "Kurt", value: 66 },
// 	    { label: "Sabine", value: 146 },
// 	    { label: "Nasty", value: 177 },
// 	    { label: "Hans", value: 100 },
// 	    { label: "Dieter", value: 50 },
// 	    { label: "Peter", value: 75 },
// 	    { label: "Klaus", value: 150 }
// 	], sorted: true, sortLargeToSmall: true, graphDirection: "horizontal" });
// 	Retina.Renderer.create('svg', { target: document.getElementById('b'), height: 400 }).render().barchart({ data: [ 
// 	    { label: "Hans", value: 100 },
// 	    { label: "Dieter", value: 50 },
// 	    { label: "Peter", value: 75 },
// 	    { label: "Klaus", value: 150 },
// 	    { label: "Stefan", value: 10 },
// 	    { label: "Kurt", value: 66 },
// 	    { label: "Sabine", value: 146 },
// 	    { label: "Nasty", value: 177 },
// 	    { label: "Hans", value: 100 },
// 	    { label: "Dieter", value: 50 }
// 	], sorted: true, sortLargeToSmall: true, graphDirection: "vertical" });
// 	Retina.Renderer.create('svg', { target: document.getElementById('c') }).render().stackedBarchart({
// 	    categories: [ "A", "B", "C", "D" ],
// 	    data: [ 
// 		{ label: "Hans", values: [ 100, 95, 90, 85 ] },
// 		{ label: "Dieter", values: [ 50, 55, 60, 65 ] },
// 		{ label: "Peter", values: [ 75, 70, 75, 70 ] },
// 		{ label: "Klaus", values: [ 150, 155, 150, 155 ] },
// 		{ label: "Stefan", values: [ 10, 15, 20, 25 ] },
// 		{ label: "Kurt", values: [ 66, 61, 56, 51 ] },
// 		{ label: "Sabine", values: [ 146, 144, 142, 140 ] },
// 		{ label: "Nasty", values: [ 177, 179, 181, 183 ] }
// 	    ],
// 	    callback: function () {
// 		console.log(this);
// 	    }
// 	});
// 	Retina.Renderer.create('svg', { target: document.getElementById('d') }).render().stackedBarchart({
// 	    categories: [ "A", "B", "C", "D" ],
// 	    data: [ 
// 		{ label: "Hans", values: [ 100, 95, 90, 85 ] },
// 		{ label: "Dieter", values: [ 50, 55, 60, 65 ] },
// 		{ label: "Peter", values: [ 75, 70, 75, 70 ] },
// 		{ label: "Klaus", values: [ 150, 155, 150, 155 ] },
// 		{ label: "Stefan", values: [ 10, 15, 20, 25 ] },
// 		{ label: "Kurt", values: [ 66, 61, 56, 51 ] },
// 		{ label: "Sabine", values: [ 146, 144, 142, 140 ] },
// 		{ label: "Nasty", values: [ 177, 179, 181, 183 ] }
// 	    ],
// 	    graphDirection: "horizontal",
// 	    callback: function () {
// 		console.log(this);
// 	    }
// 	});
// 	Retina.Renderer.create('svg', { target: document.getElementById('e') }).render().donutchart({
// 	    categories: [ "A", "B", "C", "D" ],
// 	    data: [ 
// 		{ label: "Hans", values: [ 100, 95, 90, 85 ] },
// 		{ label: "Dieter", values: [ 50, 55, 60, 65 ] },
// 		{ label: "Peter", values: [ 75, 70, 75, 70 ] },
// 		{ label: "Klaus", values: [ 150, 155, 150, 155 ] },
// 		{ label: "Stefan", values: [ 10, 15, 20, 25 ] },
// 		{ label: "Kurt", values: [ 66, 61, 56, 51 ] },
// 		{ label: "Sabine", values: [ 146, 144, 142, 140 ] },
// 		{ label: "Nasty", values: [ 177, 179, 181, 183 ] }
// 	    ],
// 	    callback: function () {
// 		console.log(this);
// 	    }
// 	});
// 	Retina.Renderer.create('svg', { target: document.getElementById('f'), height: 400 }).render().piechart({ data: [ 
// 	    { label: "Hans", value: 100 },
// 	    { label: "Dieter", value: 50 },
// 	    { label: "Peter", value: 75 },
// 	    { label: "Klaus", value: 150 },
// 	    { label: "Stefan", value: 10 },
// 	    { label: "Kurt", value: 66 },
// 	    { label: "Sabine", value: 146 },
// 	    { label: "Nasty", value: 177 }
// 	], sorted: true, sortLargeToSmall: true });