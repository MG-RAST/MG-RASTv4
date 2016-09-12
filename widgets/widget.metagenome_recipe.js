(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 Recipe Widget",
                name: "metagenome_recipe",
                author: "Tobias Paczian",
            requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [
	    Retina.load_renderer("svg2")
	];
    };

    widget.recipes = [];
        
    widget.display = function (wparams) {
        widget = this;

	var container = widget.container = wparams ? wparams.main : widget.container;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;
	
	// set page title
	document.getElementById("pageTitle").innerHTML = "recipes";
	
	sidebar.innerHTML = '<h4 style="margin-left: 10px; margin-right: 10px; margin-top: 20px;">  <img style="height: 16px; position: relative; bottom: 3px; margin-right: 10px;" src="Retina/images/info.png">  What is a recipe?</h4><p style="margin-left: 10px; margin-right: 10px;">An MG-RAST analysis recipe is a template for a certain type of metagenomic analysis. Recipes require a minimal set of input parameters to produce a result and also guide you in the exploration of data.</p><p style="margin-left: 10px; margin-right: 10px;">This page lets you browse our recipes which come with an example image and a short description of what the analysis will do.</p>';

	//'<h4 style="margin-left: 10px; margin-right: 10px; margin-top: 20px;">  <img style="height: 16px; position: relative; bottom: 3px; margin-right: 10px;" src="Retina/images/info.png">  Can I create my own?</h4><p style="margin-left: 10px; margin-right: 10px;">You can create recipes on the analysis page and share them with other users or the public.</p>';
	
	container.innerHTML = '<h3>Analysis Recipes</h3><div id="recipes"><img src="Retina/images/loading.gif" style="margin-left: 45%; margin-top: 150px; width: 32px;"></div>';

	widget.loadData();
    };

    widget.showRecipes = function () {
	var widget = this;

	var html = [ '<ul class="thumbnails">' ];
	for (var i=0; i<widget.recipes.length; i++) {
	    var d = widget.recipes[i];
	    if (i % 3 == 0) {
		html.push('</ul><ul class="thumbnails">');
	    }
	    html.push('<li class="span4" onclick="window.location=\'mgmain.html?mgpage=analysis&recipe='+(i+1)+'\';"><div class="thumbnail" id="recipe'+i+'"><div style="height: 280px;">'+d.image+'</div><h4>'+d.name+'</h4><p>'+d.description+'</p></div></li>');
	}
	html.push('</ul>');
	document.getElementById('recipes').innerHTML = html.join("");
    };

    widget.loadData = function () {
	for (var i=1; i<9; i++) {
	    jQuery.getJSON('data/recipes/recipe'+i+'.recipe.json', function (data) {
		var widget = Retina.WidgetInstances.metagenome_recipe[1];
		widget.recipes.push( data );
		if (widget.recipes.length == 8) {
		    widget.showRecipes();
		}
	    });
	}
    };
    
})();
