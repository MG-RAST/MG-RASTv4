(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "MG-RAST v4 plugin for KEGG Mapper",
            name: "plugin_listmaker",
            author: "Tobias Paczian",
            requires: []
        }
    });
    
    widget.setup = function () {
	return [
	    Retina.load_renderer("listgenerator"),
	    Retina.load_renderer("table")
	];
    };

    widget.aliasList = {};
    
    widget.display = function (wparams) {
        widget = this;

	var container = widget.container = wparams ? wparams.main : widget.container;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;

	container.innerHTML = '<div id="gen" style="width: 900px; margin-left: auto; margin-right: auto;"></div><div style="clear: both; height: 20px;"></div><div id="allfuncs" style="width: 900px; margin-left: auto; margin-right: auto;"></div><div style="width: 900px; margin-left: auto; margin-right: auto;"><select id="aliaslist" size=10 style="float: left; margin-right: 10px; width: 400px;" onclick="Retina.WidgetInstances.plugin_listmaker[1].showAlias();"></select><div style="float: right; width: 400px;" id="aliastext"></div></div>';

	var d = window.opener.stm.DataStore.functionMap;
	var funcdata = [];
	var typeahead = {};
	for (var i=0; i<d.length; i++) {
	    if (d.hasOwnProperty(i)) {
		typeahead[d[i]] = i;
		funcdata.push( [ d[i], "<input type='checkbox' name='alias' index='"+i+"' style='margin-top: 0px; margin-right: 5px;'><button class='btn btn-mini' onclick='Retina.WidgetInstances.plugin_listmaker[1].createAlias("+i+");'>make alias</button>" ] );
	    }
	}

	// widget.generator = Retina.Renderer.create("listgenerator",
	// 					  { target: document.getElementById("gen"),
	// 					    api: { url: mgrast_api+'/m5nr/function/',
	// 						   url_suffix: '?id_only=true&limit=30',
	// 						   idfield: 'function_id',
	// 						   textfield: 'function' },
	// 					    width: 380,
	// 					    max_search_entries: 30,
	// 					    callback: widget.listSelected
	// 					  }).render();

	widget.generator = Retina.Renderer.create("listgenerator",
						  { target: document.getElementById("gen"),
						    type: 'static',
						    data: typeahead,
						    width: 380,
						    max_search_entries: 30,
						    callback: widget.listSelected
						  }).render();

	
	Retina.Renderer.create("table", {
	    target: document.getElementById('allfuncs'),
	    rows_per_page: 30,
	    filter_autodetect: true,
	    sort_autodetect: true,
	    synchronous: true,
	    sort: "function",
	    show_export: true,
	    data: { data: funcdata, header: [ "function", "select" ] }
	}).render();
    };

    widget.showAlias = function () {
	var widget = this;

	var d = window.opener.stm.DataStore.functionMap;
	var index = document.getElementById('aliaslist').options[document.getElementById('aliaslist').selectedIndex].value;
	var aliases = [];
	for (var i=0; i<widget.aliasList[index].length; i++) {
	    aliases.push(d[widget.aliasList[index][i]]);
	}

	document.getElementById('aliastext').innerHTML = aliases.join('<br>');
    };

    widget.createAlias = function (index) {
	var widget = this;

	var alias = [];
	var checked = document.getElementsByName('alias');
	for (var i=0; i<checked.length; i++) {
	    if (checked.checked) {
		alias.push(checked[i].getAttribute('index'));
	    }
	}
	widget.aliasList[index] = alias;
	
	widget.redrawAliasList();
    };

    widget.removeAlias = function (index) {
	var widget = this;

	delete widget.aliasList(index);

	widget.redrawAliasList();
    };

    widget.redrawAliasList = function () {
	var widget = this;

	var d = window.opener.stm.DataStore.functionMap;
	var opts = [];
	var aliases = Retina.keys(widget.aliasList).sort();
	for (var i=0; i<aliases.length; i++) {
	    opts.push('<option value="'+aliases[i]+'">'+d[aliases[i]]+'</option>');
	}
	document.getElementById('aliaslist').innerHTML = opts.join('');
    };

})();
