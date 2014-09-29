(function () {
    widget = Retina.Widget.extend({
        about: {
            title: "Metagenome Account Registration Widget",
            name: "metagenome_register",
            author: "Tobias Paczian",
            requires: [
		"http://www.google.com/recaptcha/api/js/recaptcha_ajax.js"
	    ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_renderer("cvfield") ];
    };
    
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.metagenome_register[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}

	if (Retina.cgiParam('forgot')) {
	    widget.forgotPassword();
	} else {
	    widget.newAccount();
	}

    };

    widget.forgotPassword = function () {
	var widget = Retina.WidgetInstances.metagenome_register[1];

	document.title = "Password Recovery";

	widget.sidebar.style.paddingLeft = "20px";
	widget.sidebar.style.paddingRight = "20px";
	widget.sidebar.innerHTML = "<h3><img style='height: 20px; margin-right: 10px; margin-top: -4px;' src='Retina/images/info.png'>Password Reset fails?</h3><p>If you are trying to reset your password, but you do not remember the login / email combination you registered with, you need to <a href='contact.html'>contact our support</a> to retrieve a new password.</p><p>We will need to verify that you are the owner of the account. The easiest way is for you to send an email originating from the account you registered with MG-RAST.</p><p>It helps us a lot you add information about your account, like metagenome or project ids you own, your full name or your organization.</p>";

	var html = '\
<h3>Reset your Password</h3>\
<form class="form-horizontal">\
  <div class="control-group">\
    <label class="control-label" for="inputLogin">login</label>\
    <div class="controls">\
      <input type="text" id="inputLogin" placeholder="login" class="span4"><span class="help-inline">the login name you registered with</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputEmail">email</label>\
    <div class="controls">\
      <input type="text" id="inputEmail" placeholder="email" class="span4"><span class="help-inline">the email address you registered with</span>\
    </div>\
  </div>\
<div id="recap"></div>\
  <button type="button" class="btn" onclick="Retina.WidgetInstances.metagenome_register[1].performPasswordReset();" id="submit">reset password</button>\
</form>\
';

	widget.main.innerHTML = html;

	// set up recaptcha
	Recaptcha.create("6Lf1FL4SAAAAAO3ToArzXm_cu6qvzIvZF4zviX2z", "recap");
    };

    widget.newAccount = function () {
	var widget = Retina.WidgetInstances.metagenome_register[1];

	widget.sidebar.innerHTML = '\
<div style="padding-left: 20px; padding-right: 20px;">\
  <h3><img src="Retina/images/info.png" style="height: 20px; margin-right: 10px; margin-top: -4px;">why register?</h3>\
  <p>MG-RAST is a free resource, but the data you upload is private to you. Even though we encourage making data public as soon as possible, it will stay private until you decide to share it with the world. To do so, you need to be able to securely authenticate yourself.</p>\
  <p style="margin-bottom: 35px;">Our past experience has also shown that the computation on metagenomic data is a complicated process. Sometimes we need to feedback error or other information to you. This is only possible if we have a valid email to contact you.</p>\
  <hr>\
  <h3><img src="Retina/images/info.png" style="height: 20px; margin-right: 10px; margin-top: -4px;">can I share my account?</h3>\
  <p>No, you should never share your account with anyone, nor should you create group accounts. MG-RAST offers easy to use mechanisms to securely share data with other users.</p>\
  <p>You can also create a group of registered users and share data with that group. Even in a classroom situation, you should always create separate accounts for each user.</p>\
</div>\
';
	
	var html = '\
<h3>Register a new Account</h3>\
<form class="form-horizontal">\
  <div class="control-group">\
    <label class="control-label" for="inputFirstname">First Name</label>\
    <div class="controls">\
      <input type="text" id="inputFirstname" placeholder="firstname" class="span4" onblur="Retina.WidgetInstances.metagenome_register[1].checkNotEmpty(this);"><span class="help-inline" id="namecheck"></span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputLastname">Last Name</label>\
    <div class="controls">\
      <input type="text" id="inputLastname" placeholder="lastname" class="span4" onblur="Retina.WidgetInstances.metagenome_register[1].checkNotEmpty(this);">\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputLogin">Login</label>\
    <div class="controls">\
      <input type="text" id="inputLogin" placeholder="login" onblur="Retina.WidgetInstances.metagenome_register[1].checkLogin();" class="span4"><span class="help-inline" id="logincheck">login names may only contain alphanumeric characters without spaces</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputPrimaryEmail">Primary eMail</label>\
    <div class="controls">\
      <input type="text" id="inputPrimaryEmail" placeholder="primary email" class="span4" onblur="Retina.WidgetInstances.metagenome_register[1].checkPEmail();"><span class="help-inline">preferrably your eMail at your organization</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputSecondaryEmail">Secondary eMail</label>\
    <div class="controls">\
      <input type="text" id="inputSecondaryEmail" placeholder="secondary email" autocomplete="off" class="span4" onblur="Retina.WidgetInstances.metagenome_register[1].checkSEmail();"><span class="help-inline">optional, for recovery purposes</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputOrganization">Organization</label>\
    <div class="controls">\
      <span id="inputOrganiszationSpan" style="display: inline-block"></span><span class="help-inline">enter the full name of your organization / university</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputURL">URL</label>\
    <div class="controls">\
      <div class="input-prepend">\
        <span class="add-on">http://</span>\
        <input type="text" id="inputURL" placeholder="URL" style="width: 238px;" onblur="Retina.WidgetInstances.metagenome_register[1].checkURL();">\
      </div>\
      <span class="help-inline" style="margin-left: -4px;" id="urlcheck">enter the homepage URL of your organization</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputCountry">Country</label>\
    <div class="controls">\
      <input type="text" id="inputCountry" placeholder="country" data-provide="typeahead" autocomplete="off" class="span4" onblur="Retina.WidgetInstances.metagenome_register[1].checkNotEmpty(this);"><span class="help-inline">If you allow geolocation, this is filled automatically. Otherwise start typing for autocompletion.</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <div class="controls">\
      <label class="checkbox">\
        <input type="checkbox" checked id="inputMailinglist"> Add me to the MG-RAST mailing-list<span class="help-inline">(We encourage you to subscribe as the list is used to inform you about major changes to the MG-RAST service and announces MG-RAST workshops. Email originates from the MG-RAST team only and is quite rare.)</span>\
      </label>\
    </div>\
  </div>\
  <div id="recap"></div>\
  <button type="button" class="btn pull-right" onclick="Retina.WidgetInstances.metagenome_register[1].performRegistration();" id="submit">register</button>\
</form>\
';

  // <div class="control-group">\
  //   <label class="control-label" for="inputPassword">Password</label>\
  //   <div class="controls">\
  //     <input type="password" id="inputPassword" placeholder="password" autocomplete="off" onkeyup="Retina.WidgetInstances.metagenome_register[1].checkPasswordStrength();" class="span4" onblur="Retina.WidgetInstances.metagenome_register[1].checkNotEmpty(this);"><span class="help-inline">Password strength: <span id="passwordStrength" style="color: red;">none</span></span>\
  //   </div>\
  // </div>\
  // <div class="control-group">\
  //   <label class="control-label" for="inputVerifyPassword">Verify Password</label>\
  //   <div class="controls">\
  //     <input type="password" id="inputVerifyPassword" placeholder="verify password" onblur="Retina.WidgetInstances.metagenome_register[1].checkVerifyPassword();" class="span4"><span class="help-inline">this must match your password</span>\
  //   </div>\
  // </div>\


	// set the output area
	widget.main.innerHTML = html;

	// add organization cvfield
	var orgs = widget.organizations;
	var org_items = {};
	var org_urls = {};
	for (var i=0; i<orgs.length; i++) {
	    org_items[orgs[i][0]] = orgs[i][0];
	    if (orgs[i][1] != "NULL") {
	    	org_items[orgs[i][1]] = orgs[i][0];
	    }
	    if (orgs[i][2] != "NULL") {
		org_urls[orgs[i][0]] = orgs[i][2];
	    }
	}
	widget.org_urls = org_urls;
	Retina.Renderer.create("cvfield", {
	    target: document.getElementById("inputOrganiszationSpan"),
	    data: { items: org_items },
	    fieldWidth: 286,
	    id: "inputOrganization",
	    callback: Retina.WidgetInstances.metagenome_register[1].checkOrganization
	}).render();

	// set up recaptcha
	Recaptcha.create("6Lf1FL4SAAAAAO3ToArzXm_cu6qvzIvZF4zviX2z", "recap");
 	
	// set up country typeahead
	jQuery('#inputCountry').typeahead({ source: Retina.values(widget.countryCodes) });

	// try to automagically determine the users country
	navigator.geolocation.getCurrentPosition(function(position){
	    jQuery.getJSON("http://maps.googleapis.com/maps/api/geocode/json?latlng="+position.coords.latitude+","+position.coords.longitude+"&sensor=false", function(result) {
		if (result.status == "OK") {
		    var country = null;
		    for (var i=0; i<result.results.length; i++) {
			for (var h=0; h<result.results[i].address_components.length; h++) {
			    for (var j=0; j<result.results[i].address_components[h].types.length; j++) {
				if (result.results[i].address_components[h].types[j] == "country") {
				    country = result.results[i].address_components[h].long_name;
				    break;
				}
			    }
			    if (country) {
				break;
			    }
			}
			if (country) {
			    break;
			}
		    }
		    if (country) {
			document.getElementById('inputCountry').value = country;
		    }
		}
	    });
	});
    };

    widget.performPasswordReset = function () {
	var widget = Retina.WidgetInstances.metagenome_register[1];

	if (Recaptcha.get_response() && document.getElementById('inputLogin').value && document.getElementById('inputEmail').value) {
	    document.getElementById('submit').setAttribute('disabled', 'disabled');
	    jQuery.post(RetinaConfig.mgrast_api+"/user/resetpassword", {
	    	"email": document.getElementById('inputEmail').value,
		"login": document.getElementById('inputLogin').value,
	    	"challenge": Recaptcha.get_challenge(),
	    	"response": Recaptcha.get_response()
	    }, function (result) {
		if (result.hasOwnProperty('ERROR')) {
		    alert("Resetting your password failed: "+result.ERROR);
		} else {
		    Retina.WidgetInstances.metagenome_register[1].main.innerHTML = "<h3>Password Reset Successful</h3><p>Your password has been reset. You will receive an email at your registered email address containing further instructions.</p>";
		}
	    }).fail(function(result){
		if (result.hasOwnProperty('ERROR')) {
		    alert("Resetting your password failed: "+result.ERROR);
		} else {
		    alert('An error occured while resetting your password');
		}
	    });
	} else {
	    alert('You need to fill out login, password and the ReCaptcha field');
	}
    };

    widget.performRegistration = function () {
	var widget = Retina.WidgetInstances.metagenome_register[1];

	// check all fields for validity
	var valid = true;
	
	var fields = [ "inputCountry", "inputOrganization", "inputSecondaryEmail", "inputPrimaryEmail", "inputLogin", "inputLastname", "inputFirstname" ];
	var optional = { "inputOrganization": true,
			 "inputSecondaryEmail": true };

	for (var i=0; i<fields.length; i++) {
	    var f = document.getElementById(fields[i]);
	    var p = f.parentNode.parentNode;
	    if (! p.className.match(/control-group/)) {
		p = p.parentNode;
	    }
	    if (p.className == "control-group error" || (! f.value.length && ! optional[fields[i]])) {
		f.focus();
		p.setAttribute('class', "control-group error");
		valid = false;
	    }
	}
	if (valid) {
	    document.getElementById('submit').setAttribute('disabled', 'disabled');
	    jQuery.post(RetinaConfig.mgrast_api+"/user/"+Recaptcha.get_challenge(), {
	    	"email": document.getElementById('inputPrimaryEmail').value,
		"email2": document.getElementById('inputSecondaryEmail').value,
	    	"firstname": document.getElementById('inputFirstname').value,
	    	"lastname": document.getElementById('inputLastname').value,
	    	"login": document.getElementById('inputLogin').value,
	    	"organization": document.getElementById('inputOrganization').value,
	    	"lru": document.getElementById('inputURL').value,
	    	"country": document.getElementById('inputCountry').value,
	    	"mailinglist": document.getElementById('inputMailinglist').checked,
		"response": Recaptcha.get_response()
	    }, function (result) {
		if (result.hasOwnProperty('ERROR')) {
		    alert("Your registration failed: "+result.ERROR);
		} else {
		    Retina.WidgetInstances.metagenome_register[1].main.innerHTML = "<h3>Registration Successful</h3><p>Your registration has been submitted successfully. You should have received a confirmation at the registered primary email address.</p><p>An administrator will review your request at the earliest opportunity and you will receive a mail with further instructions.</p>";
		}
	    }).fail(function(result){
		if (result.hasOwnProperty('ERROR')) {
		    alert("Your registration failed: "+result.ERROR);
		} else {
		    alert('An error occured during your registration');
		}
	    });
	} else {
	    alert('You need to enter valid values for the red marked fields');
	}
    };

    widget.checkNotEmpty = function (box) {
	if (box.value.length) {
	    box.parentNode.parentNode.setAttribute('class', 'control-group');
	    if (document.getElementById('inputFirstname').value == document.getElementById('inputLastname').value) {
		document.getElementById('inputFirstname').parentNode.parentNode.className = "control-group error";
		document.getElementById('inputLastname').parentNode.parentNode.className = "control-group error";
		document.getElementById('namecheck').innerHTML = "firstname and lastname may not be identical";
	    } else {
		document.getElementById('namecheck').innerHTML = "";
	    }
	}
    };

    widget.checkPEmail = function () {
	var p = document.getElementById('inputPrimaryEmail');
	var s = document.getElementById('inputSecondaryEmail');
	if (! p.value.match(/\@/)) {
	    p.parentNode.parentNode.className = "control-group error";
	    p.nextSibling.innerHTML = "invalid email address";
	    return;
	}
	if (p.value == s.value) {
	    p.parentNode.parentNode.className = "control-group error";
	    p.nextSibling.innerHTML = "primary and secondary email address cannot be the same";
	    return;
	}
	jQuery.ajax({ url: RetinaConfig.mgrast_api+"/user/"+encodeURIComponent(p.value),
		      error: function(response) {
			  var result = response.responseJSON;
			  var p = document.getElementById('inputPrimaryEmail');
			  if (result && result.hasOwnProperty("ERROR") && result.ERROR == "insufficient permissions for user call") {
			      p.nextSibling.innerHTML = "email already taken";
			      p.parentNode.parentNode.setAttribute('class', 'control-group error');
			      return "error";
			  } else {
			      p.parentNode.parentNode.setAttribute('class', 'control-group success');
			      p.nextSibling.innerHTML = "email valid";
			      return "ok";
			  }
		      }
		    });
	p.parentNode.parentNode.className = "control-group";
	p.nextSibling.innerHTML = "preferrably your eMail at your organization";
    };

    widget.checkSEmail = function () {
	var p = document.getElementById('inputPrimaryEmail');
	var s = document.getElementById('inputSecondaryEmail');
	if (s.value.length) {
	    if (! s.value.match(/\@/)) {
		s.parentNode.parentNode.className = "control-group error";
		s.nextSibling.innerHTML = "invalid email address";
		return;
	    }
	    if (p.value == s.value) {
		s.parentNode.parentNode.className = "control-group error";
		s.nextSibling.innerHTML = "primary and secondary email address cannot be the same";
		return;
	    }
	}
	s.parentNode.parentNode.className = "control-group";
	s.nextSibling.innerHTML = "optional, for recovery purposes";
    };
    
    widget.checkLogin = function () {
	var widget = Retina.WidgetInstances.metagenome_register[1];
	
	// get the login input
	var login = document.getElementById('inputLogin');

	// check if something was entered
	if (login.value.length) {
	    if (! login.value.match(/^[\w\d]+$/)) {
		login.parentNode.parentNode.setAttribute('class', 'control-group error');
		document.getElementById('logincheck').innerHTML = "login names may only contain alphanumeric characters without spaces";
		return "error";
	    }

	    jQuery.ajax({ url: RetinaConfig.mgrast_api+"/user/"+login.value,
			  error: function(response) {
			      var result = response.responseJSON;
			      if (result && result.hasOwnProperty("ERROR") && result.ERROR == "insufficient permissions for user call") {
				  document.getElementById('logincheck').innerHTML = "login already taken";
				  login.parentNode.parentNode.setAttribute('class', 'control-group error');
				  return "error";
			      } else {
				  login.parentNode.parentNode.setAttribute('class', 'control-group success');
				  document.getElementById('logincheck').innerHTML = "login valid";
				  return "ok";
			      }
			  }
			});
	} else {
	    login.parentNode.parentNode.setAttribute('class', 'control-group error');
	    return "error";
	}
    };

    // widget.checkPasswordStrength = function () {
    // 	var widget = Retina.WidgetInstances.metagenome_register[1];
	
    // 	var pass = document.getElementById('inputPassword');
    // 	var strength = 0;
    // 	if (pass.value.length > 7) {
    // 	    strength += 5;
    // 	}
    // 	if (pass.value.length > 1) {
    // 	    strength++;
    // 	}
    // 	if (pass.value.length > 15) {
    // 	    strength++;
    // 	}
    // 	if (pass.value.match(/[^\w\d]+/)) {
    // 	    strength++;
    // 	}
    // 	if (pass.value.toLowerCase() != pass.value) {
    // 	    strength++;
    // 	}
    // 	if (pass.value.match(/\d+/) && pass.value.match(/\w+/)) {
    // 	    strength++;
    // 	}
    // 	var result = document.getElementById('passwordStrength');
    // 	if (strength == 0) {
    // 	    result.setAttribute('style', 'color: red;');
    // 	    result.innerHTML = "none";
    // 	} else if (strength < 5) {
    // 	    result.setAttribute('style', 'color: orange;');
    // 	    result.innerHTML = "very weak";
    // 	} else if (strength < 6) {
    // 	    result.setAttribute('style', 'color: orange;');
    // 	    result.innerHTML = "weak";
    // 	} else if (strength < 7) {
    // 	    result.setAttribute('style', 'color: green;');
    // 	    result.innerHTML = "ok";
    // 	}  else if (strength < 8) {
    // 	    result.setAttribute('style', 'color: green;');
    // 	    result.innerHTML = "good";
    // 	} else if (strength < 9) {
    // 	    result.setAttribute('style', 'color: green;');
    // 	    result.innerHTML = "strong";
    // 	} else if (strength < 10) {
    // 	    result.setAttribute('style', 'color: green;');
    // 	    result.innerHTML = "very strong";
    // 	} else if (strength < 11) {
    // 	    result.setAttribute('style', 'color: green;');
    // 	    result.innerHTML = "awesome!";
    // 	}
    // };

    // widget.checkVerifyPassword = function () {
    // 	var widget = Retina.WidgetInstances.metagenome_register[1];
	
    // 	var pass = document.getElementById('inputPassword');
    // 	var very = document.getElementById('inputVerifyPassword');
    // 	if (pass.value == very.value) {
    // 	    very.parentNode.parentNode.setAttribute('class', 'control-group');
    // 	} else {
    // 	    very.parentNode.parentNode.setAttribute('class', 'control-group error');
    // 	}
    // };

    widget.checkURL = function (check) {
	var widget = Retina.WidgetInstances.metagenome_register[1];
	
	var url = document.getElementById('inputURL');

	if (url.value.length) {
	    if (check) {
		if (widget.urlOK) {
		    return;
		} else {
		    url.parentNode.parentNode.parentNode.setAttribute('class', 'control-group error');
		    document.getElementById('urlcheck').innerHTML = 'URL invalid';
		    return;
		}
	    }
	    widget.urlOK = false;
	    window.onerror = function(e){ 
		if (e == "Script error.") {
		    Retina.WidgetInstances.metagenome_register[1].urlOK = true;
		    document.getElementById('inputURL').parentNode.parentNode.parentNode.setAttribute('class', 'control-group success');
		    document.getElementById('urlcheck').innerHTML = 'URL valid';
		} else {
		    console.log(e);
		}
		return true;
	    }
	    url.parentNode.parentNode.parentNode.setAttribute('class', 'control-group warning');
	    document.getElementById('urlcheck').innerHTML = 'checking url...';
	    jQuery.getScript("http://"+url.value).done(function(err){console.log(err);});
	    window.setTimeout("Retina.WidgetInstances.metagenome_register[1].checkURL(true)", 3000);
	} else {
	    url.parentNode.parentNode.parentNode.setAttribute('class', 'control-group');
	    document.getElementById('urlcheck').innerHTML = 'enter the homepage URL of your organization';
	}
    }

    widget.checkOrganization = function (org) {
	var widget = Retina.WidgetInstances.metagenome_register[1];
	if (widget.org_urls.hasOwnProperty(org)) {
	    document.getElementById('inputURL').value = widget.org_urls[org].replace(/^http\:\/\//, "");
	    if (document.getElementById('inputCountry').value.length) {
		Recaptcha.focus_response_field();
	    } else {
		document.getElementById('inputCountry').focus();
	    }
	} else {
	    document.getElementById('inputURL').focus();
	}
    };

    widget.countryCodes = {
	'TV': 'Tuvalu',
	'FJ': 'Fiji',
	'SR': 'Suriname',
	'TZ': 'Tanzania',
	'FR': 'France',
	'CI': 'Ivory Coast',
	'ZW': 'Zimbabwe',
	'TD': 'Chad',
	'GQ': 'Equatorial Guinea',
	'AN': 'Netherlands Antilles',
	'US': 'United States',
	'GU': 'Guam',
	'ZA': 'South Africa',
	'GF': 'French Guiana',
	'NZ': 'New Zealand',
	'FI': 'Finland',
	'UG': 'Uganda',
	'NE': 'Niger',
	'KI': 'Kiribati',
	'AQ': 'British Antarctic Territory',
	'IL': 'Israel',
	'VU': 'Vanuatu',
	'PL': 'Poland',
	'EG': 'Egypt',
	'HM': 'Heard Island and McDonald Islands',
	'AQ': 'Peter I Island',
	'PN': 'Pitcairn Islands',
	'TK': 'Tokelau',
	'TT': 'Trinidad and Tobago',
	'BH': 'Bahrain',
	'MA': 'Morocco',
	'AX': 'Aland',
	'SM': 'San Marino',
	'GW': 'Guinea-Bissau',
	'SE': 'Sweden',
	'UM': 'Johnston Atoll',
	'NF': 'Norfolk Island',
	'HU': 'Hungary',
	'ME': 'Montenegro',
	'PA': 'Panama',
	'BY': 'Belarus',
	'BV': 'Bouvet Island',
	'MV': 'Maldives',
	'CH': 'Switzerland',
	'BA': 'Bosnia and Herzegovina',
	'AQ': 'Queen Maud Land',
	'DK': 'Denmark',
	'PR': 'Puerto Rico',
	'SN': 'Senegal',
	'LC': 'Saint Lucia',
	'PW': 'Palau',
	'CA': 'Canada',
	'DJ': 'Djibouti',
	'VC': 'Saint Vincent and the Grenadines',
	'BD': 'Bangladesh',
	'AU': 'Ashmore and Cartier Islands',
	'MQ': 'Martinique',
	'SO': 'Somalia',
	'AT': 'Austria',
	'NA': 'Namibia',
	'SL': 'Sierra Leone',
	'RE': 'Reunion',
	'BW': 'Botswana',
	'TA': 'Tristan da Cunha',
	'FO': 'Faroe Islands',
	'CD': 'Congo',
	'GL': 'Greenland',
	'BZ': 'Belize',
	'AW': 'Aruba',
	'IN': 'India',
	'GD': 'Grenada',
	'MT': 'Malta',
	'CM': 'Cameroon',
	'KZ': 'Kazakhstan',
	'IT': 'Italy',
	'MU': 'Mauritius',
	'BT': 'Bhutan',
	'ZM': 'Zambia',
	'BS': 'Bahamas',
	'NO': 'Norway',
	'NR': 'Nauru',
	'SK': 'Slovakia',
	'MK': 'Macedonia',
	'MP': 'Northern Mariana Islands',
	'TR': 'Turkey',
	'KG': 'Kyrgyzstan',
	'CO': 'Colombia',
	'MR': 'Mauritania',
	'LT': 'Lithuania',
	'CK': 'Cook Islands',
	'PY': 'Paraguay',
	'PS': 'Palestinian Territories (Gaza Strip and West Bank)',
	'TO': 'Tonga',
	'LS': 'Lesotho',
	'MS': 'Montserrat',
	'AM': 'Armenia',
	'SJ': 'Svalbard',
	'SB': 'Solomon Islands',
	'SI': 'Slovenia',
	'ER': 'Eritrea',
	'HT': 'Haiti',
	'AL': 'Albania',
	'FK': 'Falkland Islands (Islas Malvinas)',
	'SG': 'Singapore',
	'TF': 'French Southern and Antarctic Lands',
	'PF': 'French Polynesia',
	'AQ': 'Australian Antarctic Territory',
	'UM': 'Midway Islands',
	'SH': 'Saint Helena',
	'UZ': 'Uzbekistan',
	'GB': 'United Kingdom',
	'KM': 'Comoros',
	'VA': 'Vatican City',
	'UY': 'Uruguay',
	'LR': 'Liberia',
	'TC': 'Turks and Caicos Islands',
	'EH': 'Western Sahara',
	'JP': 'Japan',
	'AR': 'Argentina',
	'TN': 'Tunisia',
	'ID': 'Indonesia',
	'RW': 'Rwanda',
	'AF': 'Afghanistan',
	'AC': 'Ascension',
	'LY': 'Libya',
	'GS': 'South Georgia and the South Sandwich Islands',
	'GA': 'Gabon',
	'BI': 'Burundi',
	'HN': 'Honduras',
	'KE': 'Kenya',
	'UM': 'Palmyra Atoll',
	'PF': 'Clipperton Island',
	'AD': 'Andorra',
	'TJ': 'Tajikistan',
	'SV': 'El Salvador',
	'GP': 'Saint Martin',
	'MN': 'Mongolia',
	'GP': 'Saint Barthelemy',
	'MG': 'Madagascar',
	'RU': 'Russia',
	'IO': 'British Indian Ocean Territory',
	'DZ': 'Algeria',
	'OM': 'Oman',
	'CU': 'Cuba',
	'DO': 'Dominican Republic',
	'VE': 'Venezuela',
	'MX': 'Mexico',
	'KW': 'Kuwait',
	'UM': 'Kingman Reef',
	'BB': 'Barbados',
	'ET': 'Ethiopia',
	'EE': 'Estonia',
	'RS': 'Serbia',
	'AZ': 'Nagorno-Karabakh',
	'CZ': 'Czech Republic',
	'GI': 'Gibraltar',
	'CC': 'Cocos (Keeling) Islands',
	'VG': 'British Virgin Islands',
	'UA': 'Ukraine',
	'CY': 'Cyprus',
	'VN': 'Vietnam',
	'AE': 'United Arab Emirates',
	'YE': 'Yemen',
	'BF': 'Burkina Faso',
	'IS': 'Iceland',
	'NG': 'Nigeria',
	'TM': 'Turkmenistan',
	'MW': 'Malawi',
	'TH': 'Thailand',
	'WF': 'Wallis and Futuna',
	'NU': 'Niue',
	'LB': 'Lebanon',
	'SA': 'Saudi Arabia',
	'LI': 'Liechtenstein',
	'MO': 'Macau',
	'GE': 'Georgia',
	'LU': 'Luxembourg',
	'AQ': 'Ross Dependency',
	'KN': 'Saint Kitts and Nevis',
	'QA': 'Qatar',
	'MD': 'Moldova',
	'IM': 'Isle of Man',
	'AU': 'Coral Sea Islands',
	'JM': 'Jamaica',
	'UM': 'Navassa Island',
	'CR': 'Costa Rica',
	'BN': 'Brunei',
	'MM': 'Myanmar (Burma)',
	'CN': 'China',
	'BE': 'Belgium',
	'YT': 'Mayotte',
	'JO': 'Jordan',
	'PK': 'Pakistan',
	'DM': 'Dominica',
	'BR': 'Brazil',
	'TL': 'Timor-Leste (East Timor)',
	'GG': 'Guernsey',
	'SO': 'Somaliland',
	'NP': 'Nepal',
	'NC': 'New Caledonia',
	'MZ': 'Mozambique',
	'MD': 'Pridnestrovie (Transnistria)',
	'FM': 'Micronesia',
	'IE': 'Ireland',
	'NI': 'Nicaragua',
	'AI': 'Anguilla',
	'DE': 'Germany',
	'UM': 'Howland Island',
	'GE': 'South Ossetia',
	'AU': 'Australia',
	'KH': 'Cambodia',
	'KY': 'Cayman Islands',
	'GR': 'Greece',
	'EC': 'Ecuador',
	'BM': 'Bermuda',
	'HK': 'Hong Kong',
	'PG': 'Papua New Guinea',
	'PM': 'Saint Pierre and Miquelon',
	'UM': 'Wake Island',
	'GN': 'Guinea',
	'LK': 'Sri Lanka',
	'GP': 'Guadeloupe',
	'UM': 'Baker Island',
	'GH': 'Ghana',
	'PE': 'Peru',
	'LA': 'Laos',
	'WS': 'Samoa',
	'BG': 'Bulgaria',
	'NL': 'Netherlands',
	'AS': 'American Samoa',
	'SZ': 'Swaziland',
	'PT': 'Portugal',
	'PH': 'Philippines',
	'ML': 'Mali',
	'AZ': 'Azerbaijan',
	'SC': 'Seychelles',
	'CV': 'Cape Verde',
	'CX': 'Christmas Island',
	'AQ': 'Antarctica',
	'CF': 'Central African Republic',
	'GY': 'Guyana',
	'ES': 'Spain',
	'BO': 'Bolivia',
	'TG': 'Togo',
	'HR': 'Croatia',
	'BJ': 'Benin',
	'UM': 'Jarvis Island',
	'AO': 'Angola',
	'CL': 'Chile',
	'JE': 'Jersey',
	'CS': 'Kosovo',
	'MY': 'Malaysia',
	'KR': 'South Korea',
	'GM': 'Gambia',
	'AG': 'Antigua and Barbuda',
	'GT': 'Guatemala',
	'MC': 'Monaco',
	'GE': 'Abkhazia',
	'CY': 'Northern Cyprus',
	'LV': 'Latvia',
	'MH': 'Marshall Islands',
	'ST': 'Sao Tome and Principe',
	'VI': 'U.S. Virgin Islands',
	'RO': 'Romania'
    };

    widget.organizations = [ ["Wellcome Trust Sanger Institute", "Sanger", "http://www.sanger.ac.uk/"],
			     ["Pacific Northwest National Laboratory", "PNNL", "http://www.pnnl.gov/"],
			     ["Massachusetts Institute of Technology", "MIT", "http://www.mit.edu"],
			     ["University of Iowa", "UI", "http://www.uiowa.edu/"],
			     ["Center for Ecology and Hydrology", "CEH", "http://www.ceh.ac.uk/"],
			     ["Institute for Genomic Biology", "IGB", "http://www.igb.uiuc.edu/"],
			     ["Queens University", "QU", "http://www.queensu.ca"],
			     ["Burnham Institute for Medical Research", "BIfMR", "http://www.burnham.org"],
			     ["University College Dublin", "UCD", "http://www.ucd.ie/"],
			     ["NCSA", "NCSA", "http://www.ncsa.uiuc.edu"],
			     ["Los Alamos National Laboratory", "LANL", "http://www.lanl.gov"],
			     ["University di Pisa", "UdP", "http://www.unipi.it"],
			     ["Center for Biological Sequence Analysis", "CBS", "http://cbs.dtu.dk"],
			     ["University of Florida", "UF", "http://www.ufl.edu/"],
			     ["University of California, Davis", "UC Davis", "http://www.ucdavis.edu/"],
			     ["Riken", "Riken", "http://www.riken.jp/"],
			     ["University of Tennessee, Knoxville", "UTK", "http://www.utk.edu/"],
			     ["University of Waikato", "UoW", "http://www.waikato.ac.nz"],
			     ["Navy Medical Research Center - Biological Defense Research Directorate", "Navy ", "http://www.nmrc.navy.mil"],
			     ["University of Pune", "Pune", "http://www.unipune.ac.in/"],
			     ["Institut de Ciencies del Mar", "ICM", "http://www.icm.csic.es"],
			     ["Univeristy of Chicago", "UoC", "http://www.uchicago.edu"],
			     ["Bowling Green State University", "BGSU", "http://www.bgsu.edu"],
			     ["Studiecentrum voor Kernenergie", "SCK-CEN", "http://www.sckcen.be"],
			     ["Miguel Hernandez University", "UMH", "http://www.umh.es/"],
			     ["George Mason University", "George Mason University", "http://www.gmu.edu"],
			     ["University of Louisville", "Louisville", "http://www.louisville.edu"],
			     ["Lawrence Livermore National Laboratory", "LLNL", "https://www.llnl.gov/"],
			     ["Plymouth Marine Laboratory", "PML", "http://www.pml.ac.uk/"],
			     ["National Institutes of Health", "NIH", "http://www.nih.gov"],
			     ["University of Manchester", "Manchester", "http://www.manchester.ac.uk"],
			     ["Woods Hole Oceanographic Institution", "WHOI", "http://www.whoi.edu"],
			     ["Northern Illinois University", "NIU   ", "http://www.niu.edu"],
			     ["Joint Genome Institute", "JGI", "http://www.jgi.doe.gov/"],
			     ["University of Chicago", "UoC", "http://www.uchicago.edu"],
			     ["University of Granada", "UGR", "http://www.ugr.es/"],
			     ["Cornell University", "Cornell", "http://www.cornell.edu/"],
			     ["San Diego State University", "SDSU", "http://www.sdsu.edu"],
			     ["University of Tromso", "University of Tromso", "http://www.uit.no/"],
			     ["ERIC BRC", "ERIC", "http://www.ericbrc.org"],
			     ["Scripps Institution of Oceanography", "Scripps", "http://www.sio.ucsd.edu"],
			     ["West Penn Allegheny Health System", "WPAHS", "http://www.wpahs.org"],
			     ["Brigham Womens Hospital at Harvard", "BWH-Harvard ", "http://research.bwh.harvard.edu"],
			     ["Institute of Genomics and Integrative Biology", "IGIB", "http://www.igib.res.in/"],
			     ["Hokkaido University", "Hokkaido_JP", "http://www.hokudai.ac.jp"],
			     ["University of Conneticut", "NULL", "http://www.uconn.edu/"],
			     ["luca technologies", "luca technologies", "http://www.lucatechnologies.com/"],
			     ["Lawrence Berkeley National Laboratory", "LBL", "http://www.lbl.gov/"],
			     ["Centers for Disease Control and Prevention", "CDC", "http://www.cdc.gov/"],
			     ["University of Bergen", "University of Bergen", "http://www.uib.no/"],
			     ["Hope College", "Hope", "http://www.hope.edu"],
			     ["California Institute of Technology", "Caltech", "http://www.caltech.edu"],
			     ["University of Delaware", "UD", "http://www.udel.edu/"],
			     ["Stanford University", "Stanford", "http://www.stanford.edu/"],
			     ["Argonne National Laboratory", "ANL", "http://www.anl.gov/"],
			     ["Netherlands Institute of Ecology (Nederlands Instituut voor Ecologie)", "NIOO-KNAW", "http://www.nioo.knaw.nl/"],
			     ["Harvard Medical School", "Harvard", "http://hms.harvard.edu"],
			     ["Washington University in St Louis", "WUSTL", "http://www.wustl.edu"],
			     ["Orion Biosciences", "Orion", "http://www.orionbiosciences.com"],
			     ["University of Calcutta", "Calcutta_IN", "http://www.caluniv.ac.in"],
			     ["Bigelow Laboratory for Ocean Sciences", "BLOS", "http://www.bigelow.org/"],
			     ["Genoscope", "Genoscope", "http://www.genoscope.cns.fr/"],
			     ["EMBL-EBI", "EBI", "http://www.ebi.ac.uk"],
			     ["Blaise Pascal University (Université Blaise Pascal, Clermont-Ferrand II)", "UBP", "http://www.univ-bpclermont.fr/"],
			     ["University of Texas at Austin", "UT", "http://www.utexas.edu/"],
			     ["University of Arizona", "UoA", "http://www.arizona.edu/"],
			     ["Baylor College of Medicine", "Baylor", "http://www.bcm.edu/"],
			     ["Fellowship for the Interpretation of Genomes", "FIG", "http://www.thefig.org"],
			     ["Universite Paris-Sud", "u-psud", "http://www.u-psud.fr"],
			     ["Northwestern University", "Northwestern", "http://www.northwestern.edu/"],
			     ["LUCIGEN", "Lucigen", "http://www.lucigen.com/"],
			     ["Rockefeller University", "Rockefeller University", "http://www.rockefeller.edu"],
			     ["Birla Institute of Technology and Science", "BITS-Pilani", "http://www.bits-pilani.ac.in"],
			     ["Cardiff University", "Cardiff", "http://www.cardiff.ac.uk/"],
			     ["French National Institute for Agricultural Research", "INRA", "http://www.international.inra.fr"],
			     ["University of Sheffield", "Sheffield", "http://www.sheffield.ac.uk/"],
			     ["University of Lleida, Spain", "Lleida_ES  Lleida", "http://www.udl.es"],
			     ["University of South Florida", "USF", "http://www.usf.edu"],
			     ["Sodertorn University College", "Sodertorn University College, SE ", "http://webappl.web.sh.se"],
			     ["Helsinki University, Finland", "Helsinki University_FI Helsinki", "http://www.helsinki.fi/university/"],
			     ["University of Birmingham", "Birmingham", "http://www.birmingham.ac.uk/"],
			     ["National Institute of Allergies and Infectious Diseases", "NIAID ", "http://www.niaid.nih.gov"],
			     ["University of the Free State", "UFS", "http://www.ufs.ac.za/"],
			     ["Virginia Bioinformatics Institute", "VBI", "https://www.vbi.vt.edu/"],
			     ["Methodist Hospital Research Institute", "Methodist Hospital Research Institute ", "http://www.methodisthealth.com/"],
			     ["North Dakota State University", "NDSU", "http://www.ndsu.edu"],
			     ["Lyon University", "IRD", "http://www.ec-lyon.fr"],
			     ["University of California, San Diego", "UCSD", "http://www.ucsd.edu/"],
			     ["University of Nebraska at Lincoln", "UNL", "http://www.unl.edu/"],
			     ["University of Illinois at Urbana-Champaign", "UIUC", "http://illinois.edu/"],
			     ["Wageningen University, Laboratory of Phytopathology NL", "WUR", "http://www.wur.nl"],
			     ["GenomeQuest", "GenomeQuest", "http://www.genomequest.com"],
			     ["University of Georgia", "UGA", "http://www.uga.edu/"],
			     ["University of Illinois", "UoI", "http://www.uiuc.edu"],
			     ["Oregon State University", "OSU", "http://oregonstate.edu"],
			     ["Alagappa University", "Alagappa", "http://www.alagappauniversity.ac.in/"],
			     ["University of Maryland", "UMD", "http://www.umd.edu/"],
			     ["Mahidol University", "Mahidol University", "http://www.mahidol.ac.th/"],
			     ["Centre National de la Recherce Scientifique", "CNRS", "http://www.cnrs.fr"],
			     ["Oregon Health & Science University", "OHSU", "http://www.ohsu.edu"],
			     ["University of Oklahoma", "OU", "http://www.ou.edu/"],
			     ["University of Wisconsin - Madison", "UW - Madison", "http://www.wisc.edu/"],
			     ["Marine Biological Laboratory", "MBL", "http://www.mbl.edu/"],
			     ["University of California, Santa Barbara", "UCSB", "http://www.ucsb.edu"],
			     ["Michigan State University", "MSU", "http://www.msu.edu/"],
			     ["Pennsylvania State University", "PSU", "http://www.psu.edu/"],
			     ["J. Craig Venter Institute", "JCVI", "http://www.jcvi.org/"],
			     ["University of Hawaii", "Hawaii", "http://www.hawaii.edu/"],
			     ["Georgetown University", "Georgetown", "http://www.georgetown.edu"],
			     ["University of South Carolina", "USC", "http://www.sc.edu/"],
			     ["University of Colorado at Boulder", "CU-Boulder", "http://www.colorado.edu/"],
			     ["Nara Institute of Science and Technology", "NAIST", "http://www.naist.jp/"],
			     ["Broad Institute", "BI", "http://www.broadinstitute.org/"],
			     ["University of California, Berkeley", "Berkeley", "http://www.berkeley.edu/"],
			     ["University of North Carolina, Chapel Hill", "UNC", "http://www.unc.edu/"],
			     ["University of Minnesota", "UofM", "http://www.umn.edu/"],
			     ["Jawaharlal Nehru University", "JNU", "http://www.jnu.ac.in/"],
			     ["National Health Research Institutes", "NHRI", "http://www.nhri.org.tw/"],
			     ["Hebrew University of Jerusalem", "HUJI", "http://www.huji.ac.il/"],
			     ["Agriculture and Agri-Food Canada", "AAFC-AAC", "http://www.agr.gc.ca/"],
			     ["Chinese Academy of Agricultural Sciences", "CAAS", "http://www.caas.net.cn/"],
			     ["Flinders University", "Flinders University", "http://www.flinders.edu.au"],
			     ["Shanghai Institute of Plant Physiology and Ecology", "SIPPE", "http://www.sippe.ac.cn/"],
			     ["Dalhousie University", "Dalhousie", "http://www.dal.ca/"],
			     ["University of Zuerich", "UZH_CH", "http://www.uzh.ch"],
			     ["Universidade Federal do Para", "UFPA_BR", "http://www.ufpa.br"],
			     ["University of Giessen", "IMM", "http://www.uni-giessen.de"],
			     ["Harbin Institute of Technology", "HIT", "http://en.hit.edu.cn"],
			     ["Murdoch University", "Murdoch University", "http://www.murdoch.edu.au/"],
			     ["University New South Wales", "NULL", "http://www.unsw.edu.au"],
			     ["University of Western Australia", "UWA", "http://www.uwa.edu.au"],
			     ["University of Wuerzburg", "Wuerzburg", "http://www.uni-wuerzburg.de/"],
			     ["Helmholtz Centre for Environmental Research, UFZ", "UFZ", "http://www.ufz.de/"],
			     ["Institute of Molecular Genetics, Czech Academy of Sciences", "IMG", "http://www.img.cas.cz/"],
			     ["University of Tübingen", "University of Tuebingen", "http://www.uni-tuebingen.de"],
			     ["Austrian Academy of Sciences", "AAS", "http://www.oeaw.ac.at/"],
			     ["University of Prince Edward Island", "UPEI", "http://www.upei.ca/"],
			     ["Max Planck Institute for Marine Microbiology", "MPI-MM", "http://www.mpi-bremen.de"],
			     ["University of British Columbia", "UBC", "http://www.ubc.ca/"],
			     ["Max Planck Institute for Molecular Genetics", "MPI-MG", "http://www.molgen.mpg.de"],
			     ["Bielefeld University", "Bielefeld University", "http://www.uni-bielefeld.de/"],
			     ["University of Melbourne", "UniMelb", "http://www.unimelb.edu.au"],
			     ["Acme", "ACME", "www.acme.com"],
			     ["University of Oldenburg", "NULL", "http://www.uni-oldenburg.de/"],
			     ["J. Gordon Lab, Center for Genome Sciences, Washington University School of Medicine", "WUSTL_medschool", "http://gordonlab.wustl.edu"],
			     ["Medical College of Wisconsin", "MCW", "http://www.mcw.edu"],
			     ["Institute for Genome Sciences, University of Maryland School of Medicine", "IGS", "http://www.igs.umaryland.edu/"],
			     ["University of Oslo", "UIO", "http://www.uio.no/"],
			     ["University of Helsinki", "UH", "http://www.helsinki.fi/"],
			     ["University of York", "York", "http://www.york.ac.uk"],
			     ["University of Santiago de Compostela", "USC", "http://www.usc.es/"],
			     ["LMU-Munich, Institut fur Mikrobiologie", "LMU", "http://www.mikrobiologie.biologie.uni-muenchen.de/index.php?showpage=1"],
			     ["Virginia Tech", "VT", "http://www.vt.edu"],
			     ["U.S. Department of Agriculture", "USDA", "http://www.usda.gov"],
			     ["Kitasato University", "NULL", "http://www.lisci.kitasato-u.ac.jp"],
			     ["University of Utah", "NULL", "http://www.utah.edu"],
			     ["University of Washington", "UW", "http://www.washington.edu/"],
			     ["University of Valencia", "UV", "http://www.uv.es/"],
			     ["Washington University School of Medicine", "WUSTL_medschool", "http://medschool.wustl.edu/"],
			     ["Institute of Microbiology", "NULL", "NULL"],
			     ["University of Edinburgh", "UE", "http://www.ed.ac.uk/"],
			     ["University of Victoria", "UVic", "http://www.uvic.ca"],
			     ["CAMS", "NULL", "NULL"],
			     ["Macquarie University", "MQ", "http://www.mq.edu.au/"],
			     ["Statens Serum Institut", "SSI", "http://www.ssi.dk"],
			     ["University", "NULL", "NULL"],
			     ["ECL", "NULL", "NULL"],
			     ["Ocean Genome Legacy Foundation", "OGLF", "http://www.oglf.org/"],
			     ["DNAStar", "DNAStar", "http://www.dnastar.com"],
			     ["University of Massachusetts Dartmouth", "UMass Dartmouth", "http://web.bio.umassd.edu/elilly"],
			     ["Seoul National University", "SNU", "http://www.snu.ac.kr/"],
			     ["Duke University", "Duke", "http://www.duke.edu/"],
			     ["Nova Southeastern University", "NSU", "http://www.nova.edu/"],
			     ["North Carolina State University", "NCSU", "http://www.ncsu.edu/"],
			     ["Texas A&M University", "Texas A&M", "http://www.tamu.edu/"],
			     ["Georgia Institute of Technology", "Georgia Tech", "http://www.gatech.edu/"],
			     ["International Vaccine Institute", "IVI", "http://www.ivi.int"],
			     ["Shandong University", "SDU", "http://www.sdu.edu.cn/english05/"],
			     ["University of the Western Cape", "UWC", "http://www.uwc.ac.za/"],
			     ["New England Biolabs", "NEB", "http://www.neb.com/"],
			     ["Instituto Nacional de Técnica Aeroespacial", "INTA", "http://www.inta.es/"],
			     ["OVOBIO", "OVOBIO", "http://www.ovobio.co.kr"],
			     ["Max Planck Institute for Terrestrial Microbiology", "MPI-Marburg", "http://www.mpi-marburg.mpg.de/"],
			     ["Universidade Federal de São Carlos", "UFSCar", "http://www2.ufscar.br/home/index.php"],
			     ["University of Aberdeen", "UoA", "http://www.abdn.ac.uk/"],
			     ["University of Oklahoma Health Sciences Center", "OUHSC", "http://www.ouhsc.edu/"],
			     ["HUG", "NULL", "NULL"],
			     ["Naval Medical Research Center", "NMRC", "http://www.nmrc.navy.mil/"],
			     ["NMRC", "NULL", "NULL"],
			     ["university of Leicester", "Leicester", "http://www.le.ac.uk/"],
			     ["Soongsil University", "NULL", "http://www.thegreatgoodplace.com"],
			     ["Agencourt Bioscience Corporation", "Agencourt", "http://www.agencourt.com/"],
			     ["University of Cambridge", "Cambridge", "http://www.cam.ac.uk"],
			     ["Swiss Federal Institute of Technology Zurich", "ETHZ", "http://www.ethz.ch/"],
			     ["Davidson College", "Davidson", "http://www.davidson.edu/"],
			     ["University of Kalmar", "HIK", "http://www.hik.se/"],
			     ["National Autonomous University of Mexico (Universidad Nacional Autónoma de México)", "UNAM", "http://www.unam.mx/"],
			     ["University of Queensland", "UQ", "http://www.uq.edu.au/"],
			     ["Université Libre de Bruxelles", "ULB", "http://www.ulb.ac.be/"],
			     ["University of the West Indies, Mona", "UWI, Mona", "http://www.mona.uwi.edu/"],
			     ["Sun Yat-sen University", "SYSU", "http://www.sysu.edu.cn/"],
			     ["Korean Bioinformation Center", "KOBIC", "http://www.kobic.re.kr/"],
			     ["Cinvestav", "Cinvestav", "http://www.cinvestav.mx/"],
			     ["National Veterinary Institute", "NVI", "http://www.vetinst.no/"],
			     ["Commonwealth Scientific and Industrial Research Organisation", "CSIRO", "http://www.csiro.au/"],
			     ["University of Copenhagen", "KU", "http://www.ku.dk/"],
			     ["Institute of Molecular and Cell Biology of Rosario (Instituto de Biología Molecular y Celular de Rosario)", "IBR", "http://www.ibr.gov.ar/"],
			     ["Colorado School of Mines", "CSM", "http://www.mines.edu/"],
			     ["University of New Mexico", "UNM", "http://www.unm.edu/"],
			     ["Korea Research Institute of Bioscience & Biotechnology", "KRIBB", "https://www.kribb.re.kr/"],
			     ["Medical Biofilm Research Institute", "MBRI", "http://www.medicalbiofilm.org/"],
			     ["Universidade Presbiteriana Mackenzie", "NULL", "http://www.mackenzie.br/"],
			     ["Xcelris Labs", "NULL", "http://www.xcelrislabs.com/"],
			     ["Universidad de Cantabria", "UC", "http://www.unican.es/"],
			     ["Norwegian Geotechnical Institute", "NGI", "http://www.ngi.no/"],
			     ["Fudan University ", "Fudan", "http://www.fudan.edu.cn/"],
			     ["Center for Bioinformatics and Computational Biology, University of Maryland", "CBCB", "http://www.cbcb.umd.edu/"],
			     ["Bioremediation Group (commercial group)", "NULL", "NULL"],
			     ["St. Jude Children's Research Hospital", "St. Jude", "http://www.stjude.org/"],
			     ["Central Science Laboratory", "CSL", "http://www.csl.gov.uk/"],
			     ["Wyeth", "Wyeth", "http://www.wyeth.com/"],
			     ["University of Vienna (Universität Wien)", "NULL", "http://www.univie.ac.at/"],
			     ["United States Air Force", "USAF", "http://www.af.mil/"],
			     ["Universidad Pública de Navarra", "UPNA", "http://www.unavarra.es/"],
			     ["University College Cork", "UCC", "http://www.ucc.ie/"],
			     ["Portland State University", "PSU", "http://www.pdx.edu/"],
			     ["Mayo Clinic", "Mayo", "http://www.mayo.edu/"],
			     ["University of Nevada, Las Vegas", "UNLV", "http://www.unlv.edu/"],
			     ["MITRE", "MITRE", "http://www.mitre.org/"],
			     ["University of Florence", "UNIFI", "http://www.unifi.it/"],
			     ["National Institute of Cholera and Enteric Diseases", "NICED", "http://www.niced.org.in/"],
			     ["University of Colorado Denver", "UC Denver", "http://www.ucdenver.edu/"],
			     ["Chinese University of Hong Kong", "CUHK", "http://www.cuhk.edu.hk/"],
			     ["University of Toronto", "U of T", "http://www.utoronto.ca/"],
			     ["University of Aberdeen, Rowett Institute of Nutrition and Health", "RINH", "http://www.rowett.ac.uk/"],
			     ["University of Tennessee Health Science Center", "UTHSC", "http://www.uthsc.edu/"],
			     ["McGill University", "McGill", "http://www.mcgill.ca/"],
			     ["Boston University", "BU", "http://www.bu.edu/"],
			     ["Shanghai Institutes of Biological Sciences", "SIBS", "http://www.sibs.ac.cn/"],
			     ["Biocant", "Biocant", "http://www.biocant.pt"],
			     ["University of Hamburg", "UHH", "http://www.uni-hamburg.de/"],
			     ["Geospiza", "Geospiza", "http://www.geospiza.com"],
			     ["Idaho National Laboratory", "INL", "http://www.inl.gov/"],
			     ["Hedmark University College", "HiHm", "http://www.hihm.no/"],
			     ["Gordon and Betty Moore Foundation", "Moore Foundation", "http://www.moore.org/"],
			     ["Université Laval", "Laval", "http://www.ulaval.ca/"],
			     ["University of Rhode Island", "URI", "http://www.uri.edu/"],
			     ["University of California, Santa Cruz", "UCSC", "http://www.ucsc.edu/"],
			     ["Chinese National Human Genome Center at Shanghai", "CHGC", "http://chgc.sh.cn/"],
			     ["Leiden University Medical Center", "LUMC", "http://www.lumc.nl/"],
			     ["Universidade Católica Portuguesa", "UCP", "http://www.ucp.pt/"],
			     ["Harvard University", "Harvard", "http://www.harvard.edu/"],
			     ["Xiamen University ", "XMU", "http://www.xmu.edu.cn/"],
			     ["University of Concepción (Universidad de Concepción)", "UdeC", "http://www.udec.cl/"],
			     ["Institute of Microbiology, Chinese Academy of Sciences", "IMCAS", "http://www.im.ac.cn/en/"],
			     ["Leibniz Institute of Marine Sciences", "IFM-GEOMAR", "http://www.ifm-geomar.de/"],
			     ["Universidade Estadual de Santa Cruz", "UESC", "http://www.uesc.br/"],
			     ["National Research Council", "CNR", "http://www.cnr.it/"],
			     ["Glasgow Caledonian University", "GCU", "http://www.gcu.ac.uk/"],
			     ["Royal Institute of Technology", "KTH", "http://www.kth.se/"],
			     ["Universidad de Alicante", "UA", "http://www.ua.es/"],
			     ["Florida State University", "FSU", "http://www.fsu.edu/"],
			     ["Dauphin Island Sea Lab", "DISL", "http://www.disl.org/"],
			     ["Indiana University", "IU", "http://www.indiana.edu/"],
			     ["Genoscreen", "NULL", "http://genoscreen.chez-alice.fr/"],
			     ["TNO", "TNO", "http://www.tno.nl/"],
			     ["AgResearch Limited", "AgResearch", "http://www.agresearch.co.nz/"],
			     ["San Diego Supercomputer Center", "SDSC", "http://www.sdsc.edu/"],
			     ["University of Liverpool", "NULL", "http://www.liv.ac.uk/"],
			     ["Oklahoma State University", "OSU", "http://osu.okstate.edu/"],
			     ["Leibniz Institute of Plant Genetics and Crop Plant Research", "IPK", "http://www.ipk-gatersleben.de/"],
			     ["National Yang Ming University", "NYMU", "http://www.ym.edu.tw/"],
			     ["University of Oxford", "Oxford", "http://www.ox.ac.uk/"],
			     ["Stockholm University", "SU", "http://www.su.se/"],
			     ["University of Pittsburgh", "Pitt", "http://www.pitt.edu/"],
			     ["Aberystwyth University", "UWA", "http://www.aber.ac.uk/"],
			     ["Medical University of South Carolina", "MUSC", "http://www.musc.edu/"],
			     ["Roche Korea", "NULL", "http://www.roche.co.kr/"],
			     ["Kent State University", "KSU", "http://www.kent.edu/"],
			     ["Swedish University of Agricultural Sciences", "SLU", "http://www.slu.se/"],
			     ["Australian National University", "ANU", "http://www.anu.edu.au/"],
			     ["Department of Primary Industries, Victoria", "DPI", "http://www.dpi.vic.gov.au/"],
			     ["National Institute of Infectious Diseases", "NIID", "http://www.nih.go.jp/niid/index-e.html"],
			     ["Stellenbosch University", "SU", "http://www.sun.ac.za/"],
			     ["Institute of Marine Biotechnology", "IMaB", "http://www.marine-biotechnologie.de/"],
			     ["University of Greifswald", "NULL", "http://www.uni-greifswald.de/"],
			     ["University of Southern California", "USC", "http://www.usc.edu/"],
			     ["boulder", "NULL", "NULL"],
			     ["Louisiana State University ", "LSU", "http://www.lsu.edu/"],
			     ["University of Calgary", "UofC", "http://www.ucalgary.ca/"],
			     ["Universidade Federal do Paraná", "UFPR", "http://www.ufpr.br/"],
			     ["Wayne State University", "WSU", "http://wayne.edu/"],
			     ["Wayne State University School of Medicine", "NULL", "http://home.med.wayne.edu/"],
			     ["University of St Andrews", "NULL", "http://www.st-andrews.ac.uk/"],
			     ["andrew", "NULL", "NULL"],
			     ["Macrogen", "NULL", "http://www.macrogen.com/"],
			     ["Syracuse University", "SU", "http://www.syr.edu/"],
			     ["National Center for Genetic Engineering and Biotechnology", "BIOTEC", "http://www.biotec.or.th/"],
			     ["University of California, Los Angeles", "UCLA", "http://www.ucla.edu/"],
			     ["Wageningen University and Research Centre", "WUR", "http://www.wur.nl/"],
			     ["American University in Cairo", "AUC", "http://www.aucegypt.edu/"],
			     ["Environmental Protection Agency", "EPA", "http://www.epa.gov/"],
			     ["Kansas State University", "K-state", "http://www.ksu.edu"],
			     ["Andhra University", "NULL", "http://www.andhrauniversity.info/"],
			     ["Medical University of Graz", "NULL", "http://www.meduni-graz.at/"],
			     ["BIOZONE Research Technologies", "NULL", "http://www.biozone.co.in"],
			     ["The Roslin Institute of the University of Edinburgh", "Roslin Institute", "http://www.roslin.ac.uk/"],
			     ["Center for Genomic Sciences", "CGS", "http://www.centerforgenomicsciences.org/"],
			     ["Functional Genomics Center Zurich", "FGCZ", "http://www.fgcz.ethz.ch/"],
			     ["Drexel University", "Drexel", "http://www.drexel.edu/"],
			     ["Fundación Ciencia Para La Vida", "FCV", "http://www.cienciavida.cl/"],
			     ["Kinki University", "NULL", "http://ccpc01.cc.kindai.ac.jp/"],
			     ["Instituto Mediterráneo de Estudios Avanzados", "IMEDEA", "http://www.imedea.uib.es/"],
			     ["Queen's University Belfast", "Queens", "http://www.qub.ac.uk/"],
			     ["MIC College of Technology", "NULL", "http://www.mictech.ac.in/"],
			     ["University of Ottawa", "uOttawa", "http://www.uottawa.ca/"],
			     ["Cincinnati Children's Hospital Medical Center", "CCHMC", "http://www.cincinnatichildrens.org/"],
			     ["Arizona State University", "ASU", "http://www.asu.edu/"],
			     ["Eastern Illinois University", "EIU", "http://www.eiu.edu/"],
			     ["University of Idaho", "U of I", "http://www.uidaho.edu/"],
			     ["University of Vermont", "UVM", "http://www.uvm.edu/"],
			     ["Defence Science and Technology Laboratory", "Dstl", "http://www.dstl.gov.uk/"],
			     ["Genomic Research Laboratory, University of Geneva Hospitals", "GRL", "http://www.genomic.ch/"],
			     ["Montana State University", "MSU", "http://www.montana.edu/"],
			     ["Technion – Israel Institute of Technology", "Technion", "http://www.technion.ac.il/"],
			     ["University of Iceland", "NULL", "http://www.hi.is/"],
			     ["National Oceanography Centre, Southampton", "NOCS", "http://www.noc.soton.ac.uk/"],
			     ["Institute of Molecular Genetics, Czech Academy of Sciences, Czech Republic", "IMG", "http://www.img.cas.cz/"],
			     ["Life Technologies", "NULL", "http://www.lifetechnologies.com/"],
			     ["Purdue University", "Purdue", "http://www.purdue.edu/"],
			     ["University of Bordeaux", "NULL", "http://u-bordeaux2.fr/"],
			     ["Prairie View A&M University", "PVAMU", "http://www.pvamu.edu/"],
			     ["Laboratoire de Microbiologie et Génétique Moléculaires", "LMGM", "http://www-lmgm.biotoul.fr/"],
			     ["Madurai Kamaraj University", "MKU", "http://www.mkuniversity.org/"],
			     ["Inha University", "Inha", "http://www.inha.ac.kr/"],
			     ["University of Illinois at Chicago", "UIC", "http://www.uic.edu/"],
			     ["Western Kentucky University", "WKU", "http://www.wku.edu/"],
			     ["Virginia Commonwealth University", "VCU", "http://www.vcu.edu/"],
			     ["Julius Kühn-Institut", "JKI", "http://www.jki.bund.de/"],
			     ["University of Göttingen", "NULL", "http://www.uni-goettingen.de/"],
			     ["The Research Institute at Nationwide Children’s Hospital", "NULL", "http://www.nationwidechildrens.org/pediatric-research"],
			     ["University of Arkansas", "UARK", "http://www.uark.edu/"],
			     ["Jacobs University", "NULL", "http://www.jacobs-university.de/"],
			     ["University of California, Merced", "UC Merced", "http://www.ucmerced.edu/"],
			     ["Maharaja Sayajirao University of Baroda", "MSU", "http://www.msubaroda.ac.in/"],
			     ["Leibniz Institute for Baltic Sea Research", "IOW", "http://www.io-warnemuende.de/"],
			     ["Centro Nacional de Investigaciones Oncológicas", "CNIO", "http://www.cnio.es/"],
			     ["University of Massachusetts Amherst", "UMass", "http://www.umass.edu/"],
			     ["Fukuyama University", "NULL", "http://www.fukuyama-u.ac.jp/"],
			     ["University of Western Ontario", "Western", "http://www.uwo.ca/"],
			     ["SoftGenetics", "NULL", "http://www.softgenetics.com/"],
			     ["Consejo Nacional de Investigaciones Científicas y Técnicas", "CONICET", "http://www.conicet.gov.ar/"],
			     ["Food and Environment Research Agency", "FERA", "http://www.fera.defra.gov.uk/"],
			     ["Biotechnology Research Institute of the National Research Council", "NRC-BRI", "http://www.irb-bri.cnrc-nrc.gc.ca/"],
			     ["West Virginia University", "WVU", "http://www.wvu.edu/"],
			     ["Oak Ridge National Laboratory", "ORNL", "http://www.ornl.gov/"],
			     ["Uppsala University", "UU", "http://www.uu.se/"],
			     ["University of Delhi", "DU", "http://www.du.ac.in/"],
			     ["University of Costa Rica", "UCR", "http://www.ucr.ac.cr/"],
			     ["Hiroshima University", "HU", "http://www.hiroshima-u.ac.jp/"],
			     ["GenDoc.Info UG", "NULL", "http://gendoc.info/"],
			     ["Unilever", "NULL", "http://www.unilever.com/"],
			     ["Microsynth", "NULL", "http://www.microsynth.ch/"],
			     ["EnGenCore", "NULL", "http://www.engencore.com/"],
			     ["United States Army", "NULL", "http://www.army.mil/"],
			     ["University of Warwick", "Warwick", "http://www.warwick.ac.uk/"],
			     ["Emory University", "Emory", "http://www.emory.edu/"],
			     ["University of Alberta", "U of A", "http://www.ualberta.ca/"],
			     ["Oswaldo Cruz Foundation", "Fiocruz", "http://www.fiocruz.br/"],
			     ["Norwegian Institute for Water Research", "NIVA", "http://www.niva.no/"],
			     ["Celestial Labs Ltd.", "CLL", "http://www.celestiallabs.com/"],
			     ["Danisco", "NULL", "http://www.danisco.com/"],
			     ["University of Hong Kong", "HKU", "http://www.hku.hk/"],
			     ["Aarhus University", "AU", "http://www.au.dk/"],
			     ["The Defence Science and Technology Laboratory", "DSTL", "http://www.dstl.gov.uk"],
			     ["Graz University of Technology", "TU Graz", "http://www.tugraz.at/"],
			     ["Yale University", "Yale", "http://www.yale.edu/"],
			     ["University of Hyderabad", "UOH", "http://www.uohyd.ac.in/"],
			     ["Nijmegen Centre for Molecular Life Sciences", "NCMLS", "http://www.ncmls.nl/"],
			     ["Food and Drug Administration", "FDA", "http://www.fda.gov/"],
			     ["Baygen", "Baygen", "http://baygen.hu/"],
			     ["Western Oregon University", "WOU", "http://www.wou.edu/"],
			     ["Centre for Marine Bioinnovation, University of New South Wales", "CMB_UNSW_AU", "http://www.unsw.edu.au"],
			     ["École centrale de Lyon", "EC-Lyon", "http://www.ec-lyon.fr/"],
			     ["Ohio State University", "OSU", "http://www.osu.edu/"],
			     ["Monash University", "NULL", "http://www.monash.edu.au/"],
			     ["University of Connecticut", "UConn", "http://www.uconn.edu/"],
			     ["University of New South Wales", "UNSW", "http://www.unsw.edu.au/"],
			     ["Center for Food Safety and Applied Nutrition", "CFSAN", "http://www.fda.gov/Food/default.htm"],
			     ["University of California, Irvine", "UCI", "http://www.uci.edu/"],
			     ["Universidad de Panama", "NULL", "http://www.up.ac.pa/"],
			     ["University at Buffalo", "UB", "http://www.buffalo.edu/"],
			     ["Pontifical Xavierian University (Pontificia Universidad Javeriana)", "NULL", "http://www.javeriana.edu.co/"],
			     ["Bermuda Institute of Ocean Sciences", "BIOS", "http://www.bios.edu/"],
			     ["454 Life Sciences", "454", "http://www.454.com/"],
			     ["Ruhr-Universität Bochum", "RUB", "http://www.ruhr-uni-bochum.de/"],
			     ["Université Claude Bernard Lyon 1", "UCBL1", "http://www.univ-lyon1.fr/"],
			     ["Centro Superior de Investigación en Salud Pública", "CSISP", "http://www.csisp.gva.es/"],
			     ["Centro Nacional de Biotecnología", "CNB", "http://www.cnb.csic.es/"],
			     ["Freie Universität Berlin", "FU", "http://www.fu-berlin.de/"],
			     ["Centre for Cellular and Molecular Biology", "CCMB", "http://ccmb.res.in/"],
			     ["University of North Bengal", "NBU", "http://www.nbu.ac.in/"],
			     ["International Institute of Information Technology, Hyderabad", "IIIT-H", "http://iiit.ac.in/"],
			     ["Universidade de São Paulo", "USP", "http://www.usp.br/"],
			     ["Radboud University Nijmegen", "RU", "http://www.ru.nl/"],
			     ["University of East Anglia", "UEA", "http://www.uea.ac.uk/"],
			     ["Vrije Universiteit", "VU", "http://www.vu.nl/"],
			     ["Norwegian University of Science and Technology", "NTNU", "http://www.ntnu.no/"],
			     ["Anand Agricultural University", "AAU", "http://www.aau.in/"],
			     ["BioGrammatics, Inc.", "NULL", "http://www.biogrammatics.com/"],
			     ["University of the West of England", "UWE", "http://uwe.ac.uk/"],
			     ["Utrecht University", "UU", "http://www.uu.nl/"],
			     ["Laboratório Nacional de Computação Científica", "LNCC", "http://www.lncc.br/"],
			     ["BIOMIN Research Center", "BIOMIN", "http://www.biomin.net"],
			     ["King Abdullah University of Science and Technology", "KAUST", "http://www.kaust.edu.sa/"],
			     ["University of Cincinnati", "UC", "http://www.uc.edu/"],
			     ["University of Michigan", "UM", "http://www.umich.edu/"],
			     ["Ontario Institute for Cancer Research", "OICR", "http://www.oicr.on.ca/"],
			     ["Technical University of Denmark (Danmarks Tekniske Universitet)", "DTU", "http://www.dtu.dk/"],
			     ["Katholieke Universiteit Leuven", "KU Leuven", "http://www.kuleuven.be/"],
			     ["Instituto de Tecnologia Química e Biológica", "ITQB", "http://www.itqb.unl.pt/"],
			     ["West Virginia State University", "WVSU", "http://wvstateu.edu/"],
			     ["Academia Sinica", "NULL", "http://www.sinica.edu.tw/"],
			     ["Max Planck Institute for Biochemistry", "MPI-B", "http://www.biochem.mpg.de/"],
			     ["Campden BRI", "NULL", "http://www.campden.co.uk/"],
			     ["Pasteuria Bioscience, Inc.", "NULL", "http://www.pasteuriabio.com/"],
			     ["Viroclinics Biosciences", "NULL", "http://www.viroclinics.com/"],
			     ["Weill Cornell Medical College", "NULL", "http://www.med.cornell.edu/"],
			     ["Case Western Reserve University", "Case", "http://www.case.edu/"],
			     ["National Tsing Hua University", "NTHU", "http://www.nthu.edu.tw/"],
			     ["Schepens Eye Research Institute", "SERI", "http://www.schepens.harvard.edu/"],
			     ["Yonsei University", "Yonsei", "http://www.yonsei.ac.kr/"],
			     ["Commissariat à l Energie Atomique", "CEA", "http://www.cea.fr/"],
			     ["Institut Pasteur", "NULL", "http://www.pasteur.fr/"],
			     ["University of Otago", "NULL", "http://www.otago.ac.nz/"],
			     ["Institute of Microbiology AS CR", "NULL", "http://www.biomed.cas.cz/mbu/lbwrf/"],
			     ["Utah State University", "USU", "http://www.usu.edu/"],
			     ["University of Massachusetts Boston", "UMass Boston", "http://www.umb.edu/"],
			     ["Université de Montréal", "UdeM", "http://www.umontreal.ca/"],
			     ["Universidad de Guadalajara", "UDG", "http://www.udg.mx/"],
			     ["Ghent University (Universiteit Gent)", "UGent", "http://www.ugent.be/"],
			     ["University of Mississippi Medical Center", "UMMC", "http://www.umc.edu/"],
			     ["Miami University", "MU", "http://www.miamioh.edu/"],
			     ["National University of Ireland, Maynooth", "NUIM", "http://biology.nuim.ie/"],
			     ["University of Pretoria", "U.  Pretoria", "http://web.up.ac.za/"],
			     ["University of Lausanne", "UNIL", "http://www.unil.ch/"],
			     ["USDA Agricultural Research Service", "USDA-ARS", "http://www.ars.usda.gov/"],
			     ["Technical University of Denmark", "DTU", "http://www.dtu.dk/English.aspx"],
			     ["Instituto Valenciano de Investigaciones Agrarias ", "IVIA", "http://www.ivia.es/index_eng.php"],
			     ["Loyola University", "Loyola", "http://www.luc.edu/"],
			     ["University of Groningen", "RUG", "http://www.rug.nl/"],
			     ["Colombian Center for Genomics and Bioinformatics of Extreme Environments", "GeBiX", "http://www.gebix.org.co/"],
			     ["Shanghai Biochip Co., Ltd", "SBC", "http://www.shbiochip.com/"],
			     ["NRC Biotechnology Research Institute", "NRC-BRI", "http://www.nrc-cnrc.gc.ca/eng/ibp/bri.html"],
			     ["Institute of Food Research", "IFR", "http://www.ifr.ac.uk/"],
			     ["Luiz de Queiroz College of Agriculture", "ESALQ", "http://www.esalq.usp.br/"],
			     ["University of South Carolina, Columbia", "NULL", "http://www.sc.edu/"],
			     ["German Collection of Microorganisms and Cell Cultures", "DSMZ", "http://www.dsmz.de/"],
			     ["Embrapa Agrobiologia", "NULL", "http://www.cnpab.embrapa.br/"],
			     ["Royal Life Sciences Pvt Ltd", "NULL", "http://www.royalgroupinfo.com/"],
			     ["Estación Experimental del Zaidín", "EEZ-CSIC", "http://www.eez.csic.es/"],
			     ["Centro Regional de Estudios Genómicos", "CREG", "http://www.creg.org.ar/"],
			     ["Molecular Biology Center Severo Ochoa (Centro de Biología Molecular Severo Ochoa)", "CBMSO", "http://www.cbm.csic.es/"],
			     ["Hubbard Center for Genome Studies", "HCGS", "http://hcgs.unh.edu"],
			     ["University College London", "UCL", "http://www.ucl.ac.uk/"],
			     ["James Cook University", "JCU", "http://www.jcu.edu.au/"],
			     ["Tel Aviv University", "TAU", "http://www.tau.ac.il/"],
			     ["University of Freiburg", "NULL", "http://www.uni-freiburg.de/"],
			     ["National Research Council Canada", "NRC", "http://www.nrc-cnrc.gc.ca/"],
			     ["Saier Lab", "NULL", "http://biology.ucsd.edu/faculty/saier.html"],
			     ["Pierre and Marie Curie University", "UPMC", "http://www.upmc.fr/"],
			     ["Centro de Estudios Avanzados de Blanes", "CEAB", "http://www.ceab.csic.es/"],
			     ["University of Rennes 1", "NULL", "http://www.univ-rennes1.fr/"],
			     ["Chalmers University of Technology", "Chalmers", "http://www.chalmers.se/"],
			     ["Istanbul Technical University", "ITU", "http://www.itu.edu.tr/"],
			     ["Samuel Roberts Noble Foundation", "NULL", "http://www.noble.org/"],
			     ["University of Manitoba", "NULL", "http://umanitoba.ca/"],
			     ["Institute of Soil Science, Chinese Academy of Sciences", "ISSCAS", "http://www.issas.ac.cn/"],
			     ["Ganeden Biotech", "NULL", "http://www.ganedenbiotech.com"],
			     ["Universidade Federal de São Paulo", "UNIFESP", "http://www.unifesp.br/"],
			     ["Institut de recherche pour le développement", "IRD", "http://www.ird.fr/"],
			     ["École normale supérieure de Lyon", "ENS Lyon", "http://www.ens-lyon.fr/"],
			     ["Great Lakes Bioenergy Research Center", "GLBRC", "http://www.greatlakesbioenergy.org/"],
			     ["Northeastern University", "NU", "http://www.northeastern.edu/"],
			     ["University of the Mediterranean Aix-Marseille II", "NULL", "http://www.univmed.fr/"],
			     ["Centro de Investigação em Biodiversidade e Recursos Genéticos", "CIBIO", "http://cibio.up.pt/"],
			     ["University of Kentucky", "UK", "http://www.uky.edu/"],
			     ["Nagahama Institute of Bio-Science and Technology", "NULL", "http://www.nagahama-i-bio.ac.jp/"],
			     ["Bio-Logistics", "NULL", "http://www.biologistics.co.in/"],
			     ["Ontario Agency for Health Protection and Promotion", "OAHPP", "http://www.oahpp.ca/"],
			     ["Harvey Mudd College", "HMC", "http://www.hmc.edu/"],
			     ["Scripps Florida", "NULL", "http://www.scripps.edu/florida/"],
			     ["Charité - Universitätsmedizin Berlin", "NULL", "http://www.charite.de/"],
			     ["Universidade Federal do Pampa", "UNIPAMPA", "http://www.unipampa.edu.br/"],
			     ["Nanjing University of Technology", "NJUT", "http://www.njut.edu.cn/"],
			     ["University of Nebraska at Kearney", "UNK", "http://unk.edu/"],
			     ["Yokohama City University", "YCU", "http://www.yokohama-cu.ac.jp/"],
			     ["Fermentas UAB (Lithuania)", "NULL", "http://www.fermentas.com/"],
			     ["Philipps University of Marburg", "NULL", "http://www.uni-marburg.de/"],
			     ["British Antarctic Survey", "BAS", "http://www.antarctica.ac.uk/"],
			     ["Ocean University of China", "OUC", "http://www.ouc.edu.cn/"],
			     ["California State University, Chico", "Cal State, Chico", "http://www.csuchico.edu/"],
			     ["Sant Gadge Baba Amravati University", "SGB Amravati University", "http://www.sgbau.ac.in/"],
			     ["Genomatica, Inc.", "NULL", "http://www.genomatica.com/"],
			     ["University of Oregon", "UO", "http://www.uoregon.edu/"],
			     ["University of Stavanger", "UiS", "http://www.uis.no/"],
			     ["University of New Brunswick", "UNB", "http://www.unb.ca/"],
			     ["National University of the Northeast", "UNNE", "http://www.unne.edu.ar/"],
			     ["CorpoGen", "NULL", "http://www.corpogen.org/"],
			     ["University of Technology, Sydney", "UTS", "http://www.uts.edu.au/"],
			     ["Nicolaus Copernicus University, Collegium Medicum in Bydgoszczy", "NULL", "http://www.cm.umk.pl/"],
			     ["Archer Daniels Midland Company", "ADM", "http://www.adm.com/"],
			     ["University of Natural Resources and Applied Life Sciences", "BOKU", "http://www.boku.ac.at/"],
			     ["Smith College", "Smith", "http://www.smith.edu/"],
			     ["Robert Koch Institut", "RKI", "http://www.rki.de/"],
			     ["University of Houston–Downtown", "UHD", "http://www.uhd.edu/"],
			     ["Albert Einstein College of Medicine, Yeshiva University", "Einstein", "http://www.einstein.yu.edu/"],
			     ["University of Vigo", "NULL", "http://www.uvigo.es/"],
			     ["University of Tokyo", "T&#333;dai", "http://www.u-tokyo.ac.jp/"],
			     ["Academy of Sciences of the Czech Republic", "ASCR", "http://www.avcr.cz/"],
			     ["Sandia National Laboratories", "Sandia", "http://www.sandia.gov/"],
			     ["Novartis", "NULL", "http://www.novartis.com/"],
			     ["Technical University of Munich", "TUM", "http://www.tum.de"],
			     ["Veterinary Laboratories Agency", "VLA", "http://www.defra.gov.uk/vla/"],
			     ["Rhodes University", "RU", "http://www.ru.ac.za/"],
			     ["Griffith University", "NULL", "http://www.griffith.edu.au/"],
			     ["Tohoku University", "Tohokudai", "http://www.tohoku.ac.jp/"],
			     ["University of Texas at Arlington", "UTA", "http://www.uta.edu/"],
			     ["University of Waterloo", "UW", "http://uwaterloo.ca/"],
			     ["Nottingham Trent University", "NTU", "http://www.ntu.ac.uk/"],
			     ["BHSAI, USAMRMC", "BHSAI", "http://www.bhsai.org/"],
			     ["Indian Institute of Science", "IISc", "http://www.iisc.ernet.in/"],
			     ["Public Health Agency of Canada", "PHAC", "http://www.phac-aspc.gc.ca/"],
			     ["Rutgers University", "Rutgers", "http://www.rutgers.edu/"],
			     ["University of Tartu", "UT", "http://www.ut.ee/"],
			     ["Agency for Science, Technology and Research", "A*STAR", "http://www.a-star.edu.sg/"],
			     ["Chung-Ang University", "CAU", "http://www.cau.ac.kr/"],
			     ["Universidade Estadual de Campinas", "Unicamp", "http://www.unicamp.br/"],
			     ["Weizmann Institute of Science", "NULL", "http://www.weizmann.ac.il/"],
			     ["GITAM University", "GITAM", "http://www.gitam.edu/"],
			     ["Friedrich Loeffler Institute", "FLI", "http://www.fli.bund.de/"],
			     ["China Agricultural University", "CAU", "http://www.cau.edu.cn/"],
			     ["University of Canterbury", "UC", "http://www.canterbury.ac.nz/"],
			     ["Friedrich-Schiller-Universität Jena", "FSU", "http://www.uni-jena.de/"],
			     ["European Molecular Biology Laboratory, Heidelberg", "EMBL, Heidelberg", "http://www.embl.de/"],
			     ["National Polytechnic Institute of Lorraine, University of Nancy", "INPL-Nancy", "http://www.inpl-nancy.fr/"],
			     ["Texas A&M Health Science Center", "NULL", "http://tamhsc.edu/"],
			     ["Roche", "NULL", "http://www.roche.com/"],
			     ["Station biologique de Roscoff", "SBR", "http://www.sb-roscoff.fr/"],
			     ["Shanghai Jiao Tong University", "SJTU", "http://www.sjtu.edu.cn/"],
			     ["Centro de Investigaciones Biológicas", "CIB", "http://www.cib.csic.es/"],
			     ["Korea Advanced Institute of Science and Technology", "KAIST", "http://www.kaist.ac.kr/"],
			     ["Pukyong National University", "PKNU", "http://www.pknu.ac.kr/"],
			     ["King", "King", "http://www.kcl.ac.uk/"],
			     ["Catholic University of the North (Universidad Católica del Norte)", "UCN", "http://www.ucn.cl/"],
			     ["CLC bio", "NULL", "http://clcbio.com/"],
			     ["Winogradsky Institute of Microbiology  of the Russian Academy of Sciences", "INMI RAS", "http://www.inmi.ru/"],
			     ["Université Montpellier 2", "um2", "http://www.univ-montp2.fr/"],
			     ["Crop Research Institute", "VURV", "http://www.vurv.cz/"],
			     ["University of Milan", "NULL", "http://www.unimi.it/"],
			     ["Instituto de Investigaciones Marinas", "IIM", "http://www.iim.csic.es/"],
			     ["University of Western Brittany (Université de Bretagne Occidentale)", "UBO", "http://www.univ-brest.fr/"],
			     ["University of Pennsylvania", "Penn", "http://www.upenn.edu/"],
			     ["Université de Caen Basse-Normandie", "NULL", "http://www.unicaen.fr/"],
			     ["New Mexico Institute of Mining and Technology", "NMT", "http://www.nmt.edu/"],
			     ["L'Université de Pau et des Pays de l'Adour", "UPPA", "http://www.univ-pau.fr/"],
			     ["Tokyo University of Agriculture", "Nodai", "http://www.nodai.ac.jp/"],
			     ["New Mexico State University", "NMSU", "http://www.nmsu.edu/"],
			     ["Rothamsted Research", "Rothamsted", "http://www.rothamsted.ac.uk/"],
			     ["Plant & Food Research", "NULL", "http://www.plantandfood.co.nz/"],
			     ["Ohio University", "OU", "http://www.ohio.edu/"],
			     ["University of Kansas", "KU", "http://www.ku.edu/"],
			     ["Stowers Institute for Medical Research", "NULL", "http://www.stowers-institute.org/"],
			     ["Universidad Autónoma de Madrid", "UAM", "http://www.uam.es/"],
			     ["Teagasc – the Agriculture and Food Development Authority", "Teagasc", "http://www.teagasc.ie/"],
			     ["Imperial College London", "Imperial", "http://www.imperial.ac.uk/"],
			     ["Korean Institute of Ocean Science and Technology", "KIOST", "http://www.kiost.ac/"],
			     ["National Ecological Observatory Network", "NEON", "http://neoninc.org/"],
			     ["Competence Center of Food and Fermentation Technology", "CCFFT, TFTAK", "http://www.ccfft.eu/"],
			     ["The Genome Analysis Centre", "TGAC", "http://www.tgac.bbsrc.ac.uk/"],
			     ["Centre for Environment, Fisheries & Aquaculture Science", "Cefas", "http://www.cefas.co.uk/"],
			     ["Anna University", "NULL", "http://www.annauniv.edu/"],
			     ["University of Konstanz", "NULL", "http://www.uni-konstanz.de/"],
			     ["Japan Agency for Marine-Earth Science and Technology", "JAMSTEC", "http://www.jamstec.go.jp/"],
			     ["University of Science and Technology", "UST", "http://www.ust.ac.kr/"],
			     ["University of Dayton Research Institute", "UDRI", "http://www.udri.udayton.edu/"],
			     ["Universidad de Pamplona", "NULL", "http://www.unipamplona.edu.co/"],
			     ["Shri Shivaji Science College, Amravati", "NULL", "http://www.shivajiscamt.org/"],
			     ["Chinese Academy of Sciences", "CAS", "http://www.cas.cn/"],
			     ["University of the Azores (Universidade dos Açores)", "UAC", "http://www.uac.pt/"],
			     ["University of Ljubljana", "UL", "http://www.uni-lj.si/"],
			     ["National Institute of Advanced Industrial Science and Technology", "AIST", "http://www.aist.go.jp/"],
			     ["Auburn University", "AU", "http://www.auburn.edu/"],
			     ["John Innes Centre", "JIC", "http://www.jic.ac.uk/"],
			     ["Instituto de Zootecnia", "IZ", "http://www.iz.sp.gov.br/"],
			     ["Institute for Systems Biology", "ISB", "http://www.systemsbiology.org/"],
			     ["Tianjin University", "TU", "http://www.tju.edu.cn/"],
			     ["Biotechnology and Biological Sciences Research Council", "BBSRC", "http://www.bbsrc.ac.uk/"],
			     ["University of Montana", "UM", "http://www.umt.edu/"],
			     ["University of Veterinary Medicine Vienna", "Vetmeduni Vienna", "http://www.vu-wien.ac.at/"],
			     ["Universidade Paranaense", "UNIPAR", "http://www.unipar.br/"],
			     ["Johns Hopkins University ", "JHU", "http://www.jhu.edu/"],
			     ["University of Zagreb", "NULL", "http://www.unizg.hr/"],
			     ["University of Padua (Università degli Studi di Padova)", "UNIPD", "http://www.unipd.it/"],
			     ["Rush University", "RushU", "http://www.rushu.rush.edu/"],
			     ["University of Kiel (Christian-Albrechts-Universität zu Kiel)", "CAU", "http://www.uni-kiel.de/"],
			     ["University of Strasbourg", "NULL", "http://www.unistra.fr/"],
			     ["INDEAR", "INDEAR", "http://www.indear.com/"],
			     ["Stony Brook University", "SB", "http://www.stonybrook.edu/"],
			     ["University of Geneva", "UNIGE", "http://www.unige.ch/"],
			     ["Qingdao Institute of Bioenergy and Bioprocess Technology, Chinese Academy of Sciences", "QIBEBT", "http://www.qibebt.cas.cn/"],
			     ["Max Planck Institute for Informatics", "MPI-INF", "http://www.mpi-inf.mpg.de/"],
			     ["Kyoto University", "NULL", "http://www.kyoto-u.ac.jp/"],
			     ["University of Sydney", "Sydney", "http://sydney.edu.au/"],
			     ["Colorado State University", "CSU", "http://www.colostate.edu/"],
			     ["SoilGeNe", "NULL", "http://soilgene.net/"],
			     ["University of Basel", "NULL", "http://www.unibas.ch/"],
			     ["New South Wales Department of Health", "NSW Health", "http://www.nsw.gov.au/"],
			     ["Helmholtz Centre for Infection Research", "HZI", "http://www.helmholtz-hzi.de/"],
			     ["Universidad de los Andes", "Uniandes", "http://www.uniandes.edu.co/"],
			     ["Universidad Nacional de Colombia", "UNAL", "http://www.unal.edu.co/"],
			     ["Occidental College", "Oxy", "http://www.oxy.edu/"],
			     ["Indian Agricultural Research Institute", "IARI", "http://www.iari.res.in/"],
			     ["Universidad Tecnológica de Pereira", "UTP", "http://www.utp.edu.co/"],
			     ["University of Graz", "UNIGRAZ", "http://www.uni-graz.at/"],
			     ["Oberlin College", "Oberlin", "http://new.oberlin.edu/"],
			     ["Universidade Federal de Santa Catarina", "UFSC", "http://www.ufsc.br/"],
			     ["bermuda", "NULL", "NULL"],
			     ["Furman University", "NULL", "http://www.furman.edu/"],
			     ["Connecticut College", "Conn", "http://www.conncoll.edu/"],
			     ["Agroscope Liebefeld-Posieux Research Station ALP", "NULL", "NULL"],
			     ["Universidade Católica de Brasília", "UCB", "http://www.ucb.br/"],
			     ["Brazilian Enterprise for Agricultural Research", "EMBRAPA", "http://www.embrapa.br/"],
			     ["Universidade Federal do Rio de Janeiro", "UFRJ", "http://www.ufrj.br/"],
			     ["Federal University of Minas Gerais (Universidade Federal de Minas Gerais)", "UFMG", "http://www.ufmg.br/"],
			     ["São Paulo State University (Universidade Estadual Paulista)", "UNESP", "http://www.unesp.br/"],
			     ["Laboratorio de Investigaciones Microbiológicas de Lagunas Andinas", "NULL", "NULL"],
			     ["Universidade Federal do Rio Grande do Norte", "UFRN", "http://www.ufrn.br/"],
			     ["Universidade Federal do Ceará", "UFC", "http://www.ufc.br/"],
			     ["National University of Singapore", "NUS", "http://nus.edu.sg/"],
			     ["Beijing Institute of Genomics, Chinese Academy of Sciences", "BIG", "http://www.big.ac.cn/"],
			     ["National Cancer Institute at Frederick", "NCI-Frederick", "http://www.ncifcrf.gov/"],
			     ["University of Warmia and Mazury in Olsztyn", "UWM", "http://www.uwm.edu.pl/"],
			     ["Universidade do Estado do Rio de Janeiro", "UERJ", "http://www.uerj.br/"],
			     ["Wuhan University", "WHU", "http://www.whu.edu.cn/"],
			     ["Columbia University", "NULL", "http://www.columbia.edu/"],
			     ["University of Exeter", "NULL", "http://www.exeter.ac.uk/"],
			     ["Southeast University", "SEU", "http://www.seu.edu.cn/"],
			     ["Universidad de La Laguna", "ULL", "http://www.ull.es/"],
			     ["Netherlands Institute of Ecology", "NIOO-KNAW", "http://www.nioo.knaw.nl/"],
			     ["Chonnam National University", "NULL", "http://web.chonnam.ac.kr/"],
			     ["University of Tasmania", "UTAS", "http://www.utas.edu.au/"],
			     ["Kanpur University", "NULL", "http://www.kanpuruniversity.org/"],
			     ["University of Southern Maine", "USM", "http://usm.maine.edu/"],
			     ["University Medical Center Utrecht", "UMC Utrecht", "http://www.umcutrecht.nl/"],
			     ["Naval Research Laboratory", "NRL", "http://www.nrl.navy.mil/"],
			     ["Centro de Investigación en Alimentación y Desarrollo A.C.", "CIAD", "http://www.ciad.mx/"],
			     ["Xplorigen Technologies", "XTPL", "http://ai.xplorigen.com/XTPL/"],
			     ["Universidade da Coruña", "NULL", "http://www.udc.es/"],
			     ["Universidad Complutense de Madrid", "UCM", "http://www.ucm.es/"],
			     ["Gujarat Genomics initiative", "GGI", "http://btm.gujarat.gov.in/"],
			     ["University of Texas Southwestern Medical Center", "UT Southwestern", "http://www.utsouthwestern.edu/"],
			     ["BaseClear", "BC", "http://www.baseclear.com/"],
			     ["East China University of Science and Technology", "ECUST", "http://www.ecust.edu.cn/"],
			     ["Beijing Genomics Institute", "BGI", "http://www.genomics.cn/"],
			     ["Helmholtz Zentrum München", "NULL", "http://www.helmholtz-muenchen.de/"],
			     ["BioInforMatikz", "NULL", "http://sites.google.com/site/bioinformatikz/"],
			     ["Aalborg University (Aalborg Universitet)", "AAU", "http://www.aau.dk/"],
			     ["Max Planck Institute for Evolutionary Biology", "NULL", "http://www.evolbio.mpg.de/"],
			     ["National Research Centre on Plant Biotechnology", "NRCPB", "http://www.nrcpb.org/"],
			     ["University of Rochester Medical Center", "URMC", "http://www.urmc.rochester.edu/"],
			     ["Memphis VA Medical Center", "Memphis VAMC", "http://www.memphis.va.gov/"],
			     ["Meiji University", "NULL", "http://www.meiji.ac.jp/"],
			     ["University of Lethbridge", "U of L", "http://www.uleth.ca/"],
			     ["Biodiversity Institute of Ontario", "BIO", "http://www.biodiversity.uoguelph.ca/"],
			     ["Institute of Microbial Technology", "IMTECH", "http://www.imtech.res.in/"],
			     ["Cairo University", "CU", "http://www.cu.edu.eg/"],
			     ["Goethe University Frankfurt", "Frankfurt University", "http://www.uni-frankfurt.de/"],
			     ["Nationwide Children's Hospital", "NULL", "http://www.nationwidechildrens.org/"],
			     ["University of Minnesota College of Veterinary Medicine", "NULL", "http://www.cvm.umn.edu/"],
			     ["University of Notre Dame", "ND", "http://www.nd.edu/"],
			     ["University of Michigan Medical School", "UMMS", "http://www.med.umich.edu/"],
			     ["International Livestock Research Institute", "ILRI", "http://www.ilri.org/"],
			     ["Friedrich Loeffler Institute, Institute of Farm Animal Genetics", "FLI-ING", "http://www.fli.bund.de/de/startseite/forschung-institute/institut-fuer-nutztiergenetik.html"],
			     ["National Environmental Engineering Research Institute", "NEERI", "http://www.neeri.res.in/"],
			     ["Kaiserslautern University of Technology", "TU Kaiserslautern", "http://www.tu-kaiserslautern.de/"],
			     ["Kyung Hee University", "KHU", "http://www.kyunghee.edu/"],
			     ["Sichuan University", "SCU", "http://scu.edu.cn/"],
			     ["University of Minho", "UM", "http://www.uminho.pt/"],
			     ["Jiangnan University", "NULL", "http://www.sytu.edu.cn/"],
			     ["Peking University", "PKU", "http://www.pku.edu.cn/"],
			     ["University of Liège", "ULg", "http://www.ulg.ac.be/"],
			     ["Dresden University of Technology", "TU Dresden", "http://tu-dresden.de/"],
			     ["Martin Luther University of Halle-Wittenberg", "MLU", "http://www.uni-halle.de/"],
			     ["Leibniz Institute for Natural Product Research and Infection Biology, Hans-Knöll-Institute (HKI)", "HKI", "http://www.hki-jena.de/"],
			     ["Limnological Institute, Siberian Branch of the Russian Academy of Sciences", "NULL", "http://lin.irk.ru/"],
			     ["Huazhong Agricultural University", "HZAU", "http://www.hzau.edu.cn/"],
			     ["Institute of Biophysics, Chinese Academy of Sciences", "IBP", "ttp://www.ibp.cas.cn"],
			     ["Institute for Agricultural and Fisheries Research", "ILVO", "http://www.ilvo.vlaanderen.be/"],
			     ["C5-6 Technologies Inc.", "C56", "http://www.c56technologies.com/"],
			     ["Real Time Genomics", "RTG", "http://www.realtimegenomics.com/"],
			     ["Concordia University", "Concordia", "http://www.concordia.ca/"],
			     ["Ibaraki University", "NULL", "http://www.ibaraki.ac.jp/"],
			     ["University of Gothenburg", "NULL", "http://www.gu.se/"],
			     ["VTT Technical Research Centre of Finland", "VTT", "http://www.vtt.fi/"],
			     ["SRI International", "SRI", "http://www.sri.com/"],
			     ["Desert Research Institute", "DRI", "http://www.dri.edu/"],
			     ["University of Zurich", "UZH", "http://www.uzh.ch/"],
			     ["Korea University", "KU", "http://www.korea.ac.kr/"],
			     ["Università Cattolica del Sacro Cuore", "UCSC", "http://www.unicattolica.it/"],
			     ["University of North Texas", "UNT", "http://www.unt.edu/"],
			     ["Universiti Sains Malaysia", "USM", "http://www.usm.my/"],
			     ["University of Surrey", "NULL", "http://www.surrey.ac.uk/"],
			     ["New York University School of Medicine", "NYU School of Medicine", "http://www.med.nyu.edu/"],
			     ["Institute of Oceanology, Chinese Academy of Sciences", "IOCAS", "http://www.qdio.cas.cn/"],
			     ["Third Military Medical University", "TMMU", "http://www.tmmu.com.cn/"],
			     ["Chinese Center for Disease Control and Prevention", "China CDC", "http://www.chinacdc.net/"],
			     ["Pusan National University", "PNU", "http://www.pusan.ac.kr/"],
			     ["Universidad Austral de Chile", "UACh", "http://www.uach.cl/"],
			     ["University of Nottingham", "Nottingham", "http://www.nottingham.ac.uk/"],
			     ["Daegu University", "NULL", "http://www.daegu.ac.kr/"],
			     ["University of Turabo", "UT", "http://www.ut.pr/"],
			     ["Danone", "Danone", "http://www.danone.com/"],
			     ["Marche Polytechnic University", "UNIVPM", "http://www.univpm.it/"],
			     ["Lund University", "LU", "http://www.lu.se/"],
			     ["Thomas Jefferson University", "TJU", "http://www.jefferson.edu/"],
			     ["Scylla Bioinformatics", "Scylla", "http://www.scylla.com.br/"],
			     ["National Institute of Genetics", "NIG", "http://www.nig.ac.jp/"],
			     ["Johns Hopkins Medical Institutions", "JHMI", "http://www.hopkinsmedicine.org/"],
			     ["Royal Holloway, University of London", "RHUL", "http://www.rhul.ac.uk/"],
			     ["Pfizer Inc.", "Pfizer", "http://www.pfizer.com/"],
			     ["Wetsus", "NULL", "http://www.wetsus.nl/"],
			     ["Instituto de Catálisis y Petroleoquímica", "ICP", "http://www.icp.csic.es/"],
			     ["Centro de Estudios Científicos", "CECS", "http://www.cecs.cl/"],
			     ["University of Rochester", "UR", "http://www.rochester.edu/"],
			     ["Florida International University", "FIU", "http://www.fiu.edu/"],
			     ["University of Cape Town", "UCT", "http://www.uct.ac.za/"],
			     ["Jagiellonian University", "JU", "http://www.uj.edu.pl/"],
			     ["Donald Danforth Plant Science Center", "NULL", "http://www.danforthcenter.org/"],
			     ["SINTEF", "SINTEF", "http://www.sintef.no/"],
			     ["University of Pécs", "NULL", "http://www.ttk.pte.hu/"],
			     ["University of Virginia", "UVA", "http://www.virginia.edu/"],
			     ["National Oceanic and Atmospheric Administration", "NOAA", "http://www.noaa.gov/"],
			     ["Universidad de Oviedo", "NULL", "http://www.uniovi.es/"],
			     ["Pontificia Universidad Católica de Chile", "PUC", "http://www.uc.cl/"],
			     ["Agricultural Research Organization", "ARO", "http://www.agri.gov.il/"],
			     ["Tata Consultancy Services", "TCS", "http://www.tcs.com/"],
			     ["French Agency for Food, Environmental and Occupational Health and Safety", "ANSES", "http://www.anses.fr/"],
			     ["Forsyth Institute", "Forsyth", "http://forsyth.org/"],
			     ["Statens Serum Institute", "SSI", "http://www.ssi.dk/"],
			     ["South Carolina Department of Health and Environmental Control", "DHEC", "http://www.dhec.sc.gov/"],
			     ["NRC Institute for Biological Sciences", "NRC-IBS", "http://www.nrc-cnrc.gc.ca/eng/ibp/ibs.html"],
			     ["University of Silesia", "US", "http://www.us.edu.pl/"],
			     ["Johann Heinrich von Thünen-Institut", "vTI", "http://www.vti.bund.de/"],
			     ["Institute of Biochemistry and Biophysics, Polish Academy of Sciences", "IBB", "http://www.ibb.waw.pl/"],
			     ["Kazusa DNA Research Institute", "KDRI", "http://www.kazusa.or.jp/"],
			     ["University of the Balearic Islands (Universidad de las Islas Baleares)", "UIB", "http://www.uib.es/"],
			     ["Gujarat State Biotechnology Mission", "GSBTM", "http://btm.gujarat.gov.in/"],
			     ["University of Veterinary Medicine Hanover", "TiHo", "http://www.tiho-hannover.de/"],
			     ["BC Centre for Disease Control", "BCCDC", "http://www.bccdc.ca/"],
			     ["Zhejiang University", "ZJU", "http://www.zju.edu.cn/"],
			     ["UCL Eastman Dental Institute", "UCL EDI", "http://www.eastman.ucl.ac.uk/"],
			     ["National Chemical Laboratory", "NCL", "http://www.ncl-india.org/"],
			     ["hill", "NULL", "NULL"],
			     ["North-Eastern Hill University", "NEHU", "http://www.nehu.ac.in/"],
			     ["National Bureau of Agriculturally Important Microorganisms ", "NBAIM", "http://nbaim.org/"],
			     ["Vellore Institute of Technology", "VIT", "http://www.vit.ac.in/"],
			     ["Hemchandracharya North Gujarat University", "NGU", "http://www.ngu.ac.in/"],
			     ["Indian Council of Agricultural Research", "ICAR", "http://www.icar.org.in/"],
			     ["Bethel University", "BU", "http://www.bethel.edu/"],
			     ["Iowa State University", "ISU", "http://www.iastate.edu/"],
			     ["University of Messina", "NULL", "http://www.unime.it/"],
			     ["Universidad de Antofagasta", "NULL", "http://www.uantofagasta.cl/"],
			     ["Texas State University", "Texas State", "http://www.txstate.edu/"],
			     ["University of Genoa", "NULL", "http://www.unige.it/"],
			     ["University of Guelph", "U of G", "http://www.uoguelph.ca/"],
			     ["University of Glasgow", "Glasgow", "http://www.gla.ac.uk/"],
			     ["Pompeu Fabra University", "UPF", "http://www.upf.edu/"],
			     ["University of California, Riverside", "UCR", "http://www.ucr.edu/"],
			     ["Centre for Shellfish Research", "CSR", "http://www.viu.ca/csr/"],
			     ["Central Salt & Marine Chemicals Research Institute", "CSMCRI", "http://www.csmcri.org/"],
			     ["University of Bremen", "NULL", "http://www.uni-bremen.de/"],
			     ["Institute for Biomedical Technologies", "ITB-CNR", "http://www.itb.cnr.it/"],
			     ["Kyoto Sangyo University", "NULL", "http://www.kyoto-su.ac.jp/"],
			     ["Alfred Wegener Institute for Polar and Marine Research", "AWI", "http://www.awi.de/"],
			     ["University of Regensburg", "NULL", "http://www.uni-regensburg.de/"],
			     ["University of Nebraska Medical Center", "UNMC", "http://www.unmc.edu/"],
			     ["Tufts University", "Tufts", "http://www.tufts.edu/"],
			     ["Newcastle University", "Newcastle", "http://www.ncl.ac.uk/"],
			     ["newc", "NULL", "NULL"],
			     ["University of North Carolina at Charlotte", "UNCC", "http://www.uncc.edu/"],
			     ["MenonTech Info Solutions Pvt Ltd.", "MenonTech", "http://menontech.com/"],
			     ["i-Life Academy", "i-life", "http://www.ilifeacademy.org/"],
			     ["Mata Gujri Girls College", "NULL", "NULL"],
			     ["Eminent Biosciences", "NULL", "http://www.eminentbio.com/"],
			     ["University of Puget Sound", "UPS", "http://www.pugetsound.edu/"],
			     ["Missouri University of Science and Technology", "Missouri S&T", "http://www.mst.edu/"],
			     ["CIRAD, Centre de coopération internationale en recherche agronomique pour le développement", "CIRAD", "http://www.cirad.fr/"],
			     ["Brigham Young University", "BYU", "http://www.byu.edu/"],
			     ["University of Durham", "Durham", "http://www.dur.ac.uk/"],
			     ["Bharathidasan University", "BDU", "http://www.bdu.ac.in/"],
			     ["Planta Piloto de Procesos Industriales Microbiologicos", "PROIMI", "http://www.proimi.org.ar/"],
			     ["Wilfrid Laurier University", "Laurier", "http://www.wlu.ca/"],
			     ["East Carolina University", "ECU", "http://www.ecu.edu/"],
			     ["University of Puerto Rico", "UPR", "http://www.upr.edu/"],
			     ["Australian Institute of Marine Science", "AIMS", "http://www.aims.gov.au/"],
			     ["Tongji University", "Tongji", "http://www.tongji.edu.cn/"],
			     ["Norwegian Institute of Public Health", "NULL", "http://www.fhi.no/"],
			     ["University of Western Sydney", "UWS", "http://www.uws.edu.au/"],
			     ["Instituto Nacional dos Recursos Biológicos", "NULL", "NULL"],
			     ["United States Geological Survey", "USGS", "http://www.usgs.gov/"],
			     ["University of Ulm", "NULL", "http://www.uni-ulm.de/"],
			     ["Bitlis Eren University", "NULL", "http://www.bitliseren.edu.tr/"],
			     ["Eötvös Loránd University", "ELTE", "http://www.elte.hu/"],
			     ["Murdoch Childrens Research Institute", "MCRI", "http://www.mcri.edu.au/"],
			     ["University of Mary Washington", "UMW", "http://www.umw.edu/"],
			     ["Barnard College", "Barnard", "http://www.barnard.edu/"],
			     ["Institute for Information Transmission Problems", "IITP", "http://www.iitp.ru/"],
			     ["CEINGE-Biotecnologie Avanzate", "CEINGE", "http://www.ceinge.unina.it/"],
			     ["Pacific Biosciences", "PacBio", "http://www.pacificbiosciences.com/"],
			     ["Earlham College", "Earlham", "http://www.earlham.edu/"],
			     ["M.B. Khalsa College", "MB Khalsa", "http://www.mbkhalsacollege.com/"],
			     ["Cuu Long Delta Rice Research Institute", "CLRRI", "http://www.clrri.org/"],
			     ["AS CR – Biomedical Research Campus in Prague – Krc", "NULL", "http://www.biomed.cas.cz/"],
			     ["DSO National Laboratories", "DSO", "http://www.dso.org.sg/"],
			     ["Clark University", "Clark", "http://www.clarku.edu/"],
			     ["Consejo Superior de Investigaciones Científicas", "CSIC", "http://www.csic.es/"],
			     ["Indian Institute of Information Technology, Allahabad", "IIITA", "http://www.iiita.ac.in/"],
			     ["Contango Strategies Limited", "Contango Strategies", "http://www.contangostrategies.com/"],
			     ["University of Saskatchewan", "U of S", "http://www.usask.ca/"],
			     ["Ifremer", "Ifremer", "http://wwz.ifremer.fr/"],
			     ["Tsinghua University", "THU", "http://www.tsinghua.edu.cn/"],
			     ["University of Maine", "UMaine", "http://www.umaine.edu/"],
			     ["A. C. Camargo Cancer Hospital", "Camargo Hospital", "http://www.accamargo.org.br/"],
			     ["Centre of Marine Sciences", "CCMAR", "http://www.ccmar.ualg.pt/"],
			     ["University of South Bohemia", "USB", "http://www.jcu.cz/"],
			     ["Nanjing Agricultural University", "NAU", "http://www.njau.edu.cn/"],
			     ["NuGEN Technologies, Inc.", "NuGEN", "http://www.nugeninc.com/"],
			     ["Max Planck Institute for Plant Breeding Research", "MPIPZ", "http://www.mpiz-koeln.mpg.de/"],
			     ["KWR Watercycle Research Institute", "KWR", "http://www.kwrwater.nl/"],
			     ["Veer Narmad South Gujarat University", "VNGSU", "http://www.vnsgu.ac.in/"],
			     ["Ecosystem Solutions", "ESI", "http://www.ecosystemsolutions.org/"],
			     ["University of Naples Federico II", "UNINA", "http://www.unina.it/"],
			     ["Penn State Altoona", "NULL", "http://www.altoona.psu.edu/"],
			     ["Michigan Technological University", "Michigan Tech", "http://www.mtu.edu/"],
			     ["Chapman University", "Chapman", "http://www.chapman.edu/"],
			     ["Linnaeus University", "LNU", "http://lnu.se/"],
			     ["University of Macau", "UM", "http://www.umac.mo/"],
			     ["Baruch Marine Field Laboratory", "BMFL", "http://links.baruch.sc.edu/"],
			     ["Fairchild Tropical Botanic Garden", "NULL", "http://www.fairchildgarden.org/"],
			     ["Skidaway Institute of Oceanography", "SkIO", "http://www.skio.usg.edu/"],
			     ["Translational Genomics Research Institute", "TGen", "http://www.tgen.org/"],
			     ["Geschickten Solutions", "NULL", "http://www.geschickten.com/"],
			     ["wars", "NULL", "NULL"],
			     ["University of Warsaw", "UW", "http://www.uw.edu.pl/"],
			     ["Nanyang Technological University", "NTU", "http://www.ntu.edu.sg/"],
			     ["Vanderbilt University", "Vanderbilt", "http://www.vanderbilt.edu/"],
			     ["Applied Genomics Institute", "IGA", "http://www.appliedgenomics.org/"],
			     ["École Polytechnique Fédérale de Lausanne", "EPFL", "http://www.epfl.ch/"],
			     ["paul", "NULL", "NULL"],
			     ["University of Buenos Aires", "UBA", "http://www.uba.ar/"],
			     ["Universidad Nacional de Quilmes", "NULL", "NULL"],
			     ["Warren Wilson College", "WWC", "http://www.warren-wilson.edu/"],
			     ["Universidad Nacional de La Plata", "UNLP", "http://www.unlp.edu.ar/"],
			     ["Tokyo Institute of Technology", "Tokyo Tech", "http://www.titech.ac.jp/"],
			     ["Chungbuk National University", "CBNU", "http://www.chungbuk.ac.kr/"],
			     ["National Institute of Metrology, Standardization and Industrial Quality", "INMETRO", "http://www.inmetro.gov.br/"],
			     ["Federal Institute for Risk Assessment", "BfR", "http://www.bfr.bund.de/"],
			     ["Veterinary Research Institute", "VRI", "http://www.vri.cz/"],
			     ["Louisiana Tech University", "Louisiana Tech", "http://www.latech.edu/"],
			     ["Universidad Michoacana de San Nicolás de Hidalgo", "UMSNH", "http://www.umich.mx/"],
			     ["Institute of Bioinformatics and Applied Biotechnology", "IBAB", "http://www.ibab.ac.in/"],
			     ["New York University", "NYU", "http://www.nyu.edu/"],
			     ["McMaster University", "McMaster", "http://www.mcmaster.ca/"],
			     ["Kongunadu Arts and Science College", "NULL", "http://www.kongunaducollege.ac.in/"],
			     ["Universidad Mayor", "UM", "http://www.umayor.cl/"],
			     ["Agroscope Changins-Wädenswil", "ACW", "http://www.agroscope.admin.ch/"],
			     ["University of Burgundy", "NULL", "NULL"],
			     ["Universidade Federal de Juiz de Fora", "UFJF", "http://www.ufjf.br/"],
			     ["Leibniz Institute of Freshwater Ecology and Inland Fisheries", "IGB", "http://www.igb-berlin.de/"],
			     ["Tamil Nadu Agricultural University", "TNAU", "http://www.tnau.ac.in/"],
			     ["Fred Hutchinson Cancer Research Center", "FHCRC", "http://www.fhcrc.org/"],
			     ["Ontario Veterinary College", "OVC", "http://www.ovc.uoguelph.ca/"],
			     ["University of Medicine and Dentistry of New Jersey", "UMDNJ", "http://www.umdnj.edu/"],
			     ["St. Joseph's Healthcare Hamilton", "NULL", "http://www.stjosham.on.ca/"],
			     ["Centro de Excelência em Bioinformática de Minas Gerais", "CEBio", "http://cebio.org/"],
			     ["Southern Medical University", "SMU", "http://www.smu.com/"],
			     ["Florida A&M University", "NULL", "NULL"],
			     ["Observatoire Océanologique de Banyuls sur mer", "OBS", "http://www.obs-banyuls.fr/"],
			     ["University of Alabama", "UA", "http://www.ua.edu/"],
			     ["Guru Angad Dev Veterinary and Animal Sciences University", "GADVASU", "http://www.gadvasu.in/"],
			     ["Trinity College, Dublin", "TCD", "http://www.tcd.ie/"],
			     ["National Cancer Institute", "NCI", "http://www.cancer.gov/"],
			     ["University of Connecticut Health Center", "UConn Health Center", "http://www.uchc.edu/"],
			     ["University of Maryland Center for Environmental Science - Horn Point Laboratory", "HPL", "http://www.umces.edu/hpl"],
			     ["Uniformed Services University of the Health Sciences", "USU", "http://www.usuhs.mil/"],
			     ["Technical University of Hamburg", "TUHH", "http://www.tuhh.de/"],
			     ["Nicolaus Copernicus University, Toru&#324;", "UMK", "http://www.umk.pl/"],
			     ["Hong Kong University of Science and Technology", "HKUST", "http://www.ust.hk/"],
			     ["San Jose State University", "SJSU", "http://www.sjsu.edu/"],
			     ["University of California, San Francisco", "UCSF", "http://www.ucsf.edu/"],
			     ["Bioforsk", "Bioforsk", "http://www.bioforsk.no/"],
			     ["Institute of Molecular Biology and Genetics", "IMBG", "http://www.imbg.org.ua/"],
			     ["Aichi Gakuin University", "AGU", "http://www.dpc.agu.ac.jp/"],
			     ["Competence Center of Food and Fermentation Technologies", "CCFFT", "http://web.tftak.eu/"],
			     ["National Agricultural Research Institute of  Uruguay", "INIA", "http://www.inia.org.uy/"],
			     ["Alabama State University", "ASU", "http://www.alasu.edu/"],
			     ["Southeastern Louisiana University", "SELU", "http://www.selu.edu/"],
			     ["Kunming University of Science and Technology", "KMUST", "http://www.kmust.edu.cn/"],
			     ["Battelle Memorial Institute", "Battelle", "http://www.battelle.org/"],
			     ["Universidade do Vale do Itajaí", "Univali", "http://www.univali.br/"],
			     ["Seattle Children’s Hospital", "Seattle Children’s", "http://www.seattlechildrens.org/"],
			     ["Ministry of Agriculture and Forestry", "MAF", "http://www.maf.govt.nz/"],
			     ["Dr. DY Patil Vidyapeeth", "DPU", "http://www.dpu.edu.in/"],
			     ["Princeton University", "Princeton", "http://www.princeton.edu/"],
			     ["Institute of Hydrobiology, Chinese Academy of Sciences", "IHB", "http://www.ihb.ac.cn/"],
			     ["University of North Carolina Wilmington", "UNCW", "http://uncw.edu/"],
			     ["National Centre for Cell Science", "NCCS", "http://www.nccs.res.in/"],
			     ["Laboratory of Microbial Research on Andean Lakes", "LIMLA", "http://www.limla.com.ar/"],
			     ["Indian Veterinary Research Institute", "IVRI", "http://www.ivri.nic.in/"],
			     ["En-Vision Enviro Engineers Pvt. Ltd.", "En-Vision", "http://www.en-vision.in/"],
			     ["Instituto de Investigaciones Biológicas Clemente Estable", "IIBCE", "http://www.iibce.edu.uy/"],
			     ["University of Science and Technology of China", "UTSC", "http://www.ustc.edu.cn/"],
			     ["Indian Institute of Technology, Bombay", "IIT, Bombay", "http://www.iitb.ac.in/"],
			     ["Pondicherry University", "NULL", "http://www.pondiuni.edu.in/"],
			     ["Bio-Iliberis R&D", "NULL", "http://www.bioiliberis.com/"],
			     ["University of Adelaide", "Adelaide Uni", "http://www.adelaide.edu.au/"],
			     ["Evandro Chagas Institute (Instituto Evandro Chagas)", "IEC", "http://www.iec.pa.gov.br/"],
			     ["University of Turku", "NULL", "http://www.utu.fi/"],
			     ["Tallinn University of Technology", "TUT", "http://www.ttu.ee/"],
			     ["Nestlé S.A.", "Nestlé", "http://www.nestle.com/"],
			     ["NEIKER-Tecnalia", "NEIKER", "http://www.neiker.net/"],
			     ["European Centre for Environment and Human Health", "ECEHH", "http://www.ecehh.org/"],
			     ["Omya Development AG", "Omya", "http://www.omya.com/"],
			     ["University of the Philippines Los Baños", "UPLB", "http://www.uplb.edu.ph/"],
			     ["Universal Bio Mining", "NULL", "http://universalbiomining.com/"],
			     ["University of Rouen", "NULL", "NULL"],
			     ["Department of Employment, Economic Development and Innovation, Queensland", "DEEDI", "http://www.deedi.qld.gov.au/"],
			     ["Centre for Bioengineering RAS", "NULL", "http://www.biengi.ac.ru/"],
			     ["University of Brighton", "Brighton", "http://www.brighton.ac.uk/"],
			     ["Nanjing University", "NJU", "http://www.nju.edu.cn/"],
			     ["Smithsonian Institution", "SI", "http://www.si.edu/"],
			     ["Baylor University", "Baylor", "http://www.baylor.edu/"],
			     ["University of North Carolina at Chapel Hill School of Medicine", "UNC School of Medicine", "http://www.med.unc.edu/"],
			     ["Meharry Medical College", "Meharry", "http://www.mmc.edu/"],
			     ["Heidelberg University", "NULL", "http://www.uni-heidelberg.de/"],
			     ["National Institute of Livestock and Grassland Science", "NILGS", "http://www.nilgs.affrc.go.jp/"],
			     ["University of Southern Mississippi", "Southern Miss", "http://www.usm.edu/"],
			     ["PSG College of Technology", "NULL", "NULL"],
			     ["SeqWright Inc.", "SeqWright", "http://www.seqwright.com/"],
			     ["Texas A&M University - Corpus Christi", "TAMU-CC", "http://www.tamucc.edu/"],
			     ["Hospital Heliópolis", "NULL", "http://www.heliopolis.org.br/"],
			     ["St George's, University of London", "SGUL", "http://www.sgul.ac.uk/"],
			     ["Swinburne University of Technology", "Swinburne", "http://www.swinburne.edu.au/"],
			     ["Orissa University of Agriculture and Technology", "OUAT", "http://ouat.ac.in/"],
			     ["James Hutton Institute", "JHI", "http://www.hutton.ac.uk/"],
			     ["State University of New York at Cortland", "SUNY Cortland", "http://www.cortland.edu/"],
			     ["Korea Institute of Science and Technology", "KIST", "http://www.kist.re.kr/"],
			     ["Laboratoire d'Ecologie Alpine", "LECA", "http://www-leca.ujf-grenoble.fr/"],
			     ["Tokyo Medical and Dental University", "TMDU", "http://www.tmd.ac.jp/"],
			     ["Cemagref", "Cemagref", "http://www.cemagref.fr/"],
			     ["Environment Canada", "NULL", "http://www.ec.gc.ca/"],
			     ["Kyushu University", "NULL", "http://www.kyushu-u.ac.jp/"],
			     ["Max Planck Institute for Medical Research ", "MPI-Heidelberg", "http://www.mpimf-heidelberg.mpg.de/"],
			     ["Instituto de Productos Lácteos de Asturias", "IPLA-CSIC", "http://www.ipla.csic.es/"],
			     ["Laboratório Nacional de Ciência e Tecnologia do Bioetanol", "CTBE", "http://www.bioetanol.org.br/"],
			     ["Academic Medical Center", "AMC", "http://www.amc.nl/"],
			     ["Charles University in Prague", "Charles University", "http://www.cuni.cz/"],
			     ["Institut Fédératif de Recherche 48", "IFR48", "http://www.ifr48.com/"],
			     ["Ewha Womans University", "Ewha", "http://www.ewha.ac.kr/"],
			     ["University of Wisconsin Oshkosh", "UW Oshkosh", "http://www.uwosh.edu/"],
			     ["Laboratório Nacional de Biociências", "LNBio", "http://www.lnbio.org.br/"],
			     ["University of Malaya", "UM", "http://www.um.edu.my/"],
			     ["Institut de Recherche en Informatique et Systèmes Aléatoires", "IRISA", "http://www.irisa.fr/"],
			     ["Simon Fraser University", "SFU", "http://www.sfu.ca/"],
			     ["University Hospital Bucharest", "SUUB", "http://www.suub.ro/"],
			     ["National Academy of Agricultural Science", "NAAS", "http://www.naas.go.kr/"],
			     ["NIZO", "NIZO", "http://www.nizo.com/"],
			     ["AstraZeneca", "AstraZeneca", "http://www.astrazeneca.com/"],
			     ["Monterey Bay Aquarium Research Institute", "MBARI", "http://www.mbari.org/"],
			     ["Devi Ahilya University, Indore University", "DAVV", "http://www.dauniv.ac.in/"],
			     ["Bio-K+ International Inc.", "Bio-K+", "http://www.biokplus.com/"],
			     ["Ryerson University", "RU", "http://www.ryerson.ca/"],
			     ["LORIA, Laboratoire Lorrain de Recherche en Informatique et ses Applications", "LORIA", "http://www.loria.fr/"],
			     ["Ben-Gurion University of the Negev", "BGU", "http://in.bgu.ac.il/"],
			     ["Universidad Peruana Cayetano Heredia", "UPCH", "http://www.upch.edu.pe/"],
			     ["Mercyhurst College", "Mercyhurst", "http://www.mercyhurst.edu/"],
			     ["Chatham University", "Chatham", "http://www.chatham.edu/"],
			     ["University Centre in Svalbard", "UNIS", "http://www.unis.no/"],
			     ["Colby College", "Colby", "http://www.colby.edu/"],
			     ["Sri Venkateswara University", "SVU", "http://www.svuniversity.in/"],
			     ["Shanghai Center for Bioinformation Technology", "SCBIT", "http://www.scbit.org:8080/"],
			     ["University of Luxembourg", "NULL", "http://www.uni.lu/"],
			     ["Maulana Azad National Institute of Technology", "MANIT", "http://www.manit.ac.in/"],
			     ["University of Perugia (Università degli Studi di Perugia)", "NULL", "http://www.unipg.it/"],
			     ["University of Dhaka", "NULL", "http://www.du.ac.bd/"],
			     ["National Institute of Animal Science", "NIAS", "http://www.nias.go.kr/"],
			     ["Research and Testing Laboratories", "RTL", "http://www.researchandtesting.com/"],
			     ["Mohammed V University at Agdal", "NULL", "http://www.um5s.ac.ma/"],
			     ["University of Southampton", "NULL", "http://www.soton.ac.uk/"],
			     ["Carnegie Mellon University", "CMU", "http://www.cmu.edu/"],
			     ["University of the Basque Country (Universidad del País Vasco)", "EHU", "http://www.ehu.es/"],
			     ["Novartis Institutes for BioMedical Research", "NIBR", "http://www.nibr.com/"],
			     ["Institut National des Sciences Appliquées de Lyon", "INSA de Lyon", "http://www.insa-lyon.fr/"],
			     ["Institut national de la santé et de la recherche médicale", "Inserm", "http://www.inserm.fr/"],
			     ["Royal Women's Hospital", "NULL", "http://www.thewomens.org.au/"],
			     ["International Centre for Diarrhoeal Disease Research, Bangladesh", "ICDDR,B", "http://www.icddrb.org/"],
			     ["Vall d’Hebron Research Institute", "VHIR", "http://www.vhir.org/"],
			     ["University of the Algarve (Universidade do Algarve)", "UAlg", "http://www.ualg.pt/"],
			     ["University of New Hampshire", "UNH", "http://www.unh.edu/"],
			     ["National Institute for Marine Research and Development", "NIMRD", "http://www.rmri.ro/"],
			     ["California Academy of Sciences", "NULL", "http://www.calacademy.org/"],
			     ["Maastricht University", "UM", "http://www.maastrichtuniversity.nl/"],
			     ["Annamalai University", "NULL", "http://annamalaiuniversity.ac.in/"],
			     ["Centre for Genomic Regulation (Centre de Regulació Genòmica)", "CRG", "http://pasteur.crg.es/"],
			     ["University of Crete", "UOC", "http://www.uoc.gr/"],
			     ["Karlsruhe Institute of Technology ", "KIT", "http://www.kit.edu/"],
			     ["National Research Institute of Science and Technology for Environment and Agriculture", "IRSTEA", "http://www.irstea.fr/"],
			     ["University of Innsbruck  (Leopold-Franzens-Universität Innsbruck)", "NULL", "http://www.uibk.ac.at/"],
			     ["GlaxoSmithKline", "NULL", "http://www.gsk.com/"],
			     ["Max Rubner-Institut , Federal Research Institute of Nutrition and Food", "MRI", "http://www.mri.bund.de/"],
			     ["Tianjin Institute of Industrial Biotechnology, Chinese Academy of Science", "TIB", "http://www.tib.cas.cn/"],
			     ["Federal University of Rio Grande do Sul (Universidade Federal do Rio Grande do Sul)", "UFRGS", "http://www.ufrgs.br/"],
			     ["Ege University ", "NULL", "http://www.ege.edu.tr/"],
			     ["Matis ltd.", "Matis", "http://www.matis.is/"],
			     ["International Centre of Insect Physiology and Ecology ", "icipe", "http://www.icipe.org/"],
			     ["U.S. Army Medical Research Institute of Infectious Diseases", "USAMRIID", "http://www.usamriid.army.mil/"],
			     ["National Institute of Ocean Technology", "NIOT", "http://www.niot.res.in/"],
			     ["Joint BioEnergy Institute", "JBEI", "http://www.jbei.org/"],
			     ["Vavilov Institute of General Genetics, Russian Academy of Sciences", "VIGG RAS", "http://en.vigg.ru/"],
			     ["University of North Texas Health Science Center", "UNTHSC", "http://www.hsc.unt.edu/"],
			     ["Dartmouth Medical School ", "DMS", "http://dms.dartmouth.edu/"],
			     ["Health Protection Agency", "HPA", "http://www.hpa.org.uk/"],
			     ["College of Veterinary and Animal Sciences", "COVAS", "http://www.kau.edu/"],
			     ["Central South University ", "CSU", "http://www.csu.edu.cn/"],
			     ["National Institute for Agricultural and Food Scientific Research and Technology", "INIA", "http://www.inia.es/"],
			     ["University of Wyoming ", "UW", "http://www.uwyo.edu/"],
			     ["Indian Institute of Horticultural Research", "IIHR", "http://www.iihr.ernet.in/"],
			     ["University of Alabama at Birmingham ", "UAB", "http://www.uab.edu/"],
			     ["University of Wollongong ", "UOW", "http://www.uow.edu.au/"],
			     ["East Central University ", "ECU", "http://www.ecok.edu/"],
			     ["Biomatters Ltd.", "Biomatters", "http://www.biomatters.com/"],
			     ["Novozymes", "Novozymes", "http://www.novozymes.com/"],
			     ["Max Planck Institute for Chemical Ecology ", "MPI CE", "http://www.ice.mpg.de/ext/"],
			     ["Gladstone Institutes", "NULL", "http://www.gladstone.ucsf.edu/"],
			     ["DuPont", "DuPont", "http://www.dupont.com/"],
			     ["Yantai Institute of Coastal Zone Research, Chinese Academy of Sciences", "YICCAS", "http://www.yic.cas.cn/"],
			     ["Fondazione Edmund Mach, Istituto Agrario di San Michele all’Adige", "IASMA", "http://www.iasma.it/"],
			     ["DTU National Veterinary Institute", "DTU Vet", "http://www.vet.dtu.dk/"],
			     ["Yangzhou University ", "NULL", "http://www.yzu.edu.cn/"],
			     ["Tokyo University of Agriculture and Technology", "TUAT", "http://www.tuat.ac.jp/"],
			     ["University of Rostock (Universität Rostock)", "Rostock", "http://www.uni-rostock.de/"],
			     ["Max Planck Institute for Developmental Biology ", "NULL", "http://www.eb.tuebingen.mpg.de/"],
			     ["National Taiwan University", "NTU", "http://www.ntu.edu.tw/"],
			     ["University of Texas Medical Branch", "UTMB", "http://www.utmb.edu/"],
			     ["Institut Pasteur of Shanghai, Chinese Academy of Sciences", "IPS", "http://www.shanghaipasteur.cas.cn/"],
			     ["Delft University of Technology (Technische Universiteit Delft) ", "TU Delft", "http://home.tudelft.nl/"],
			     ["University of Coimbra (Universidade de Coimbra)", "UC", "http://www.uc.pt/"],
			     ["Sandor Medicaids Pvt. Ltd", "Sandor", "http://www.sandor.co.in/"],
			     ["Vassar College", "Vassar", "http://www.vassar.edu/"],
			     ["Yucatan Center for Scientific Research (Centro de Investigación Científica de Yucatán, A.C.)", "CICY", "http://www.cicy.mx/"],
			     ["Norwegian University of Life Sciences  (Universitetet for miljø- og biovitenskap)", "UMB", "http://www.umb.no/"],
			     ["University of the Philippines Diliman ", "UPD", "http://www.upd.edu.ph/"],
			     ["Federal University of ABC (Universidade Federal do ABC)", "UFABC", "http://www.ufabc.edu.br/"],
			     ["Laboratory of Plant-Microbe Interactions (Laboratoire des Interactions Plantes-Microrganismes)", "LIPM", "http://www6.toulouse.inra.fr/lipm/"],
			     ["California Polytechnic State University ", "Cal Poly", "http://www.calpoly.edu/"],
			     ["University of Wisconsin - Milwaukee ", "UWM", "http://www.uwm.edu/"],
			     ["Brown University", "Brown", "http://www.brown.edu/"],
			     ["Technical University of Crete", "TUC", "http://en.tuc.gr/"],
			     ["University of Quebec at Rimouski  (Université du Québec à Rimouski)", "UQAR", "http://www.uqar.ca/"],
			     ["Deakin University", "Deakin", "http://www.deakin.edu.au/"],
			     ["Autonomous University of Nuevo León (Universidad Autónoma de Nuevo León)", "UANL", "http://www.uanl.mx/"],
			     ["Genomatix Software GmbH", "Genomatix", "http://www.genomatix.de/"],
			     ["Aix-Marseille University  (Université d", "NULL", "http://www.univ-amu.fr/"],
			     ["Escola Superior de Agricultura “Luiz de Queiroz”", "ESALQ-USP", "http://www.esalq.usp.br/"],
			     ["Australian Genome Research Facility Ltd", "AGRF", "http://www.agrf.org.au/"],
			     ["Charles Darwin University", "CDU", "http://www.cdu.edu.au/"],
			     ["Kyungpook National University", "KNU", "http://www.knu.ac.kr/"],
			     ["Animal Health and Veterinary Laboratories Agency", "AHVLA", "http://animalhealth.defra.gov.uk/"],
			     ["Progenus", "Progenus", "http://www.progenus.be/"],
			     ["University of Houston", "UH", "http://www.uh.edu/"],
			     ["University of Technology, Malaysia (Universiti Teknologi Malaysia)", "UTM", "http://www.utm.my/"],
			     ["National Center for Biotechnology Information", "NCBI", "http://www.ncbi.nlm.nih.gov/"],
			     ["Franklin W. Olin College of Engineering", "Olin College", "http://www.olin.edu/"],
			     ["University of Dayton", "UD", "http://www.udayton.edu/"],
			     ["RTI International (Research Triangle Institute)", "RTI", "http://www.rti.org/"],
			     ["Federal University of Tocantins (Universidade Federal do Tocantins)", "UFT", "http://www.site.uft.edu.br/"],
			     ["Manonmaniam Sundaranar University", "MS University", "http://www.msuniv.ac.in/"],
			     ["Veolia Environnement S.A.", "Veolia", "http://www.veolia.com/"],
			     ["Silesian University of Technology", "NULL", "http://www.polsl.pl/"],
			     ["Ehime University", "NULL", "http://www.ehime-u.ac.jp/"],
			     ["Versailles Saint-Quentin-en-Yvelines University (Université de Versailles Saint-Quentin-en-Yvelines)", "UVSQ", "http://www.uvsq.fr/"],
			     ["Williams College", "Williams", "http://www.williams.edu/"],
			     ["University of Auvergne (Université d", "NULL", "http://www.u-clermont1.fr/"],
			     ["Northrop Grumman Corporation", "NULL", "http://www.northropgrumman.com/"],
			     ["Temple University", "NULL", "http://www.temple.edu/"],
			     ["University of Bath", "Bath", "http://www.bath.ac.uk/"],
			     ["Bucknell University", "Bucknell", "http://www.bucknell.edu/"],
			     ["University of Aveiro (Universidade de Aveiro)", "UA", "http://www.ua.pt/"],
			     ["University of Hawaii, C-MORE", "C-MORE", "http://cmore.soest.hawaii.edu/"],
			     ["Clemson University", "Clemson", "http://www.clemson.edu/"],
			     ["Juniata College", "NULL", "http://www.juniata.edu/"],
			     ["University of Plymouth", "NULL", "http://www.plymouth.ac.uk/"],
			     ["Autonomous University of Barcelona (Universitat Autònoma de Barcelona)", "UAB", "http://www.uab.cat/"],
			     ["Chonbuk National University", "CBNU", "http://www.jbnu.ac.kr/"],
			     ["Genotypic Technology", "Genotypic", "http://www.genotypic.co.in/"],
			     ["Center for Applied Medical Research", "CIMA", "http://www.cima.es/"],
			     ["Yokohama National University", "YNU", "http://www.ynu.ac.jp/"],
			     ["Masdar Institute of Science and Technology", "NULL", "NULL"],
			     ["University of Kansas Medical Center", "KUMC", "http://www.kumc.edu/"],
			     ["Sichuan Agricultural University", "SAU", "http://202.115.176.32/"],
			     ["Department of Agriculture, Fisheries and Forestry, Queensland", "DAFF", "http://www.daff.qld.gov.au/"],
			     ["Cooperative Institute for Research in Environmental Sciences", "CIRES", "http://cires.colorado.edu/"],
			     ["Ludwig Maximilian University of Munich", "LMU", "http://www.uni-muenchen.de/"],
			     ["Nihon University", "NULL", "NULL"],
			     ["University of Barcelona", "NULL", "http://www.ub.edu/"],
			     ["Western Illinois University", "WIU", "http://www.wiu.edu/"],
			     ["Radboud University Nijmegen Medical Centre", "RUNMC", "http://www.umcn.nl/"],
			     ["AgroParisTech", "NULL", "http://www.agroparistech.fr/"],
			     ["RWTH Aachen University", "NULL", "http://www.rwth-aachen.de/"],
			     ["National Institute Of Oceanography", "NIO", "http://www.nio.org/"],
			     ["Translational Health Science and Technology Institute", "THSTI", "http://www.thsti.res.in/"],
			     ["University of Lisbon (Universidade de Lisboa)", "UL", "http://www.ul.pt/"],
			     ["Nanjing Institute of Geography and Limnology, Chinese Academy of Sciences", "NIGLAS", "http://www.niglas.ac.cn/"],
			     ["University of Mons", "UMONS", "http://portail.umons.ac.be/"],
			     ["GenePlus", "NULL", "http://www.gene-plus.com/"],
			     ["KIIT University", "KIIT", "http://www.kiit.ac.in/"],
			     ["Central University of Punjab", "CUPB", "http://www.centralunipunjab.com/"],
			     ["University of Bari Aldo Moro", "NULL", "http://www.uniba.it/"],
			     ["Directorate of Coldwater Fisheries Research", "DCFR", "http://www.dcfr.res.in/"],
			     ["Lethbridge Research Centre", "LRC", "http://www4.agr.gc.ca/AAFC-AAC/display-afficher.do?id=1180547946064&lang=eng"],
			     ["Natural History Museum", "NHM", "http://www.nhm.ac.uk/"],
			     ["Institute of Tibetan Plateau Research, Chinese Academy of Sciences ", "ITP", "http://www.itpcas.ac.cn/"],
			     ["Maharshi Dayanand University", "MDU", "http://www.mdurohtak.ac.in/"],
			     ["Xinnovem", "NULL", "NULL"],
			     ["New York University Abu Dhabi", "NYUAD", "http://nyuad.nyu.edu/"],
			     ["Universitätsklinikum Erlangen", "NULL", "http://www.uk-erlangen.de/"],
			     ["University at Albany, State University of New York", "UAlbany", "http://www.albany.edu/"],
			     ["Technical University of Liberec", "TUL", "http://www.tul.cz/"],
			     ["Philippine Genome Center", "PGC", "http://pgc.up.edu.ph/"],
			     ["Biology Centre of the Academy of Sciences of the Czech Republic", "NULL", "http://www.bc.cas.cz/"],
			     ["Institute of Process Engineering, Chinese Academy of Sciences", "IPE, CAS", "http://www.ipe.cas.cn/"],
			     ["University of Sassari", "UniSS", "http://www.uniss.it/"],
			     ["Sam Higginbottom Institute of Agriculture, Technology and Sciences", "SHIATS", "http://www.shiats.edu.in/"],
			     ["Children's Medical Research Institute", "CMRI", "http://www.cmri.org.au/"],
			     ["Western Washington University", "WWU", "http://www.wwu.edu/"],
			     ["aScidea", "aScidea", "http://www.ascidea.com/"],
			     ["Queensland University of Technology", "QUT", "http://www.qut.edu.au/"],
			     ["Northumbria University", "NULL", "http://www.northumbria.ac.uk/"],
			     ["International Centre for Genetic Engineering and Biotechnology", "ICGEB", "http://www.icgeb.org/"],
			     ["Sardar Patel University", "SPU", "http://www.spuvvn.edu/"],
			     ["ENOVEO", "ENOVEO", "http://enoveo.com/"],
			     ["Institute of Biophysics, Siberian Branch, Russian  Academy of Sciences", "IBP, SB, RAS", "http://www.ibp.ru/"],
			     ["Instituto Tecnológico Superior de Irapuato", "ITESI", "http://www.itesi.edu.mx/"],
			     ["Illumina", "Illumina", "http://www.illumina.com/"],
			     ["University of Auckland", "NULL", "http://www.auckland.ac.nz/"],
			     ["Federal University of Paraíba", "UFPB", "http://www.ufpb.br/"],
			     ["University of Texas at Tyler", "UT Tyler", "http://www.uttyler.edu/"],
			     ["Rice University", "Rice", "http://www.rice.edu/"],
			     ["University of Pau and Pays de l", "UPPA", "http://www.univ-pau.fr/"],
			     ["Bowdoin College", "NULL", "http://www.bowdoin.edu/"],
			     ["Apsara Innovations", "NULL", "http://www.apsarain.com/"],
			     ["Central Rice Research Institute", "CRRI", "http://www.crri.nic.in/"],
			     ["National Changhua University of Education", "NCUE", "http://web.ncue.edu.tw/"],
			     ["SCK•CEN", "SCK•CEN", "http://www.sckcen.be/"],
			     ["National Cerebral and Cardiovascular Center", "NCVC", "http://www.ncvc.go.jp/"],
			     ["Akita Prefectural University", "NULL", "http://www.akita-pu.ac.jp/"],
			     ["Addis Ababa Science and Technology University", "AASTU", "http://www.aastu.org/"],
			     ["Insilicogen", "NULL", "http://www.insilicogen.com/"],
			     ["Max Planck Institute for Dynamics of Complex Technical Systems, Magdeburg", "NULL", "http://www.mpi-magdeburg.mpg.de/"],
			     ["Universidade Federal de Viçosa", "UFV", "http://www.ufv.br/"],
			     ["Birla Institute of Technology, Mesra", "BIT Mesra", "http://www.bitmesra.ac.in/"],
			     ["Persistent Systems", "NULL", "http://www.persistentsys.com/"],
			     ["University of Bayreuth", "NULL", "http://www.uni-bayreuth.de/"],
			     ["SciGenom", "SciGenom", "http://www.scigenom.com/"],
			     ["National Health Service", "NHS", "http://www.nhs.uk/"],
			     ["Algorithmic Biology Lab", "NULL", "http://bioinf.spbau.ru/"],
			     ["Lodz University of Technology", "TUL", "http://www.p.lodz.pl/"],
			     ["Vermont Genetics Network", "VGN", "http://vgn.uvm.edu/"],
			     ["Hunan Agricultural University", "HUNAU", "http://www.hunau.net/"],
			     ["State University of New York Upstate Medical University", "SUNY Upstate", "http://www.upstate.edu/"],
			     ["Centre Nacional d'AnÃ lisi GenÃ²mica", "CNAG", "http://www.cnag.cat/"],
			     ["Shenzhen Graduate School of Harbin Institute of Technology", "NULL", "NULL"],
			     ["South China Agricultural University", "SCAU", "http://www.scau.edu.cn/"],
			     ["Vidarium", "Vidarium", "http://www.vidarium.org/"],
			     ["Idaho State University", "ISU", "http://www.isu.edu/"],
			     ["Texas Tech University", "TTU", "http://www.ttu.edu/"],
			     ["Special Phage Services", "SPS", "http://specialphageservices.com.au/"],
			     ["Universidad Nacional del Litoral", "UNL", "http://www.unl.edu.ar/"],
			     ["Dongguk University", "NULL", "http://www.dongguk.edu/"],
			     ["Fondation Mérieux", "NULL", "http://www.fondation-merieux.org/"],
			     ["Bar-Ilan University", "BIU", "http://www.biu.ac.il/"],
			     ["Memorial Sloan–Kettering Cancer Center", "MSKCC", "http://www.mskcc.org/"],
			     ["OGI School of Science and Engineering", "OGI", "http://www.ogi.edu/"],
			     ["Stazione Zoologica Anton Dohrn", "NULL", "http://www.szn.it/"],
			     ["Institut Pasteur de la Guyane", "IPG", "http://www.pasteur-cayenne.fr/"],
			     ["Autonomous University of Yucatan (Universidad Autónoma de Yucatán)", "UADY", "http://www.uady.mx/"],
			     ["University of Miami", "UM", "http://www.miami.edu/"],
			     ["National Institute of Animal Nutrition and Physiology", "NIANP", "http://www.nianp.res.in/"],
			     ["Cold Spring Harbor Laboratory", "CSHL", "http://www.cshl.edu/"],
			     ["Kingston University", "NULL", "http://www.kingston.ac.uk/"],
			     ["Florida Gulf Coast University", "FGCU", "http://www.fgcu.edu/"],
			     ["University of Neuchâtel (Université de Neuchâtel)", "UniNE", "http://www.unine.ch/"],
			     ["Marine Biological Association of the United Kingdom", "MBA of the UK", "http://www.mba.ac.uk/"],
			     ["Interdisciplinary Centre of Marine and Environmental Research", "CIIMAR", "http://www.ciimar.up.pt/"],
			     ["Central University of Gujarat", "CUG", "http://www.cug.ac.in/"],
			     ["University of Haifa", "NULL", "http://www.haifa.ac.il/"],
			     ["Konkuk University", "NULL", "http://www.konkuk.ac.kr/"],
			     ["University of Cologne", "NULL", "http://www.uni-koeln.de/"],
			     ["Atatürk University", "NULL", "http://www.atauni.edu.tr/"],
			     ["University of Essex", "Essex", "http://www.essex.ac.uk/"],
			     ["Mohammad Ali Jinnah University", "MAJU", "http://www.jinnah.edu.pk/"],
			     ["Indian Institute of Technology, Mandi", "IIT Mandi", "http://www.iitmandi.ac.in/"],
			     ["Brookhaven National Laboratory", "BNL", "http://www.bnl.gov/"],
			     ["College of William & Mary", "William & Mary", "http://www.wm.edu/"],
			     ["Hiram College", "Hiram", "http://www.hiram.edu/"],
			     ["Robert Gordon University", "RGU", "http://www.rgu.ac.uk/"],
			     ["Georgia State University", "GSU", "http://www.gsu.edu/"],
			     ["Health Canada", "HC", "http://www.hc-sc.gc.ca/"],
			     ["Open University of Israel", "NULL", "http://www.openu.ac.il/"],
			     ["Northwest Nazarene University", "NNU", "http://www.nnu.edu/"],
			     ["Indiana University East", "IU East", "http://www.iue.edu/"],
			     ["Wuhan Institute Of Virology, Chinese Academy Of Sciences", "WIV", "http://www.whiov.cas.cn/"],
			     ["Victoria University of Wellington", "VUW", "http://www.victoria.ac.nz/"],
			     ["Illinois Institute of Technology", "IIT", "http://www.iit.edu/"],
			     ["Kuwait University", "KU", "http://www.kuniv.edu/"],
			     ["Vita-Salute San Raffaele University", "UniSR", "http://www.unisr.it/"],
			     ["Christian Medical College & Hospital", "CMC Vellore", "http://www.cmch-vellore.edu/"],
			     ["University of Szeged", "NULL", "http://www.u-szeged.hu/"],
			     ["HudsonAlpha Institute for Biotechnology", "NULL", "http://www.hudsonalpha.org/"],
			     ["University of La Frontera (Universidad de La Frontera)", "UFRO", "http://www.ufro.cl/"],
			     ["University of Colombo", "UoC", "http://www.cmb.ac.lk/"],
			     ["University of Missouri–St. Louis", "UMSL", "http://www.umsl.edu/"],
			     ["University of Thessaly", "NULL", "http://www.uth.gr/"],
			     ["National University of Ireland, Galway", "NUI Galway", "http://www.nuigalway.ie/"],
			     ["University of Seville (Universidad de Sevilla)", "US", "http://www.us.es/"],
			     ["University of Turin", "UNITO", "http://www.unito.it/"],
			     ["Maryville College", "MC", "http://www.maryvillecollege.edu/"],
			     ["University of Milan Bicocca", "UNIMIB", "http://www.unimib.it/"],
			     ["V.V.Dokuchaev Soil Science Institute", "NULL", "http://esoil.ru/"],
			     ["University of Agricultural Sciences, Dharwad", "UASD", "http://www.uasd.edu/"],
			     ["National Chung Hsing University", "NCHU", "http://www.nchu.edu.tw/"],
			     ["University of Salford", "UoS", "http://www.salford.ac.uk/"],
			     ["Haverford College", "Haverford", "http://www.haverford.edu/"],
			     ["Bay Zoltán Nonprofit Ltd. for Applied Research", "bay", "http://www.bayzoltan.hu/"],
			     ["National Institute of Technology and Evaluation", "NITE", "http://www.nite.go.jp/"],
			     ["Agriculture,Forestry and Fisheries Research Council", "AFFRC", "http://www.s.affrc.go.jp/"],
			     ["Vista Informatics", "NULL", "http://www.vistainformatics.com/"],
			     ["Gateway Technical College", "GTC", "http://www.gtc.edu/"],
			     ["University of Chile (Universidad de Chile)", "U. de Chile", "http://www.uchile.cl/"],
			     ["Lebanese American University", "LAU", "http://www.lau.edu.lb/"],
			     ["Walter Reed Army Institute of Research", "WRAIR", "http://wrair-www.army.mil/"],
			     ["University of New England", "UNE", "http://www.une.edu/"],
			     ["Central Michigan University", "CMU", "http://www.cmich.edu/"],
			     ["Indian Institute of Technology Kharagpur", "IIT Kharagpur", "http://www.iitkgp.ac.in/"],
			     ["University of Missouri–Columbia", "Mizzou", "http://missouri.edu/"],
			     ["University of Leeds", "Leeds", "http://www.leeds.ac.uk/"],
			     ["Keio University", "Keio", "http://www.keio.ac.jp/"],
			     ["Hannover Medical School", "MHH", "http://www.mh-hannover.de/"],
			     ["IFP Energies nouvelles ", "IFPEN", "http://www.ifpenergiesnouvelles.com/"],
			     ["Mizoram University", "MZU", "http://www.mzu.edu.in/"],
			     ["PathWest Laboratory Medicine WA", "PathWest", "http://www.pathwest.com.au/"],
			     ["National Center for Biotechnology", "NCB", "http://www.biocenter.kz/"],
			     ["Institute of Zoology, Chinese Academy of Sciences", "IOZ", "http://www.ioz.ac.cn/"],
			     ["University of Camerino", "UNICAM", "http://www.unicam.it/"],
			     ["Institute for Veterinary Medical Research", "MTA ATK ÁOTI", "http://www.vmri.hu/"],
			     ["Bode Technology Group, Inc.", "Bode", "http://www.bodetech.com/"],
			     ["Augustana College", "Augustana", "http://www.augie.edu/"],
			     ["LibraGen", "LibraGen", "http://www.libragen.com/"],
			     ["Centro de Astrobiología", "CAB", "http://cab.inta-csic.es/"],
			     ["National Biodefense Analysis and Countermeasures Center", "NBACC", "http://www.bnbi.org/"],
			     ["Centre for Development of Advanced Computing", "NULL", "NULL"],
			     ["astridbio", "astridbio", "http://www.astridbio.com/"],
			     ["University of the Philippines Mindanao", "UPMin", "http://www.upmin.edu.ph/"],
			     ["Rovira i Virgili University (Universidad Rovira i Virgili)", "URV", "http://www.urv.cat/"],
			     ["A.C.Camargo Cancer Center", "NULL", "http://www.accamargo.org.br/"],
			     ["Swiss Federal Institute of Aquatic Science and Technology", "Eawag", "http://www.eawag.ch/"],
			     ["University of Udine", "UniUD", "http://www.uniud.it/"],
			     ["Instituto de Salud Carlos III", "ISCIII", "http://www.isciii.es/"],
			     ["Hong Kong Baptist University", "HKBU", "http://www.hkbu.edu.hk/"],
			     ["Scotland's Rural College", "SRUC", "http://www.sruc.ac.uk/"],
			     ["Centre de Recherche Public - Gabriel Lippmann", "CRP-GL", "http://www.lippmann.lu/"],
			     ["University of Akron", "UA", "http://www.uakron.edu/"],
			     ["San Raffaele Hospital", "HSR", "http://www.hsr.it/"],
			     ["Royal Zoological Society of Antwerp", "KMDA", "http://www.kmda.org/"],
			     ["Norwegian Institute of Food, Fishery and Aquaculture", "Nofima", "http://www.nofima.no/"],
			     ["Bose Institute", "NULL", "http://www.jcbose.ac.in/"],
			     ["Sardar Swaran Singh National Institute of Renewable Energy", "SSS NIRE", "http://www.nire.res.in/"],
			     ["Pakistan Agricultural Research Council", "PARC", "http://www.parc.gov.pk/"],
			     ["Howard University", "HU", "http://www.howard.edu/"],
			     ["Swansea University", "Swansea", "http://www.swansea.ac.uk/"],
			     ["University of the Philippines", "UP", "http://up.edu.ph/"],
			     ["Jilin University", "JLU", "http://www.jlu.edu.cn/newjlu/"],
			     ["Minnesota State University Moorhead", "MSUM", "http://www.mnstate.edu/"],
			     ["Heriot-Watt University", "Heriot-Watt", "http://www.hw.ac.uk/"],
			     ["Environmental Analysis laboratory EPA", "NIEA", "http://www.niea.gov.tw/"],
			     ["University of Westminster", "Westminster", "http://www.westminster.ac.uk/"],
			     ["Karel de Grote-Hogeschool", "KdG", "http://www.kdg.be/"],
			     ["Binghamton University", "BU", "http://www.binghamton.edu/"],
			     ["University of Memphis", "U of M", "http://www.memphis.edu/"],
			     ["Moscow State University", "MSU", "http://www.msu.ru/"],
			     ["The Hospital for Sick Children", "SickKids Hospital", "http://www.sickkids.ca/"],
			     ["Cluster in Biomedicine", "CBM", "http://www.cbm.fvg.it/"],
			     ["Karolinska Institute", "KI", "http://www.ki.se/"],
			     ["Oklahoma State University Center for Health Sciences", "OSU-CHS", "http://www.healthsciences.okstate.edu/college/"],
			     ["Okinawa Institute of Science and Technology", "OIST", "http://www.oist.jp/"],
			     ["Chongqing University", "CQU", "http://international.cqu.edu.cn/"],
			     ["University of Amsterdam", "UvA", "http://www.uva.nl/"],
			     ["Robarts Research Institute", "Robarts", "http://www.robarts.ca/"],
			     ["Callaghan Innovation", "NULL", "http://www.callaghaninnovation.govt.nz/"],
			     ["University of Strathclyde", "Strathclyde", "http://www.strath.ac.uk/"],
			     ["KEMRI Wellcome Trust Research Programme", "NULL", "http://www.kemri-wellcome.org/"],
			     ["Singapore Centre on Environmental Life Sciences Engineering", "SCELSE", "http://www.scelse.sg/"],
			     ["Ganpat University", "NULL", "http://www.ganpatuniversity.ac.in/"],
			     ["Genes Diffusion", "NULL", "http://www.genesdiffusion.com/"],
			     ["Erasmus University Medical Center", "Erasmus MC", "http://www.erasmusmc.nl/"],
			     ["George Washington University", "GWU", "http://www.gwu.edu/"],
			     ["Research Institute of Horticulture", "InHort", "http://www.inhort.pl/"],
			     ["National Academy of Agricultural Science, Rural Development Administration", "RDA", "http://www.rda.go.kr/"],
			     ["Kasetsart University", "Kaset", "http://www.ku.ac.th/"],
			     ["Center for Coastal Margin Observation & Prediction", "CMOP", "http://www.stccmop.org/"],
			     ["University of Tolima", "UT", "http://www.ut.edu.co/"],
			     ["Luxia Scientific", "NULL", "http://www.luxiascientific.com/"],
			     ["Korea Food Research Institute", "KFRI", "http://www.kfri.re.kr/"],
			     ["Central Queensland University", "NULL", "NULL"],
			     ["National Cheng Kung University", "NCKU", "http://www.ncku.edu.tw/"],
			     ["West Virginia University Genomics Core Facility", "NULL", "http://genomics.as.wvu.edu/"],
			     ["Umeå University", "NULL", "http://www.umu.se/"],
			     ["Ponce School of Medicine & Health Sciences", "PSMHS", "http://www.psm.edu/"],
			     ["Austrian Institute of Technology", "AIT", "http://www.ait.ac.at/"],
			     ["University of Colorado School of Medicine", "CU Medicine", "medschool.ucdenver.edu/â€Ž"],
			     ["BioMed Central", "BMC", "http://www.biomedcentral.com/"],
			     ["Chungnam National University", "NULL", "NULL"],
			     ["Ain Shams University", "ASU", "http://www.asu.edu.eg/"],
			     ["Universidade Federal de Ciências da Saúde de Porto Alegre", "UFCSPA", "http://www.ufcspa.edu.br/"],
			     ["University of South Australia", "UniSA", "http://www.unisa.edu.au/"],
			     ["Carroll College", "Carroll", "http://www.carroll.edu/"],
			     ["Centro de Referencia para Lactobacilos", "CERELA", "http://www.cerela.org.ar/"],
			     ["Atma Jaya Catholic University of Indonesia", "NULL", "http://www.atmajaya.ac.id/"],
			     ["Charles Sturt University", "CSU", "http://www.csu.edu.au/"],
			     ["University of Maryland School of Medicine", "NULL", "http://medschool.umaryland.edu/"],
			     ["Universidade Estadual de Londrina", "UEL", "http://www.uel.br/"],
			     ["National Aeronautics and Space Administration", "NASA", "http://www.nasa.gov/"],
			     ["National Institute for Medical Research", "NIMR", "http://www.nimr.mrc.ac.uk/"],
			     ["Karanth Genomics LLC", "NULL", "NULL"],
			     ["El Bosque University (Universidad El Bosque)", "El Bosque", "http://www.uelbosque.edu.co/"],
			     ["University of South Alabama", "USA", "http://www.southalabama.edu/"],
			     ["Gringene Bioinformatics", "NULL", "http://www.gringene.org/"],
			     ["Waseda University", "S&#333;dai", "http://www.waseda.jp/"],
			     ["The Scripps Research Institute", "TSRI", "http://www.scripps.edu/"],
			     ["University of Windsor", "UWindsor", "http://www.uwindsor.ca/"],
			     ["Nelson Mandela African Institute of Science and Technology", "NM-AIST", "http://www.nm-aist.ac.tz/"],
			     ["Nutreco", "NULL", "http://www.nutreco.com/"],
			     ["Catalan Institute for Water Research", "ICRA", "http://www.icra.cat/"],
			     ["University of California, San Diego School of Medicine", "UCSD School of Medicine", "http://som.ucsd.edu/"],
			     ["Universidad del Mar", "UMAR", "http://www.umar.mx/"],
			     ["Wright State University", "Wright State", "http://www.wright.edu/"],
			     ["Thermo Fisher Scientific", "NULL", "http://www.thermofisher.com/"],
			     ["Austin College", "NULL", "http://www.austincollege.edu/"],
			     ["University of St. Thomas", "UST", "http://www.stthomas.edu/"],
			     ["Goswami Ganesh Dutta Sanatan Dharma College", "GGDSDC", "http://www.ggdsd.ac.in/"],
			     ["Children", "CHLA", "http://www.chla.org/"],
			     ["Henkel", "Henkel", "http://www.henkel.com/"] ];
    
})();