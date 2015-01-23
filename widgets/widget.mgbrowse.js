(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Browser Widget",
                name: "mgbrowse",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ 
 	    Retina.load_renderer("table"),
 	    Retina.load_renderer("listselect")
	];
    };
    
    widget.type = "table";
    
    widget.display = function (params) {
        var widget = this;

	jQuery.extend(widget, params);

	var result_columns = widget.header || [ "id", "name", "project_id", "project_name", "PI_lastname", "biome", "feature", "material", "env_package_type", "location", "country", "longitude", "latitude", "collection_date", "sequence_type", "seq_method", "status", "created" ];

	var result_table_filter = widget.filter;
	if (result_table_filter == null) {
	    result_table_filter = {};
	    for (var i=0;i<result_columns.length;i++) {
		result_table_filter[i] = { "type": "text" };
	    }
	}

	if (widget.type == "listselect") {
	    if (widget.result_list) {
		widget.result_list.settings.target = widget.target;
	    } else {
		widget.result_list = Retina.Renderer.create("listselect", {
		    target: widget.target,
		    callback: widget.callback || null,
		    asynch_limit: 100,
		    synchronous: false,
		    navigation_url: RetinaConfig.mgrast_api+'/metagenome?match=all&verbosity=mixs',
		    data: [],
		    filter: result_columns,
		    result_field: widget.result_field || false,
		    result_field_placeholder: widget.result_field_placeholder || "selection name",
		    result_field_default: widget.result_field_default || "",
		    multiple: (widget.multiple === false) ? false : true,
		    extra_wide: widget.wide || false,
		    return_object: true,
		    filter_attribute: 'name',
		    asynch_filter_attribute: 'name',
		    value: "id"
		});
	    }
	    widget.result_list.update_data({},1);
	} else {
	    if (widget.result_table) {
		widget.result_table.settings.target = widget.target;
	    } else {
		widget.result_table = Retina.Renderer.create("table", {
		    target: widget.target,
		    rows_per_page: 14,
		    filter_autodetect: false,
		    filter: result_table_filter,
		    sort_autodetect: false,
		    synchronous: false,
		    invisible_columns: {0:1,2:1,6:1,7:1,8:1,11:1,12:1,15:1,16:1,17:1},
		    navigation_url: RetinaConfig.mgrast_api+'/metagenome?match=all&verbosity=mixs',
		    data: { data: [], header: result_columns }
		});
	    }
	    widget.result_table.render();
	    widget.result_table.update({},1);
	}
    };
    
})();