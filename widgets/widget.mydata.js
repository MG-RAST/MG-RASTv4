(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "myData",
            name: "mydata",
	    version: 1,
            author: "Tobias Paczian",
            requires: [ ]
        }
    });

    widget.setup = function () {
	return [ ];
    }
    
    widget.display = function (params) {

	var html = "<h1>Hello World</h1>";

	

	var types = [ { name: "float",
			type: "structural",
			description: "floating point number",
			definition: { type: "number",
				      min: null,
				      max: null,
				      regexp: "/^\d+\.\d{16}$/" } }, 
		      
		      { name: "digit",
			type: "structural",
			description: "numbers 0 to 9",
			definition: { type: "number",
				      min: null,
				      max: null,
				      regexp: "/^\d$/" } },
		      
		      { name: "womans age",
			type: "structural",
			description: "the age of a woman",
			definition: { type: "number",
				      min: 0,
				      max: 29,
				      regexp: null } },

		      { name: "count",
			type: "structural",
			description: "a hash of key strings with a numerical value",
			contains: { "hash": true },
			definition: { type: "hash",
				      value: "number" } },
		      
		      { name: "matrix",
			type: "structural",
			description: "a list of row names, a list of column names and a list of lists of number",
			contains: { "array": true,
				    "hash":  true },
			definition: { type: "hash",
				      keys: { "rows":    { "array": "string" },
					      "columns": { "array": "string" },
					      "data":    { "array": { "array": "number" } } } } } ];

	html += "<pre>"+JSON.stringify(types, undefined, 2)+"</pre>";

	params.target.innerHTML = html;

    };

})();
