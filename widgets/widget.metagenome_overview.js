(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Metagenome Ooverview Widget",
                name: "metagenome_overview",
                author: "Tobias Paczian",
                requires: []
        }
    });
    
    widget.setup = function () {
	return [
	    Retina.load_renderer("svg"),
	    Retina.load_renderer('notebook')
	];
    };
        
    widget.display = function (wparams) {
        widget = this;

	var container = widget.target = wparams ? wparams.main : widget.target;
	var sidebar = widget.sidebar = wparams ? wparams.sidebar : widget.sidebar;

	if (Retina.cgiParam('metagenome')) {
	    widget.id = Retina.cgiParam('metagenome');
	    if (! widget.id.match(/^mgm/)) {
		widget.id = "mgm"+widget.id;
	    }
	}
	
        // check if id given
        if (widget.id) {
	    widget.sidebar.parentNode.className = "span3 sidebar affix";
	    widget.sidebar.parentNode.style = "right: 8%; background-color: white;";
	    jQuery('#mg_modal').modal('hide');
	    
	    widget.target.innerHTML = '<div style="margin-left: auto; margin-right: auto; margin-top: 300px; width: 50px;"><img style="" src="Retina/images/waiting.gif"></div>';
	    
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
				   if (! stm.DataStore.hasOwnProperty('metagenome')) {
				       stm.DataStore.metagenome = {};
				   }
				   if (data.hasOwnProperty('statistics')) {
				       data.computationStatus = "complete";
				   } else {
				       data.computationStatus = "incomplete";
				   }
				   stm.DataStore.metagenome[data.id] = data;
				   Retina.WidgetInstances.metagenome_overview[1].variableExtractorMetagenome(data.id);
				   jQuery.getJSON("data/metagenome.json").then(function(data){
				       console.log(data);
				   });
				   jQuery.getJSON("data/metagenome_overview.flow.json").then(function(d) {
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
	    
	    var notebook = Retina.Renderer.create('notebook', { target: container, showTOC: true, tocTarget: sidebar, flow: stm.DataStore.flows.metagenome_overview, dataContainer: stm.DataStore.metagenome[widget.id] }).render();	
	} else {
	    container.innerHTML = "<div class='alert alert-info'>Metagenome Overview page called without a valid ID</div>";
	}
    };  

    widget.variableExtractorMetagenome = function (id) {
	var widget = this;
	
	var mg = stm.DataStore.metagenome[id];
	
	// get base numbers
        var stats  = mg.statistics.sequence_stats;
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
	var taxa = [ "domain", "phylum", "class", "order", "family", "genus" ];
	for (var h=0; h<taxa.length; h++) {
	    mg.taxonomy[taxa[h]] = [];
	    var d = mg.statistics.taxonomy[taxa[h]];
	    for (var j=0; j<d.length; j++) {
		mg.taxonomy[taxa[h]].push( { value: d[j][1], label: d[j][0]} );
	    }
	}
	mg.ontology = {};
	var onto = [ "NOG", "COG", "KO", "Subsystems" ];
	for (var h=0; h<onto.length; h++) {
	    mg.ontology[onto[h]] = [];
	    var d = mg.statistics.ontology[onto[h]];
	    for (var j=0; j<d.length; j++) {
		mg.ontology[onto[h]].push( { value: d[j][1], label: d[j][0]} );
	    }
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
	for (var i=0; i<mg.statistics.qc.bp_profile.percents.data.length; i++) {
	    for (var h=0; h<bpprofile.length; h++) {
		bpprofile[h].values.push(mg.statistics.qc.bp_profile.percents.data[i][h+1]);
	    }
	}
	mg.bpprofile = bpprofile;
	
	var rankabundance = [];
	var t = mg.statistics.taxonomy.family.sort(function(a,b) {
	    return b[1] - a[1];
        }).slice(0,50);
	for (var i=0; i<t.length; i++) {
	    rankabundance.push( { label: t[i][0], value: t[i][1] } );
	}
	mg.rankabundance = rankabundance;
	
	var rarefaction = [];
	for (var i=0; i<mg.statistics.rarefaction.length; i++) {
	    rarefaction.push({ x: mg.statistics.rarefaction[i][0], y: mg.statistics.rarefaction[i][1] });
	}
	mg.rarefaction = rarefaction;
	
	var drisee = [ { label: "A", values: [] }, { label: "T", values: [] }, { label: "C", values: [] }, { label: "G", values: [] }, { label: "N", values: [] }, { label: "InDel", values: [] }, { label: "Total", values: [] } ];
	var dr = mg.statistics.qc.drisee.percents.data;
	for (var i=0; i<dr.length; i++) {
	    for (var h=0; h<drisee.length; h++) {
		drisee[h].values.push({x: dr[i][0], y: dr[i][h+1] });
	    }
	}
	mg.drisee = drisee;
	
	var kmer = [];
        for (var i = 0; i < mg.statistics.qc.kmer['15_mer']['data'].length; i+=2) {
	    var thisY = mg.statistics.qc.kmer['15_mer']['data'][i][0];
            kmer.push({ x: mg.statistics.qc.kmer['15_mer']['data'][i][3], y: thisY });
        }
	mg.kmer = kmer;
    };
    
})();