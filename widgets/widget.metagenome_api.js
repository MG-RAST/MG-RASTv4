(function() {
    widget = Retina.Widget.extend({
        about: {
            title: "Metagenome API Widget",
            name: "metagenome_api",
            author: "Tobias Paczian",
            requires: ["jquery.datepicker.js"]
        }
    });

    widget.setup = function() {
        return [];
    };

    widget.display = function(params) {
        widget = this;
        var index = widget.index;

        if (params && params.main) {
            widget.main = params.main;
            widget.sidebar = params.sidebar;
        }
        var content = widget.main;
        var sidebar = widget.sidebar;

        sidebar.parentNode.style.display = "none";
        content.className = "span10 offset1";

        document.getElementById("pageTitle").innerHTML = "API explorer";

        var html = ["<div style='width: 400px; margin-left: auto; margin-right: auto; margin-top: 100px;'><img src='Retina/images/waiting.gif' style='width: 32px;'> loading content...</div>"];

        content.innerHTML = html.join('');

        jQuery.ajax({
            dataType: "json",
            headers: stm.authHeader,
            url: RetinaConfig.mgrast_api,
            success: function(data) {
                stm.DataStore.api = data;
                Retina.WidgetInstances.metagenome_api[1].showContent();
            }
        }).fail(function(xhr, error) {
            content.innerHTML = "<div class='alert alert-danger' style='width: 500px;'>could not reach API server</div>";
            console.log(error);
        });
        return;
    };

    widget.showContent = function() {
        var widget = this;

        var data = stm.DataStore.api;

        var html = ['<h1 style="font-weight: 300;">MG-RAST API explorer</h1>'];

        var shortDesc = data.description.substring(0, data.description.indexOf('</p>') + 4);
        var fullDesc = data.description.substring(data.description.indexOf('</p>') + 4);

        html.push(shortDesc);
        html.push('<div style="text-align: center;"><button class="btn btn-mini" style="width: 50px; margin-bottom: 30px;" onclick="jQuery(\'#fullDesc\').toggle();">...</button></div>');
        html.push('<div id="fullDesc" style="display: none;">' + fullDesc + '</div>');

        html.push('<h2 style="font-weight: 300;">searching for datasets?</h2><p>Try out the <a href="mgmain.html?mgpage=searchapi">search API explorer</a>.</p>');

        html.push('<h2 style="font-weight: 300;">access to private data</h2>');
        if (stm.user) {
            html.push('<p>You are logged in and your webkey is auto-filled into the forms below. This is needed to access your private data. To access your current webkey type "webkey" into the search box in the header and press enter.</p>');
        } else {
            html.push('<p>You are not logged in and do not have access to private data. Use the <b>login</b> button at the top right of the page to log in.</p><p>If you do not yet have an account, obtain one by clicking the <b>register</b> button next to the login button.</p>');
        }

        for (var i = 0; i < data.resources.length; i++) {
            var r = data.resources[i];
            if (r.name == 'search' || r.name == 'submission') {
                continue;
            }
            html.push('<h3>' + r.name + '</h3><div id="resource' + r.name + '"><img src="Retina/images/waiting.gif" style="width: 16px;"> loading...</div>');
        }
        widget.main.innerHTML = html.join("");

        for (var i = 0; i < data.resources.length; i++) {
            var r = data.resources[i];
            if (r.name == 'search' || r.name == 'submission') {
                continue;
            }
            jQuery.ajax({
                dataType: "json",
                url: r.url,
                res: r.name,
                rid: i,
                success: function(d) {
                    var widget = Retina.WidgetInstances.metagenome_api[1];
                    stm.DataStore.api.resources[this.rid] = d;
                    var h = [];
                    h.push('<p>' + d.description + '</p>');
                    h.push('<h4>requests</h4>');
                    for (var j = 0; j < d.requests.length; j++) {
                        var req = d.requests[j];
                        if (!req.hasOwnProperty('example')) {
                            continue;
                        }

                        if (typeof req.example != 'object') {
                            console.log('invalid example structure');
                            console.log(req.example);
                            continue;
                        }
                        req.format = "url"
                        
                        // url cleaning
                        var tempreq = req.request.replace('-ui', '');
                        req.request = tempreq;
                        var tempex = req.example[0].replace('-ui', '');
                        req.example[0] = tempex;

                        var example_description = req.example[1];
                        var example_params;
                        var example_id = null;
                        var phash = {};

                        if (req.method == 'POST') {
                            req.format = "form";
                            if (req.request.indexOf('{') > -1) {
                                var text = req.example[0];
                                phash[req.request.substring(req.request.indexOf('{') + 1, req.request.indexOf('}')).toLowerCase()] = text.substr(text.lastIndexOf('/') + 1, text.lastIndexOf('"') - (text.lastIndexOf('/') + 1));
                            }
                            if (req.example[0].indexOf('curl') > -1) {
                                var ed = req.example[0];
                                // json data curl POST
                                if (req.example[0].indexOf("-d '") > -1) {
                                    req.format = "json"
                                    try {
                                        ed = JSON.parse(ed.substr(ed.indexOf("-d '") + 4, ed.lastIndexOf("}") - ed.indexOf("-d '") - 3));
                                        var keys = Retina.keys(ed);
                                        for (var k = 0; k < keys.length; k++) {
                                            phash[keys[k]] = ed[keys[k]];
                                        }
                                    } catch (e) {
                                        console.log('invalid curl -d in ' + d.name + ' ' + req.name + ': ' + req.example[0]);
                                    }
                                }
                                // multipart form curl POST
                                else if (req.example[0].indexOf('-F "') > -1) {
                                    var pattern = /-F (\".+?\")/g;
                                    var match;
                                    while (match = pattern.exec(ed)) {
                                        var parts = match[1].split("=");
                                        if (parts.length == 2) {
                                            phash[parts[0]] = phash[parts[1]];
                                        }
                                    }
                                }
                            }
                            example_params = phash;
                        } else {
                            example_params = req.example[0].substr(req.example[0].lastIndexOf('/') + 1).split('?');
                        }
                        if (example_params.length > 1) {
                            if (example_params[0] != req.name) {
                                example_id = example_params[0];
                                example_params[0] = example_params[1];
                                var idfield = req.request.substring(req.request.indexOf('{') + 1, req.request.indexOf('}')).toLowerCase();
                                phash[idfield] = example_id;
                            } else {
                                example_params[0] = example_params[1];
                            }
                            example_params = example_params[0].split('&');
                            for (var k = 0; k < example_params.length; k++) {
                                if (example_params[k].indexOf('=') > -1) {
                                    var x = example_params[k].split('=');
                                    if (phash.hasOwnProperty(x[0])) {
                                        phash[x[0]] += "," + x[1];
                                    } else {
                                        phash[x[0]] = x[1];
                                    }
                                }
                            }
                            example_params = phash;
                        } else if (example_params.length == 1) {
                            var idfield = req.request.substring(req.request.indexOf('{') + 1, req.request.indexOf('}')).toLowerCase();
                            example_params[idfield] = example_params[0];
                        }

                        req.example = {
                            "description": example_description,
                            "params": example_params,
                            "id": example_id
                        };
                        var cleanurl = RetinaConfig.mgrast_api.replace('-ui', '');
                        req.call = req.request.substring(cleanurl.length).replace('//', '/');

                        h.push('<div class="request" style="cursor: pointer;"><div class="requestMethod" onclick="jQuery(\'#request' + this.res + req.name + req.method + '\').toggle();"><span>' + req.method + '</span><span>' + req.call + '</span></div><div onclick="jQuery(\'#request' + this.res + req.name + req.method + '\').toggle();">' + req.description + '</div><div class="requestchild" id="request' + this.res + req.name + req.method + '" style="display: none;">');

                        h.push('<h5>example</i></h5><p style="padding-left: 100px;">' + req.example.description + '</p>');
                        h.push('<form class="form-horizontal" onsubmit="return false" resource="' + this.rid + '" request="' + j + '" target="request' + this.res + req.name + req.method + 'target">')
                        h.push('<h5>required parameters</h5>');

                        var params = Retina.keys(req.parameters.required).sort();
                        for (var k = 0; k < params.length; k++) {
                            h.push(widget.formField(params[k], req.parameters.required[params[k]], req));
                        }
                        if (params.length == 0) {
                            h.push('<div style="padding-left: 100px;"> - no required parameters - </div>');
                        }

                        h.push('<h5>optional parameters</h5>');

                        params = Retina.keys(req.parameters.options).sort();
                        for (var k = 0; k < params.length; k++) {
                            h.push(widget.formField(params[k], req.parameters.options[params[k]], req));
                        }
                        var bparams = Retina.keys(req.parameters.body).sort();
                        for (var k = 0; k < bparams.length; k++) {
                            h.push(widget.formField(bparams[k], req.parameters.body[bparams[k]], req));
                        }
                        if (params.length + bparams.length == 0) {
                            h.push('<div style="padding-left: 100px;"> - no optional parameters - </div>');
                        }
                        h.push('<button class="btn pull-left" onclick="Retina.WidgetInstances.metagenome_api[1].submitForm(this, true);">show curl</button>');
                        h.push('<button class="btn pull-right" onclick="Retina.WidgetInstances.metagenome_api[1].submitForm(this);">send</button>');
                        h.push('</form>');

                        h.push('<div id="request' + this.res + req.name + req.method + 'target_curl"></div>');
                        h.push('<div id="request' + this.res + req.name + req.method + 'target"></div>');

                        h.push('<h5 style="clear: both;">return structure</h5>');
                        h.push('<pre>' + JSON.stringify(req.attributes == "self" ? req : req.attributes, null, 2) + '</pre>');
                        h.push('</div></div>');
                    }
                    document.getElementById('resource' + d.name).innerHTML = h.join("");
                }
            }).fail(function(xhr, error) {
                content.innerHTML = "<div class='alert alert-danger' style='width: 500px;'>could not reach API server</div>";
                console.log(error);
            });
        }
    };

    widget.formField = function(name, p, req) {
        var h = [];
        h.push('<div class="control-group"><label class="control-label" >' + name + '</label><div class="controls">');
        if (name == 'upload') {
            h.push('<input type="file" name="' + name + '">');
        } else if (p[0] == 'string' || p[0] == 'date' || p[0] == 'int' || p[0] == 'integer') {
            var val = (req.example && req.example.params.hasOwnProperty(name)) ? req.example.params[name] : "";
            h.push('<input type="text" name="' + name + '" placeholder="' + name + '" value="' + val + '">');
        } else if (p[0] == 'cv') {
            h.push('<select name="' + name + '">');
            var val = req.example && req.example.params.hasOwnProperty(name) ? req.example.params[name] : null;
            for (var l = 0; l < p[1].length; l++) {
                h.push('<option title="' + p[1][l][1] + '"' + (val !== null && val == p[1][l][0] ? ' selected="selected"' : '') + '>' + p[1][l][0] + '</option>');
            }
            h.push('</select>');
        } else if (p[0] == 'boolean') {
            h.push('<select name="' + name + '"><option value=0>no</option><option value=1' + (req.example && req.example.params.hasOwnProperty(name) && req.example.params[name] ? ' selected="selected"' : "") + '>yes</option></select>');
        } else if (p[0] == 'list') {
            var val = JSON.stringify(req.example && req.example.params.hasOwnProperty(name) ? req.example.params[name] : "").replace(/"/g, '&quot;');
            h.push('<input type="text" name="' + name + '" placeholder="' + name + '" value="' + val + '">');
        } else {
            var val = JSON.stringify(req.example && req.example.params.hasOwnProperty(name) ? req.example.params[name] : "").replace(/"/g, '&quot;');
            h.push('<input type="text" name="' + name + '" placeholder="' + name + '" value="' + val + '">');
        }
        if (p[0] != 'cv') {
            if (typeof p[1] === 'string') {
                h.push('<span class="help-inline">&nbsp;' + p[1] + '</span>');
            } else if (typeof p[1][1] === 'string') {
                h.push('<span class="help-inline">&nbsp;' + p[0] + ':&nbsp;&nbsp;' + p[1][1] + '</span>');
            } else if (typeof p[1][1][1] === 'string') {
                h.push('<span class="help-inline">&nbsp;' + p[0] + ':&nbsp;&nbsp;' + p[1][1][1] + '</span>');
            }
        }
        h.push('</div></div>');

        return h.join("");
    };

    widget.submitForm = function(btn, curlOnly) {
        var widget = this;

        // send or show-curl button
        var form = btn.parentNode;
        if (btn.innerHTML == 'send') {
            btn.setAttribute('disabled', 'disabled');
            btn.innerHTML = '<img src="Retina/images/waiting.gif" style="width: 12px;">';
        }

        // get full struct of resource by array index
        var resource = stm.DataStore.api.resources[form.getAttribute('resource')];
        // get request struct from resource by array index
        var request = resource.requests[form.getAttribute('request')];
        // place to put return call or curl example
        var target = form.getAttribute('target');

        var values = {};
        for (var i = 0; i < form.elements.length; i++) {
            if (form.elements[i].value) {
                if (form.elements[i].name == "upload") {
                    values[form.elements[i].name] = form.elements[i];
                } else {
                    values[form.elements[i].name] = form.elements[i].value;
                }
            }
        }

        var req = Retina.keys(request.parameters.required);
        for (var i = 0; i < req.length; i++) {
            if (!values.hasOwnProperty(req[i])) {
                alert('required parameter ' + req[i] + ' is missing');
                return;
            }
        }

        var url = request.request.replace(/([^\:])\/\//, "$1/");
        if (url.match(/\{id\}/)) {
            url = url.replace("{id}", values.id);
            delete values.id;
        } else if (url.match(/\{text\}/)) {
            url = url.replace("{text}", values.text);
            delete values.text;
        } else if (url.match(/\{uuid\}/)) {
            url = url.replace("{uuid}", values.uuid);
            delete values.uuid;
        } else if (url.match(/\{label\}/)) {
            url = url.replace("{label}", values.label);
            delete values.label;
        }

        var hasParams = (Retina.keys(values).length > 0) ? true : false;
        if (hasParams) {
            if (request.method == 'GET') {
                url += "?";
                var p = [];
                for (var i in values) {
                    var vals = values[i].split(/,/);
                    for (var h = 0; h < vals.length; h++) {
                        p.push(i + "=" + vals[h]);
                    }
                }
                url += p.join("&");
                url = url.replace(/ /g, "%20");
            } else {
                for (var i in values) {
                    try {
                        var vals = JSON.parse(values[i].replace(/&quot;/g, '"'));
                        values[i] = vals;
                    } catch (e) {}
                }
            }
        }

        if (curlOnly) {
            var curlstr = "curl" + (stm.user ? ' -H "Authorization: mgrast ' + stm.user.token + '"' : "") + " -X " + request.method;
            if (hasParams && (request.format == "json")) {
                curlstr += " -d '" + JSON.stringify(values).replace(/'/g, "\\'") + "'";
            } else if (hasParams && (request.format == "form")) {
                for (var i in values) {
                    var val = (i == 'upload') ? '@' + values[i].value.split('\\').reverse()[0] : values[i];
                    curlstr += ' -F "' + i + '=' + val + '"';
                }
            }
            curlstr += ' "' + url + '"';
            document.getElementById(target + '_curl').innerHTML = "<div style='clear: both; height: 10px;'></div><pre>" + curlstr + "</pre>";
        } else {
            // set values for type of call
            var processData = true;
            var contentType = "application/x-www-form-urlencoded";
            var postData = null;
            if (hasParams && (request.format == "json")) {
                contentType = "application/json";
                postData = JSON.stringify(values);
            } else if (hasParams && (request.format == "form")) {
                processData = false;
                contentType = false;
                postData = new FormData();
                for (var i in values) {
                    if (i == "upload") {
                        postData.append(i, values[i].files[0]);
                    } else {
                        postData.append(i, values[i]);
                    }
                }
            }
            // do call
            var preResponse = "<div style='clear: both; height: 1px;'></div><h5>response<button class='btn btn-mini' style='margin-left: 10px;' onclick='if(this.innerHTML==\"hide\"){this.innerHTML=\"show\";this.parentNode.nextSibling.style.display=\"none\";}else{this.innerHTML=\"hide\";this.parentNode.nextSibling.style.display=\"\";}'>hide</button></h5><pre style='margin-bottom: 30px;'>";
            var postResponse = "</pre>";
            if (request.type == "stream") {
                // text stream
                var ajaxStream = null;

                function abortAjaxStream() {
                    if (ajaxStream != null) {
                        ajaxStream.abort();
                    }
                }
                var truncated = false;
                ajaxStream = jQuery.ajax({
                    method: request.method,
                    url: url,
                    btn: btn,
                    data: postData,
                    dataType: 'text',
                    headers: stm.authHeader,
                    processData: false,
                    target: target,
                    xhrFields: {
                        // Getting on progress streaming response
                        onprogress: function(e) {
                            var resp = e.currentTarget.response;
                            if (resp.length >= 10000) {
                                resp = resp.substr(0, 10000) + "...\n(the content is longer than 10,000 characters and has been truncated)";
                                btn.removeAttribute('disabled');
                                btn.innerHTML = 'send';
                                document.getElementById(target).innerHTML = preResponse + resp.replace(/</g, '&lt;') + postResponse;
                                truncated = true;
                                abortAjaxStream();
                            }
                        }
                    }
                });
                ajaxStream.done(function(d) {
                    if (!truncated) {
                        this.btn.removeAttribute('disabled');
                        this.btn.innerHTML = 'send';
                        document.getElementById(this.target).innerHTML = preResponse + d.replace(/</g, '&lt;') + postResponse;
                    }
                });
                ajaxStream.fail(function(xhr, error) {
                    if (!truncated) {
                        this.btn.removeAttribute('disabled');
                        this.btn.innerHTML = 'send';
                        document.getElementById(this.target).innerHTML = "<div style='clear: both; height: 1px;'></div><div class='alert alert-danger'>" + xhr.responseText + "</div>";
                        console.log(error);
                    }
                });
            } else {
                // json result
                jQuery.ajax({
                    method: request.method,
                    url: url,
                    btn: btn,
                    data: postData,
                    headers: stm.authHeader,
                    contentType: contentType,
                    processData: processData,
                    target: target
                }).done(function(d) {
                    this.btn.removeAttribute('disabled');
                    this.btn.innerHTML = 'send';
                    var resp = JSON.stringify(d, null, 2);
                    if (resp.length > 10000) {
                        resp = resp.substr(0, 10000) + "...\n(the content is longer than 10,000 characters and has been truncated)";
                    }
                    document.getElementById(this.target).innerHTML = preResponse + resp.replace(/</g, '&lt;') + postResponse;
                }).fail(function(xhr, error) {
                    this.btn.removeAttribute('disabled');
                    this.btn.innerHTML = 'send';
                    document.getElementById(this.target).innerHTML = "<div style='clear: both; height: 1px;'></div><div class='alert alert-danger'>" + xhr.responseText + "</div>";
                    console.log(error);
                });
            }
        }
    };

})();
