(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Ooverview Widget",
                name: "metagenome_overview",
                author: "Tobias Paczian",
                requires: []
        }
    });

    widget.statusDiv = "";
    
    widget.setup = function () {
	return [
	    Retina.load_renderer("svg"),
	    Retina.load_renderer('notebook'),
	    Retina.load_widget("mgbrowse")
	];
    };
        
    widget.display = function (wparams) {
        widget = this;

	var container = widget.target = wparams ? wparams.main : widget.target;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;

	if (Retina.cgiParam('metagenome')) {
	    widget.id = Retina.cgiParam('metagenome').match(/^mgm/) ? Retina.cgiParam('metagenome') : Retina.idmap(Retina.cgiParam('metagenome'));
	    if (! widget.id.match(/^mgm/)) {
		widget.id = "mgm"+widget.id;
	    }
	}
	
        // check if id given
        if (widget.id) {
	    widget.sidebar.parentNode.className = "span3 sidebar affix";
	    widget.sidebar.parentNode.style = "right: 8%; background-color: white;";
	    jQuery('#mg_modal').modal('hide');
	    
	    widget.target.innerHTML = '<div id="status">'+widget.statusDiv+'</div><div id="notebook"><div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div></div>';
	    
	    if (stm.DataStore.hasOwnProperty('metagenome') && stm.DataStore.metagenome.hasOwnProperty(widget.id) && stm.DataStore.metagenome[widget.id].hasOwnProperty('computationStatus') && stm.DataStore.metagenome[widget.id].computationStatus == 'incomplete') {
		widget.target.innerHTML = "<div class='alert'>This metagenome has not yet finished analysis.</div>";
		return;
	    }
	    
	    // check if required data is loaded (use stats)
	    if (! stm.DataStore.hasOwnProperty('metagenome') || ! stm.DataStore.metagenome.hasOwnProperty(widget.id) || ! stm.DataStore.metagenome[widget.id].hasOwnProperty('computationStatus')) {
		var url = RetinaConfig.mgrast_api + '/metagenome/'+widget.id+'?verbosity=full';
		jQuery.ajax( { dataType: "json",
			       url: url,
			       headers: stm.authHeader,
			       success: function(data) {
				   var widget = Retina.WidgetInstances.metagenome_overview[1]
				   if (! stm.DataStore.hasOwnProperty('metagenome')) {
				       stm.DataStore.metagenome = {};
				   }
				   if (data.hasOwnProperty('statistics')) {
				       data.computationStatus = "complete";
				   } else {
				       data.computationStatus = "incomplete";
				   }
				   if (data.pipeline_parameters.assembled == "yes") {
				       data.sequence_type = "Assembly";
				   }
				   stm.DataStore.metagenome[data.id] = data;

				   // check public / private status
				   if (data.status == "private") {
				       widget.statusDiv = '<div class="alert alert-info" style="font-size: 14px;">This data is private and cannot be publicly linked. Click the share button for publication options.<a class="btn" style="position: relative; bottom: 5px; float: right;" href="mgmain.html?mgpage=share" title="show sharing options"><i class="icon icon-share"></i></a></div>';
				   }
				   
				   widget.variableExtractorMetagenome(data.id);
				   var url = "data/";
				   switch (data.sequence_type) {
				   case 'Amplicon':
				       url += "amplicon";
				       document.getElementById("pageTitle").innerHTML = "amplicon metagenome";
				       break;
				   case 'MT':
				       url += "transcriptome";
				       document.getElementById("pageTitle").innerHTML = "shotgun metatranscriptome";
				       break;
				   case 'Assembly':
				       url += "assembly";
				       document.getElementById("pageTitle").innerHTML = "assembled shotgun metagenome";
				       break;
				   case 'WGS':
				       url += "shotgun";
				       document.getElementById("pageTitle").innerHTML = "shotgun metagenome";
				       break;
				   default:
				       url += "shotgun";
				       document.getElementById("pageTitle").innerHTML = "shotgun metagenome";
				       break;
				   }
				   url += "_overview.flow.json";
				   jQuery.getJSON(url).then(function(d) {
				       stm.DataStore.flows = { "metagenome_overview": d };
				       Retina.WidgetInstances.metagenome_overview[1].display();
				   });
			       },
			       error: function () {
				   widget.target.innerHTML = "<div class='alert alert-error' style='width: 50%;'>You do not have the permisson to view this data.</div>";
			       }
			     } );
		return;
            }
	    
	    var notebook = Retina.Renderer.create('notebook', { target: document.getElementById("notebook"), showTOC: true, tocTarget: sidebar, flow: stm.DataStore.flows.metagenome_overview, dataContainer: stm.DataStore.metagenome[widget.id] }).render();

	    // dynamically resolve pubmed
	    var mg = stm.DataStore.metagenome[widget.id];
	    if (mg.hasOwnProperty('metadata') && mg.metadata.hasOwnProperty('library') && mg.metadata.library.data.hasOwnProperty('pubmed_id')) {
	    var pubmed_ids = mg.metadata.library.data.pubmed_id.split(", ");
	    
	    jQuery.get("http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id="+pubmed_ids[0], function (data) {
		var journal, pubdate;
		var items = data.children[0].children[0].children;
		for (var i=0; i<items.length; i++) {
		    if (items[i].attributes.length) {
			if (items[i].attributes[0].nodeValue == "FullJournalName") {
			    journal = items[i].innerHTML;
			}
			if (items[i].attributes[0].nodeValue == "PubDate") {
			    pubdate = items[i].innerHTML;
			}
		    }
		}
		if (journal && pubdate) {
		    document.getElementById('pubmed').innerHTML = " - published in <a href='http://www.ncbi.nlm.nih.gov/pubmed/"+pubmed_ids[0]+"' target=_blank>"+journal+", "+pubdate+"</a>";
		}
	    });
	}
	    
	} else {
	    container.innerHTML = '\
<div id="mg_modal" class="modal show fade" tabindex="-1" style="width: 500px;" role="dialog">\
  <div class="modal-header">\
    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
    <h3>Metagenome Selector</h3>\
  </div>\
  <div class="modal-body" style="padding-left: 20px;"><div id="mg_modal_body"><div style="margin-left: auto; margin-right: auto; margin-top: 50px; margin-bottom: 50px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div></div></div>\
  <div class="modal-footer">\
    <button class="btn btn-danger pull-left" data-dismiss="modal" aria-hidden="true">Cancel</button>\
  </div>\
</div>';
	    widget.metagenome_modal();
	}
    };

    // mg selector modal, use API selectlist
    widget.metagenome_modal = function() {
	var widget = this;
        jQuery('#mg_modal').modal('show');
        if (! widget.mg_select_list) {
            widget.mg_select_list = Retina.Widget.create('mgbrowse', {
                target: document.getElementById('mg_modal_body'),
                type: 'listselect',
                wide: true,
                multiple: false,
                callback: function (data) {
		    var widget = Retina.WidgetInstances.metagenome_overview[1];
                    if ((! data) || (data.length == 0)) {
        	        alert("You have not selected a metagenome");
            	        return;
        	    }
		    jQuery('#mg_modal').modal('hide');
		    widget.id = data['id'];
    		    widget.display();
                }
            });
        } else {
            widget.mg_select_list.display();
        }
    };

    widget.variableExtractorMetagenome = function (id) {
	var widget = this;
	
	var mg = stm.DataStore.metagenome[id];
	
	// get base numbers
        var stats = mg && mg.statistics ? mg.statistics.sequence_stats : null;
	
	if (! stats) {
	    widget.target.innerHTML = '<div class="alert alert-error">no statistical data available for this metagenome</div>';
	    return;
	}

        var is_rna = (mg.sequence_type == 'Amplicon') ? 1 : 0;
        var raw_seqs    = ('sequence_count_raw' in stats) ? parseFloat(stats.sequence_count_raw) : 0;
        var qc_rna_seqs = ('sequence_count_preprocessed_rna' in stats) ? parseFloat(stats.sequence_count_preprocessed_rna) : 0;
        var qc_seqs     = ('sequence_count_preprocessed' in stats) ? parseFloat(stats.sequence_count_preprocessed) : 0;
        var rna_sims    = ('sequence_count_sims_rna' in stats) ? parseFloat(stats.sequence_count_sims_rna) : 0;
        var r_clusts    = ('cluster_count_processed_rna' in stats) ? parseFloat(stats.cluster_count_processed_rna) : 0;
        var r_clust_seq = ('clustered_sequence_count_processed_rna' in stats) ? parseFloat(stats.clustered_sequence_count_processed_rna) : 0;
        var ann_reads   = ('read_count_annotated' in stats) ? parseFloat(stats.read_count_annotated) : 0;
        var aa_reads    = ('read_count_processed_aa' in stats) ? parseFloat(stats.read_count_processed_aa) : 0;

	mg.statistics.sequence_breakdown.unknown_percent = (mg.statistics.sequence_breakdown.unknown / mg.statistics.sequence_breakdown.total * 100).formatString(2);
	mg.statistics.sequence_breakdown.unknown_prot_percent = (mg.statistics.sequence_breakdown.unknown_prot / mg.statistics.sequence_breakdown.total * 100).formatString(2);
	mg.statistics.sequence_breakdown.failed_qc_percent = (mg.statistics.sequence_breakdown.failed_qc / mg.statistics.sequence_breakdown.total * 100).formatString(2);
	mg.statistics.sequence_breakdown.known_rna_percent = (mg.statistics.sequence_breakdown.known_rna / mg.statistics.sequence_stats.read_count_processed_rna * 100).formatString();
	mg.statistics.sequence_breakdown.known_prot_percent = (mg.statistics.sequence_breakdown.known_prot / mg.statistics.sequence_breakdown.total * 100).formatString(2);

	mg.taxonomy = {};
	try {
	    var taxa = [ "domain", "phylum", "class", "order", "family", "genus" ];
	    for (var h=0; h<taxa.length; h++) {
		mg.taxonomy[taxa[h]] = [];
		var d = mg.statistics.taxonomy[taxa[h]];
		if (d == undefined) {
		    continue;
		}
		for (var j=0; j<d.length; j++) {
		    mg.taxonomy[taxa[h]].push( { value: d[j][1], label: d[j][0], click: 'if(confirm("Download the annotated sequences for this segment?")){window.open("'+RetinaConfig.mgrast_api+'/annotation/sequence/'+mg.id+'?source=RefSeq&browser=1&filter_level='+taxa[h]+'&type=organism&filter='+d[j][0].replace(/ /g, '%20')+(mg.status=="private" ? '&auth='+stm.authHeader.Authorization.replace(/ /, '%20') : "")+'");}' } );
		}
	    }
	} catch (error) {
	    console.log("could not parse taxonomy data: "+error);
	}

	mg.ontology = {};
	try {
	    var onto = [ "NOG", "COG", "KO", "Subsystems" ];
	    for (var h=0; h<onto.length; h++) {
		mg.ontology[onto[h]] = [];
		var d = mg.statistics.ontology[onto[h]];
		if (d == undefined) {
		    continue;
		}
		for (var j=0; j<d.length; j++) {
		    mg.ontology[onto[h]].push( { value: d[j][1], label: d[j][0], click: 'if(confirm("Download the annotated sequences for this segment?")){window.open("'+RetinaConfig.mgrast_api+'/annotation/sequence/'+mg.id+'?source='+onto[h]+'&browser=1&type=ontology&filter_level=level1&filter='+d[j][0].replace(/ /g, '\%20')+(mg.status=="private" ? '&auth='+stm.authHeader.Authorization.replace(/ /, '%20') : "")+ '");}'} );
		}
	    }
	} catch (error) {
	    console.log("could not parse functional data: "+error);
	}
	
	var allmetadata = [];
	if (mg.hasOwnProperty('metadata')) {
	    var cats = ['env_package', 'library', 'project', 'sample'];
	    for (var h=0; h<cats.length; h++) {
		if (! mg.metadata.hasOwnProperty(cats[h])) {
		    continue;
		}
		if (! mg.metadata[cats[h]].hasOwnProperty('data')) {
		    continue;
		}
		var k = Retina.keys(mg.metadata[cats[h]].data).sort();
		for (var i=0; i<k.length; i++) {
		    allmetadata.push([ cats[h], k[i], mg.metadata[cats[h]].data[k[i]] ]);
		}
	    }
	}
	mg.allmetadata = allmetadata;

	var sourcehits = [];
	var sourcehitsprotein = [];
	var sourcehitsrna = [];
	var rna = { "SSU": true, "LSU": true, "RDP": true, "Greengenes": true };
	if (mg.hasOwnProperty('statistics') && mg.statistics.hasOwnProperty('source')) {
	    var labels = ["e^-3 to e^-5", "e^-5 to e^-10", "e^-10 to e^-20", "e^-20 to e^-30", "e^-30 & less" ];
	    for (var h=0; h<5; h++) {
		sourcehits.push( { "label": labels[h], "values": [], "labels": [] } );
		sourcehitsprotein.push( { "label": labels[h], "values": [], "labels": [] } );
		sourcehitsrna.push( { "label": labels[h], "values": [], "labels": [] } );
		for (var i in mg.statistics.source) {
		    if (h == 0) {
			sourcehits[h].labels.push(i);
			if (rna[i]) {
			    sourcehitsrna[h].labels.push(i);
			} else {
			    sourcehitsprotein[h].labels.push(i);
			}
		    }
		    if (mg.statistics.source.hasOwnProperty(i)) {
			sourcehits[h].values.push(mg.statistics.source[i].evalue[h]);
			if (rna[i]) {
			    sourcehitsrna[h].values.push(mg.statistics.source[i].evalue[h]);
			} else {
			    sourcehitsprotein[h].values.push(mg.statistics.source[i].evalue[h]);
			}
		    }
		}
	    }
	}
	mg.sourcehitsdistribution = sourcehits;
	mg.sourcehitsdistributionrna = sourcehitsrna;
	mg.sourcehitsdistributionprotein = sourcehitsprotein;
	
	var bpprofile = [
	    { label: "A", values: [] },
	    { label: "T", values: [] },
	    { label: "C", values: [] },
	    { label: "G", values: [] },
	    { label: "N", values: [] } ]
	try {
	    for (var i=0; i<mg.statistics.qc.bp_profile.percents.data.length; i++) {
		for (var h=0; h<bpprofile.length; h++) {
		    bpprofile[h].values.push(mg.statistics.qc.bp_profile.percents.data[i][h+1]);
		}
	    }
	} catch (error) {
	    console.log("could not extract nucleotide data: "+error);
	}
	mg.bpprofile = bpprofile;
	
	var rankabundance = [];
	try {
	    if (mg.statistics.taxonomy.family != undefined) {
		var t = mg.statistics.taxonomy.family.sort(function(a,b) {
		    return b[1] - a[1];
		}).slice(0,50);
		for (var i=0; i<t.length; i++) {
		    rankabundance.push( { label: t[i][0], value: t[i][1], click: 'if(confirm("Download the annotated sequences for this segment?")){window.open("'+RetinaConfig.mgrast_api+'/annotation/sequence/'+mg.id+'?source=RefSeq&filter_level=family&type=organism&filter='+t[i][0].replace(/ /g, '%20')+(mg.status=="private" ? '&auth='+stm.authHeader.Authorization.replace(/ /, '%20') : "")+'");}' } );
		}
	    }
	} catch (error) {
	    console.log("could not extract rankabundance data: " + error);
	}
	mg.rankabundance = rankabundance;
	
	var rarefaction = [];
	try {
	    for (var i=0; i<mg.statistics.rarefaction.length; i++) {
		rarefaction.push({ x: mg.statistics.rarefaction[i][0], y: mg.statistics.rarefaction[i][1] });
	    }
	} catch (error) {
	    console.log("could not parse rarefaction data: "+error);
	}
	mg.rarefaction = rarefaction;
	
	var drisee = [ { label: "A", values: [] }, { label: "T", values: [] }, { label: "C", values: [] }, { label: "G", values: [] }, { label: "N", values: [] }, { label: "InDel", values: [] }, { label: "Total", values: [] } ];
	try {
	    var dr = mg.statistics.qc.drisee.percents.data;
	    for (var i=0; i<dr.length; i++) {
		for (var h=0; h<drisee.length; h++) {
		    drisee[h].values.push({x: dr[i][0], y: dr[i][h+1] });
		}
	    }
	} catch (error) {
	    console.log("could not parse drisee data:" +error);
	}
	mg.drisee = drisee;
	
	var kmer = [];
	try {
            for (var i=0; i<mg.statistics.qc.kmer['15_mer']['data'].length; i+=2) {
		var thisY = mg.statistics.qc.kmer['15_mer']['data'][i][0];
		kmer.push({ x: mg.statistics.qc.kmer['15_mer']['data'][i][3], y: thisY });
            }
	} catch (error) {
	    console.log("could not parse kmer data: "+error);
	}
	mg.kmer = kmer;

	var sequenceLengthQC = [];
	var sequenceLengthUpload = [];
	if (mg.hasOwnProperty('statistics') && mg.statistics.hasOwnProperty('length_histogram')) {
	    for (var i=0; i<mg.statistics.length_histogram.post_qc.length; i++) {
		sequenceLengthQC.push({ x: mg.statistics.length_histogram.post_qc[i][0], y: mg.statistics.length_histogram.post_qc[i][1] });
	    }
	    for (var i=0; i<mg.statistics.length_histogram.upload.length; i++) {
		sequenceLengthUpload.push({ x: mg.statistics.length_histogram.upload[i][0], y: mg.statistics.length_histogram.upload[i][1] });
	    }
	}
	mg.sequenceLengthQC = sequenceLengthQC;
	mg.sequenceLengthUpload = sequenceLengthUpload;

	var sequenceGCQC = [];
	var sequenceGCUpload = [];
	if (mg.hasOwnProperty('statistics') && mg.statistics.hasOwnProperty('gc_histogram')) {
	    for (var i=0; i<mg.statistics.gc_histogram.post_qc.length; i++) {
		sequenceGCQC.push({ x: mg.statistics.gc_histogram.post_qc[i][0], y: mg.statistics.gc_histogram.post_qc[i][1] });
	    }
	    for (var i=0; i<mg.statistics.gc_histogram.upload.length; i++) {
		sequenceGCUpload.push({ x: mg.statistics.gc_histogram.upload[i][0], y: mg.statistics.gc_histogram.upload[i][1] });
	    }
	}
	mg.sequenceGCQC = sequenceGCQC;
	mg.sequenceGCUpload = sequenceGCUpload;

	mg.ids = { "ncbi": "-", "pubmed": "-", "gold": "-" };
	if (mg.metadata.hasOwnProperty('project') && mg.metadata.project.hasOwnProperty('data') && mg.metadata.project.data.hasOwnProperty('ncbi_id')) {
	    var ncbiids = mg.metadata.project.data.ncbi_id.split(/, /);
	    for (var i=0; i<ncbiids.length; i++) {
		ncbiids[i] = '<a target="_blank" href="http://www.ncbi.nlm.nih.gov/genomeprj/'+ncbiids[i]+'">'+ncbiids[i]+'</a>';
	    }
	    mg.ids.ncbi = ncbiids.join(', ');
	}
	if (mg.hasOwnProperty('metadata') && mg.metadata.hasOwnProperty('library')) {
	    if (mg.metadata.library.data.hasOwnProperty('pubmed_id')) {
		var pubmedids = mg.metadata.library.data.pubmed_id.split(/, /);
		for (var i=0; i< pubmedids.length; i++) {
		    pubmedids[i] = '<a target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed/'+pubmedids[i]+'">'+pubmedids[i]+'</a>';
		}
		mg.ids.pubmed = pubmedids.join(', ');
	    }
	    if (mg.metadata.library.data.hasOwnProperty('gold_id')) {
		var goldids = mg.metadata.library.data.gold_id.split(/, /);
		for (var i=0; i<goldids.length; i++) {
		    goldids[i] = '<a target="_blank" href="http://genomesonline.org/cgi-bin/GOLD/bin/GOLDCards.cgi?goldstamp='+goldids[i]+'">'+goldids[i]+'</a>';
		}
		mg.ids.gold = goldids.join(', ');
	    }
	}
	if (mg.status == "public") {
	    mg.staticLink = "<a href='http://metagenomics.anl.gov/linkin.cgi?metagenome="+mg.id+"' title='static link'>http://metagenomics.anl.gov/linkin.cgi?metagenome="+mg.id+"</a>";
	} else {
	    mg.id = Retina.idmap(mg.id);
	    mg.staticLink = 'private metagenomes cannot be linked';	    
	}
    };
    
})();
