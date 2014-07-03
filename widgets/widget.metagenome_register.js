(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Account Registration Widget",
                name: "metagenome_register",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.add_renderer({"name": "table", "resource": "Retina/renderers/",  "filename": "renderer.table.js" }),
  		 Retina.load_renderer("table") ];
    };
    
    widget.display = function (wparams) {
        widget = Retina.WidgetInstances.metagenome_register[1];

	if (wparams && wparams.main) {
	    widget.main = wparams.main;
	    widget.sidebar = wparams.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;
	
	var html = '\
<h3>Register a new Account</h3>\
<form class="form-horizontal">\
  <div class="control-group">\
    <label class="control-label" for="inputFirstname">First Name</label>\
    <div class="controls">\
      <input type="text" id="inputFirstname" placeholder="firstname"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputLastname">Last Name</label>\
    <div class="controls">\
      <input type="text" id="inputlastname" placeholder="lastname"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputLogin">Login</label>\
    <div class="controls">\
      <input type="text" id="inputLogin" placeholder="login"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputPrimaryEmail">Primary eMail</label>\
    <div class="controls">\
      <input type="text" id="inputPrimaryEmail" placeholder="primary email"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputSecondaryEmail">Secondary eMail</label>\
    <div class="controls">\
      <input type="text" id="inputSecondaryEmail" placeholder="secondary email"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputPassword">Password</label>\
    <div class="controls">\
      <input type="password" id="inputPassword" placeholder="password"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputVerifyPassword">Verify Password</label>\
    <div class="controls">\
      <input type="password" id="inputVerifyPassword" placeholder="verify password"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputOrganization">Organization</label>\
    <div class="controls">\
      <input type="text" id="inputOrganization" placeholder="organization"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputURL">URL</label>\
    <div class="controls">\
      <input type="text" id="inputURL" placeholder="URL"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="inputCountry">Country</label>\
    <div class="controls">\
      <input type="text" id="inputCountry" placeholder="country"><span class="help-inline">Inline help text</span>\
    </div>\
  </div>\
  <div class="control-group">\
    <div class="controls">\
      <label class="checkbox">\
        <input type="checkbox"> Add me to the MG-RAST mailing-list<span class="help-inline">(We encourage you to subscribe as the list is used to inform you about major changes to the MG-RAST service and announces MG-RAST workshops. Email originates from the MG-RAST team only and is quite rare.)</span>\
      </label>\
    </div>\
  </div>\
  <script type="text/javascript" src="http://www.google.com/recaptcha/api/challenge?k=6Lf1FL4SAAAAAO3ToArzXm_cu6qvzIvZF4zviX2z"></script>\
  <noscript>\
    <iframe src="http://www.google.com/recaptcha/api/noscript?k=6Lf1FL4SAAAAAO3ToArzXm_cu6qvzIvZF4zviX2z" height="300" width="500" frameborder="0"></iframe>\
    <br>\
    <textarea name="recaptcha_challenge_field" rows="3" cols="40"></textarea>\
    <input type="hidden" name="recaptcha_response_field" value="manual_challenge">\
  </noscript>\
  <button type="submit" class="btn pull-right">register</button>\
</form>\
';

	// set the output area
	content.innerHTML = html;
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
    
})();