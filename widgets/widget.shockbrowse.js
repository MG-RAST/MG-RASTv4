/*

  Display a browser for a SHOCK server

  Parameters:

  shockBase - URL of the SHOCK server to interact with, default is config.js-shock_url
  width - width of the browser in pixel, default is 1550
  height - height of the browser in pixel, default is 800
  title - text displayed in the title bar, default is "SHOCK browser"

  showFilter - boolean whether the filter section is visible, default is true
  showTitleBar - boolean whether the title bar is visible, default is true
  showResizer - boolean whether the rezise buttons and corner are visible, default is true

  enableUpload - boolean whether upload is enabled, default is true
  enableDownload - boolean whether download is enabled, default is true
  showUploadPreview - boolean whether a preview is shown for files selected for upload

  showDetailBar - boolean whether the detail bar is visible, default is true
  showDetailInfo - boolean whether the detail option 'info' is available, default is true
  showDetailAttributes - boolean whether the detail option 'attributes' is available, default is true
  showDetailACL - boolean whether the detail option 'acl' is available, default is true
  showDetailPreview - boolean whether the detail option 'preview' is available, default is true

  showStatusBar - boolean whether the status bar at the bottom is displayed, default is true

  showTopSection - boolean whether the top section is visible, default is true

  detailType - one of [ info, attributes, acl, preview ] indicating the initial display when selecting a file, default is info

  presetFilters - hash of field name -> field value that is always added to the filter
  querymode - [ full | attributes ] determines which part of the node to search in, default is attributes
  keylist - array of hashes of items in the filter list. The form of the hash is { "name": "$filter_url_param", "value": "$label_in_filter_list" },

  previewChunkSize - size in bytes that is loaded from the server for the preview of a file, default is 2 KB
  uploadChunkSize - size in bytes uploaded to the server per chunk, default is 10 MB
  currentLimit - maximum number of files loaded initially and whenever scrolling to the bottom
  authHeader - authentication header used when interacting with the server
  customPreview - optinally provided custom function for node preview, receives an object with the selected node (node), the first previewChunkSize bytes of the file (data) and the error if exists (error), must return the HTML to be displayed in the preview section

*/
(function () {
    var widget = Retina.Widget.extend({
        about: {
            title: "SHOCK Browser Widget",
            name: "shockbrowse",
            author: "Tobias Paczian",
            requires: [ 'jszip.min.js', 'jsoneditor.min.js' ]
        }
    });
    
    widget.setup = function () {
	return [ 
  	    Retina.load_renderer("table"),
  	    Retina.load_renderer("listselect")
	];
    };

    /*
     * VARIABLES
     */

    // shock url for this browser
    widget.shockBase = RetinaConfig.shock_url;

    // user authentication
    widget.authHeader = {};

    // layout
    widget.width = 1550;
    widget.height = 800;
    widget.borderRadius = 4;
    widget.fontSize = 13;
    widget.showFilter = true;
    widget.filterWidth = 232;
    widget.sizes = { "small": [ 800, 400 ] };

    // upload status information
    widget.previewChunkSize = 2048; // 2 KB
    widget.uploadChunkSize = 1024 * 1024 * 10; // 10 MB
    widget.currentUploadChunk = 0;
    widget.uploadPaused = false;
    widget.chunkComplete = false;

    // store the different sections
    widget.sections = {};

    // title bar text
    widget.title = "SHOCK Browser";

    // status bar text
    widget.status = "<img src='Retina/images/waiting.gif' style='height: 15px;'> connecting to SHOCK server...";

    // interface default settings
    widget.detailInfo = null;
    widget.selectedFile = null;
    widget.infoRequest = null;
    widget.append = false;
    widget.currentOffset = 0;
    widget.currentLimit = 100;
    widget.scrollPosition = 0;

    widget.filters = {};
    widget.querymode = "attributes";
    widget.detailType = "info";

    widget.showTitleBar = true;
    widget.showResizer = true;
    widget.showDetailBar = true;
    widget.showDetailInfo = true;
    widget.showDetailACL = true;
    widget.showDetailPreview = true;
    widget.showDetailAttributes = true;

    widget.showStatusBar = true;

    widget.enableDownload = true;
    widget.enableUpload = true;
    widget.showUploadPreview = true;

    widget.showTopSection = true;

    /*
     * STYLESHEET
     */
    widget.style = function () {
	return '\
<style>\
.btn-moremini {\
  padding-left: 5px;padding-right:5px\
}\
\
.btn-menu {\
  border: 1px solid #838383;\
  height: 28px;\
}\
.fileItem {\
  cursor: pointer;\
}\
.fileItem:hover {\
  background-color: #e6eaef;\
}\
</style>\
';
    };
    
    /*
     * DISPLAY 
     */
    widget.display = function (wparams) {
        var widget = Retina.WidgetInstances.shockbrowse[1];

	if (wparams) {
	    jQuery.extend(true, widget, wparams);
	}

	if (widget.presetFilters && ! Retina.keys(widget.filters).length) {
	    widget.filters = widget.presetFilters;
	}

	if (! widget.hasOwnProperty('keylist')) {
	    if (widget.querymode == "attributes") {
		widget.keylist = [
		    { "name": "type", "value": "type" },
		    { "name": "data_type", "value": "data type" },
		    { "name": "status", "value": "status" },
		    { "name": "file_format", "value": "file format" },
		    { "name": "_custom_", "value": "custom - 'field=value'" }
		];
	    } else {
		widget.keylist = [
		    { "name": "file.name", "value": "filename" },
		    { "name": "file.size", "value": "filesize" },
		    { "name": "file.checksum.md5", "value": "md5" },
		    { "name": "owner", "value": "owner" },
		    { "name": "attributes.type", "value": "type" },
		    { "name": "attributes.data_type", "value": "data type" },
		    { "name": "attributes.status", "value": "status" },
		    { "name": "attributes.file_format", "value": "file format" },
		    { "name": "_custom_", "value": "custom - 'field=value'" }
		];
	    }
	}

	var filterWidth = widget.showFilter ? widget.filterWidth : 0;
	widget.fileWidth = Math.floor((widget.width - filterWidth) / 2) - 5;
	widget.detailWidth = Math.floor((widget.width - filterWidth) / 2) - 5;

	widget.topHeight = widget.showTopSection ? (widget.showTitleBar ? 52 : 40) : 0;
	widget.middleHeight = widget.height - (widget.showStatusBar ? (22 + widget.topHeight) : (1 + widget.topHeight));

	widget.sections = {};

	var browser = document.createElement('div');
	widget.sections.browser = browser;

	browser.setAttribute('style', "width: "+widget.width+"px; height: "+widget.height+"px; border: 1px solid #C7C7C7; border-radius: "+widget.borderRadius+"px; box-shadow: 6px 6px 6px #BBBBBB;");

	widget.target.innerHTML = widget.style();
	widget.target.appendChild(browser);

	if (widget.showTopSection) {
	    widget.top_section();
	}
	widget.middle_section();
	widget.bottom_section();

	if (! widget.data) {
	    widget.updateData();
	}
    };

    /*
     * GENERAL SECTIONS 
     */
    widget.top_section = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var section;
	if (widget.sections.topSection) {
	    section = widget.sections.topSection;
	    section.innerHTML = "";
	    widget.sections.titleBar = null;
	    widget.sections.toolBar = null;
	} else {
	    section = document.createElement('div');
	    section.setAttribute('style', "height: "+widget.topHeight+"px; border-bottom: 1px solid #838383; background-color: #F5F5F5; background-image: linear-gradient(to bottom, #FDFDFD, #C3C3C3); background-repeat: repeat-x; position: relative; border-radius: "+widget.borderRadius+"px "+widget.borderRadius+"px 0 0;");
	    widget.sections.browser.appendChild(section);
	    widget.sections.topSection = section;
	}

	widget.title_bar();
	widget.tool_bar();
    };

    widget.middle_section = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var height = widget.middleHeight;

	var section;
	if (widget.sections.middleSection) {
	    section = widget.sections.middleSection;
	    section.innerHTML = "";
	    widget.sections.filterSection = null;
	    widget.sections.fileSection = null;
	    widget.sections.detailSection = null;
	} else {
	    section = document.createElement('div');
	    section.setAttribute('style', "height: "+height+"px;");
	    widget.sections.browser.appendChild(section);
	    widget.sections.middleSection = section;
	}

	if (widget.showFilter) {
	    widget.filter_section();
	}
	widget.file_section();
	widget.middle_border();
	widget.detail_section();
    };

    widget.bottom_section = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var section;
	if (widget.sections.bottomSection) {
	    section = widget.sections.bottomSection;
	    section.innerHTML = "";
	    widget.sections.statusBar = null;
	} else {
	    section = document.createElement('div');
	    section.setAttribute('style', "height: 20px; border-top: 1px solid #838383; background-color: #F5F5F5; background-image: linear-gradient(to bottom, #FDFDFD, #C3C3C3); background-repeat: repeat-x; position: relative;");
	    if (widget.showStatusBar) {
		widget.sections.browser.appendChild(section);
	    }
	    widget.sections.bottomSection = section;
	}

	widget.status_bar();
    };

    /*
     * TOP SECTION INTERNALS
     */
    widget.title_bar = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var section;
	if (widget.sections.titleBar) {
	    section = widget.sections.titleBar;
	    section.innerHTML = "";
	} else {
	    section = document.createElement('div');
	    section.setAttribute('style', "text-align: center; text-shadow: 0 1px 1px rgba(255, 255, 255, 0.75);"+(widget.showTitleBar ? "" : " height: 10px;"));
	    widget.sections.topSection.appendChild(section);
	    widget.sections.titleBar = section;
	}

	section.innerHTML = (widget.showTitleBar && widget.title) ? widget.title : "&nbsp;";
	var resizer = document.createElement('div');
	resizer.setAttribute('style', "float: left;");
	resizer.innerHTML = '\
<img src="Retina/images/expand.png" style="margin-left: 7px; margin-right: 5px; width: 12px; cursor: pointer;" onclick="Retina.WidgetInstances.shockbrowse[1].width=jQuery(window).width()-jQuery(Retina.WidgetInstances.shockbrowse[1].sections.browser).offset().left - 20;Retina.WidgetInstances.shockbrowse[1].height=jQuery(window).height()-jQuery(Retina.WidgetInstances.shockbrowse[1].sections.browser).offset().top - 20;Retina.WidgetInstances.shockbrowse[1].display();" title="fullscreen">\
\
<img src="Retina/images/contract.png" style="width: 12px; cursor: pointer;" onclick="Retina.WidgetInstances.shockbrowse[1].width=Retina.WidgetInstances.shockbrowse[1].sizes[\'small\'][0];Retina.WidgetInstances.shockbrowse[1].height=Retina.WidgetInstances.shockbrowse[1].sizes[\'small\'][1];Retina.WidgetInstances.shockbrowse[1].display();" title="small">\
';
	if (widget.showResizer) {
	    section.appendChild(resizer);
	}
    };

    widget.tool_bar = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var section;
	if (widget.sections.toolBar) {
	    section = widget.sections.toolBar;
	    section.innerHTML = "";
	} else {
	    section = document.createElement('div');
	    section.setAttribute('style', "text-align: left; text-shadow: 0 1px 1px rgba(255, 255, 255, 0.75); margin-left: 10px; margin-right: 10px;");
	    widget.sections.topSection.appendChild(section);
	    widget.sections.toolBar = section;
	}

	var toolBar = document.createElement('div');
	toolBar.setAttribute("style", "position: relative; margin-left: "+(widget.showFilter ? widget.filterWidth : "0")+"px;");

	if (widget.enableUpload) {
	    // upload bar
	    var uploadBar = document.createElement('div');
	    uploadBar.className = "btn-group";

	    var realUploadButton = document.createElement('input');
	    realUploadButton.setAttribute('type', 'file');
	    realUploadButton.setAttribute('style', 'display: none;');
	    jQuery(realUploadButton).on('change',  function(event){
		Retina.WidgetInstances.shockbrowse[1].uploadFileSelected(event);
	    });
	    widget.uploadDialog = realUploadButton;
	    section.appendChild(realUploadButton);

	    var uploadButton = document.createElement('button');
	    uploadButton.className = "btn btn-menu btn-small";
	    uploadButton.title = "upload file";
	    uploadButton.innerHTML = "<img src='Retina/images/upload.png' style='height: 16px;'><div id='progress_button_progress' style='bottom: 20px; position: relative; margin-right: -11px; background-color: green; height: 26px; margin-top: -2px; margin-left: -10px; width: 0px; opacity: 0.4;'></div>";
	    uploadButton.addEventListener('click', function(){ Retina.WidgetInstances.shockbrowse[1].uploadDialog.click(); });
	    uploadBar.appendChild(uploadButton);
	    widget.uploadButton = uploadButton;

	    var resumeButton = document.createElement('button');
	    resumeButton.className = "btn btn-menu btn-small";
	    resumeButton.title = "resume incomplete uploads";
	    resumeButton.innerHTML = "<i class='icon-play'></i>";
	    resumeButton.addEventListener('click', Retina.WidgetInstances.shockbrowse[1].findResumableUploads);
	    widget.resumeButton = resumeButton;
	    uploadBar.appendChild(resumeButton);

	    if (! widget.user) {
		uploadButton.setAttribute('disabled', 'disabled');
		resumeButton.setAttribute('disabled', 'disabled');
	    }

	    toolBar.appendChild(uploadBar);
	}

	// modify bar
	var modifyBar = document.createElement('div');
	modifyBar.className = "btn-group";
	
	// download button
	if (widget.enableDownload) {
	    var downloadButton = document.createElement('button');
	    downloadButton.className = "btn btn-menu btn-small";
	    downloadButton.title = "download selected file";
	    downloadButton.innerHTML = "<img src='Retina/images/download.png' style='height: 16px;'>";
	    downloadButton.addEventListener('click', function(){
		var widget = Retina.WidgetInstances.shockbrowse[1];
		if (widget.selectedFile) {
		    jQuery.ajax({ url: widget.shockBase + "/node/" + widget.selectedFile.getAttribute('fi') + "?download_url&filename="+widget.selectedFile.innerHTML,
				  dataType: "json",
				  success: function(data) {
				      var widget = Retina.WidgetInstances.shockbrowse[1];
				      if (data != null) {
					  if (data.error != null) {
					      console.log("error: "+data.error);
					  }
					  window.location = data.data.url;
				      } else {
					  console.log("error: invalid return structure from SHOCK server");
					  console.log(data);
				      }
				  },
				  error: function(jqXHR, error) {
				      var widget = Retina.WidgetInstances.shockbrowse[1];
				      console.log( "error: unable to connect to SHOCK server" );
				      console.log(error);
				  },
				  crossDomain: true,
				  headers: widget.authHeader
				});
		} else {
		    alert('no file selected for download');
		}
	    });
	    modifyBar.appendChild(downloadButton);
	}

	toolBar.appendChild(modifyBar);

	// update bar
	var updateBar = document.createElement('div');
	updateBar.className = "btn-group";

	var refreshButton = document.createElement('button');
	refreshButton.className = "btn btn-menu btn-small";
	refreshButton.title = "refresh file list";
	refreshButton.innerHTML = "<img src='Retina/images/loop.png' style='height: 16px;'>";
	refreshButton.addEventListener('click', function(){
	    Retina.WidgetInstances.shockbrowse[1].updateData();
	});
	updateBar.appendChild(refreshButton);

	toolBar.appendChild(updateBar);

	// detail type
	var detailBar = document.createElement('div');
	detailBar.className = "btn-group";
	detailBar.setAttribute("data-toggle", "buttons-radio");
	detailBar.setAttribute("style", "float: right;");
	
	var types = [];
	if (widget.showDetailInfo) {
	    types.push("info");
	}
	if (widget.showDetailAttributes) {
	    types.push("attributes");
	}
	if (widget.showDetailPreview) {
	    types.push("preview");
	}
	if (widget.showDetailACL) {
	    types.push("acl");
	}
	for (var i=0; i<types.length; i++) {
	    var button = document.createElement('button');
	    var active = "";
	    if (types[i] == widget.detailType) {
		active = " active";
	    }
	    button.className = "btn btn-menu btn-small"+active;
	    button.title = types[i];
	    button.innerHTML = "<img src='Retina/images/"+types[i]+".png' style='height: 16px;'>";
	    button.setAttribute('onclick', "Retina.WidgetInstances.shockbrowse[1].detailType='"+types[i]+"';Retina.WidgetInstances.shockbrowse[1].showDetails(null, true);");
	    detailBar.appendChild(button);
	}

	if (widget.showDetailBar) {
	    toolBar.appendChild(detailBar);
	}

	section.appendChild(toolBar);
    };

    /*
     * MIDDLE SECTION INTERNALS
     */

    widget.filter_section = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var section;
	if (widget.sections.filterSection) {
	    section = widget.sections.filterSection;
	    section.innerHTML = "";
	    widget.sections.filterSectionContent = null;
	} else {
	    var height = widget.middleHeight;
	    var section = document.createElement('div');
	    section.setAttribute('style', "height: "+height+"px; width: "+widget.filterWidth+"px; float: left; background-color: #e6eaef; color: #6e7886; border-right: 1px solid #808080;");
	    widget.sections.middleSection.appendChild(section);
	    widget.sections.filterSection = section;
	}

	var sectionContent = document.createElement('div');
	sectionContent.setAttribute("style", "padding-left: 5px; padding-top: 1px; padding-right: 5px; height: inherit; overflow-y: scroll;");
	section.appendChild(sectionContent);

	sectionContent.innerHTML = '\
<p style="font-weight: bold;">Filter</p>\
  <div class="control-group">\
    <label class="control-label" for="filter_key">field</label>\
    <div class="controls">\
      <select id="filter_key" style="width: 220px; font-size: '+widget.fontSize+'px;"></select>\
    </div>\
  </div>\
  <div class="control-group">\
    <label class="control-label" for="filter_value">term</label>\
    <div class="controls input-append">\
      <input type="text" id="filter_value" placeholder="enter filter term" style="width: 157px; font-size: '+widget.fontSize+'px;">\
      <button class="btn" onclick="Retina.WidgetInstances.shockbrowse[1].refineFilter(\'add\');">add</button>\
    </div>\
  </div>\
  <hr>\
  <div id="refine_filter_terms"></div>\
';
	
	var keyselect = document.getElementById('filter_key');
	var keylist = widget.keylist;
	document.getElementById('filter_value').addEventListener('keypress', function (e) {
	    e = e || window.event;
	    if (e.keyCode == 13) {
		Retina.WidgetInstances.shockbrowse[1].refineFilter('add');
	    }
	});
	
	var keyselect_html = "";
	for (var i=0; i<keylist.length; i++) {
	    keyselect_html += "<option value='"+keylist[i].name+"'>"+keylist[i].value+"</option>";
	}
	keyselect.innerHTML = keyselect_html;

	widget.sections.filterSectionContent = sectionContent;
    };

    widget.file_section = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var section;
	var sectionContent;
	if (widget.append) {
	    sectionContent = widget.sections.fileSectionContent;
	} else {
	    if (widget.sections.fileSection) {
		section = widget.sections.fileSection;
		section.innerHTML = "";
		widget.sections.fileSectionContent = null;
	    } else {
		var height = widget.middleHeight;
		section = document.createElement('div');
		section.setAttribute('style', "height: "+height+"px; width: "+widget.fileWidth+"px; float: left;");
		widget.sections.middleSection.appendChild(section);
		widget.sections.fileSection = section;
	    }

	    sectionContent = document.createElement('div');
	    sectionContent.setAttribute("style", "padding-left: 5px; padding-top: 1px; padding-right: 5px; height: inherit; overflow-y: scroll; font-size: "+widget.fontSize+"px;");
	    section.appendChild(sectionContent);
	    widget.sections.fileSectionContent = sectionContent

	    sectionContent.addEventListener('scroll', function(event) {
		event = event || window.event;
		var widget = Retina.WidgetInstances.shockbrowse[1];
		if (widget.currentOffset + widget.currentLimit < widget.data.total_count) {
		    if (event.target.scrollTop == event.target.scrollTopMax) {
			widget.scrollPosition = event.target.scrollTop;
			widget.currentOffset += Retina.WidgetInstances.shockbrowse[1].currentLimit;
			widget.append = true;
			widget.updateData();
		    }
		}
	    });
	}

	if (widget.data) {
	    var html = "";
	    for (var i=widget.currentOffset; i<widget.data.data.length; i++) {
		var ds = widget.data.data[i];
		var fn = ds.file.name || ds.id;
		html += "<div id='file"+ds.id+"' class='fileItem' fi='"+ds.id+"' onclick='Retina.WidgetInstances.shockbrowse[1].showDetails(event);' draggable='true' data-downloadurl='application/octet-stream:"+fn+":"+widget.shockBase + "/node/" + ds.id + "?download&filename="+fn+"'>" + fn + "</div>";
	    }
	    if (widget.append) {
		sectionContent.innerHTML += html;
	    } else {
		sectionContent.innerHTML = html;
	    }

	    for (var i=widget.currentOffset; i<widget.data.data.length; i++) {
		var div = document.getElementById("file"+widget.data.data[i].id);
		div.addEventListener("dragstart", function(evt){
		    evt.dataTransfer.setData("DownloadURL", typeof this.dataset === "undefined" ? this.getAttribute("data-downloadurl") : this.dataset.downloadurl);
		},false);
	    }
	    widget.append = false;
	}

	sectionContent.scrollTop = widget.scrollPosition;
	
	widget.sections.fileSectionContent = sectionContent;
    };

    widget.detail_section = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var section;
	if (widget.sections.detailSection) {
	    section = widget.sections.detailSection;
	    section.innerHTML = "";
	    widget.sections.detailSectionContent = null;
	} else {
	    section = document.createElement('div');
	    var height = widget.middleHeight;
	    section.setAttribute('style', "height: "+height+"px; width: "+widget.detailWidth+"px; float: left;");
	    widget.sections.middleSection.appendChild(section);
	    widget.sections.detailSection = section;
	}

	var sectionContent = document.createElement('div');
	sectionContent.setAttribute("style", "padding-left: 5px; padding-top: 1px; padding-right: 5px; height: inherit; overflow-y: scroll;");
	section.appendChild(sectionContent);

	widget.sections.detailSectionContent = sectionContent;
    };

    widget.middle_border = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var height = widget.middleHeight;

	var bar = document.createElement('div');
	bar.setAttribute('style', "background-color: #E9E9E9; width: 4px; border-left: 1px solid #808080; border-right: 1px solid #808080; height: "+height+"px; float: left; cursor: col-resize;");
	widget.sections.middleSection.appendChild(bar);
	
	var start;
	var wA;
	var wB;

	function startSplitMouse(evt) {
	    start = evt.pageX;
	    wA = parseInt(bar.previousSibling.style.width);
	    wB = parseInt(bar.nextSibling.style.width);
	    jQuery(document)
		.on("mousemove", doSplitMouse)
		.on("mouseup", endSplitMouse);
	}
	function doSplitMouse(evt) {
	    bar.previousSibling.style.width = (wA - (start - evt.pageX)) + "px";
	    bar.nextSibling.style.width = (wB + (start - evt.pageX)) + "px";
	}
	function endSplitMouse(evt) {
	    var widget = Retina.WidgetInstances.shockbrowse[1];
	    if (bar.previousSibling.previousSibling) {
		widget.fileWidth = bar.previousSibling.style.width;
		widget.detailWidth = bar.nextSibling.style.width;
	    } else {
		widget.filterWidth = bar.previousSibling.style.width;
		widget.fileWidth = bar.nextSibling.style.width;
	    }
	    jQuery(document)
		.off("mousemove", doSplitMouse)
		.off("mouseup", endSplitMouse);
	}

	bar.addEventListener('mousedown', startSplitMouse);
    };

    /*
     * BOTTOM SECTION INTERNALS
     */
    widget.status_bar = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	var section;
	if (widget.sections.statusBar) {
	    section = widget.sections.statusBar;
	    section.innerHTML = "";
	    widget.sections.authContainer = null;
	} else {
	    section = document.createElement('div');
	    section.setAttribute('style', "width: 100%; text-align: center; text-shadow: 0 1px 1px rgba(255, 255, 255, 0.75); z-index: 1;");
	    widget.sections.bottomSection.appendChild(section);
	    widget.sections.statusBar = section;
	}

	section.innerHTML = widget.status;

	if (widget.showResizer) {
	    var resizeCorner = document.createElement('div');
	    resizeCorner.setAttribute('style', "cursor: nwse-resize; float: right; width: 20px; height: 16px; position: relative; top: 4px; left: 5px;");
	    resizeCorner.innerHTML = "<img src='Retina/images/resizer.gif'>";
	    function endResizeMouse(evt) {
		var widget = Retina.WidgetInstances.shockbrowse[1];
		widget.width = widget.width - (widget.startX - evt.screenX);
		widget.height = widget.height - (widget.startY - evt.screenY);
		widget.display();
	    }
	    function startResizeMouse(evt) {
		var widget = Retina.WidgetInstances.shockbrowse[1];
		widget.startX = evt.screenX;
		widget.startY = evt.screenY;
	    }
	    resizeCorner.addEventListener('dragstart', startResizeMouse);
	    resizeCorner.addEventListener('dragend', endResizeMouse);
	    section.appendChild(resizeCorner);
	}

	var authContainer = document.createElement('div');
	authContainer.setAttribute("style", "float: right; height: 16px; position: relative; top: 2px; text-align: right;");
	if (widget.user) {
	    authContainer.innerHTML = '<img src="Retina/images/lock.png" style="width: 16px; position: relative; bottom: 3px;" title="authenticated as '+widget.user.firstname+' '+widget.user.lastname+'">';
	} else {
	    authContainer.innerHTML = '<img src="Retina/images/unlocked.png" style="width: 16px; position: relative; bottom: 3px;" title="not authenticated">';
	}
	widget.sections.authContainer = authContainer;
	section.appendChild(authContainer);
    };

    /*
     * ACTION FUNCTIONS
     */
    widget.setShockBase = function (url) {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	widget.shockBase = url;

	widget.display();
    };

    widget.loginAction = function (action) {
	var widget = Retina.WidgetInstances.shockbrowse[1];
	if (action.action == "login" && action.result == "success") {
	    // set user
	    widget.user = action.user;

	    // set authentication
	    widget.authHeader = { "Authorization": "OAuth "+action.token };

	    if (widget.enableUpload) {
		// enable functions only available when logged in
		widget.uploadButton.removeAttribute('disabled');
		widget.resumeButton.removeAttribute('disabled');
	    }

	} else {
	    // remove user
	    widget.user = null;

	    // remove authentication
	    widget.authHeader = {};

	    if (widget.enableUpload) {
		// disable functions only available when logged in
		widget.uploadButton.setAttribute('disabled', 'disabled');
		widget.resumeButton.setAttribute('disabled', 'disabled');
	    }
	}
	widget.data = null;
	widget.status = "<img src='Retina/images/waiting.gif' style='height: 15px;'> connecting to SHOCK server...";
	widget.updateData();
    };
    
    widget.updateData = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	widget.status = "<img src='Retina/images/waiting.gif' style='height: 15px;'> fetching data...";
	widget.status_bar();
	
	var url = widget.shockBase + "/node/?limit="+widget.currentLimit+"&offset="+widget.currentOffset;
	if (Retina.keys(widget.filters).length) {
	    url += "&"+(widget.querymode == "attributes" ? "query" : "querynode");
	    for (var i in widget.filters) {
		if (widget.filters.hasOwnProperty(i)) {
		    url += "&"+i+"="+widget.filters[i];
		}
	    }
	}
	jQuery.ajax({ url: url,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.shockbrowse[1];
			  if (data != null) {
			      if (data.error != null) {
				  console.log("error: "+data.error);
			      }
			  } else {
			      console.log("error: invalid return structure from SHOCK server");
			      console.log(data);
			  }
			  if (widget.currentOffset == 0) {
			      widget.data = data;
			  } else {
			      for (var i=0; i<data.data.length; i++) {
				  widget.data.data.push(data.data[i]);
			      }
			  }
			  widget.updateDisplay();
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.shockbrowse[1];
			  console.log( "error: unable to connect to SHOCK server" );
			  console.log(error);
			  widget.updateDisplay();
		      },
		      crossDomain: true,
		      headers: widget.authHeader
		    });
    };

    widget.updateDisplay = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	if (widget.data && widget.data.hasOwnProperty('total_count')) {
	    var numNodes = widget.data.total_count.formatString(0);
	    var maxNodes = widget.currentOffset+widget.currentLimit;
	    widget.status = "loaded "+(maxNodes > numNodes ? numNodes : maxNodes)+" of "+numNodes+" nodes for current filter";
	    widget.status_bar();
	    widget.file_section();
	    widget.detail_section();
	}
    };

    widget.showDetails = function (e, update) {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	if (! widget.selectedFile && ! e) {
	    return;
	}

	if (! update) {
	    if (widget.selectedFile != null) {
		widget.selectedFile.style.backgroundColor = null;
	    }
	    
	    widget.selectedFile = e.currentTarget;
	    widget.selectedFile.style.backgroundColor = "#e6eaef";

	    widget.currentFileId = e.currentTarget.getAttribute('fi');
	}
	var id = widget.currentFileId;
	var node;
	for (var i=0; i<widget.data.data.length; i++) {
	    if (widget.data.data[i].id == id) {
		node = widget.data.data[i];
		break;
	    }
	}

	var fn = node.file.name || node.id;
	
	var html;
	var height = parseInt((widget.height - 85) / 2) - 50;

	var detailInfo = widget.detailInfo || "<div style='padding-top: "+height+"px; text-align: center;'><img src='Retina/images/waiting.gif' style='width: 25px;'></div>";

	if (widget.detailType == "info") {
	    html = "<h4>file information - "+fn+"</h4><table style='text-align: left; font-size: "+widget.fontSize+"px;'>\
<tr><th style='width: 75px;'>name</th><td>"+fn+"</td></tr>\
<tr><th style='width: 75px;'>node id</th><td>"+node.id+"</td></tr>\
<tr><th>created</th><td>"+node.created_on+"</td></tr>\
<tr><th>modified</th><td>"+node.last_modified+"</td></tr>\
<tr><th>size</th><td>"+node.file.size.formatString()+"</td></tr>\
<tr><th>MD5</th><td>"+node.file.checksum.md5+"</td></tr>\
<tr><th>SHA1</th><td>"+node.file.checksum.sha1+"</td></tr>\
<tr><th>format</th><td>"+(node.file.format ? node.file.format : "unknown")+"</td></tr>\
<tr><th>virtual</th><td>"+(node.file.virtual ? "yes" : "no")+"</td></tr>\
</table>";
	} else if (widget.detailType == "acl") {
	    html = "<h4>permissions - "+fn+"</h4>" + detailInfo;
	    if (widget.detailInfo) {
		widget.detailInfo = null;
	    } else {
		var url = widget.shockBase + "/node/" + node.id + "/acl";
		jQuery.ajax({ url: url,
			      success: function(data) {
				  var widget = Retina.WidgetInstances.shockbrowse[1];
				  widget.detailInfo = widget.aclDetail(data, node.id);
				  widget.showDetails(null, true);
			      },
			      error: function(jqXHR, error) {
				  var widget = Retina.WidgetInstances.shockbrowse[1];
				  widget.detailInfo = "<div class='alert alert-error' style='text-align: center;'>Unable to retrieve access right information<br>You must be the owner of the node to see this data.";
				  if (widget.showFilter && widget.querymode == "full" && widget.user) {
				      widget.detailInfo += "<br><br><button class='btn' onclick='document.getElementById(\"filter_value\").value=\"owner="+Retina.WidgetInstances.shockbrowse[1].user.login+"\";Retina.WidgetInstances.shockbrowse[1].refineFilter(\"add\", null, true);'>show only files I own</button>";
				  }
				  widget.detailInfo += "</div>";
				  widget.showDetails(null, true);
			      },
			      crossDomain: true,
			      headers: widget.authHeader
			    });
	    }
	} else if (widget.detailType == "attributes") {
	    html = "<h4>attributes - "+fn+"<span id='attributesEditButtonSpan'></span></h4><div id='attributesEditor'></div>";
	    widget.sections.detailSectionContent.innerHTML = html;
            widget.jsonEditor = new JSONEditor(document.getElementById("attributesEditor"), { mode: 'view'}, node.attributes);
	    widget.checkForAttributesEditButton(node.id);
	    return;
	} else if (widget.detailType == "preview") {
	    html = detailInfo;
	    if (widget.detailInfo) {
		widget.detailInfo = null;
	    } else {
		if (node.file.size == 0) {
		    widget.detailInfo = "<h4>preview - "+fn+"</h4><p>This node has no file</p>";
		    widget.showDetails(null, true);
		    return;
		}
		var url = widget.shockBase + "/node/" + node.id + "?download&index=size&part=1&chunksize="+widget.previewChunkSize;
		jQuery.ajax({ url: url,
			      success: function(data, status, xhr) {
				  var widget = Retina.WidgetInstances.shockbrowse[1];
				  if (typeof widget.customPreview == 'function') {
				      widget.detailInfo = widget.customPreview.call(null, { "node": node, "data": data, "error": null });
				  } else {
				      data = data.slice(0, widget.previewChunkSize);
				      widget.detailInfo = "<h4>preview - "+(node.file.name || node.id)+"</h4><pre style='font-size: "+(widget.fontSize - 1)+"px;'>"+data+"</pre>";
				  }
				  widget.showDetails(null, true);
			      },
			      error: function(jqXHR) {
				  var error = "";
				  try {
				      error = JSON.parse(jqXHR.responseText);
				      error = error.error;
				  } catch (er) {
				      console.log(er);
				  }
				  var widget = Retina.WidgetInstances.shockbrowse[1];
				  if (typeof widget.customPreview == 'function') {
				      widget.detailInfo = widget.customPreview.call(null, { "node": node, "data": null, "error": error });
				  } else {
				      widget.detailInfo = "<div class='alert alert-error' style='margin-top: 50px;'>unable to retrieve preview data: "+error+"</div>";
				  }
				  widget.showDetails(null, true);
			      },
			      crossDomain: true,
			      headers: widget.authHeader
			    });
	    }
	}

	widget.sections.detailSectionContent.innerHTML = html;
    };

    widget.aclDetail = function(data, node) {
	var html = "<table style='font-size: 13px; width: 100%;'>";
	html += "<tr><td style='padding-right: 20px;'><b>owner</b></td><td>"+(data.data.owner.match(/\|/) ? data.data.owner.split("|")[0] : data.data.owner)+"</td><td style='text-align: right;'><button class='btn btn-mini' onclick='Retina.WidgetInstances.shockbrowse[1].addAcl({node:\""+node+"\",acl:\"owner\"});'>change owner</button></td></tr>";
	var rights = ["read","write","delete"];
	for (var i=0; i<rights.length; i++) {
	    html += "<tr><td style='padding-right: 20px; vertical-align: top;'><b>"+rights[i]+"</b></td><td><table style='width: 100%;'>";
	    for (var h=0; h<data.data[rights[i]].length; h++) {
		var u = data.data[rights[i]][h].split("|");
		var uuid = (u.length == 1 ? u[0] : u[1]);
		var uname = u[0];
		html +="<tr><td style='text-align: left;'>"+uname+"</td><td style='text-align: right;'><button class='btn btn-mini btn-danger' onclick='Retina.WidgetInstances.shockbrowse[1].removeAcl({node:\""+node+"\",acl:\""+rights[i]+"\",uuid:\""+uuid+"\"});'>delete</button></td></tr>";
	    }
	    html += "</table></td><td style='vertical-align: top; text-align: right;'><button class='btn btn-mini' onclick='Retina.WidgetInstances.shockbrowse[1].addAcl({node:\""+node+"\",acl:\""+rights[i]+"\"});'>add</button></td></tr>";
	}
	html += "</table>";

	html += "<br><br><div style='text-align: center;'><button class='btn btn-mini btn-danger' onclick='if(confirm(\"really delete this node?\")){Retina.WidgetInstances.shockbrowse[1].removeNode({node:\""+node+"\"});}'>delete node</button></div>";
	
	return html;
    };

    widget.removeAcl = function(params) {
	widget = Retina.WidgetInstances.shockbrowse[1];
	
	var url = widget.shockBase + "/node/" + params.node + "/acl/"+params.acl+"?users="+params.uuid;
	jQuery.ajax({ url: url,
		      success: function(data) {
			  var widget = Retina.WidgetInstances.shockbrowse[1];
			  widget.showDetails(null, true);
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.shockbrowse[1];
			  widget.showDetails(null, true);
		      },
		      crossDomain: true,
		      headers: widget.authHeader,
		      type: "DELETE"
		    });
	return;
    };

    widget.removeNode = function(params) {
	widget = Retina.WidgetInstances.shockbrowse[1];
	
	var url = widget.shockBase + "/node/" + params.node;
	jQuery.ajax({ url: url,
		      success: function(data) {
			  var widget = Retina.WidgetInstances.shockbrowse[1];
			  widget.updateData();
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.shockbrowse[1];
			  widget.showDetails(null, true);
		      },
		      crossDomain: true,
		      headers: widget.authHeader,
		      type: "DELETE"
		    });
	return;
    };

    widget.addAcl = function(params) {
	widget = Retina.WidgetInstances.shockbrowse[1];

	var uuid = prompt("Enter user id or uuid", "");
	if (uuid) {
	    var url = widget.shockBase + "/node/" + params.node + "/acl/"+params.acl+"?users="+uuid;
	    jQuery.ajax({ url: url,
			  success: function(data) {
			      var widget = Retina.WidgetInstances.shockbrowse[1];
			      widget.showDetails(null, true);
			  },
			  error: function(jqXHR, error) {
			      var widget = Retina.WidgetInstances.shockbrowse[1];
			      widget.showDetails(null, true);
			  },
			  crossDomain: true,
			  headers: widget.authHeader,
			  type: "PUT"
			});
	}
    };

    widget.checkForAttributesEditButton = function(node) {
	widget = Retina.WidgetInstances.shockbrowse[1];

	var url = widget.shockBase + "/node/" + node + "/acl";
	jQuery.ajax({ url: url,
		      success: function(data) {
			  document.getElementById('attributesEditButtonSpan').innerHTML = "<button id='attributesEditorButton' class='btn btn-mini pull-right' onclick='Retina.WidgetInstances.shockbrowse[1].editAttributes();'>edit</button>";
		      },
		      error: function(jqXHR, error) {
			  
		      },
		      crossDomain: true,
		      headers: widget.authHeader,
		      type: "GET"
		    });
    };

    widget.refineFilter = function (action, item, custom) {
	widget = Retina.WidgetInstances.shockbrowse[1];
	
	// get the DOM space for the buttons
	var target = document.getElementById('refine_filter_terms');

	if (action == "add") {

	    // add key and value to the filters
	    var skeyList = document.getElementById('filter_key');
	    var skey = custom ? "_custom_" : skeyList.options[skeyList.selectedIndex].value;
	    var sname = skeyList.options[skeyList.selectedIndex].text;
	    var sval = document.getElementById('filter_value').value;

	    // check for custom filter
	    if (skey == "_custom_") {
		var f = sval.split(/=/);
		if (f.length == 2) {
		    skey = f[0];
		    sname = f[0];
		    sval = f[1];
		} else {
		    alert("invalid format for custom filter\nPlease use 'field=value'");
		    return;
		}
	    }

	    // if there is already a filter for this field, remove the button
	    if (widget.filters.hasOwnProperty(skey)) {
		// check if someone accidentally clicked add filter twice
		if (widget.filters[skey] == sval) {
		    return;
		}
		var old = document.getElementById('advFilter_'+skey);
		old.parentNode.removeChild(old);
	    }
	    widget.filters[skey] = sval;

	    // check if this is the first button
	    if (target.innerHTML == "") {
		// create a 'clear' button

		var clear = document.createElement('button');
		clear.className = "btn btn-small btn-danger";
		clear.innerHTML = "clear filters";
		clear.addEventListener('click', function () {
		    Retina.WidgetInstances.shockbrowse[1].refineFilter("clear");
		});
		clear.setAttribute('style', "width: 100%; clear: both; margin-bottom: 20px; margin-top: -15px;");
		target.appendChild(clear);
	    }
	    
	    var button = document.createElement('button');
	    button.className = "btn btn-small";
	    button.setAttribute('style', "float: left; margin-right: 10px;");
	    button.innerHTML = sname+" - "+sval+" <i class='icon icon-remove'></i>";
	    button.title = "click to remove";
	    button.setAttribute('id', 'advFilter_'+skey);
	    button.skey = skey;
	    button.addEventListener('click', function() {
		Retina.WidgetInstances.shockbrowse[1].refineFilter("remove", this.skey);
	    });
	    target.appendChild(button);
	} else if (action == "remove") {
	    delete widget.filters[item];
	    target.removeChild(document.getElementById('advFilter_'+item));
	    if (target.childNodes.length == 1) {
		target.innerHTML = "";
	    }
	} else if (action == "clear") {
	    widget.filters = widget.presetFilters || {};
	    target.innerHTML = "";
	} else {
	    console.log("undefined action for refineFilter");
	    return;
	}
	widget.currentOffset = 0;
	widget.scrollPosition = 0;
	widget.data = null;
	widget.append = false;
	widget.updateData();
    };

    // enables the attributes editor
    widget.editAttributes = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	widget.jsonEditor.setMode('tree');

	var button = document.getElementById('attributesEditorButton');
	button.innerHTML = "save changes";
	button.addEventListener('click', function(){
	    Retina.WidgetInstances.shockbrowse[1].saveEditedAttributes();
	});
    };

    // saves the changes attributes to the node
    widget.saveEditedAttributes = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];
	
	var newNodeAttributes = widget.jsonEditor.get();

	var id = widget.currentFileId;
	var node;
	for (var i=0; i<widget.data.data.length; i++) {
	    if (widget.data.data[i].id == id) {
		widget.data.data[i].attributes = newNodeAttributes;
		node = widget.data.data[i];
		break;
	    }
	}
	var url = widget.shockBase+'/node/'+node.id;
	var fd = new FormData();
	fd.append('attributes', new Blob([ JSON.stringify(newNodeAttributes) ], { "type" : "text\/json" }));
	jQuery.ajax(url, {
	    contentType: false,
	    processData: false,
	    data: fd,
	    success: function(data){
		alert('attributes updated');
	    },
	    error: function(jqXHR, error){
		console.log(error);
		console.log(jqXHR);
	    },
	    crossDomain: true,
	    headers: Retina.WidgetInstances.shockbrowse[1].authHeader,
	    type: "PUT"
	});
	
	widget.jsonEditor.setMode('view');

	var button = document.getElementById('attributesEditorButton');
	button.innerHTML = "edit";
	button.addEventListener('click', function(){
	    Retina.WidgetInstances.shockbrowse[1].editAttributes();
	});
    };
    
    // UPLOAD FUNCTIONS

    // start the actual upload
    widget.uploadFile = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// get the selected file
	var file = widget.uploadDialog.files[0];

	// set up the url
	var url = widget.shockBase+'/node';
	widget.uploadURL = url;
	
	widget.currentUpload();

	widget.currentUploadChunk = 0;

	widget.initializeFileReader(file);
	var chunkSize = widget.uploadChunkSize == 0 ? file.size : widget.uploadChunkSize;
	widget.uploadChunkSize = chunkSize;
	var chunks = Math.ceil(file.size / chunkSize);

	// set up the node
	var incomplete = new Blob([ JSON.stringify({ "incomplete": "1", "incomplete_size": file.size, "incomplete_name": file.name, "incomplete_user": widget.user.login, "incomplete_chunk": Retina.WidgetInstances.shockbrowse[1].currentUploadChunk, "incomplete_chunksize": Retina.WidgetInstances.shockbrowse[1].uploadChunkSize }) ], { "type" : "text\/json" });
	var form = new FormData();
	form.append('attributes', incomplete);
	form.append('parts', chunks);
	jQuery.ajax(widget.uploadURL, {
	    contentType: false,
	    processData: false,
	    data: form,
	    success: function(data) {
		widget.uploadURL += "/" + data.data.id;
		Retina.WidgetInstances.shockbrowse[1].loadNext();
	    },
	    error: function(jqXHR, error){
		Retina.WidgetInstances.shockbrowse[1].uploadDone(null, error);
	    },
	    crossDomain: true,
	    headers: Retina.WidgetInstances.shockbrowse[1].authHeader,
	    type: "POST"
	});
    };

    widget.initializeFileReader = function (file) {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	if (widget.fileReader) {
	    return;
	}

	// get the tools
	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
	var chunkSize = widget.uploadChunkSize == 0 ? file.size : widget.uploadChunkSize;
	widget.uploadChunkSize = chunkSize;
	var start = 0;
	var end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
	var chunks = Math.ceil(file.size / chunkSize);

	// file reader
	var fileReader = new FileReader();
	widget.fileReader = fileReader;
	fileReader.onerror = function (error) {
	    Retina.WidgetInstances.shockbrowse[1].uploadDone(null, error);
	};
	fileReader.onload = function(e) {
	    var data = e.target.result;
	    var fd = new FormData();
	    var oMyBlob = new Blob([data], { "type" : file.type });
	    var incomplete = new Blob([ JSON.stringify({ "incomplete": "1", "incomplete_size": file.size, "incomplete_name": file.name, "incomplete_user": widget.user.login, "incomplete_chunk": Retina.WidgetInstances.shockbrowse[1].currentUploadChunk, "incomplete_chunksize": Retina.WidgetInstances.shockbrowse[1].uploadChunkSize }) ], { "type" : "text\/json" });
	    fd.append('attributes', incomplete);

	    fd.append(Retina.WidgetInstances.shockbrowse[1].currentUploadChunk+1, oMyBlob);
	    jQuery.ajax(widget.uploadURL, {
		xhr: function() {
		    var xhr = new window.XMLHttpRequest();
		    xhr.upload.addEventListener("progress", Retina.WidgetInstances.shockbrowse[1].uploadProgress, false);
		    Retina.WidgetInstances.shockbrowse[1].uploadXHR = xhr;
		    return xhr;
		},
		contentType: false,
		processData: false,
		data: fd,
		success: function(data) {
		    Retina.WidgetInstances.shockbrowse[1].currentUploadChunk++;
		    if ((Retina.WidgetInstances.shockbrowse[1].currentUploadChunk * Retina.WidgetInstances.shockbrowse[1].uploadChunkSize) > file.size) {
			Retina.WidgetInstances.shockbrowse[1].uploadDone(data.data);
		    } else {
			if (! Retina.WidgetInstances.shockbrowse[1].uploadPaused) {
			    Retina.WidgetInstances.shockbrowse[1].loadNext();
			} else {
			    Retina.WidgetInstances.shockbrowse[1].chunkComplete = true;
			}
		    }
		},
		error: function(jqXHR, error){
		    Retina.WidgetInstances.shockbrowse[1].uploadDone(null, error);
		},
		crossDomain: true,
		headers: Retina.WidgetInstances.shockbrowse[1].authHeader,
		type: "PUT"
	    });
	}
    };

    widget.loadNext = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// get the selected file
	var file = widget.uploadDialog.files[0];

	var start = parseInt(Retina.WidgetInstances.shockbrowse[1].currentUploadChunk * parseInt(Retina.WidgetInstances.shockbrowse[1].uploadChunkSize)),
	end = ((start + parseInt(Retina.WidgetInstances.shockbrowse[1].uploadChunkSize)) >= file.size) ? file.size : start + parseInt(Retina.WidgetInstances.shockbrowse[1].uploadChunkSize);

	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
	widget.fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
    };

    // show the details about the current upload in the detail section
    widget.currentUpload = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// prevent another upload from starting simultaneously
	widget.uploadButton.addEventListener('click', function(){ Retina.WidgetInstances.shockbrowse[1].currentUpload(); });

	// get the section
	var section = Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent;

	// get the selected file
	var file = widget.uploadDialog.files[0];

	var html = "<div style='margin-bottom: 25px;'><h4>uploading "+file.name+"</h4><table style='text-align: left;'><tr><th style='padding-right: 20px;'>filename</th><td>"+file.name+"</td><tr></tr><th>modified</th><td>"+file.lastModifiedDate+"</td></tr><tr><th>size</th><td>"+file.size.byteSize()+"</td></tr><tr><th>type</th><td>"+(file.type || "-")+"</td></tr></table></div>";

	section.innerHTML = html;

	var progressText = document.createElement('div');
	progressText.setAttribute('style', 'text-align: center;');
	section.appendChild(progressText);
	widget.sections.progressText = progressText;
	var progressContainer = document.createElement('div');
	widget.sections.progressContainer = progressContainer;
	progressContainer.setAttribute("style", "height: 25px;");
	progressContainer.className = "progress";
	var progressBar = document.createElement('div');
	progressBar.className = "bar";
	progressBar.setAttribute("style", "width: 0%;");
	progressContainer.appendChild(progressBar);	    
	widget.sections.progressBar = progressBar;
	section.appendChild(progressContainer);

	var buttons = document.createElement('div');
	widget.abortButtons = buttons;
	buttons.setAttribute('style', 'margin-top: 25px;');
	buttons.innerHTML = "<button class='btn pull-left' type='button' onclick='Retina.WidgetInstances.shockbrowse[1].pauseUpload();'><i class='icon-pause'></i> pause upload</button><button class='btn btn-danger pull-right' type='button' onclick='Retina.WidgetInstances.shockbrowse[1].abortUpload();'><i class='icon-stop'></i> abort</button>";
	section.appendChild(buttons);
    };

    widget.abortUpload = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// abort the upload
	widget.uploadXHR.abort();
	widget.abortButtons.innerHTML = "<div class='alert alert-error'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>aborted...</strong> the upload has been aborted by user request.</div>";
	widget.uploadDone(null, "aborted by user");
    };

    widget.pauseUpload = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// do pause and resume
	if (widget.uploadPaused) {
	    widget.uploadPaused = false;
	    widget.abortButtons.innerHTML = "<button class='btn pull-left' type='button' onclick='Retina.WidgetInstances.shockbrowse[1].pauseUpload();'><i class='icon-pause'></i> pause upload</button><button class='btn btn-danger pull-right' type='button' onclick='Retina.WidgetInstances.shockbrowse[1].abortUpload();'><i class='icon-stop'></i> abort</button>";
	    if (widget.chunkComplete) {
		widget.chunkComplete = false;
		widget.loadNext();
	    }
	} else {
	    widget.uploadPaused = true;
	    widget.abortButtons.innerHTML = "<div class='alert alert-info'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>pausing...</strong> the upload will pause when the current chunk is complete.</div><button class='btn pull-left' type='button' onclick='Retina.WidgetInstances.shockbrowse[1].pauseUpload();'><i class='icon-play'></i> resume upload</button><button class='btn btn-danger pull-right' type='button' onclick='Retina.WidgetInstances.shockbrowse[1].abortUpload();'><i class='icon-stop'></i> abort</button>";
	}
    };

    // update the progress bars
    widget.uploadProgress = function (event) {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// get the selected file
	var file = widget.uploadDialog.files[0];

	var loaded = event.loaded + (widget.currentUploadChunk * widget.uploadChunkSize);
	var total = file.size;
	var percent = parseFloat(loaded / total * 100);
	document.getElementById('progress_button_progress').style.width = parseInt(36 * percent / 100) + "px";
	widget.sections.progressText.innerHTML = loaded.byteSize() + " complete";
	widget.sections.progressBar.style.width = percent+"%";
    };

    // the upload has completed successfully, show the details about the uploaded file
    widget.uploadDone = function (data, error) {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	widget.uploadButton.addEventListener('click', function(){ Retina.WidgetInstances.shockbrowse[1].uploadDialog.click(); });
	widget.sections.progressContainer.style.width = "100%";
	document.getElementById('progress_button_progress').style.display = "none";
	widget.uploadPaused = false;
	widget.chunkComplete = false;

	// upload was successful, remove incomplete attributes
	if (data) {
	    widget.abortButtons.style.display = "none";
	    
	    // set up the url
	    var url = widget.shockBase+'/node';
	    var file = widget.uploadDialog.files[0];
	    var fd = new FormData();
	    fd.append('attributes', new Blob([ JSON.stringify({}) ], { "type" : "text\/json" }));
	    fd.append('file_name', file.name);
	    jQuery.ajax(url +  "/" + data.id, {
		contentType: false,
		processData: false,
		data: fd,
		success: function(data){
		    // get the section
		    var section = Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent;
		    var done = document.createElement('div');
		    done.setAttribute('class', 'alert alert-success');
		    done.innerHTML = "The upload has completed successfully";
		    section.appendChild(done);

		    var checksum = document.createElement('div');
		    checksum.innerHTML = "<h4>check md5-sum</h4><p>To check for file corruption paste the md5-sum of your local file into the textbox below and click <b>check</b>.</p><input type='text' disabled value='"+data.data.file.checksum.md5+"' class='span4'><div class='input-append'><input type='text' placeholder='paste md5 here' class='span4'><button class='btn' onclick='if(this.previousSibling.value==\""+data.data.file.checksum.md5+"\"){alert(\"file is OK\");}else{alert(\"file is corrupted!\");}'>check</button></div>";
		    section.appendChild(checksum);

		    if (typeof Retina.WidgetInstances.shockbrowse[1].fileUploadCompletedCallback == 'function') {
			Retina.WidgetInstances.shockbrowse[1].fileUploadCompletedCallback.call(null, data);
		    }
		},
		error: function(jqXHR, error){
		    console.log(error);
		    console.log(jqXHR);
		},
		crossDomain: true,
		headers: Retina.WidgetInstances.shockbrowse[1].authHeader,
		type: "PUT"
	    });
	}
    };

    // a file was selected for upload, show details, preview, settings and upload button
    widget.uploadFileSelected = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// get the selected file
	var file = widget.uploadDialog.files[0];
	
	// get the filereader
	var fileReader = new FileReader();
	fileReader.onerror = function (error) {
	    console.log(error);
	};
	var chunkSize = widget.previewChunkSize;
	var start = 0;
	var end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;

	// check file type
	var fileType = file.type || "-";
	if (! file.type) {

	    // check for sequence files
	    var sequenceFiles = { "fasta$": "fasta",
				  "fna$": "fasta",
				  "fq$": "fastq",
				  "fastq$": "fastq",
				  "faa$": "fasta",
				  "fa$": "fasta" };

	    for (var i in sequenceFiles) {
		if (sequenceFiles.hasOwnProperty(i)) {
		    if (file.name.match(i)) {
			fileType = "text/"+sequenceFiles[i];
		    }
		}
	    }
	}

	// show file details and settings
	var section = Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent;
	var html = "<p><table style='text-align: left;'><tr><th style='padding-right: 20px;'>filename</th><td>"+file.name+"</td><tr></tr><th>modified</th><td>"+file.lastModifiedDate+"</td></tr><tr><th>size</th><td>"+file.size.byteSize()+"</td></tr><tr><th>type</th><td>"+fileType+"</td></tr></table></p><div style='text-align: center;'><button class='btn btn-success' type='button' onclick='Retina.WidgetInstances.shockbrowse[1].uploadFile();'>commence upload</button><button class='btn pull-right' data-toggle='button' type='button' onclick='if(this.className.match(/active/)){document.getElementById(\"upload_advanced_options\").style.display=\"none\";}else{document.getElementById(\"upload_advanced_options\").style.display=\"\";}'><i class='icon icon-cog'></i> advanced</button></div><div id='upload_advanced_options' style='margin-top: 10px; border: 1px solid #bbbbbb; padding: 5px; margin-bottom: 10px; display: none;'><b>upload chunk size</b> <select id='upload_chunk_size' onchange='Retina.WidgetInstances.shockbrowse[1].uploadChunkSize=this.options[this.selectedIndex].value;' style='position: relative; top: 4px; left: 5px;'>";
	
	// upload chunk size is currently the only advanced parameter
	var chunkSizes = [ [ 1024 * 100, "100 KB" ],
			   [ 1024 * 1024, "1 MB" ],
			   [ 1024 * 1024 * 10, "10 MB" ],
			   [ 1024 * 1024 * 100, "100 MB" ],
			   [ 0, "unchunked" ] ];
	for (var i=0; i<chunkSizes.length; i++) {
	    var sel = "";
	    if (chunkSizes[i][0] == widget.uploadChunkSize) {
		sel = " selected";
	    }
	    html += "<option value='"+chunkSizes[i][0]+"'"+sel+">"+chunkSizes[i][1]+"</option>";
	}

	html += "</select></div>";
	
	section.innerHTML = html;

	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

	if (widget.showUploadPreview) {
	    // check if we can show a preview
	    if (fileType.match(/json$/)) {
		fileReader.onload = function(e) {
		    var section = Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent;
		    section.innerHTML += "<p><b>Preview</b></p><pre>" + e.target.result + "\n"+(file.size > chunkSize ? "..." : "")+"</pre>";
		};
		fileReader.readAsText(blobSlice.call(file, start, end));	    
	    } else if (fileType.match(/^text/)) {
		fileReader.onload = function(e) {
		    var section = Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent;
		    section.innerHTML += "<p><b>Preview</b></p><pre style='overflow: auto;'><xmp>" + e.target.result + "\n"+(file.size > chunkSize ? "..." : "")+"</xmp></pre>";
		};
		fileReader.readAsText(blobSlice.call(file, start, end));
	    } else if (fileType.match(/^image/)) {
		fileReader.onload = function(e) {
		    var section = Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent;
		    var img = document.createElement('img');
		    img.setAttribute('src', e.target.result);
		    section.innerHTML += "<p><b>Preview</b></p>";
		    section.appendChild(img);
		    img.addEventListener('load', function () {
			if (img.naturalWidth > (Retina.WidgetInstances.shockbrowse[1].detailWidth - 20)) {
			    img.setAttribute('style', 'width: '+(Retina.WidgetInstances.shockbrowse[1].detailWidth - 20)+'px');
			}
			var sizeNode = document.createElement("p");
			sizeNode.innerHTML = " <i style='font-size: 12px;'>original size: "+img.naturalWidth+"px wide - "+img.naturalHeight+"px high</i>";
			Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent.insertBefore(sizeNode, img);
		    });
		};
		fileReader.readAsDataURL(file);	    
	    } else if (fileType.match(/\/zip$/)) {
		fileReader.onload = function(e) {
		    var zip = new JSZip(e.target.result);
		    var html = "<p><b>Contents</b></p><table class='table' style='margin-top: 25px; font-size: 12px;'><tr><th>name</th><th>compressed</th><th>uncompressed</th></tr>";
		    var first;
		    for (var i in zip.files) {
			if (zip.files.hasOwnProperty(i)) {
			    if (! first) {
				first = i;
			    }
			    html += "<tr><td>"+i+"</td><td>"+zip.files[i]._data.compressedSize.byteSize()+"</td><td>"+zip.files[i]._data.uncompressedSize.byteSize()+"</td></tr>";
			}
		    }
		    html += "</table>";
		    var buf = zip.file(first).asText(10);
		    console.log(buf);
		    Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent.innerHTML += html;
		}
		fileReader.readAsArrayBuffer(file);
	    }
	}
    }

    // RESUME UPLOAD SECTION
    
    // find the resumable uploads for the current user
    widget.findResumableUploads = function () {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// remove previously fetched data
	widget.resumableData = [];

	// construct URL
	var url = widget.shockBase + "/node?query&incomplete=1&incomplete_user=" + widget.user.login;

	// get the section
	var section = Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent;

	section.innerHTML = "<h4>Resumable Uploads</h4><div style='text-align: center; margin-top: 100px;'>loading<br><img src='Retina/images/waiting.gif' style='width: 25px;'></div>";
	
	jQuery.ajax({ url: url,
		      dataType: "json",
		      success: function(data) {
			  var widget = Retina.WidgetInstances.shockbrowse[1];
			  if (data != null) {
			      if (data.error != null) {
				  widget.displayResumableUploads(null, data.error);
			      } else {
				  widget.displayResumableUploads(data);
			      }
			  } else {
			      widget.displayResumableUploads(null, data);
			  }
		      },
		      error: function(jqXHR, error) {
			  var widget = Retina.WidgetInstances.shockbrowse[1];
			  console.log( "error: unable to connect to SHOCK server" );
			  console.log(error);
			  widget.displayResumableUploads(null, error);
		      },
		      crossDomain: true,
		      headers: widget.authHeader
		    });
    };
    
    widget.displayResumableUploads = function (data, error) {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// get the section
	var section = Retina.WidgetInstances.shockbrowse[1].sections.detailSectionContent;
	
	if (error) {
	    section.innerHTML = "<h4>Error</h4><pre>"+JSON.stringify(error, null, 2)+"</pre>";
	} else {
	    if (data.data.length) {
		widget.resumableData = data.data;
		var html = "<h4>Resumable Uploads</h4><table class='table' style='text-align: left; font-size: 12px;'><tr><th>filename</th><th>full size</th><th>complete</th><th>resume</th></tr>";
		for (var i=0; i<data.data.length; i++) {
		    var ds = data.data[i].attributes;
		    var size = (ds.incomplete_chunk + 1) * ds.incomplete_chunksize;
		    html += "<tr><td>"+ds.incomplete_name+"</td><td>"+ds.incomplete_size.byteSize()+"</td><td>"+size.byteSize()+"</td><td><button class='btn btn-small' onclick='Retina.WidgetInstances.shockbrowse[1].resumeUploadIndex="+i+";Retina.WidgetInstances.shockbrowse[1].uploadDialog.click();'><i class='icon-play'></i></button></td></tr>";
		}
		html += "</table>";
		section.innerHTML = html;

		jQuery(widget.uploadDialog).off('change');
		jQuery(widget.uploadDialog).on('change', function(event){
		    Retina.WidgetInstances.shockbrowse[1].resumeUpload();
		});
	    } else {
		section.innerHTML = "<h4>Resumable Uploads</h4><p>No resumable uploads were found.</p>";
	    }
	}
    };

    widget.resumeUpload = function (event) {
	var widget = Retina.WidgetInstances.shockbrowse[1];

	// if no resume index is set, this is a real upload
	if (Retina.WidgetInstances.shockbrowse[1].resumeUploadIndex == null) {
	    jQuery(widget.uploadDialog).off('change');
	    jQuery(widget.uploadDialog).on('change', function(event){
		Retina.WidgetInstances.shockbrowse[1].uploadFileSelected(event);
	    });
	    widget.uploadFileSelected(event);
	    return;
	}

	// get the selected file
	var file = widget.uploadDialog.files[0];

	// get the file to be resumed
	var node = widget.resumableData[Retina.WidgetInstances.shockbrowse[1].resumeUploadIndex];
	Retina.WidgetInstances.shockbrowse[1].resumeUploadIndex = null;

 	// check if the selected file matches the one to be resumed
	if (file.name == node.attributes.incomplete_name && file.size == node.attributes.incomplete_size) {
	    widget.currentUploadChunk = node.attributes.incomplete_chunk + 1;
	    widget.currentChunksize = node.attributes.incomplete_chunksize;
	    widget.uploadURL = widget.shockBase + "/node/" + node.id;
	    widget.currentUpload();
	    widget.initializeFileReader(file);
	    widget.loadNext();
	} else {
	    alert("The selected file does not match the file to be resumed");
	    return;
	}
    };

    /* CUSTOM PREVIEW */
    widget.previewStub = function (params) {
	if (params.node.attributes.type == "awe_workflow") {
	    var html = "<style>\
.awetaskbox {\
  cursor: pointer;\
  border-radius: 4px;\
  box-shadow: 4px 4px 4px #BBBBBB;\
  border: 1px solid gray;\
  text-align: center;\
  vertical-align: middle;\
  float: left;\
}\
.awetaskbox:active {\
  box-shadow: 0px 0px 4px #BBBBBB;\
}\
.awetaskboxSelected {\
  border: 2px dotted green;\
}\
.awetaskboxDependant {\
  border: 2px dotted blue;\
}\
</style>\
";
	    params.data = params.data.replace(/\#totalwork/g, '"#totalwork"');
	    var data = JSON.parse(params.data);

	    // show the info section
	    html += "<h4>"+params.node.file.name+"</h4><h5>info</h5>";
	    html += "<table style='font-size: 13px;'>";
 	    for (var h in data.info) {
		if (data.info.hasOwnProperty(h)) {
		    html += "<tr><td style='text-align: left; vertical-align: middle; font-weight: bold; padding-left: 50px;'>"+h+"</td><td style='padding-left: 10px; text-align: left;'>" + data.info[h] + "</td></tr>";
		}
	    }
	    html += "</table>";

	    // calculate the task hierarchy
	    var tasks = data.tasks;
	    var hierarchy = {};
	    var remaining = [];
	    var levelWidth = { 0: 0 };
	    for (var i=0; i<tasks.length; i++) {
		if (tasks[i].dependsOn.length == 0) {
		    hierarchy[tasks[i].taskid] = 0;
		    levelWidth[0]++;
		} else {
		    remaining.push(tasks[i]);
		}
	    }
	    var maxLevel = 0;
	    var maxLevelWidth = levelWidth[0];
	    while (remaining.length) {
		var stillremaining = [];
		for (var i=0; i<remaining.length; i++) {
		    var max = 0;
		    var unknown = false;
		    for (var h=0; h<remaining[i].dependsOn.length; h++) {
			if (hierarchy.hasOwnProperty(remaining[i].dependsOn[h])) {
			    if (max < (hierarchy[remaining[i].dependsOn[h]] + 1)) {
				max = hierarchy[remaining[i].dependsOn[h]] + 1;
			    }
			} else {
			    unknown = true;
			    break;
			}
		    }
		    if (unknown) {
			stillremaining.push(remaining[i]);
		    } else {
			if (! levelWidth.hasOwnProperty(max)) {
			    levelWidth[max] = 0;
			}
			hierarchy[remaining[i].taskid] = max;
			levelWidth[max]++;
			if (levelWidth[max] > maxLevelWidth) {
			    maxLevelWidth = levelWidth[max];
			}
			if (max > maxLevel) {
			    maxLevel = max;
			}
		    }
		}
		remaining = stillremaining;
	    }

	    // draw the tasks
	    var taskheight = 50;
	    var fontsize = 13;
	    var taskvpadding = 10;
	    var taskwidth = 50;
	    var taskhpadding = 10;
	    var totalHeight = (taskheight * maxLevel) + (taskvpadding * (maxLevel - 1));
	    var totalWidth = (taskwidth * maxLevelWidth) + (taskhpadding * (maxLevelWidth - 1));
	    if (totalWidth < 400) {
		totalWidth = 400;
	    }
	    html += "<h5>tasks</h5><div style='width: 280px; float: left; height: 465px; overflow-y: auto; border-radius: 4px; box-shadow: 4px 4px 4px #BBBBBB; border: 1px solid black; margin-left: 20px; padding: 0 10px 10px; font-size: 13px;' id='taskPreviewDetails'><h5>selected task</h5><p style='margin-top: 100px; text-align: center; color: gray;'>none selected</p></div></div><div style='height: "+totalHeight+"; width: "+totalWidth+"; font-size: "+fontsize+"px; float: left;'>";
	    for (var i=0; i<=maxLevel; i++) {
		var placed = 0;
		var spaceNeeded = (levelWidth[i] * taskwidth) + ((levelWidth[i] - 1) * taskhpadding);
		var left = parseInt((totalWidth - spaceNeeded) / 2);
		for (var h=0; h<tasks.length; h++) {
		    if (hierarchy[tasks[h].taskid] == i) {
			html += "<div class='awetaskbox' name='taskPreviewTask' onclick='AWEtaskClick(\""+tasks[h].taskid+"\");' id='taskPreviewTask"+tasks[h].taskid+"' style='"+(placed == 0 ? "clear: left; margin-left: "+left+"px;" : "margin-left: "+taskhpadding+"px;")+" width: "+taskwidth+"px; height: "+(taskheight / 2 + fontsize)+"px; padding-top: "+(taskheight / 2 - fontsize)+"px;"+(i>0 ? " margin-top: "+taskvpadding+"px;" : "")+"'>"+tasks[h].taskid+"</div>";
			placed++;
			if (placed == levelWidth[i]) {
			    break;
			}
		    }
		}
	    }
	    html += "</div>";

	    // create the onclick function
	    var taskhash = {};
	    for (var i=0; i<tasks.length; i++) {
		taskhash[tasks[i].taskid] = tasks[i];
	    }
	    window.AWEtasks = taskhash;
	    window.AWEtaskClick = function(id) {
		var task = AWEtasks[id];
		var target = document.getElementById('taskPreviewDetails');
		var html = '\
<h5>'+task.cmd.description+'</h5>\
<table>\
<tr><td style="vertical-align: top; padding-right: 20px;"><b>ID</b></td><td>'+task.taskid+'</td></tr>\
'+(task.totalwork ? '<tr><td style="vertical-align: top; padding-right: 20px;"><b>workunits</b></td><td>'+task.totalwork+'</td></tr>' : '')+'\
<tr><td style="vertical-align: top; padding-right: 20px;"><b>depends on</b></td><td>'+(task.dependsOn.length ? task.dependsOn.join(", ") : "none")+'</td></tr>\
<tr><td style="vertical-align: top; padding-right: 20px;"><b>command</b></td><td>'+task.cmd.name+'</td></tr>\
<tr><td style="vertical-align: top;" colspan=2><b>parameters</b></td></tr>\
<tr><td colspan=2>'+task.cmd.args+'</td></tr>'
		html += '<tr><td style="vertical-align: top;" colspan=2><b>input files</b></td></tr>';
		for (var i in task.inputs) {
		    if (task.inputs.hasOwnProperty(i)) {
			html += '<tr><td colspan=2>'+i+(task.inputs[i].hasOwnProperty('origin') ? " (from task "+task.inputs[i].origin+")" : "")+'</td></tr>';			
		    }
		}
		html += '<tr><td style="vertical-align: top;" colspan=2><b>output files</b></td></tr>';
		for (var i in task.outputs) {
		    if (task.outputs.hasOwnProperty(i)) {
			html += '<tr><td colspan=2>'+i+'</td></tr>';			
		    }
		}
		html += '</table>';
		target.innerHTML = html;

		var tasks = document.getElementsByName('taskPreviewTask');
		for (var i=0; i<tasks.length; i++) {
		    tasks[i].setAttribute('class', 'awetaskbox');
		}
		document.getElementById('taskPreviewTask'+task.taskid).setAttribute('class', 'awetaskbox awetaskboxSelected');
		for (var i=0; i<task.dependsOn.length; i++) {
		    document.getElementById('taskPreviewTask'+task.dependsOn[i]).setAttribute('class', 'awetaskbox awetaskboxDependant');
		}
	    };

	    // return the html
	    return html;
	} else {
	    return "<pre>"+params.data+"</pre>";
	}

	
    };

})();