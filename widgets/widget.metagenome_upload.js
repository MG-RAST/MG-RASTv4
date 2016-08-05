(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Upload Widget",
                name: "metagenome_upload",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.inboxData = [];

    widget.setup = function () {
	return [ Retina.load_widget({ name: "shockbrowse", resource: "Retina/widgets" }) ];
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

	if (document.getElementById("pageTitle")) {
	    document.getElementById("pageTitle").innerHTML = "upload";
	}
	
	if (! stm.user) {
	    sidebar.parentNode.style.display = 'none';
	    content.className = "span10 offset1";
	    content.innerHTML = "<div class='alert alert-info' align=center>In order to submit your data to MG-RAST, you must first<br><button class='btn' style='margin-top: 10px;' onclick='document.getElementById(\"loginModalDisable\").style.display=\"none\";jQuery(\"#loginModal\").modal(\"show\");document.getElementById(\"login\").focus();'>log in</button><span style='position: relative; top: 5px; margin-left: 10px; margin-right: 10px;'>or</span><button class='btn' style='margin-top: 10px;' onclick='window.location=\"mgmain.html?mgpage=register\";'>register a new account</button></div>";
	    return;
	}

	// help text
	sidebar.setAttribute('style', 'padding: 10px; padding-top: 0px;');
	var sidehtml = '<h4><img style="height: 16px; margin-right: 10px; margin-top: -4px;" src="Retina/images/help.png">frequent questions</h4><dl>';
	sidehtml += '<dt>'+widget.expander()+'File Formats</dt><dd style="display: none;">You can upload any fasta, fastq, or SFF files. For metadata please use <a href="ftp://ftp.metagenomics.anl.gov/data/misc/metadata/MGRAST_MetaData_template_1.7.xlsx">MS Excel spreadsheets</a> with GSC MIxS-compliant metadata. (Check our <a href="?mgpage=metazen" target=_blank>Metazen tool</a> for assistance in creating and filling them out). If you want to upload multiple files at a time, you need to place them into an archive (e.g., tar or zip).<br><br></dd>';
	sidehtml += '<dt>'+widget.expander()+'Metadata</dt><dd style="display: none;">We require metadata for submission of multiple files, sharing with colleagues, or data publication. A good strategy is create the metadata file with metazen or copy an existing file. The metadata is not meant to perfectly describe your data but rather to allow others to discover it. For this purpose we use controlled vocabularies as much as possible.<br><br></dd>';
	sidehtml += '<dt>'+widget.expander()+'Studies and Projects</dt><dd style="display: none;">Older versions of MG-RAST used the term "projects", we are now migrating to the use of the term "study" instead. They are identical otherwise.</dd>';
	sidehtml += '</dl>';

	sidehtml += "<div class='alert alert-info'>Uploaded files will remain in your inbox for 72 hours before they are automatically deleted.</div>";

	// running actions
	sidehtml += '<h4><img style="height: 16px; margin-right: 10px; margin-top: -4px;" src="Retina/images/info2.png">running actions<button class="btn btn-mini" title="refresh" onclick="Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();" style="margin-left: 30px;position: relative; bottom: 2px;"><img style="height: 12px;" src="Retina/images/loop.png"></button></h4>';
	sidehtml += "<p>If you perform actions on files in your inbox that take some time to complete, you can view their status here.</p><div id='inboxActions' style='text-align: center;'><img src='Retina/images/waiting.gif' style='width: 32px;'></div>";

	sidebar.innerHTML = sidehtml;

	// check if actions are running
	Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();

	// title
	var html = "<div class='btn-group' data-toggle='buttons-checkbox' style='margin-bottom: 20px;'><a href='?mgpage=upload' class='btn btn-large active' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/cloud-upload.png'>upload data</a><a href='?mgpage=submission' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>perform submission</a><a href='?mgpage=pipeline' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a></div>";
	
	// new title
	html = '<div class="wizard span12">\
	  <div>\
	    <li class="active"></li>\
	    <a href="#" onclick="Retina.WidgetInstances.metagenome_upload[1].browser.uploadButton.click();" style="cursor: pointer;" class="active">upload<img src="Retina/images/cloud-upload.png"></a>\
	  </div>\
	  <div class="separator">›</div>\
	  <div>\
	    <li></li>\
	    <a href="?mgpage=submission">submit<img src="images/forward.png"></a>\
	  </div>\
	  <div class="separator">›</div>\
	  <div>\
	    <li></li>\
	    <a href="?mgpage=pipeline">progress<img src="Retina/images/settings3.png"></a>\
	  </div>\
	</div><div style="clear: both; height: 20px;"></div>';

	// intro
	html += "<p>Data submission is a two-step process. As the <b>first step</b>, data is uploaded into your private inbox on the MG-RAST server. This area is write only and accessible only to you. From the inbox data can then be submitted. Use the <a href='#' onclick='Retina.WidgetInstances.metagenome_upload[1].browser.uploadButton.click();'><img style='height: 16px; margin-right: 5px; position: relative; bottom: 2px;' src='Retina/images/cloud-upload.png'>upload</a> function, or use <a href='http://api.metagenomics.anl.gov/api.html#inbox' target=_blank>our API</a> to upload your data. To view your webkey required for using the API, click <a href='#' onclick='alert(stm.authHeader.Authorization);'>here</a>.</p><p>Submission of multiple files, sharing of data, or data publication requires metadata. You can use <a href='ftp://ftp.metagenomics.anl.gov/data/misc/metadata/MGRAST_MetaData_template_1.7.xlsx'>this Excel template</a> and/or <a href='?mgpage=metazen' target=_blank>the MetaZen tool</a> to fill out the metadata spreadsheet for a study.</p><p>As the <b>second step</b>, <a href='?mgpage=submission'><img style='height: 16px; margin-right: 5px; position: relative;' src='images/forward.png'>data needs to be submitted</a> for processing. At submission time you either add data to an existing study (or project) or create a new study. Upon successful submission, data is removed from the inbox. You will be notified via email once your submission has completed processing. In addition, you can monitor the progress of your submission at the <a href='?mgpage=pipeline'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a>.</p>";

	// shockbrowser space
	html += "<div id='browser'></div>";

	// move next button
	html += "<button class='btn btn-success pull-right btn-large' style='margin-top: 15px;' onclick='window.location=\"?mgpage=submission\";'>next <i class='icon icon-forward'></i></button>";

	content.innerHTML = html;
	
	// check if we have a user
	if (stm.user) {
	    if (widget.browser) {
	    	widget.browser.display({ target: document.getElementById("browser") });
	    } else {
	    	widget.browser = Retina.Widget.create("shockbrowse", { "target": document.getElementById("browser"),
	    							       "width": 900,
	    							       "height": 520,
								       "querymode": "full",
	    							       "enableUpload": true,
	    							       "customPreview": widget.filePreview,
	    							       "fileUploadCompletedCallback": widget.fileCompleted,
								       "allFileUploadCompletedCallback": widget.allFilesCompleted,
								       "fileDeletedCallback": widget.fileDeleted,
	    							       "detailType": "preview",
	    							       "showDetailBar": false,
	    							       "showFilter": false,
	    							       "showResizer": false,
	    							       "showStatusBar": false,
	    							       "showTitleBar": false,
	    							       "enableDownload": false,
								       "previewChunkSize": 100000,
								       "uploadChunkSize": 1024 * 1024 * 100,
	    							       "enableCompressedDownload": false,
	    							       "showUploadPreview": false,
	    							       "autoDecompress": true,
								       "autoUnarchive": true,
								       "hasExpiration": "5D",
								       "calculateMD5": true,
								       "allowMultiselect": true,
								       "allowMultiFileUpload": true,
								       "customButtons": [ { "title": "download sequence file details",
											    "id": "inboxDetailsButton",
											    "image": "Retina/images/info.png",
											    "callback": widget.downloadInboxDetails },
											  { "title": "join paired ends",
											    "id": "mergeMatepairsInfoButton",
											    "image": "Retina/images/merge.png",
											    "callback": widget.mergeMatepairInfo },
											  { "title": "demultiplex",
											    "id": "demultiplexInfoButton",
											    "image": "Retina/images/tree_rtl.png",
											    "callback": widget.demultiplexInfo }],
	    							       "user": stm.user,
								       "fileSectionColumns": [
									   { "path": "file.name", "name": "Name", "width": "75%", "type": "file", "sortable": true },
									   { "path": "attributes.data_type", "name": "Type", "width": "25%", "sortable": true }
								       ],
								       "fileDoneAttributes": {
									   "type": "inbox",
									   "id": stm.user.id,
									   "user": stm.user.login,
									   "email": stm.user.email },
								       "blacklist": {
									   "awe_stderr.txt": true,
									   "awe_stdout.txt": true,
									   "submission_parameters.json": true,
										    },
	    							       "uploadRestrictions": [ { "expression": /\.rar$/, "text": 'Invalid archive type. Allowed types are gz, zip and bz2' },
	    										       { "expression": /\.faa$/, "text": "MG-RAST cannot process protein sequences. Please use DNA only." }],
	    							       "preUploadCustom": widget.fileSelectedForUpload,
	    							       "presetFilters": { "attributes.type": "inbox", "attributes.id": stm.user.id },
	    							       "shockBase": RetinaConfig.shock_url});
	    	widget.browser.loginAction({ action: "login", result: "success", user: stm.user, authHeader: stm.authHeader});
	    }

	    // check if we have enough space to show the sidebar
	    widget.checkScreenWidth();
	    window.onresize = Retina.WidgetInstances.metagenome_upload[1].checkScreenWidth;

	    //Retina.WidgetInstances.login[1].verifyAuthentication(RetinaConfig.mgrast_api+"/user/authenticate", stm.authHeader);

	} else {
	    content.innerHTML = "<div class='alert alert-info' style='width: 500px;'>You must be logged in to upload data.</div>";
	}
    };

    widget.mergeMatepairInfo = function () {
	var widget = this;

	alert("To join paired end files, select the first file to join in the left window below and click the button 'join paired ends' in the righthand window.");
    };

    widget.demultiplexInfo = function () {
	var widget = this;

	alert("To demultiplex a file, select a barcode file in the left window below.");
    };

    // do some convenience checks before the file is uploaded
    widget.fileSelectedForUpload = function (selectedFile, customIndex) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	// detect filetype
	var ret = widget.detectFiletype(selectedFile.name);
	var fileType = ret.fileType;
	var sequenceType = ret.sequenceType;

	var promise = jQuery.Deferred();

	// check if the filename is valid
	if (! selectedFile.name.match(/^[\w\d\.]+$/)) {
	    var html = '<div class="alert alert-error"><strong>Invalid file name</strong> The file name may only contain letters, digits, underscore and ".".</div>';
	    return promise.resolve(html, false, customIndex);
	}

	// get the filereader
	var fileReader = new FileReader();
	fileReader.prom = promise;
	fileReader.customIndex = customIndex;
	fileReader.onerror = function (error) {
	    console.log(error);
	};
	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

	// check the type of file to be uploaded
	if (fileType == "text" ) {
	    fileReader.onload = function(e) {
		var data = e.target.result;
		var html = "";
		var allow = true;
		var validBarcode = Retina.WidgetInstances.metagenome_upload[1].validateBarcode(data).valid;
		var allow = true;
		if (validBarcode) {
		    html = "<div class='alert alert-success' style='margin-top: 20px;'>This is a valid barcode file.</div>";
		} else {
		    html = "<div class='alert alert-warning' style='margin-top: 20px;'>This file is not a valid barcode file. Barcode files must have a barcode sequence followed by a tab and a filename in each line, or be an automatically generated QIIME barcode file.</div>";
		    allow = false;
		}
		this.prom.resolve(html, allow, this.customIndex);
	    };
	    fileReader.readAsText(blobSlice.call(selectedFile, 0, selectedFile.size));
	} else if (fileType == "compressed") {
	    var containedType = widget.detectFiletype(selectedFile.name.substr(0, selectedFile.name.lastIndexOf(".")));
	    if (containedType.fileType == "") {
		var html = '<div class="alert alert-warning" style="text-align: left;"><strong>Compressed file without file ending</strong><br>You can upload this file, but the filename does not contain the filetype suffix and it will not be detected as a sequence file.</div>';
		promise.resolve(html, true, customIndex);
	    } else {
		return promise.resolve("", true, customIndex);
	    }
	} else if (fileType == "archive") {
	    var html = '<div class="alert alert-info" style="text-align: left;"><strong>Archive file detected</strong><br>Once the upload has completed, this file will automatically be decompressed and unpacked. If the archive contains sequence files, sequence statistics will automatically be computed.</div>';
	    promise.resolve(html, true, customIndex);
	} else if (fileType == "sequence") {

	    fileReader.onload = function(e) {
		var html = "";
		var data = e.target.result;
		var d = data.split(/\n/);
		var allow = true;
		var type = "unknown";
		var IUPAC = false;
		
		// FASTA
		if (d[0].match(/^>/)) {
		    type = "FASTA";
		} else if (d[0].match(/^@/)) {
		    type = "FASTQ";
		}
		if (type == "FASTA" || type == "FASTQ") {
		    var header = d[0];
		    var seq = [ d[1].trim() ];
		    var tooShort = 0;
		    var tooLong = 0;
		    var numSeqs = 1;
		    var invalidSeqs = 0;
		    var firstInvalidSeq = null;
		    var headers = {};
		    var numDuplicate = 0;
		    var invalidHeaders = 0;
		    var firstInvalidHeader = null;
		    if (type=="FASTA") {
			headers[header] = true;
			if (header.match(/^>$/)) {
			    invalidHeaders++;
			    firstInvalidHeader = 0;
			}
		    }
		    for (var i=(type=="FASTA"?2:0); i<d.length - 1; i++) {
			var newEntry = false;
			if (type == "FASTA") {
			    if (d[i].match(/^>$/)) {
				invalidHeaders++;
				if (firstInvalidHeader == null) {
				    firstInvalidHeader = i;
				}
			    }
			    if (d[i].match(/^>/)) {
				header = d[i];
				newEntry = true;
			    } else {
				seq.push(d[i].trim());
			    }
			} else {
			    header = d[i];
			    seq = [ d[i+1] ];
			    i += 3;
			}
			if (newEntry || type=="FASTQ") {
			    if (headers.hasOwnProperty(header)) {
				numDuplicate++;
			    } else {
				headers[header] = true;
			    }
			    numSeqs++;
			    
			    // sequence contains invalid characters
			    seq = seq.join("").trim();
			    if (! seq.match(/^[acgtunx]+$/i)) {
				if (seq.match(/^[acgtunxrykmswbdhv]+$/i)) {
				    IUPAC = true;
				}
				invalidSeqs++;
				if (firstInvalidSeq == null) {
				    firstInvalidSeq = i;
				}
			    }
			    if (seq.length < 75) {
				tooShort++;
			    }
			    if (seq.length > (1024 * 1024 * 3)) {
				tooLong++;
			    }
			    seq = [];
			}
		    }
		    if (type == "FASTA") {
			seq = seq.join("").trim();
			if (! seq.match(/^[acgtunx]+$/i)) {
			    if (seq.match(/^[acgtunxrykmswbdhv]+$/i)) {
				IUPAC = true;
			    }
			    invalidSeqs++;
			    if (firstInvalidSeq == null) {
				firstInvalidSeq = i;
			    }
			}
			if (seq.length < 75) {
			    tooShort++;
			}
			if (seq.length > (1024 * 1024 * 3)) {
			    tooLong++;
			}
		    }
		    
		    //numSeqs--;
		    tooShort--;
		    var lenInfo = "<p>All of the tested sequences fulfill the minimum length requirement of 75bp.</p>";
		    if (tooShort > 0) {
			lenInfo = "<p>"+tooShort.formatString() + " of the tested sequences are shorter than the minimum length of 75bp. These reads cannot be processed.</p>";
		    }
		    var validInfo = "<p>This is a valid "+type+" file. "+numSeqs.formatString() + " sequence"+(numSeqs > 1 ? "s of this file were" : " of this file was")+" tested. ";
		    if (invalidSeqs || numDuplicate || invalidHeaders || tooLong) {
			validInfo = "<p>"+numSeqs.formatString() + " sequence"+(numSeqs > 1 ? "s of this file were" : " of this file was")+" tested. ";
			if (invalidSeqs) {
			    validInfo += invalidSeqs.formatString() + " of them contain"+(invalidSeqs > 1 ? "" : "s")+" invalid characters (i.e. line "+(firstInvalidSeq + 1)+"). ";
			    if (IUPAC) {
				validInfo += "It seems the file contains IUPAC ambiguity characters other than N. Allowed characters are GATC UXN only. ";
			    }
			}
			if (numDuplicate) {
			    validInfo += numDuplicate + " of them contain"+(numDuplicate > 1 ? "" : "s")+" duplicate headers. ";
			}
			if (invalidHeaders) {
			    validInfo += invalidHeaders + " of them contain"+(invalidHeaders > 1 ? "" : "s")+" invalid headers (i.e. line "+(firstInvalidHeader + 1)+"). ";
			}
			if (tooLong) {
			    validInfo += tooLong + " of them "+(tooLong > 1 ? "are" : "is")+" too long for the MG-RAST pipeline (larger than 3Mb). ";
			}
			validInfo += "The "+type+" file is not in the correct format for processing.";
			allow = false;
		    }
		    validInfo += "</p>";
		    
		    // check for datasets too small
		    if (data.length < (1024 * 1024) && numSeqs < 100) {
			validInfo += '<p>This dataset is less than 1MB in size and contains less than 100 sequences. It is too small to be processed by the MG-RAST pipeline.</p>';
			allow = false;
		    }
		    
		    html += '<div class="alert alert-info" style="text-align: left;">'+validInfo+lenInfo+'</div>';
		} else {
		    html = '<div class="alert alert-error">Not a valid sequence file.</div>';
		    allow = false;
		}
		this.prom.resolve(html, allow, this.customIndex);
	    };
	    
	    var tenMB = 1024 * 1024 * 10;
	    fileReader.readAsText(blobSlice.call(selectedFile, 0, selectedFile.size < tenMB ? selectedFile.size : tenMB));
	} else {
	    return promise.resolve("", true, customIndex);
	}
	
	return promise;
    };

    widget.detectFiletype = function (fn) {
	var filetype = "";
	var sequenceType = null;
	if (fn.match(/(tar\.gz|zip|tar\.bz2|tar)$/)) {
	    filetype = "archive";
	} else if (fn.match(/(gz|gzip)$/)) {
	    filetype = "compressed";
	} else if (fn.match(/(fasta|fa|ffn|frn|fna|fas)$/)) {
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
	} else if (fn.match(/txt|barcode$/)) {
	    filetype = "text";
	}
	
	return { fileType: filetype, sequenceType: sequenceType };
    };

    widget.metadataValidationResult = function (data, nodeid) {
	var widget = this;

	var resultDiv = document.getElementById('metadataValidation');
	if (resultDiv) {
	    if (data.is_valid) {
		resultDiv.innerHTML = '<div class="alert alert-success">This file contains valid metadata.</div>';
	    } else {
		var txt = data.message.replace(/\[error\]/, "");
		var messages = (data.hasOwnProperty('errors') && data.errors.length) ? "<br>"+data.errors.join("<br>") : "";
//		jQuery.ajax(RetinaConfig['mgrast_api']+"/metadata/google/"+nodeid, {
			// success: function(data){
			//     var resultDiv = document.getElementById('metadataValidation');
			//     if (resultDiv) {
			// 	resultDiv.innerHTML = '<div class="alert alert-error"><b>This is not valid metadata</b><br>'+txt+messages+'</div><div style="text-align: center;"><button class="btn btn-primary" onclick="window.open(\'https://docs.google.com/spreadsheets/d/1lpLH6mStkgm81cTM5UoDrJpsLQoj9Camy0xMGyVB5bQ/edit?usp=sharing&newcopy=true\');">edit in google sheets</button></div>';
			//     }
			// },
			// error: function(jqXHR, error){
			//     var resultDiv = document.getElementById('metadataValidation');
			//     if (resultDiv) {
				resultDiv.innerHTML = '<div class="alert alert-error"><b>This is not valid metadata</b><br>'+txt+messages+'</div>';
		    // 	    }
		    // 	    console.log(error);
		    // 	    console.log(jqXHR);
		    // 	},
		    // 	crossDomain: true,
		    // 	headers: stm.authHeader,
		    // 	type: "GET"
		    // });
	    }
	}
    };

    widget.filePreview = function (params) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var html = "<h5 style='margin-bottom: 0px;'>File Information</h5>";

	var node = params.node;

	if (! node) {
	    console.log(params);
	}

	var fn = node.file.name;

	html += "<table style='font-size: 12px;'>";
	html += "<tr><td style='padding-right: 20px;'><b>filename</b></td><td>"+fn+"</td></tr>";
	html += "<tr><td><b>size</b></td><td>"+node.file.size.byteSize()+"</td></tr>";
	html += "<tr><td><b>creation</b></td><td>"+node.last_modified+"</td></tr>";
	html += "<tr><td><b>md5</b></td><td>"+node.file.checksum.md5+"</td></tr>";
	html += "</table>";

	// detect filetype
	var ret = widget.detectFiletype(fn);
	var filetype = ret.fileType;
	var sequenceType = ret.sequenceType;

	// check data
	var data = params.data;

	var task = widget.checkFileHasAction(fn);
	if (task) {
	    html += '<div class="alert alert-info" style="margin-top: 20px;">This file is being processed with '+task+'</div>';
	} else {
	    var fileHash = [];
	    for (var i=0; i<widget.browser.fileList.length; i++) {
		fileHash[widget.browser.fileList[i].file.name] = widget.browser.fileList[i];
	    }
	    if (filetype == "sff sequence") {
		var noSuffix = node.file.name.replace(/sff$/, "");
		html += "<h5 style='margin-top: 20px; margin-bottom: 0px;'>File Actions ("+filetype+")</h5>";
		if (fileHash.hasOwnProperty(noSuffix+"fastq")) {
		    html += "<div class='alert alert-info' style='margin-top: 20px;'>This file has already been converted to fastq.</div>";
		} else {
		    html += "<div id='convert'><button class='btn btn-small' onclick='Retina.WidgetInstances.metagenome_upload[1].sff2fastq(\""+node.id+"\");'>convert to fastq</button></div>";
		}
	    }
	    if (filetype == "excel") {
		// check if this file has already been validated
		if (node.attributes.hasOwnProperty('data_type') && node.attributes.data_type == 'metadata') {
		    html += '<div class="alert alert-success">This file contains valid metadata.</div>';
		} else {

		    // check if this is valid metadata
		    html += '<div id="metadataValidation" style="padding-top: 10px;"><div class="alert alert-info"><img src="Retina/images/waiting.gif" style="margin-right: 10px; width: 16px;"> validating metadata...</div></div>';
		    var url = RetinaConfig.mgrast_api+'/metadata/validate';
		    jQuery.ajax(url, {
			data: { "node_id": node.id },
			success: function(data){
			    Retina.WidgetInstances.metagenome_upload[1].metadataValidationResult(data, node.id);
			},
			error: function(jqXHR, error){
			    console.log(error);
			    console.log(jqXHR);
			},
			crossDomain: true,
			headers: stm.authHeader,
			type: "POST"
		    });
		}
	    }
	    if (filetype == "text") {
		// check if this is a barcode file
		if (! params.data) {
		    html += "<div class='alert alert-info' style='margin-top: 20px;'>This file is empty.</div>";
		} else {
		    var validation = Retina.WidgetInstances.metagenome_upload[1].validateBarcode(params.data);
		    var barcodes = validation.barcodes;
		    var validBarcode = validation.valid;
		    if (validBarcode) {
			var options = "";
			var indexOptions = "";
			var alreadyDemultiplexed = false;
			for (var i=0; i<widget.browser.fileList.length; i++) {
			    var fn = widget.browser.fileList[i].file.name;
			    if (fn.match(/\.fastq$/) || fn.match(/\.fq$/)) {
				var sel = "";
				if (fn.substr(0, fn.lastIndexOf(".")) == node.file.name.substr(0, node.file.name.lastIndexOf("."))) {
				    sel = " selected";
				}
				indexOptions += "<option value='"+widget.browser.fileList[i].id+"'>"+fn+"</option>";
				options += "<option value='"+widget.browser.fileList[i].id+"'"+sel+">"+fn+"</option>";
				fn = fn.replace(/\.fastq$/, "").replace(/\.fq$/, "");
				if (barcodes.hasOwnProperty(fn)) {
				    alreadyDemultiplexed = true;
				    break;
				}
			    }
			}
			if (alreadyDemultiplexed) {
			    html += "<div class='alert alert-info' style='margin-top: 20px;'>The demultiplex files of these barcodes have already been generated.</div>";
			} else {
			    html += "<h5>Demultiplex</h5><div id='convert'><p>This is a valid barcode file. Select a file below to demultiplex:</p>";
			    html += "<select id='demultiplexFile' style='width: 100%;'>";
			    html += options;
			    html += "</select>";
			    html += "<p>select index file if applicable</p>";
			    html += "<select id='demultiplexIndex' style='width: 100%;'><option>-</option>";
			    html += indexOptions;
			    html += "</select>";
			    html += "barcodes are reverse complements <input type='checkbox' id='demultiplexIsReverseComplement' style='margin-top: -2px;'><div style='height: 10px;'></div>";
			    html += "<button class='btn btn-mini' onclick='Retina.WidgetInstances.metagenome_upload[1].demultiplex(\""+node.id+"\");'>demultiplex</button></div>";
			}
		    } else {
			html += "<div class='alert alert-warning' style='margin-top: 20px;'>This file is not a valid barcode file. Barcode files must have a barcode sequence followed by a tab and a filename in each line, or be an automatically generated QIIME barcode file.</div>";
		    }
		}
	    }
	    if (filetype == "sequence") {
		html += "<h5 style='margin-top: 20px; margin-bottom: 0px;'>Sequence Information";

		// tell user detail info about the sequence
		if (node.attributes.hasOwnProperty('stats_info') && node.attributes.stats_info.hasOwnProperty('bp_count')) {
		    
		    // fastq files can have the "join paired ends" option
		    if (sequenceType == "fastq") {
			html += "<button class='btn btn-mini' style='float: right;' onclick='if(this.innerHTML==\"join paired ends\"){this.innerHTML=\"show sequence info\";this.previousSibling.textContent=\"Join Paired Ends\";}else{this.innerHTML=\"join paired ends\";this.previousSibling.textContent=\"Sequence Information\";}jQuery(\"#joinPairedEndsDiv\").toggle();jQuery(\"#seqInfoDiv\").toggle();'>join paired ends</button>";
		    }

		    // demultiplex button
		    html += "<button class='btn btn-mini' style='float: right;' onclick='alert(\"Please select the barcode file on the left to demultiplex\")'>demultiplex</button>";

		    html += "</h5><div id='joinPairedEndsDiv' style='display: none; font-size: 12px; padding-top: 10px;'>";
		    html += "<input type='text' style='display: none;' value='"+node.id+"' id='jpeFileA'>";
		    var opts = [];
		    var txtOpts = "<option>- none -</option>";
		    var indOpts = "<option>- none -</option>";
		    var bestHit = 0;
		    var selectedOpt = 0;
		    var partial = "";
		    var currFn = node.file.name;
		    for (var i=0; i<widget.browser.fileList.length; i++) {
			var fn = widget.browser.fileList[i].file.name;

			// a file cannot be joined on itself
			if (fn == currFn) {
			    continue;
			}

			if (fn.match(/\.fastq$/) || fn.match(/\.fq$/)) {
			    // check if the filename is similar to the current filename
			    for (var h=0; h<fn.length; h++) {
				if (fn.charAt(h) != currFn.charAt(h)) {
				    if (h>bestHit) {
					bestHit = h;
					selectedOpt = opts.length;
					partial = fn.substr(0, h);
				    }
				    break;
				}
			    }
			    opts.push(widget.browser.fileList[i]);
			    indOpts += "<option value='"+widget.browser.fileList[i].id+"'>"+fn+"</option>";
			} else if (fn.match(/\.txt$/)) {
			    txtOpts += "<option value='"+widget.browser.fileList[i].id+"'>"+fn+"</option>";
			}
		    }
		    for (var i=0; i<opts.length; i++) {
			var sel = "";
			if (i==selectedOpt) {
			    sel = " selected";
			}
			opts[i] = "<option value='"+opts[i].id+"'"+sel+">"+opts[i].file.name+"</option>";
		    }
		    opts = opts.join("\n");
		    html += "<span style='position: relative; bottom: 4px;'>file to join</span><select id='jpeFileB' style='font-size: 12px; height: 25px; margin-left: 10px; width: 350px;'>"+opts+"</select><br>";
		    html += "remove non-overlapping paired-ends <input type='checkbox' checked='checked' id='jpeRetain' style='margin-top: -2px;'><div style='height: 1px;'></div>";
		    html += "<h5>Optional Demultiplex</h5>";
		    html += "<span style='position: relative; bottom: 4px;'>index file</span><select id='jpeIndexFile' style='font-size: 12px; height: 25px; margin-left: 14px; width: 350px;'>"+indOpts+"</select><br>";
		    html += "<span style='position: relative; bottom: 4px;'>Barcode file (optional)</span><select id='jpeBarcode' style='font-size: 12px; height: 25px; margin-left: 10px; width: 286px;'>"+txtOpts+"</select><br>";
		    html += "barcodes are reverse complements <input type='checkbox' id='jpeIsReverseComplement' style='margin-top: -2px;'><div style='height: 10px;'></div>";
		    html += "<span style='position: relative; bottom: 4px;'>Output file name</span><div class='input-append'><input type='text' placeholder='output file name' id='jpeOutfile' style='font-size: 12px; height: 16px; margin-left: 3px;' value='"+(partial.length > 1 ? partial + ".fastq" : "")+"'>";
		    html += "<button class='btn btn-small' onclick='Retina.WidgetInstances.metagenome_upload[1].joinPairedEnds();'>join paired ends</button></div>";
		    html += "</div><div id='seqInfoDiv'>";

		    // check if all sequences have a unique id
		    var unique = parseInt(node.attributes.stats_info.unique_id_count);
		    var seqcount = parseInt(node.attributes.stats_info.sequence_count);
		    var minlen = parseInt(node.attributes.stats_info.length_min);
		    var maxlen = parseInt(node.attributes.stats_info.length_max);

		    html += "<div style='text-align: left; font-size: 12px;'>";
		    html += "<div style='font-weight: bold;'>basepair count</div><div>This file contains "+parseInt(node.attributes.stats_info.bp_count).formatString()+"bp of "+node.attributes.stats_info.sequence_content+" sequence containing "+parseInt(node.attributes.stats_info.ambig_char_count).formatString()+" ambiguous characters.</div>";
		    html += "<div style='font-weight: bold;'>sequence count</div><div>This file contains "+seqcount.formatString()+" sequences "+(minlen < maxlen ? "ranging from "+minlen.formatString()+"bp to "+maxlen.formatString()+"bp and averaging "+parseInt(node.attributes.stats_info.average_length).formatString()+"bp in length (std.deviation from average length "+node.attributes.stats_info.standard_deviation_length+")." : " all "+minlen+"bp in length.")+(unique == seqcount ? " All of them have unique ids." : " Only "+unique.formatString()+" have unique ids.")+" The average GC-content is "+node.attributes.stats_info.average_gc_content+"% (std.deviation "+node.attributes.stats_info.standard_deviation_gc_content+") and GC-ratio "+node.attributes.stats_info.average_gc_ratio+" (std.deviation "+node.attributes.stats_info.standard_deviation_gc_ratio+"). </div>";
		    html += "<div style='font-weight: bold;'>sequence type</div><div>We think this is a"+(node.attributes.stats_info.sequence_type == "WGS" ? " shotgun metagenome" : "n amplicon metagenome")+" "+(node.attributes.stats_info.sequencing_method_guess == "other" ? (node.attributes.stats_info.sequencing_method_guess == "assembled" ? "sequenced with "+node.attributes.stats_info.sequencing_method_guess+"." : "of assembled reads.") : "but were unable to guess the sequencing technology.")+"</div>";
		    html += "</div>";

		    html += "</div>";
		} else {
		    if (! widget.checkFileHasAction(node.file.name)) {
			var url = RetinaConfig.mgrast_api + "/inbox/stats/"+node.id;
			jQuery.ajax(url, {
			    success: function(data){
				Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();
			    },
			    error: function(jqXHR, error){ },
			    crossDomain: true,
			    headers: stm.authHeader,
			    type: "GET"
			});
		    }
		    html += "</h5><div class='alert alert-info'>calculation of sequence stats in progress <button class='btn btn-small' title='refresh' style='margin-left: 15px;' onclick='Retina.WidgetInstances.metagenome_upload[1].browser.updateData();'><img src='Retina/images/loop.png' style='width: 12px; margin-top: -2px;'></button></div>";
		}
	    }
	    
	    html += "<h5 style='margin-top: 10px;'>Delete File</h5>";
	    html += "<button class='btn btn-small btn-danger' onclick='if(confirm(\"Really delete this file?\\nThis cannot be undone!\")){Retina.WidgetInstances.metagenome_upload[1].browser.removeNode({node:\""+node.id+"\"});}'>delete file</button>";
	}

	return html;
    };

    widget.fileCompleted = function (data, currentIndex) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	// get node from data
	var nodes = data.data;

	// check if something went wrong
	if (nodes === null) {
	    console.log('error in archive unpacking');
	    return;
	}

	// check if this is an archive
	if (typeof nodes.length !== 'number') {
	    nodes = [ nodes ];
	}

	// iterate over the nodes
	for (var i=0; i<nodes.length; i++) {

	    var node = nodes[i];

	    // set permissions for mgrast
	    widget.browser.addAcl({node: node.id, acl: "all", uuid: "mgrast"});
	    
	    // calculate sequence stats
	    if (widget.detectFiletype(node.file.name).fileType == "sequence") {
		widget.statsCalculation(node.id);
	    }
	    // validate metadata
	    else if (widget.detectFiletype(node.file.name).fileType == "excel") {
		var url = RetinaConfig.mgrast_api+'/metadata/validate';
		jQuery.ajax(url, {
		    data: { "node_id": node.id },
		    success: function(data){ },
		    error: function(jqXHR, error){ },
		    crossDomain: true,
		    headers: stm.authHeader,
		    type: "POST"
		});
	    }
	}
    };

    widget.allFilesCompleted = function (data) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	widget.getRunningInboxActions();
	widget.browser.preserveDetail = true;
	widget.browser.updateData();
    };

    widget.fileDeleted = function (deleted, node) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	if (deleted && node) {
	    if (node.attributes.hasOwnProperty('actions')) {
		for (var i=0; i<node.attributes.actions.length; i++) {
		    widget.cancelInboxAction(node.attributes.actions[i].id);
		}
	    }
	}
    };

    // Inbox actions
    widget.statsCalculation = function (node) {
	var widget = this;

	var url = RetinaConfig.mgrast_api + "/inbox/stats/"+node;
	jQuery.ajax(url, {
	    success: function(data){
		var widget = Retina.WidgetInstances.metagenome_upload[1];
		widget.getRunningInboxActions();
		widget.browser.preserveDetail = true;
		widget.browser.updateData();
	    },
	    error: function(jqXHR, error){
		alert("sequence stats calculation failed");
	    },
	    crossDomain: true,
	    headers: stm.authHeader,
	    type: "GET"
	});
    };

    widget.sff2fastq = function (fid) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];
	document.getElementById('convert').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 32px;'>";

	var url = RetinaConfig.mgrast_api+'/inbox/sff2fastq';
	jQuery.ajax(url, {
	    data: { "sff_file": fid },
	    success: function(data){
		Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();
		document.getElementById('convert').innerHTML = '<div class="alert alert-info" style="margin-top: 20px;">This file is being processed with sff to fastq</div>';
	    },
	    error: function(jqXHR, error){
		console.log(error);
		console.log(jqXHR);
		document.getElementById('convert').innerHTML = '<div class="alert alert-info" style="margin-top: 20px;">sff to fastq processing failed</div>';
	    },
	    crossDomain: true,
	    headers: stm.authHeader,
	    type: "POST"
	});
    };

    widget.demultiplex = function (barcodeID) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var url = RetinaConfig.mgrast_api+'/inbox/demultiplex';
	var d = { "seq_file": document.getElementById('demultiplexFile').options[document.getElementById('demultiplexFile').selectedIndex].value,
		  "barcode_file": barcodeID,
		  "rc_index": document.getElementById('demultiplexIsReverseComplement').checked };
	var ind = document.getElementById('demultiplexIndex');
	if (ind.selectedIndex > 0) {
	    d.index_file = ind.options[ind.selectedIndex].value;
	}
	jQuery.ajax(url, {
	    data: d,
	    success: function(data){
		document.getElementById('convert').innerHTML = '<div class="alert alert-info" style="margin-top: 20px;">This file is being processed with demultiplex</div>';
		Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();
	    },
	    error: function(jqXHR, error){
		document.getElementById('convert').innerHTML = '<div class="alert alert-error" style="margin-top: 20px;">demultiplex failed</div>';
		console.log(error);
		console.log(jqXHR);
	    },
	    crossDomain: true,
	    headers: stm.authHeader,
	    type: "POST"
	});

	document.getElementById('convert').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 32px;'>";
    };

    widget.joinPairedEnds = function () {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var fileA = document.getElementById('jpeFileA').value;
	var fileB = document.getElementById('jpeFileB').options[document.getElementById('jpeFileB').selectedIndex].value;
	var outfile = document.getElementById('jpeOutfile').value;

	// check if the outfile name is valid
	if (! outfile.match(/^[\w\d\.]+$/)) {
	    alert("The selected output file name is invalid.\nFile names may only contain letters, digits, '.' and '_' characters.");
	    return;
	}

	var retain = document.getElementById('jpeRetain').getAttribute('checked') ? 1 : 0;
	var indexFile = document.getElementById('jpeIndexFile').options[document.getElementById('jpeIndexFile').selectedIndex].value;
	var d = { "pair_file_1": fileA,
		  "pair_file_2": fileB,
		  "output": outfile,
		  "retain": retain };

	if (document.getElementById('jpeIndexFile').selectedIndex > 0) {
	    d.index_file = indexFile;
	    if (indexFile == fileB) {
		alert("join file and index file may not be the same");
		return;
	    }
	}

	var barcode = document.getElementById('jpeBarcode');
	if (barcode.selectedIndex > 0) {
	    d.barcode_file = document.getElementById('jpeBarcode').options[document.getElementById('jpeBarcode').selectedIndex].value;
	    d.rc_index = document.getElementById('jpeIsReverseComplement').checked;
	}

	var url = RetinaConfig.mgrast_api+'/inbox/pairjoin' + (barcode.selectedIndex > 0 ? "_demultiplex" : "");
	jQuery.ajax(url, {
	    data: d,
	    success: function(data){
		document.getElementById('joinPairedEndsDiv').innerHTML = '<div class="alert alert-info" style="margin-top: 20px;">This file is being processed with join paired ends</div>';
		Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();
	    },
	    error: function(jqXHR, error){
		document.getElementById('joinPairedEndsDiv').innerHTML = '<div class="alert alert-error" style="margin-top: 20px;">join paired ends failed</div>';
		console.log(error);
		console.log(jqXHR);
	    },
	    crossDomain: true,
	    headers: stm.authHeader,
	    type: "POST"
	});

	document.getElementById('joinPairedEndsDiv').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 32px;'>";
    };

    widget.getRunningInboxActions = function () {
	var widget = Retina.WidgetInstances.metagenome_upload[1];
	
	document.getElementById('inboxActions').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 32px;'>";
	var url = RetinaConfig.mgrast_api+'/inbox/pending?in-progress=1&suspend=1&pending=1&queued=1';
	jQuery.ajax(url, {
	    success: function(data){
		Retina.WidgetInstances.metagenome_upload[1].inboxData = data.data;
		Retina.WidgetInstances.metagenome_upload[1].showRunningInboxActions();
	    },
	    error: function(jqXHR, error){
		console.log(error);
		console.log(jqXHR);
		Retina.WidgetInstances.metagenome_upload[1].showRunningInboxActions();
	    },
	    crossDomain: true,
	    headers: stm.authHeader,
	    type: "GET",
	});

    };

    widget.cancelInboxAction = function (id) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];
	
	var url = RetinaConfig.mgrast_api+'/inbox/cancel/'+id;
	jQuery.ajax(url, {
	    success: function(data){
		Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();
	    },
	    error: function(jqXHR, error){
		console.log(error);
		console.log(jqXHR);
		Retina.WidgetInstances.metagenome_upload[1].showRunningInboxActions();
	    },
	    crossDomain: true,
	    headers: stm.authHeader,
	    type: "GET",
	});

    };

    widget.showRunningInboxActions = function () {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var target = document.getElementById('inboxActions');
	var data = [];
	var d = widget.inboxData;
	for (var i=0; i<d.length; i++) {
	    if (d[i].tasks[0].inputs[0].filename != "submission_parameters.json") {
		data.push(d[i]);
	    }
	}

	var html = "<p style='text-align: center; font-style: italic;'>- no actions running on files in your inbox -</p>";
	if (data && data.length > 0) {
	    html = "<table class='table table-condensed' style='font-size: 12px;'><tr><th>file</th><th>action</th><th>status</th><th></th></tr>";
	    for (var i=0; i<data.length; i++) {
		var fn = data[i].tasks[0].inputs[0].filename;
		var task = data[i].tasks[0].cmd.description;
		var colors = { "in-progress": "green",
			       "suspend": "red",
			       "pending": "orange",
			       "queued": "blue" };
		var title = data[i].state;
		var isError = "";
		var errorText = "";
		if (title == "suspend") {
		    isError = " class='alert alert-error'";
		    if (data[i].hasOwnProperty('stdout')) {
			data[i].stdout = data[i].stdout.replace(/^Error[\s\t]*/, "");
			data[i].stdout = data[i].stdout.replace(/'/ig, "");
			errorText = " cursor: help;' title='"+data[i].stdout;
		    }
		}
		var status = '<span style="color: '+colors[title]+';font-size: 19px; cursor: default;" title="'+title+'">&#9679;</span>';
		html += "<tr"+isError+"><td style='padding-right: 5px;"+errorText+"'>"+fn+"</td><td>"+task+"</td><td style='text-align: center;'>"+status+"</td><td><button class='btn btn-mini btn-danger' title='cancel action' onclick='if(confirm(\"really cancel this action?\")){Retina.WidgetInstances.metagenome_upload[1].cancelInboxAction(\""+data[i].id+"\");}'>&times;</button></td></tr>";
	    }
	    html += "</table>";
	}
	
	target.innerHTML = html;
    };

    widget.checkFileHasAction = function (filename) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];
	
	var data = widget.inboxData;

	var task = false;
	for (var i=0; i<data.length; i++) {
	    if (filename == data[i].tasks[0].inputs[0].filename) {
		task = data[i].tasks[0].cmd.description;
		break;
	    }
	}
	
	return task;
    };

    // generate a tab separated file that shows details about the files in the inbox
    widget.downloadInboxDetails = function () {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var files = widget.browser.fileList;
	var sequences = [];
	for (var i=0; i<files.length; i++) {
	    if (files[i].attributes.hasOwnProperty('data_type') && files[i].attributes.data_type == "sequence") {
		sequences.push(files[i]);
	    }
	}
    
	var txt = [ "no sequence files in your inbox" ];
	if (sequences.length) {
	    var seqHead = Retina.keys(sequences[0].attributes.stats_info).sort();
	    txt = [ seqHead.join("\t") ];
	    for (var i=0; i<sequences.length; i++) {
		var row = [];
		if (sequences[i].attributes.stats_info.hasOwnProperty("bp_count")) {
		    for (var h=0; h<seqHead.length; h++) {
			row.push(sequences[i].attributes.stats_info[seqHead[h]]);
		    }
		} else {
		    row = [ "sequence statistics calculation incomplete" ]
		}
		txt.push(row.join("\t"));
	    }
	}
	
	stm.saveAs(txt.join("\n"), "inbox.txt");
    };

    // helper functions
    widget.expander = function () {
	return '<span onclick="if(this.getAttribute(\'exp\')==\'n\'){this.parentNode.nextSibling.style.display=\'\';this.innerHTML=\'▾\';this.setAttribute(\'exp\',\'y\');}else{this.parentNode.nextSibling.style.display=\'none\';this.innerHTML=\'▸\';this.setAttribute(\'exp\',\'n\');}" style="cursor: pointer; margin-right: 5px;" exp=n>▸</span>';
    };

    widget.checkScreenWidth = function () {
	var widget = this;

	var w = jQuery(window).width();
	var sb = document.getElementById('sidebarResizer');
	var c = document.getElementById('content');
	if (w < 1200) {
	    c.style.paddingLeft = "10px";
	    c.className = "span9";
	    if (sb.getAttribute('status') == "on") {
		sb.click();
	    }
	} else if (w < 1520) {
	    c.style.paddingLeft = "10px";
	    c.className = "span9";
	    if (sb.getAttribute('status') == "off") {
		sb.click();
	    }
	} else {
	    c.style.paddingLeft = "0px";
	    c.className = "span7 offset1";
	    if (sb.getAttribute('status') == "off") {
		sb.click();
	    }
	}
    };

    widget.validateBarcode = function (data) {
	var d;
	if (data.match(/\n/)) {
	    d = data.split(/\n/);
	} else {
	    d = data.split(/\r/);
	}

	var barcode = 0;
	var samplename = 1;
	var barcodes = {};
	
	// test for QIIME barcode file
	if (d[0].match(/^\#SampleID\tBarcodeSequence/i)) {
	    d.shift();
	    barcode = 1;
	    samplename = 0;
	}
	
	var validBarcode = true;
	for (var i=0; i<d.length; i++) {
	    if (d[i].length == 0) {
		continue;
	    }
	    var l = d[i].split(/\t/);
	    if (! (l[barcode].match(/^[atcg]+$/i) && l[samplename].match(/^(\S)+$/))) {
		validBarcode = false;
		console.log(l);
		break;
	    } else {
		barcodes[l[samplename]] = l[barcode];
	    }
	}

	return { "valid": validBarcode, "barcodes": barcodes };
    };
    
})();
