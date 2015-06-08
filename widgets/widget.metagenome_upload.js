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

	if (! stm.user) {
	    content.innerHTML = "<div class='alert alert-info'>You need to be logged in to use this page</div>";
	    return;
	}

	// help text
	sidebar.setAttribute('style', 'padding: 10px;');
	var sidehtml = '<h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/help.png">frequent questions</h3><ul style="list-style: none; margin-left: 10px;">';
	sidehtml += '<li><a href="http://metagenomics.anl.gov/metazen.cgi" target=_blank>Use MetaZen to create your metadata spreadsheet</a></li>';
	sidehtml += '<li><a href="http://www.youtube.com/watch?v=pAf19exJo4o&feature=youtu.be" target=_blank>Uploading a metagenome (Video)</a></li>';
	sidehtml += '<li><a href="http://blog.metagenomics.anl.gov/glossary-of-mg-rast-terms-and-concepts/#inbox" target=_blank>Inbox explained</a></li>';
	sidehtml += '<li><a href="http://blog.metagenomics.anl.gov/mg-rast-v3-2-faq/#command_line_submission" target=_blank>Automated submission via our API</a></li>';
	sidehtml += '<li><a href="http://blog.metagenomics.anl.gov/mg-rast-v3-2-faq/#preparing_metadata" target=_blank>Preparing metadata</a></li>';
	sidehtml += '<li><a href="http://blog.metagenomics.anl.gov/mg-rast-v3-2-faq/#job_priority" target=_blank>Priority assignments explained</a></li>';
	sidehtml += '<li><a href="http://blog.metagenomics.anl.gov/glossary-of-mg-rast-terms-and-concepts/#accession_numbers" target=_blank>Obtaining Accession numbers</a></li>';
	sidehtml += '<li><a href="http://blog.metagenomics.anl.gov/mg-rast-v3-2-faq/#projects_on_upload_page" target=_blank>Which projects are shown in the dialogue?</a></li>';
	sidehtml += '<li><a href="http://blog.metagenomics.anl.gov/upload-data-v3-2/" target=_blank>How should barcode files be formatted?</a></li>';
	sidehtml += '</ul>';

	// running actions
	sidehtml += '<h3><img style="height: 20px; margin-right: 10px; margin-top: -4px;" src="Retina/images/info2.png">running actions<button class="btn btn-mini" title="refresh" onclick="Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();" style="margin-left: 30px;position: relative; bottom: 2px;"><img style="height: 12px;" src="Retina/images/loop.png"></button></h3>';
	sidehtml += "<p>If you perform actions on files in your inbox that take some time to complete, you can view their status here.</p><div id='inboxActions' style='text-align: center;'><img src='Retina/images/waiting.gif' style='width: 32px;'></div>";

	sidebar.innerHTML = sidehtml;

	// check if actions are running
	Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();

	// title
	var html = "<div class='btn-group' data-toggle='buttons-checkbox' style='margin-bottom: 20px;'><a href='?mgpage=upload' class='btn btn-large active' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/upload.png'>upload data</a><a href='?mgpage=submission' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>perform submission</a><a href='?mgpage=pipeline' class='btn btn-large' style='width: 175px;'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a></div>";
	
	// new title
	html = '<div class="wizard span12">\
	  <div>\
	    <li class="active"></li>\
	    <a href="#" onclick="Retina.WidgetInstances.metagenome_upload[1].browser.uploadButton.click();" style="cursor: pointer;" class="active">upload<img src="Retina/images/upload.png"></a>\
	  </div>\
	  <div class="separator">›</div>\
	  <div>\
	    <li></li>\
	    <a href="?mgpage=submission">submit<img src="Retina/images/settings.png"></a>\
	  </div>\
	  <div class="separator">›</div>\
	  <div>\
	    <li></li>\
	    <a href="?mgpage=pipeline">progress<img src="Retina/images/settings3.png"></a>\
	  </div>\
	</div><div style="clear: both; height: 20px;"></div>';

	// intro
	html += "<p>Before you can submit data to our metagenomics pipeline you must first load it into your private inbox on the MG-RAST server. To do so you can either use <a href='http://api.metagenomics.anl.gov/api.html' target=_blank>our API</a> or the <a href='#' onclick='Retina.WidgetInstances.metagenome_upload[1].browser.uploadButton.click();'><img style='height: 16px; margin-right: 5px; position: relative; bottom: 2px;' src='Retina/images/upload.png'>upload</a> function on this page. The inbox is a temporary storage location allowing you to gather all files required for submission. You can upload any fasta, fastq or SFF files and GSC MIxS compliant metadata files into your inbox. If you want to upload multiple files at a time you need to place them into an archive (e.g. tar or zip).</p><p>After manipulating the files in your inbox, you can <a href='?mgpage=submission'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings.png'>submit data</a> to our pipeline to create and/or add to existing projects. When the submission process has been successfully completed, MG-RAST ID's (\"Accession numbers\") will be automatically assigned and the data will be removed from your inbox.</p><p>You can monitor the progress of your submission at the <a href='?mgpage=pipeline'><img style='height: 16px; margin-right: 5px; position: relative;' src='Retina/images/settings3.png'>job status</a>.</p>";

	// shockbrowser space
	html += "<div id='browser'></div>";

	content.innerHTML = html;
	
	// check if we have a user
	if (stm.user) {
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
								       "previewChunkSize": 100000,
	    							       "enableCompressedDownload": false,
	    							       "showUploadPreview": false,
	    							       "autoDecompress": true,
	    							       "user": stm.user,
								       "blacklist": {
									   "awe_stderr.txt": true,
									   "awe_stdout.txt": true,
									   "submission_parameters.json": true,
										    },
	    							       "uploadRestrictions": [ { "expression": /\.rar$/, "text": 'Invalid archive type. Allowed types are gz, zip and bz2' },
	    										       { "expression": /\.faa$/, "text": "MG-RAST cannot process protein sequences. Please use DNA only." }],
	    							       "preUploadCustom": widget.fileSelectedForUpload,
	    							       "presetFilters": { "type": "inbox" },
	    							       "shockBase": RetinaConfig.shock_url});
	    	widget.browser.loginAction({ action: "login", result: "success", user: stm.user, authHeader: stm.authHeader});
	    }
	} else {
	    content.innerHTML = "<div class='alert alert-info' style='width: 500px;'>You must be logged in to upload data.</div>";
	}
    };

    // do some convenience checks before the file is uploaded
    widget.fileSelectedForUpload = function (selectedFile) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	// detect filetype
	var ret = widget.detectFiletype(selectedFile.name);
	var fileType = ret.fileType;
	var sequenceType = ret.sequenceType;

	var promise = jQuery.Deferred();

	// get the filereader
	var fileReader = new FileReader();
	fileReader.prom = promise;
	fileReader.onerror = function (error) {
	    console.log(error);
	};
	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

	// check the type of file to be uploaded
	if (fileType == "text" ) {
	    fileReader.onload = function(e) {
		var data = e.target.result;
		var d = data.split(/\n/);
		var html = "";
		var allow = true;

		var validBarcode = true;
		for (var i=0; i<d.length; i++) {
		    if (d[i].length == 0) {
			continue;
		    }
		    if (d[i].match(/^([atcg])+\t+(\S+)$/i)) {
			var c = d[i].replace(/\t+/, "\t");
			c = c.split(/\t/);
		    } else {
			validBarcode = false;
			break;
		    }
		}
		var allow = true;
		if (validBarcode) {
		    html = "<div class='alert alert-success' style='margin-top: 20px;'>This is a valid barcode file.</div>";
		} else {
		    html = "<div class='alert alert-warning' style='margin-top: 20px;'>This file is not a valid barcode file. Barcode files must have a barcode sequence followed by a tab and a filename in each line.</div>";
		    allow = false;
		}
		this.prom.resolve(html, allow);
	    };
	    fileReader.readAsText(blobSlice.call(selectedFile, 0, selectedFile.size));
	} else if (fileType == "sequence") {

	    if (selectedFile.size < (1024 * 1024)) {
		var html = '<div class="alert alert-error"><strong>Sequence file too small</strong> You cannot use this file, as it is too small for MG-RAST to process. The minimum size is 1Mbp.</div>';
		promise.resolve(html, false);
	    } else {
		fileReader.onload = function(e) {
		    var html = "";
		    var data = e.target.result;
		    var d = data.split(/\n/);
		    var allow = true;
		    var type = "unknown";
		    
		    // FASTA
		    if (d[0].match(/^>/)) {
			type = "FASTA";
		    } else if (d[0].match(/^@/)) {
			type = "FASTQ";
		    }
		    if (type == "FASTA" || type == "FASTQ") {
			var header = d[0];
			var seq = d[1];
			var tooShort = 0;
			var numSeqs = 1;
			var invalidSeqs = 0;
			var headers = {};
			var numDuplicate = 0;
			if (type=="FASTA") {
			    headers[header] = true;
			}
			for (var i=(type=="FASTA"?2:0); i<d.length - 1; i++) {
			    var newEntry = false;
			    if (type == "FASTA") {
				if (d[i].match(/^>/)) {
				    header = d[i];
				    newEntry = true;
				} else {
				    seq += d[i];
				}
			    } else {
				header = d[i];
				seq = d[i+1];
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
				if (! seq.match(/^[acgtunx-]+$/i)) {
				    invalidSeqs++;
				}
				if (seq.length < 75) {
				    tooShort++;
				}
				seq = "";
			    }
			}
			numSeqs--;
			tooShort--;
			var lenInfo = " All of the tested sequences have the minimum length of 75bp.";
			if (tooShort > 0) {
			    lenInfo = " "+tooShort.formatString() + " of the tested sequences are shorter than the minimum length of 75bp. These reads cannot be processed.";
			}
			var validInfo = "This is a valid "+type+" file. "+numSeqs.formatString() + " sequences of this file were tested. ";
			if (invalidSeqs || numDuplicate) {
			    validInfo = numSeqs.formatString() + " sequences of this file were tested. ";
			    if (invalidSeqs) {
				validInfo += invalidSeqs.formatString() + " of them contain invalid characters. ";
			    }
			    if (numDuplicate) {
				validInfo += numDuplicate + " of them contain duplicate headers. ";
			    }
			    validInfo += "The "+type+" file is not in the correct format for processing.";
			    allow = false;
			}
			html += '<div class="alert alert-info">'+validInfo+lenInfo+'</div>';
		    } else {
			html = '<div class="alert alert-error">Not a valid sequence file.</div>';
			allow = false;
		    }
		    this.prom.resolve(html, allow);
		};
	    }
	    var tenMB = 1024 * 1024 * 10;
	    fileReader.readAsText(blobSlice.call(selectedFile, 0, selectedFile.size < tenMB ? selectedFile.size : tenMB));
	} else {
	    return promise.resolve("", true);
	}
	
	return promise;
    };

    widget.detectFiletype = function (fn) {
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
	
	return { fileType: filetype, sequenceType: sequenceType };
    };

    widget.metadataValidationResult = function (data) {
	var widget = this;

	var resultDiv = document.getElementById('metadataValidation');
	if (resultDiv) {
	    if (data.is_valid) {
		resultDiv.innerHTML = '<div class="alert alert-success">This file contains valid metadata.</div>';
	    } else {
		var txt = data.message.replace(/\[error\]/, "");
		var messages = (data.hasOwnProperty('errors') && data.errors.length) ? "<br>"+data.errors.join("<br>") : "";
		resultDiv.innerHTML = '<div class="alert alert-error"><b>This is not valid metadata</b><br>'+txt+messages+'</div>';
	    }
	}
    };

    widget.filePreview = function (params) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var html = "<h5 style='margin-bottom: 0px;'>File Information</h5>";

	var node = params.node;
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
		// check if this is valid metadata
		html += '<div id="metadataValidation" style="padding-top: 10px;"><div class="alert alert-info"><img src="Retina/images/waiting.gif" style="margin-right: 10px; width: 16px;"> validating metadata...</div></div>';
		var url = RetinaConfig.mgrast_api+'/metadata/validate';
		jQuery.ajax(url, {
		    data: { "node_id": node.id },
		    success: function(data){
			Retina.WidgetInstances.metagenome_upload[1].metadataValidationResult(data);
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
	    if (filetype == "text") {
		// check if this is a barcode file
		if (! params.data) {
		    html += "<div class='alert alert-info' style='margin-top: 20px;'>This file is empty.</div>";
		} else {
		    var d = params.data.split(/\n/);
		    var validBarcode = true;
		    var barcodes = {};
		    for (var i=0; i<d.length; i++) {
			if (d[i].length == 0) {
			    continue;
			}
			if (d[i].match(/^([atcg])+\t+(\S+)$/i)) {
			    var c = d[i].replace(/\t+/, "\t");
			    c = c.split(/\t/);
			    barcodes[c[1]] = c[0];
			} else {
			    validBarcode = false;
			}
		    }
		    if (validBarcode) {
			var options = "";
			var alreadyDemultiplexed = false;
			for (var i=0; i<widget.browser.fileList.length; i++) {
			    var fn = widget.browser.fileList[i].file.name;
			    if (fn.match(/\.fastq$/) || fn.match(/\.fq$/)) {
				var sel = "";
				if (fn.substr(0, fn.lastIndexOf(".")) == node.file.name.substr(0, node.file.name.lastIndexOf("."))) {
				    sel = " selected";
				}
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
			    html += "<select style='width: 100%;'>";
			    html += options;
			    html += "</select><button class='btn btn-small' onclick='Retina.WidgetInstances.metagenome_upload[1].demultiplex(this.previousSibling.options[this.previousSibling.selectedIndex].value, \""+node.id+"\");'>demultiplex</button></div>";
			}
		    } else {
			html += "<div class='alert alert-warning' style='margin-top: 20px;'>This file is not a valid barcode file. Barcode files must have a barcode sequence followed by a tab and a filename in each line.</div>";
		    }
		}
	    }
	    if (filetype == "sequence") {
		html += "<h5 style='margin-top: 20px; margin-bottom: 0px;'>Sequence Information";

		// tell user detail info about the sequence
		if (node.attributes.hasOwnProperty('stats_info')) {
		    
		    // fastq files can have the "join paired ends" option
		    if (sequenceType == "fastq") {
			html += "<button class='btn btn-small' style='float: right;' onclick='if(this.innerHTML==\"join paired ends\"){this.innerHTML=\"show sequence info\";this.previousSibling.textContent=\"Join Paired Ends\";}else{this.innerHTML=\"join paired ends\";this.previousSibling.textContent=\"Sequence Information\";}jQuery(\"#joinPairedEndsDiv\").toggle();jQuery(\"#seqInfoDiv\").toggle();'>join paired ends</button>";
		    }

		    html += "</h5><div id='joinPairedEndsDiv' style='display: none; font-size: 12px; padding-top: 20px;'>";
		    html += "<input type='text' style='display: none;' value='"+node.id+"' id='jpeFileA'>";
		    var opts = [];
		    var txtOpts = "<option>- none -</option>";
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
		    html += "<span style='position: relative; bottom: 4px;'>file to join</span><select id='jpeFileB' style='font-size: 12px; height: 25px; margin-left: 10px; width: 360px;'>"+opts+"</select><br>";
		    html += "<span style='position: relative; bottom: 4px;'>Barcode file (optional)</span><select id='jpeBarcode' style='font-size: 12px; height: 25px; margin-left: 10px; width: 295px;'>"+txtOpts+"</select><br>";
		    html += "remove non-overlapping paired-ends <input type='checkbox' checked='checked' id='jpeRetain' style='margin-top: -2px;'><div style='height: 10px;'></div>";
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
		    html += "<div style='font-weight: bold;'>sequence type</div><div>We think this is a"+(node.attributes.stats_info.sequence_type == "WGS" ? " whole genome shotgun" : "n amplicon")+" dataset "+(node.attributes.stats_info.sequencing_method_guess == "other" ? (node.attributes.stats_info.sequencing_method_guess == "assembled" ? "sequenced with "+node.attributes.stats_info.sequencing_method_guess+"." : "of assembled reads.") : "but were unable to guess the sequencing technology.")+"</div>";
		    html += "</div>";

		    html += "</div>";
		} else {
		    html += "</h5>";
		    var url = RetinaConfig.mgrast_api + "/inbox/stats/"+node.id;
		    widget.inboxData.push({ "info": { "pipeline": "seq stats" } });
		    jQuery.ajax(url, {
			success: function(data){
			    Retina.WidgetInstances.metagenome_upload[1].getRunningInboxActions();
			    Retina.WidgetInstances.metagenome_upload[1].browser.preserveDetail = true;
			    Retina.WidgetInstances.metagenome_upload[1].browser.updateData();
			},
			error: function(jqXHR, error){
			    console.log(error);
			    console.log(jqXHR);
			},
			crossDomain: true,
			headers: stm.authHeader,
			type: "GET"
		    });
		}
	    }
	    
	    html += "<h5 style='margin-top: 20px;'>Delete File</h5>";
	    html += "<button class='btn btn-small btn-danger' onclick='if(confirm(\"Really delete this file?\\nThis cannot be undone!\")){Retina.WidgetInstances.metagenome_upload[1].browser.removeNode({node:\""+node.id+"\"});}'>delete file</button>";
	}

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

    // Inbox actions
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

    widget.demultiplex = function (sourceID, barcodeID) {
	var widget = Retina.WidgetInstances.metagenome_upload[1];
	document.getElementById('convert').innerHTML = "<img src='Retina/images/waiting.gif' style='width: 32px;'>";

	var url = RetinaConfig.mgrast_api+'/inbox/demultiplex';
	jQuery.ajax(url, {
	    data: { "seq_file": sourceID,
		    "barcode_file": barcodeID },
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
    };

    widget.joinPairedEnds = function () {
	var widget = Retina.WidgetInstances.metagenome_upload[1];

	var fileA = document.getElementById('jpeFileA').value;
	var fileB = document.getElementById('jpeFileB').options[document.getElementById('jpeFileB').selectedIndex].value;
	var barcode = document.getElementById('jpeBarcode').selectedIndex > 0 ? document.getElementById('jpeBarcode').options[document.getElementById('jpeBarcode').selectedIndex].value : null;
	var outfile = document.getElementById('jpeOutfile').value;
	var retain = document.getElementById('jpeRetain').getAttribute('checked') ? 1 : 0;

	var url = RetinaConfig.mgrast_api+'/inbox/pairjoin' + (barcode ? "_demultiplex" : "");
	jQuery.ajax(url, {
	    data: { "pair_file_1": fileA,
		    "pair_file_2": fileB,
		    "output": outfile,
		    "index_file": barcode,
		    "retain": retain },
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
	    if (Retina.keys(d[i].tasks[0].inputs)[0] != "submission_parameters.json") {
		data.push(d[i]);
	    }
	}

	var html = "<p style='text-align: center; font-style: italic;'>- no actions running on files in your inbox -</p>";
	if (data && data.length > 0) {
	    html = "<table class='table table-condensed' style='font-size: 12px;'><tr><th>file</th><th>action</th><th>status</th><th></th></tr>";
	    for (var i=0; i<data.length; i++) {
		var fn = Retina.keys(data[i].tasks[0].inputs)[0];
		var task = data[i].tasks[0].cmd.description;
		var colors = { "in-progress": "green",
			       "suspend": "red",
			       "pending": "orange",
			       "queued": "blue" };
		var title = data[i].state;
		var status = '<span style="color: '+colors[title]+';font-size: 19px; cursor: default;" title="'+title+'">&#9679;</span>';
		html += "<tr><td style='padding-right: 5px;'>"+fn+"</td><td>"+task+"</td><td style='text-align: center;'>"+status+"</td><td><button class='btn btn-mini btn-danger' title='cancel action' onclick='if(confirm(\"really cancel this action?\")){Retina.WidgetInstances.metagenome_upload[1].cancelInboxAction(\""+data[i].id+"\");}'>&times;</button></td></tr>";
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
	    if (filename == Retina.keys(data[i].tasks[0].inputs)[0]) {
		task = data[i].tasks[0].cmd.description;
		break;
	    }
	}
	
	return task;
    };

})();