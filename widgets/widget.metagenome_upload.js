(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Upload Widget",
                name: "metagenome_upload",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [ Retina.load_widget("shockbrowse") ];
    };
    
    widget.display = function (params) {
        var widget = this;
	var index = widget.index;
	
	if (params && params.main) {
	    widget.main = params.main;
	    widget.sidebar = params.sidebar;
	}
	var content = widget.main;
	var sidebar = widget.sidebar;

	// help text
	sidebar.setAttribute('style', 'padding: 10px;');
	var sidehtml = '<h3><span style="border: 3px solid black; margin-right: 10px; border-radius: 20px; font-size: 16px; padding-left: 5px; padding-right: 5px; position: relative; bottom: 3px;">?</span>frequent questions</h3><ul style="list-style: none; margin-left: 10px;">';
	sidehtml += '<li><a href="">Use MetaZen to create your metadata spreadsheet</a></li>';
	sidehtml += '<li><a href="">Uploading a metagenome (Video)</a></li>';
	sidehtml += '<li><a href="">Inbox explained</a></li>';
	sidehtml += '<li><a href="">Automated submission via our API</a></li>';
	sidehtml += '<li><a href="">Preparing metadata</a></li>';
	sidehtml += '<li><a href="">Priority assignments explained</a></li>';
	sidehtml += '<li><a href="">Obtaining Accession numbers</a></li>';
	sidehtml += '<li><a href="">Which projects are shown in the dialogue?</a></li>';
	sidehtml += '<li><a href="">How should barcode files be formatted?</a></li>';
	sidehtml += '</ul>';

	// running actions
	sidehtml += '<h3><span style="border: 3px solid black; margin-right: 10px; border-radius: 20px; font-size: 16px; padding-left: 8px; padding-right: 8px; position: relative; bottom: 3px;">i</span>running actions</h3>';
	sidehtml += "<p>If you perform actions on files in your inbox that take some time to complete, you can view their status here.</p><p style='text-align: center; font-style: italic;'>- no actions running on files in your inbox -</p>";

	sidebar.innerHTML = sidehtml;

	// title
	var html = "<div class='btn-group' data-toggle='buttons-checkbox' style='margin-bottom: 20px;'><a href='?mgpage=upload' class='btn btn-large active' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/upload.png'>upload data</a><a href='?mgpage=submission' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>perform submission</a><a href='?mgpage=pipeline' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a></div>";

	// intro
	html += "<p>Before you can submit data to our metagenomics pipeline you must first load it into your private inbox on the MG-RAST server. To do so you can either use <a href=''>our API</a> or the <a href='#' onclick='Retina.WidgetInstances.metagenome_upload[1].browser.uploadButton.click();'><img style='height: 16px; margin-right: 5px; position: relative; bottom: 2px;' src='Retina/images/upload.png'>upload</a> function on this page. The inbox is a temporary storage location allowing you to assemble all files required for submission. You can upload any fasta, fastq or SFF files and GSC MIxS compliant metadata files into your inbox.</p><p>After manipulating the files in your inbox, you can <a href=''><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>submit data</a> to our pipeline to create and/or add to existing projects. When the submission process has been successfully completed, MG-RAST ID's (\"Accession numbers\") will be automatically assigned and the data will be removed from your inbox.</p><p>You can monitor the progress of your submission at the <a href=''><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a>.</p>";

	// shockbrowser space
	html += "<div id='browser'></div>";

	content.innerHTML = html;

	// check if we have a user
	if (widget.browser) {
	    widget.browser.display({ target: document.getElementById("browser") });
	} else {
	    widget.browser = Retina.Widget.create("shockbrowse", { "target": document.getElementById("browser"),
								   "width": 900,
								   "height": 500,
								   "enableUpload": true,
								   "customPreview": widget.filePreview,
								   "fileUploadCompletedCallback": widget.fileCompleted,
								   "detailType": "preview",
								   "showDetailBar": false,
								   "showFilter": false,
								   "showResizer": false,
								   "showStatusBar": false,
								   "showTitleBar": false,
								   "enableDownload": false,
								   "showUploadPreview": false,
								   "presetFilters": { "type": "inbox" },
								   "shockBase": RetinaConfig.shock_url});
	}
	if (! widget.user) {
	    content.innerHTML = "<div class='alert alert-info' style='width: 500px;'>You must be logged in to upload data.</div>";
	}
    };

    widget.filePreview = function (params) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var html = "<h4>File Information</h4>";

	console.log(params);

	var node = params.node;
	var fn = node.file.name;

	html += "<table>";
	html += "<tr><td style='padding-right: 20px;'><b>filename</b></td><td>"+fn+"</td></tr>";
	html += "<tr><td><b>size</b></td><td>"+node.file.size.byteSize()+"</td></tr>";
	html += "<tr><td><b>creation</b></td><td>"+node.last_modified+"</td></tr>";
	html += "<tr><td><b>md5</b></td><td>"+node.file.checksum.md5+"</td></tr>";
	html += "</table>";

	// detect filetype
	var filetype = "";
	if (fn.match(/(tar\.gz|tgz|zip|tar\.bz2|tbz|tbz2|tb2|gzip|bzip2|gz)$/)) {
	    filetype = "archive";
	} else if (fn.match(/(fasta|fa|ffn|frn|fna)$/)) {
	    filetype = "fasta sequence";
	} else if (fn.match(/sff$/)) {
	    filetype = "sff sequence";
	} else if (fn.match(/(fq|fastq)$/)) {
	    filetype = "fastq sequence";
	} else if (fn.match(/(xls|xlsx)$/)) {
	    filetype = "excel";
	} else if (fn.match(/json$/)) {
	    filetype = "JSON";
	} else if (fn.match(/txt$/)) {
	    filetype = "text";
	}

	html += "<h4 style='margin-top: 20px;'>File Actions ("+filetype+")</h4>";
	
	if (filetype == "archive") {
	    html += "<button class='btn btn-small'>decompress</button>";
	} else if (filetype.match(/sequence$/)) {
	    html += "<button class='btn btn-small'>demultiplex</button>";
	} else if (filetype == "text" || filetype == "excel" || filetype == "JSON") {
	    html += "<button class='btn btn-small'>check for metadata format</button>";
	    html += "<button class='btn btn-small'>check for barcode format</button>";
	}
	if (filetype.match(/^sff/)) {
	    html += "<button class='btn btn-small'>convert to fastq</button>";
	} else if (filetype.match(/^fastq/)) {
	    html += "<button class='btn btn-small'>join paired ends</button>";
	} else if (filetype.match(/^fasta/)) {
	    html += "<button class='btn btn-small'>check coverage format</button>";
// >sequence_number_1_[cov=2]
// CTAGCGCACATAGCATTCAGCGTAGCAGTCACTAGTACGTAGTACGTACC
// >sequence_number_2_[cov=4]
// ACGTAGCTCACTCCAGTAG
	}
	
	html += "<h4 style='margin-top: 20px;'>Delete File</h4>";
	html += "<button class='btn btn-small btn-danger' onclick='if(confirm(\"Really delete this file?\\nThis cannot be undone!\")){Retina.WidgetInstances.metagenome_upload[1].browser.removeNode({node:\""+node.id+"\"});}'>delete file</button>";
	
	return html;
    };

    widget.fileCompleted = function (data) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	// attach the required additional attributes to the uploaded file
	var node = data.data;
	var newNodeAttributes = node.attributes;
	newNodeAttributes['type'] = 'inbox';
	newNodeAttributes['user'] = widget.user.login;
	newNodeAttributes['email'] = widget.user.email;
	var url = widget.browser.shockBase+'/node/'+node.id;
	var fd = new FormData();
	fd.append('attributes', new Blob([ JSON.stringify(newNodeAttributes) ], { "type" : "text\/json" }));
	jQuery.ajax(url, {
	    contentType: false,
	    processData: false,
	    data: fd,
	    success: function(data){
		Retina.WidgetInstances.metagenome_upload[1].browser.preserveDetail = true;
		Retina.WidgetInstances.metagenome_upload[1].browser.updateData();
	    },
	    error: function(jqXHR, error){
		console.log(error);
		console.log(jqXHR);
	    },
	    crossDomain: true,
	    headers: widget.browser.authHeader,
	    type: "PUT"
	});
    };

     // login widget sends an action (log-in or log-out)
    widget.loginAction = function (params) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];
	if (params.token) {
	    widget.user = params.user;
	    widget.browser.user = widget.user;
	    widget.browser.presetFilters.user = widget.user.login;
	    widget.browser.authHeader = { "Authorization": "OAuth "+params.token };
	    widget.authHeader = { "Auth": params.token };
	} else {
	    widget.user = null;
	    widget.browser.user = null;
	    delete widget.browser.presetFilters.user;
	    widget.browser.authHeader = {};
	    widget.authHeader = {};
	}
	widget.display();
    };
})();