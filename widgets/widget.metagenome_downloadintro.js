(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Download Introduction Widget",
                name: "metagenome_downloadintro",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });
    
    widget.setup = function () {
	return [];
    };
    
    widget.display = function (params) {
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

	document.getElementById("pageTitle").innerHTML = "download";

	// create the html
	var html = [ "<h3><img src='Retina/images/cloud-download.png' style='width: 24px; margin-right: 10px; position: relative; bottom: 3px;'>Download from MG-RAST</h3>" ];
	html.push("<p>MG-RAST hosts over 100 Tbp of metagenomic data which can be downloaded in multiple ways described in detail below. Access to private data requires the use of a <a href='#'>webkey</a>. The owner of a dataset has control over sharing access to their data with individuals or the public. </p>");

	html.push('<div class="row-fluid">\
            <ul class="thumbnails">\
              <li class="span4">\
                <div class="thumbnail" style="min-height: 520px;">\
                  <img src="Retina/images/website.png" style="margin-top: 15px;">\
                  <div class="caption">\
                    <h3>Website</h3>\
                    <p>The MG-RAST website offers download of data everywhere you go. Whenever you see the <img src="Retina/images/cloud-download.png" style="width: 16px;"> symbol, click it to download the referenced data. This can be a table, a graphic or a file from the MG-RAST pipeline.</p>\
                    <p>A great place to start looking for data is the <img src="Retina/images/search.png" style="width: 16px;"> <a href="mgmain.html?mgpage=search">search page</a>, where you can search for data by project, metagenome, PI and other metadata. The results will feature a <img src="Retina/images/cloud-download.png" style="width: 16px;"> symbol that takes you directly to the according download page.</p>\
                    <p>The <a href="mgmain.html?mgpage=overview&metagenome=mgm4441834.3">metagenome overview page</a> of a metagenome features a lot of visualizations which can also be downloaded (as well as the data used to produce them).</p>\
                    <p style="text-align: center;"><a class="btn" href="mgmain.html?mgpage=search">search website</a></p>\
                  </div>\
                </div>\
              </li>\
              <li class="span4">\
                <div class="thumbnail" style="min-height: 520px;">\
                  <img src="Retina/images/ftp.png" style="margin-top: 15px;">\
                  <div class="caption">\
                    <h3>FTP site</h3>\
                    <p>Our FTP site features downloads for all public projects as well as our non-redundant MD5 database. You will also find our download tools here.</p>\
                    <p><a class="btn" href="http://ftp.metagenomics.anl.gov">visit FTP site</a> <a class="btn pull-right" href="#">help on FTP site structure</a></p>\
                  </div>\
                </div>\
              </li>\
              <li class="span4">\
                <div class="thumbnail" style="min-height: 520px;">\
                  <img src="Retina/images/api.png" style="margin-top: 15px;">\
                  <div class="caption">\
                    <h3>API & commandline-tools</h3>\
                    <p>Through our API you have programmatic access to all data in MG-RAST. Accessing private data requires the use of a <a href="#">webkey</a>. In addition to full downloads, you can also filter the data or join multiple datasets.</p>\
                    <p>Our tools include an R client as well as a download tool which grants scripted access to the data.</p>\
                    <p><a class="btn" href="http://api.metagenomics.anl.gov/api.html">API documentation</a> <a class="btn pull-right" href="#">commandline tools</a></p>\
                  </div>\
                </div>\
              </li>\
            </ul>\
          </div>');
	    
	content.innerHTML = html.join("");
    };

})();
