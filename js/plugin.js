function initWebApp (data) {
    stm.init({"data":data});
    stm.add_repository({ url: stm.Config.mgrast_api, name: "MG-RAST"});
    Retina.init({});
    
    var plugin  = stm.DataStore.plugin;
    
    changeLocation = function(event, loc) {
	event = event || window.event;
	if (event.shiftKey) {
	    window.open(loc);
	} else {
	    window.location = loc;
	}
    };
    Retina.load_widget("plugin_"+plugin).then( function() {
	var mgp = Retina.Widget.create('plugin_'+plugin, { "main": document.getElementById("content")});
    });
}
