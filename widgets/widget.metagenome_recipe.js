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
    widget.keywords = [];
    widget.allKeywords = [];
    
    widget.display = function (wparams) {
        widget = this;

	var container = widget.container = wparams ? wparams.main : widget.container;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;
	
	// set page title
	document.getElementById("pageTitle").innerHTML = "analysis recipes";
	
	sidebar.innerHTML = '<div style="margin: 20px;"><h3><img style="height: 20px; position: relative; bottom: 2px; margin-right: 10px;" src="Retina/images/info.png">  What is a recipe?</h3><p>An MG-RAST analysis recipe is a template for a certain type of metagenomic analysis. Recipes require a minimal set of input parameters to produce a result and also guide you in the exploration of data.</p><p>This page lets you browse our recipes which come with an example image and a short description of what the analysis will do.</p><p style="margin-bottom: 40px;">The recipes are sorted into categories. Enter a keyword you are looking for into the filter box - only the matching recipes will be shown.</p><hr><h3 style="margin-top: 20px;"><img style="height: 20px; position: relative; bottom: 2px; margin-right: 10px;" src="Retina/images/info.png">  Custom Analyses</h3><p>If you would like to do more sophisticated analyses, you can choose the "custom" option. It will give you access to all functionality of the new analysis page.</p></div>';
	
	container.innerHTML = '<h3>Analysis Recipes'+widget.filterbar()+'</h3><div id="recipes"><img src="Retina/images/loading.gif" style="margin-left: 45%; margin-top: 150px; width: 32px;"></div>';

	widget.loadData();
    };

    widget.filterbar = function () {
	var widget = this;

	return '<div style="float: right; font-size: 14px;"><input type="text" style="border-radius: 8px;" onchange="Retina.WidgetInstances.metagenome_recipe[1].keywordsUpdated(this);" placeholder="enter category" id="filter"><div id="keywords" style="font-size: 12px;margin: 0px;padding: 0px;position: relative;bottom: 20px; left: 5px;"></div></div>';
    };

    widget.keywordsUpdated = function (input) {
	var widget = this;

	if (input.value.length) {
	    widget.keywords = [ input.value ];
	} else {
	    widget.keywords = [];
	}

	widget.showRecipes();
    };
    
    widget.stars = function (numStars) {
	var widget = this;

	var stars = "";
	for (var i=0; i<numStars; i++) {
	    stars += '<img src="Retina/images/fullstar.png" style="width: 16px;">';
	}
	for (var i=0; i<(5-numStars); i++) {
	    stars += '<img src="Retina/images/emptystar.png" style="width: 16px;">';
	}
	
	return stars;
    };

    widget.showRecipes = function () {
	var widget = this;

	var html = [];
	var numShown = 0;
	html.push('<div class="recipe" style="height: 150px;"><table style="width: 100%;"><tr><td style="width: 280px;"><img src="Retina/images/analysis.png"></div></td><td style="padding-left: 20px; vertical-align: top;"><h4 style="margin: 0px;"><a href="mgmain.html?mgpage=analysis">Custom</a><div style="float: right; position: relative; bottom: 3px;">'+widget.stars(5)+'</div></h4><p style="font-size: 10px; color: gray; margin: 0px;">by MG-RAST</p><p>Create your own custom analysis with all options the analysis page has to offer.</p><p>Pick your data sets and annotation sources, set cutoffs, add filters, pick a visualization and explore the results. This option is recommended for advanced users.</p></td></tr></table></div>');
	for (var i=0; i<widget.recipes.length; i++) {
	    var d = widget.recipes[i];
	    var pass = true;
	    for (var h=0; h<widget.keywords.length; h++) {
		if (! d.keywords[widget.keywords[h]]) {
		    pass = false;
		    break;
		}
	    }
	    if (! pass) {
		continue;
	    }
	    numShown++;
	    html.push('<div class="recipe"><table style="width: 100%;"><tr><td style="width: 280px;">'+d.image+'</div></td><td style="padding-left: 20px; vertical-align: top;"><h4 style="margin: 0px;"><a href="mgmain.html?mgpage=analysis&recipe='+(i+1)+'">'+d.name+'</a><div style="float: right; position: relative; bottom: 3px;">'+widget.stars(d.stars)+'</div></h4><p style="font-size: 10px; color: gray; margin: 0px;">by '+d.author+'</p><p>'+d.shortdescription+'</p></td></tr></table></div>');
	}
	document.getElementById('recipes').innerHTML = html.join("<div style='clear: both;'><hr></div>");
	document.getElementById('keywords').innerHTML = 'showing '+numShown+' of '+widget.recipes.length;
    };

    widget.loadData = function () {
	for (var i=1; i<9; i++) {
	    jQuery.getJSON('data/recipes/recipe'+i+'.recipe.json', function (data) {
		var widget = Retina.WidgetInstances.metagenome_recipe[1];
		widget.recipes.push( data );
		if (widget.recipes.length == 8) {
		    var keywords = {};
		    for (var h=0; h<widget.recipes.length; h++) {
			var r = widget.recipes[h];
			for (var j in r.keywords) {
			    keywords[j] = true;
			}
		    }
		    widget.allKeywords = Retina.keys(keywords).sort();
		    jQuery('#filter').typeahead({"source":widget.allKeywords});
		    widget.showRecipes();
		}
	    });
	}
    };
    
})();
