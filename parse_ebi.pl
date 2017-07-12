#!/usr/bin/env perl

use strict;
use warnings;

open(FO, ">data/ebi.csv") or die "could not open output file: $@\n";

# host associated
open(FH, "<data/410656.xml") or die "could not open data/410656.xml: $@\n";
while (<FH>) {
  chomp;
  my $line = $_;
  my ($tax, $id) = $line =~ /\<taxon scientificName="([^"]+)" taxId="(\d+)" rank="species"/;
  if ($tax && $id) {
    $tax =~ s/ metagenome//;
    print FO "host\t$tax\t$id\n";
  }
}
close FH;

# non host-associated
open(FH, "<data/410657.xml") or die "could not open data/410657.xml: $@\n";
while (<FH>) {
  chomp;
  my $line = $_;
  my ($tax, $id) = $line =~ /\<taxon scientificName="([^"]+)" taxId="(\d+)" rank="species"/;
  if ($tax && $id) {
    $tax =~ s/ metagenome//;
    print FO "non-host\t$tax\t$id\n";
  }
}
close FH;

close FO;
