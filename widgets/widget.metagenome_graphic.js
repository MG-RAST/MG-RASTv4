(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Graphic Widget",
                name: "metagenome_graphic",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [
	    Retina.load_renderer("svg"),
	    Retina.load_widget("mgbrowse")
	];
    };
        
    widget.display = function (wparams) {
        widget = this;

	var container = widget.target = wparams ? wparams.main : widget.target;
	container.setAttribute('class', "span10 offset1");
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;
	try {
	    container.parentNode.removeChild(sidebar.parentNode);
	} catch (error) {
	    
	}
	document.getElementById('pageTitle').innerHTML = "Metagenome Graphic";

	widget.ids = [ "mgm4447943.3", "mgm4447903.3", "mgm4447102.3", "mgm4447192.3", "mgm4447970.3", "mgm4447101.3", "mgm4447971.3" ];

	widget.target.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div>';
	
	// check if required data is loaded (use stats)
	if (widget.dataLoaded) {
	    widget.showGraphic();
	} else {
	    stm.DataStore.metagenome = {};
	    var promises = [];
	    for (var i=0; i<widget.ids.length; i++) {
		var promise = jQuery.Deferred();
		promises.push(promise);
		var url = RetinaConfig.mgrast_api + '/metagenome/'+widget.ids[i]+'?verbosity=full';
		jQuery.ajax( { dataType: "json",
			       url: url,
			       prom: promise,
			       headers: stm.authHeader,
			       success: function(data) {
				   stm.DataStore.metagenome[data.id] = data;
				   this.prom.resolve();
			       },
			       error: function () {
				   widget.target.innerHTML = "<div class='alert alert-error' style='width: 50%;'>You do not have the permisson to view this data.</div>";
			       }
			     } );
	    }
	    jQuery.when.apply(this, promises).then(function(){
		Retina.WidgetInstances.metagenome_graphic[1].dataLoaded = true;
		Retina.WidgetInstances.metagenome_graphic[1].display();
	    });
	    return;
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

    widget.showGraphic = function () {
	var widget = this;

	widget.variableExtractorMetagenome();

	var html = "<div id='pic'></div>";

	widget.target.innerHTML = html;

	var data = [];
	for (var i=0; i<widget.ids.length; i++) {
	    data.push({ label: widget.ids[i], values: stm.DataStore.metagenome[widget.ids[i]].rarefaction });
	}
	
	var r = Retina.Renderer.create('svg', { target: document.getElementById('pic'), width: 1200, height: 700, valueAxisWidth: 100, labelAxisWidth: 100 });
	r.render().lineChart({ "data": data, "labelRotationX": 30, "graphWidth": 900 });

	var lx = 20;
	var ly = 250;
	var lx2 = 500;
	var ly2 = 690;
	r.svg.text(r.graphic, lx, ly, "Species Count", { fontSize: "20px", textAnchor: "end", transform: "rotate(-90,"+lx+","+ly+")" });
	r.svg.text(r.graphic, lx2, ly2, "Number of Reads", { fontSize: "20px" });
    };

    widget.variableExtractorMetagenome = function () {
	var widget = this;
	
	for (var ii=0; ii<widget.ids.length; ii++) {
	    var mg = stm.DataStore.metagenome[widget.ids[ii]];
	
	    // get base numbers
            var stats = mg.statistics.sequence_stats;
	    
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
	    
            // first round math
            var qc_fail_seqs  = raw_seqs - qc_seqs;
            var ann_rna_reads = rna_sims ? (rna_sims - r_clusts) + r_clust_seq : 0;
            var ann_aa_reads  = (ann_reads && (ann_reads > ann_rna_reads)) ? ann_reads - ann_rna_reads : 0;
            var unkn_aa_reads = aa_reads - ann_aa_reads;
            var unknown_all   = raw_seqs - (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads);
            if (raw_seqs < (qc_fail_seqs + ann_rna_reads)) {
		var diff = (qc_fail_seqs + ann_rna_reads) - raw_seqs;
		unknown_all = (diff > unknown_all) ? 0 : unknown_all - diff;
            }
            // fuzzy math
            if (is_rna) {
		qc_fail_seqs  = raw_seqs - qc_rna_seqs;
		unkn_aa_reads = 0;
		ann_aa_reads  = 0;
		unknown_all   = raw_seqs - (qc_fail_seqs + ann_rna_reads);
            } else {
		if (unknown_all < 0) { unknown_all = 0; }
		if (raw_seqs < (qc_fail_seqs + unknown_all + unkn_aa_reads + ann_aa_reads + ann_rna_reads)) {
      	            var diff = (qc_fail_seqs + unknown_all + unkn_aa_reads + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	            unknown_all = (diff > unknown_all) ? 0 : unknown_all - diff;
		}
		if ((unknown_all == 0) && (raw_seqs < (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads))) {
      	            var diff = (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	            unkn_aa_reads = (diff > unkn_aa_reads) ? 0 : unkn_aa_reads - diff;
		}
		// hack to make MT numbers add up
		if ((unknown_all == 0) && (unkn_aa_reads == 0) && (raw_seqs < (qc_fail_seqs + ann_aa_reads + ann_rna_reads))) {
      	            var diff = (qc_fail_seqs + ann_aa_reads + ann_rna_reads) - raw_seqs;
      	            ann_rna_reads = (diff > ann_rna_reads) ? 0 : ann_rna_reads - diff;
		}
		var diff = raw_seqs - (qc_fail_seqs + unkn_aa_reads + ann_aa_reads + ann_rna_reads);
		if (unknown_all < diff) {
		    unknown_all = diff;
		}
            }
	    
	    mg.qc_fail_seqs = qc_fail_seqs;
	    mg.unknown_all = unknown_all;
	    mg.unkn_aa_reads = unkn_aa_reads;
	    mg.ann_aa_reads = ann_aa_reads;
	    mg.ann_rna_reads = ann_rna_reads;
	    
	    mg.taxonomy = {};
	    try {
		var taxa = [ "domain", "phylum", "class", "order", "family", "genus" ];
		for (var h=0; h<taxa.length; h++) {
		    mg.taxonomy[taxa[h]] = [];
		    var d = mg.statistics.taxonomy[taxa[h]];
		    for (var j=0; j<d.length; j++) {
			mg.taxonomy[taxa[h]].push( { value: d[j][1], label: d[j][0]} );
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
		    for (var j=0; j<d.length; j++) {
			mg.ontology[onto[h]].push( { value: d[j][1], label: d[j][0]} );
		    }
		}
	    } catch (error) {
		console.log("could not parse functional data: "+error);
	    }
	    
	    var allmetadata = [];
	    var cats = ['env_package', 'library', 'project', 'sample'];
	    for (var h=0; h<cats.length; h++) {
		var k = Retina.keys(mg.metadata[cats[h]].data).sort();
		for (var i=0; i<k.length; i++) {
		    allmetadata.push([ cats[h], k[i], mg.metadata[cats[h]].data[k[i]] ]);
		}
	    }
	    mg.allmetadata = allmetadata;
	    
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
		var t = mg.statistics.taxonomy.family.sort(function(a,b) {
		    return b[1] - a[1];
		}).slice(0,50);
		for (var i=0; i<t.length; i++) {
		    rankabundance.push( { label: t[i][0], value: t[i][1] } );
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
	}

	
    };    
})();
