(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "MG-RAST v4 Profile Widget",
                name: "metagenome_profile",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [
	    Retina.load_renderer("svg"),
	    Retina.load_renderer('notebook')
	];
    };
        
    widget.display = function (wparams) {
        widget = this;

	var container = widget.container = wparams ? wparams.main : widget.container;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;

	sidebar.innerHTML = '<div style="padding: 20px;"><h4 style="margin-top: -5px;">What is a profile?</h4><p>Conceptually profiles are a view held on the relative importance of certain elements of the metadata vector. The profiles are not meant to represent a universal point of view, but to represent a specific entity of community. The NSF NEON project for example (and several affiliated projects) are in the process of agreeing on several profiles for e.g. soil data. Other researchers might be interested to learn which parameters "NEON*" thinks are important and might want to model their own study along those lines.</p><p>There are multiple levels of compliance for each profile, as not all researchers have the same level of instrumentation and resources available. The tiered compliance levels "gold" (highest), silver (medium) and bronze (base) are stacked, "gold" includes silver, silver includes bronze.</p></div>';
	
	// load metadata template
	jQuery.ajax( {
	    "dataType": "json",
	    "header": stm.authHeader,
	    "url": RetinaConfig.mgrast_api + '/metadata/template',
	    "success": function (data) {
		var widget = Retina.WidgetInstances.metagenome_profile[1];
		widget.template = data;
		widget.showInputForm();
	    },
	    "error": function (xhr) {
		var widget = Retina.WidgetInstances.metagenome_profile[1];
		widget.content.innerHTML = '<div class="alert alert-error">could not load background data</alert>';
	    }
	});
	
	container.innerHTML = '<p><img src="Retina/images/loading.gif" style="width: 24px; margin-right: 20"> loading background data</p>'
    };

    widget.showInputForm = function () {
	var widget = this;

	var container = widget.container;

	var html = [];

	// intro text
	html.push('<h3>MG-RAST Metadata Profiles</h3><p>MIxS profiles expand the current functionality that GSC compliant MIxS environmental packages offer. They define subsets of terms in one or more check lists to be included and validated in order to be MIxS profile compliant.</p><p>This editor allows creation and validation of these profiles. Click the "validate" button below to select an existing profile to validate. Fill out the form and click "download" to create a new profile.</p>');

	html.push('<div style="text-align: center;"><input type="file" id="profileUpload" style="display: none;" onchange="Retina.WidgetInstances.metagenome_profile[1].fileSelected()"><button class="btn" onclick="document.getElementById(\'profileUpload\').click();">validate</button></div><div id="validationResult"></div>');

	html.push('<h3>Create a new Profile</h3>');

	// start form
	html.push('<form class="form-horizontal" onsubmit="return false"><fieldset>');

	// info section
	html.push('<legend>profile information</legend>');

	// name
	html.push('<div class="control-group"><label class="control-label" for="inputName">name</label><div class="controls"><input type="text" id="inputName" placeholder="profile name"></div></div>');

	// description
	html.push('<div class="control-group"><label class="control-label" for="inputDescription">description</label><div class="controls"><textarea rows="5" id="inputDescription" placeholder="description"></textarea></div></div>');

	// package
	html.push('<div class="control-group"><label class="control-label" for="inputPackage">package</label><div class="controls"><select id="inputPackage" onchange="Retina.WidgetInstances.metagenome_profile[1].showPackage();"><option value="0" selected=selected>- please select -</option>');
	var eps = Retina.keys(widget.template.ep).sort();
	for (var i=0; i<eps.length; i++) {
	    html.push('<option>'+eps[i]+'</option>');
	}
	html.push('</select></div></div>');
	
	// contact section
	html.push('<legend>contact information</legend>');

	html.push('<div class="control-group"><label class="control-label" for="inputOrganization">organization</label><div class="controls"><input type="text" id="inputOrganization" placeholder="organization name"></div></div>');
	html.push('<div class="control-group"><label class="control-label" for="inputOrganizationAbbrev">abbreviation</label><div class="controls"><input type="text" id="inputOrganizationAbbrev" placeholder="organization abbreviation"></div></div>');
	html.push('<div class="control-group"><label class="control-label" for="inputURL">URL</label><div class="controls"><input type="text" id="inputURL" placeholder="organization url"></div></div>');
	html.push('<div class="control-group"><label class="control-label" for="inputEmail">email</label><div class="controls"><input type="text" id="inputEmail" placeholder="organization email"></div></div>');
	html.push('<div class="control-group"><label class="control-label" for="inputFirstname">firstname</label><div class="controls"><input type="text" id="inputFirstname" placeholder="contact firstname"></div></div>');
	html.push('<div class="control-group"><label class="control-label" for="inputLastname">lastname</label><div class="controls"><input type="text" id="inputLastname" placeholder="contact lastname"></div></div>');

	// general fields
	html.push('<legend>general field selection</legend>');

	html.push('<style>.top td{vertical-align:top;padding-bottom: 10px;}.top input{vertical-align:top;}</style><table class="top"><tr><td style="width: 250px;"></td><td style="text-align: center; width: 50px;"></td><td style="text-align: center; width: 50px;">bronze</td><td style="text-align: center; width: 50px;">silver</td><td style="text-align: center; width: 50px;">gold</td></tr>');
	
	var ignore = { "env_package": true, "sample_name": true, "mgrast_id": true, "misc_param": true, "sample_id": true };
	var sData = widget.template.sample.sample;
	var fields = Retina.keys(sData).sort();
	for (var i=0; i<fields.length; i++) {
	    var fName = fields[i].replace(/_/g, " ");
	    html.push('<tr'+(ignore[fields[i]] ? ' style="display: none;"' : "")+'><td style="text-align: right;">'+fName+'</td><td style="text-align: center; width: 50px;"><input type="radio" name="inputSRadio'+i+'" value="'+fields[i]+'" id="inputSRadioNone'+i+'" checked></td><td style="text-align: center; width: 50px;"><input type="radio" name="inputSRadio'+i+'" id="inputSRadioBronze'+i+'"></td><td style="text-align: center; width: 50px;"><input type="radio" name="inputSRadio'+i+'" id="inputSRadioSilver'+i+'"></td><td style="text-align: center; width: 50px;"><input type="radio" name="inputSRadio'+i+'" id="inputSRadioGold'+i+'"></td><td>'+sData[fields[i]].definition+'</td></tr>');
	}

	html.push('</table>');
	
	// package section
	html.push('<legend>package field selection</legend>');
	
	html.push('<div id="packageContainer"><p><i>no package selected</i></p></div>');
	
	// end form
        html.push('<button class="btn" onclick="Retina.WidgetInstances.metagenome_profile[1].downloadForm();">download</button></fieldset></form>');

	// fill html
	container.innerHTML = html.join("");
    };

    widget.showPackage = function () {
	var widget = this;

	var sel = document.getElementById('inputPackage');
	var envPackage = sel.options[sel.selectedIndex].value;

	var html = [];

	if (envPackage == "0") {
	    html.push('<p><i>no package selected</i></p>');
	} else {
	    html.push('<table class="top"><tr><td style="width: 250px;"></td><td style="text-align: center; width: 50px;"></td><td style="text-align: center; width: 50px;">bronze</td><td style="text-align: center; width: 50px;">silver</td><td style="text-align: center; width: 50px;">gold</td></tr>');

	    var epData = widget.template.ep[envPackage];
	    var eps = Retina.keys(epData).sort();
	    for (var i=0; i<eps.length; i++) {
		var epName = eps[i].replace(/_/g, " ");
		html.push('<tr'+(eps[i] == "misc_param" ? ' style="display: none;"' : "")+'><td style="text-align: right;">'+epName+'</td><td style="text-align: center; width: 50px;"><input type="radio" name="inputEPRadio'+i+'" value="'+eps[i]+'" id="inputEPRadioNone'+i+'" checked></td><td style="text-align: center; width: 50px;"><input type="radio" name="inputEPRadio'+i+'" id="inputEPRadioBronze'+i+'"></td><td style="text-align: center; width: 50px;"><input type="radio" name="inputEPRadio'+i+'" id="inputEPRadioSilver'+i+'"></td><td style="text-align: center; width: 50px;"><input type="radio" name="inputEPRadio'+i+'" id="inputEPRadioGold'+i+'"></td><td>'+epData[eps[i]].definition+'</td></tr>');
	    }

	    html.push('</table>');
	}
	
	document.getElementById('packageContainer').innerHTML = html.join("");
    };

    widget.downloadForm = function () {
	var widget = this;

	if (document.getElementById('inputPackage').selectedIndex == 0) {
	    alert('you must choose a package');
	    return;
	}
	
	var data = { "name": document.getElementById('inputName').value,
		     "description": document.getElementById('inputDescription').value,
		     "package": document.getElementById('inputPackage').options[document.getElementById('inputPackage').selectedIndex].value,
		     "contact": { "organization": document.getElementById('inputOrganization').value,
				  "organization_abbrev": document.getElementById('inputOrganizationAbbrev').value,
				  "url": document.getElementById('inputURL').value,
				  "email": document.getElementById('inputEmail').value,
				  "firstname": document.getElementById('inputFirstname').value,
				  "lastname": document.getElementById('inputLastname').value },
		     "hierarchy": [ { "name": "bronze",
				      "level": 1,
				      "items": [] },
				    { "name": "silver",
				      "level": 2,
				      "items": [] },
				    { "name": "gold",
				      "level": 3,
				      "items": [] } ] };

	var i=0;
	while (document.getElementById('inputSRadioBronze'+i)) {
	    if (document.getElementById('inputSRadioBronze'+i).checked) {
		data.hierarchy[0].items.push(document.getElementById('inputSRadioNone'+i).value);
	    } else if (document.getElementById('inputSRadioSilver'+i).checked) {
		data.hierarchy[1].items.push(document.getElementById('inputSRadioNone'+i).value);
	    } else if (document.getElementById('inputSRadioGold'+i).checked) {
		data.hierarchy[2].items.push(document.getElementById('inputSRadioNone'+i).value);
	    }
	    i++;
	}
	i=0;
	while (document.getElementById('inputEPRadioBronze'+i)) {
	    if (document.getElementById('inputEPRadioBronze'+i).checked) {
		data.hierarchy[0].items.push(document.getElementById('inputEPRadioNone'+i).value);
	    } else if (document.getElementById('inputEPRadioSilver'+i).checked) {
		data.hierarchy[1].items.push(document.getElementById('inputEPRadioNone'+i).value);
	    } else if (document.getElementById('inputEPRadioGold'+i).checked) {
		data.hierarchy[2].items.push(document.getElementById('inputEPRadioNone'+i).value);
	    }
	    i++;
	}

	stm.saveAs(JSON.stringify(data, true, 1), document.getElementById('inputName').value+".profile.json");
    };

    widget.fileSelected = function () {
	var widget = this;
	
	var file = document.getElementById('profileUpload').files[0];
	var fileReader = new FileReader();
	fileReader.onerror = function (error) {
	    document.getElementById('validationResult').innerHTML = "<div class='alert alert-error' style='margin: 10px;'>The selected file could not be opened.</div>";
	};
	fileReader.onload = function(e) {
	    var widget = Retina.WidgetInstances.metagenome_profile[1];
	    widget.validateFile(e.target.result);
	};
	fileReader.readAsText(file);
    };

    widget.validateFile = function (data) {
	var widget = this;

	var target = document.getElementById('validationResult');

	try {
	    var json = JSON.parse(data);
	    var errors = [];
	    var topLevel = [ { "name": "name", "type": "string" },
			     { "name": "description", "type": "string" },
			     { "name": "package", "type": "string" },
			     { "name": "contact", "type": "object", "attributes": [ "organization",
										    "organization_abbrev",
										    "url",
										    "email",
										    "firstname",
										    "lastname" ] },
			     { "name": "hierarchy", "type": "object" } ];
	    for (var i=0; i<topLevel.length; i++) {
		if (json.hasOwnProperty(topLevel[i].name)) {
		    if (typeof json[topLevel[i].name] != topLevel[i].type) {
			errors.push("attribute "+topLevel[i].name+" has an invalid type ("+typeof json[topLevel[i].name]+") should be "+topLevel[i].type);
		    } else if (topLevel[i].type == "object") {
			if (topLevel[i].hasOwnProperty('attributes')) {
			    for (var h=0; h<topLevel[i].attributes.length; h++) {
				if (json[topLevel[i].name].hasOwnProperty(topLevel[i].attributes[h])) {
				    if (typeof json[topLevel[i].name][topLevel[i].attributes[h]] != "string") {
					errors.push("attributes "+topLevel[i].name+" field "+topLevel[i].attributes[h]+" has an invalid type ("+typeof json[topLevel[i].name][topLevel[i].attributes[h]]+") should be string");
				    }
				} else {
				    errors.push("attribute "+topLevel[i].name+" is missing field "+topLevel[i].attributes[h]);
				}
			    }
			} else {
			    for (var h=0; h<json[topLevel[i].name].length; h++) {
				var item = json[topLevel[i].name][h];
				if (typeof item == "object") {
				    if (item.hasOwnProperty("level")) {
					if (typeof item.level != "number") {
					    errors.push("the level attribute of hierarchy item "+(h+1)+" is not a number");
					}
				    } else {
					errors.push("hierarchy item "+(h+1)+" has no level attribute");
				    }
				    if (item.hasOwnProperty("name")) {
					if (typeof item.name != "string") {
					    errors.push("the name attribute of hierarchy item "+(h+1)+" is not a string");
					}
				    } else {
					errors.push("hierarchy item "+(h+1)+" has no name attribute");
				    }
				    if (item.hasOwnProperty("items")) {
					if (typeof item.items == "object") {
					    if (typeof item.items.length == "number") {
						if (json.hasOwnProperty('package') && widget.template.ep.hasOwnProperty(json["package"])) {
						    for (var j=0; j<item.items.length; j++) {
							if (typeof item.items[j] == "string") {
							    if (! widget.template.ep[json["package"]].hasOwnProperty(item.items[j]) && ! widget.template.sample.sample.hasOwnProperty(item.items[j])) {
								errors.push("item "+(j+1)+" of the items attribute of the hierarchy item "+(h+1)+" is not a valid term");
							    }
							} else {
							    errors.push("item "+(j+1)+" of the items attribute of the hierarchy item "+(h+1)+" is not a string");
							}
						    }
						}
					    } else {
						errors.push("the items attribute of hierarchy item "+(h+1)+" is not a list");
					    }
					} else {
					    errors.push("the items attribute of hierarchy item "+(h+1)+" is not an object");
					}
				    } else {
					errors.push("hierarchy item "+(h+1)+" has no items attribute");
				    }
				} else {
				    errors.push("hierarchy item "+(h+1)+" is not an object");
				}
			    }
			}
		    }
		} else {
		    errors.push("missing top level field <b>"+topLevel[i].name+"</b>");
		}
	    }

	    if (topLevel.length < Retina.keys(json).length) {
		errors.push("the profile contains top level fields outside of the specified fieldset");
	    }

	    if (json.hasOwnProperty('package') && ! widget.template.ep.hasOwnProperty(json["package"])) {
		errors.push("the specified package "+json["package"]+" is not a valid GSC package name");
	    }
	    
	    if (errors.length) {
		target.innerHTML = "<div class='alert alert-error' style='margin: 10px;'>Profile is not valid:<br><ul><li>"+errors.join("</li><li>")+"</li></ul></div>";
	    } else {
		target.innerHTML = "<div class='alert alert-success' style='margin: 10px;'>The profile is valid.</li></ul></div>";
	    }
	} catch (error) {
	    console.log(error);
	    target.innerHTML = "<div class='alert alert-error' style='margin: 10px;'>not a valid JSON file:<br>"+error.message.substr(12)+"</div>";
	}
    };
    
})();
