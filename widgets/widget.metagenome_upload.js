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
	var sidehtml = '<h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/help.png">frequent questions</h3><ul style="list-style: none; margin-left: 10px;">';
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
	sidehtml += '<h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/info2.png">running actions</h3>';
	sidehtml += "<p>If you perform actions on files in your inbox that take some time to complete, you can view their status here.</p><p style='text-align: center; font-style: italic;'>- no actions running on files in your inbox -</p>";

	sidebar.innerHTML = sidehtml;

	// title
	var html = "<div class='btn-group' data-toggle='buttons-checkbox' style='margin-bottom: 20px;'><a href='?mgpage=upload' class='btn btn-large active' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/upload.png'>upload data</a><a href='?mgpage=submission' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>perform submission</a><a href='?mgpage=pipeline' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a></div>";

	// intro
	html += "<p>Before you can submit data to our metagenomics pipeline you must first load it into your private inbox on the MG-RAST server. To do so you can either use <a href=''>our API</a> or the <a href='#' onclick='Retina.WidgetInstances.metagenome_upload[1].browser.uploadButton.click();'><img style='height: 16px; margin-right: 5px; position: relative; bottom: 2px;' src='Retina/images/upload.png'>upload</a> function on this page. The inbox is a temporary storage location allowing you to assemble all files required for submission. You can upload any fasta, fastq or SFF files and GSC MIxS compliant metadata files into your inbox. If you want to upload multiple files at a time you need to place them into an archive (e.g. tar or zip).</p><p>After manipulating the files in your inbox, you can <a href=''><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>submit data</a> to our pipeline to create and/or add to existing projects. When the submission process has been successfully completed, MG-RAST ID's (\"Accession numbers\") will be automatically assigned and the data will be removed from your inbox.</p><p>You can monitor the progress of your submission at the <a href=''><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a>.</p>";

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
								   "uploadRestrictions": [ { "expression": /\.rar$/, "text": 'Invalid archive type. Allowed types are gz, zip and bz2' },
											   { "expression": /\.faa$/, "text": "MG-RAST cannot process protein sequences. Please use DNA only." }],
								   "presetFilters": { "type": "inbox" },
								   "shockBase": RetinaConfig.shock_url});
	    widget.browser.loginAction({ action: "login", result: "success", user: stm.user, authHeader: stm.authHeader});
	}
	if (! stm.user) {
	    content.innerHTML = "<div class='alert alert-info' style='width: 500px;'>You must be logged in to upload data.</div>";
	}
    };

    widget.filePreview = function (params) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var html = "<h4>File Information</h4>";

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
	var sequenceType = null;
	if (fn.match(/(tar\.gz|tgz|zip|tar\.bz2|tbz|tbz2|tb2|gzip|bzip2|gz)$/)) {
	    filetype = "archive";
	} else if (fn.match(/(fasta|fa|ffn|frn|fna)$/)) {
	    sequenceType = "fasta";
	    filetype = "sequence";
	} else if (fn.match(/sff$/)) {
	    sequenceType = "sff";
	    filetype = "sff sequence";
	} else if (fn.match(/(fq|fastq)$/)) {
	    sequenceType = "fastq";
	    filetype = "sequence";
	} else if (fn.match(/(xls|xlsx)$/)) {
	    filetype = "excel";
	} else if (fn.match(/json$/)) {
	    filetype = "JSON";
	} else if (fn.match(/txt$/)) {
	    filetype = "text";
	}

	// check data
	var data = params.data;
	
	if (filetype == "archive") {
	    html += "<h4 style='margin-top: 20px;'>File Actions ("+filetype+")</h4>";
	    html += "<button class='btn btn-small'>decompress</button>";
	}
	if (filetype == "sff sequence") {
	    html += "<h4 style='margin-top: 20px;'>File Actions ("+filetype+")</h4>";
	    html += "<button class='btn btn-small'>convert to fastq</button>";
	}
	if (filetype == "sequence") {
	    html += "<h4 style='margin-top: 20px;'>Sequence File Information</h4>";
	    if (node.file.size < (1024 * 1024)) {
		html += '<div class="alert alert-error"><strong>Sequence file too small</strong> You cannot use this file, as it is too small for MG-RAST to process. The minimum size is 1Mbp.</div>';
	    } else {
		
		// check the available sequences
		var d = params.data.split(/\n/);

		// FASTA
		if (d[0].match(/^>/)) {
		    var header = d[0];
		    var seq = d[1];
		    var tooShort = 0;
		    var numSeqs = 1;
		    var invalidSeqs = 0;
		    var headers = {};
		    var numDuplicate = 0;
		    headers[d[0]] = true;
		    for (var i=2; i<d.length; i++) {
			if (d[i].match(/^>/)) {
			    if (headers.hasOwnProperty(d[i])) {
				numDuplicate++;
			    } else {
				headers[d[i]] = true;
			    }
			    numSeqs++;
			    // sequence contains invalid characters
			    if (! seq.match(/^[acgtunx-]+$/i)) {
				invalidSeqs++;
			    }
			    if (seq.length < 75) {
				tooShort++;
			    }
			    
			    header = d[i];
			    seq = "";
			} else {
			    seq += d[i];
			}
		    }
		    numSeqs--;
		    tooShort--;
		    var lenInfo = "All of the "+numSeqs+" tested sequences have the minimum length of 75bp.";
		    if (tooShort > 0) {
			lenInfo = tooShort + " of the "+numSeqs+" tested sequences are shorter than the minimum length of 75bp. These reads cannot be processed.";
		    }
		    var validInfo = "This is a valid FASTA file.";
		    if (invalidSeqs || numDuplicate) {
			validInfo = numSeqs + " sequences of this file were tested. ";
			if (invalidSeqs) {
			    validInfo += invalidSeqs + " of them contain invalid characters. The FASTA file is not in the correct format for processing.";
			}
			if (numDuplicate) {
			    validInfo += numDuplicate + " of them contain duplicate headers";
			}
		    }
		    html += '<div class="alert alert-info">'+validInfo+'<br>'+lenInfo+'</div>';
		}
		else if (d[0].match(/^@/)) {
		    //		    @EAS139_FC706VJ:2:2104:15343:197393#0/1
		    //              @EAS139:136:FC706VJ:2:2104:15343:197393 1:Y:18:ATCACG
		    var isIllumina = false;
		    if (d[0].match() || d[0].match()) {
			isIllumina = true;
		    }
		    for (var i=0; i<d.length; i+=4) {
			var l = d.length - i;
			if (l>3) {
			    var id = d[i];
			    var seq = d[i+1];
			}
		    }
		    if (! isIllumina) {
			// add demultiplex button
			html += "<button class='btn btn-small'>demultiplex</button>";
		    }
		}
		else {
		    html += '<div class="alert alert-error">Could not detect sequence file type. Is this a valid sequence file?</div>';
		}
	    }
	}
	
	html += "<h4 style='margin-top: 20px;'>Delete File</h4>";
	html += "<button class='btn btn-small btn-danger' onclick='if(confirm(\"Really delete this file?\\nThis cannot be undone!\")){Retina.WidgetInstances.metagenome_upload[1].browser.removeNode({node:\""+node.id+"\"});}'>delete file</button>";
	

	return html;
    };

    widget.fileCompleted = function (data) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	// get node from data
	var node = data.data;

	// set permissions for mgrast
	widget.browser.addAcl({node: node.id, acl: "read", uuid: "mgrast"});
	widget.browser.addAcl({node: node.id, acl: "write", uuid: "mgrast"});
	widget.browser.addAcl({node: node.id, acl: "delete", uuid: "mgrast"});

	// attach the required additional attributes to the uploaded file
	var newNodeAttributes = node.attributes;
	newNodeAttributes['type'] = 'inbox';
	newNodeAttributes['id'] = stm.user.id;
	newNodeAttributes['email'] = stm.user.email;

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
	    headers: stm.authHeader,
	    type: "PUT"
	});
    };

})();