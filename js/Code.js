// Google Sheets Code for metadata validation
var validationData = null;
var validationTemplate = null;
var projectID = null;

function onOpen() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
                   name: "load metadata",
                   functionName: "loadMD"
                 },
                 {
                   name: "validate sheet",
                   functionName: "validateMD"
                 },
                 {
                   name: "upload metadata",
                   functionName: "uploadMD"
                 }];
  spreadsheet.addMenu("MG-RAST", entries);
};

function uploadMD() {
  
};

function validateMD() {
  if (validationData === null) {
    var response = UrlFetchApp.fetch("http://api.mg-rast.org/metadata/cv");
    validationData = JSON.parse(response.getContentText());
    
    // turn ontologies into simple arrays
    for (var i in validationData.ontology) {
      if (validationData.ontology.hasOwnProperty(i)) {
        var ontArray = [];
        for (var h=0; h<validationData.ontology[i].length; h++) {
          ontArray.push(validationData.ontology[i][h][0]); 
        }
        validationData.ontology[i] = ontArray;
      }
    }
  }
  
  if (validationTemplate === null) {
    var response = UrlFetchApp.fetch("http://api.mg-rast.org/metadata/template");
    validationTemplate = JSON.parse(response.getContentText());
  }
  
  // iterate over the sheets and add validation rules for each column
  var sheetlist = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i=0; i<sheetlist.length; i++) {
    var sheet = sheetlist[i];
    var range = sheet.getDataRange();
    var values = range.getValues();
    var name = sheet.getName();
    var lastRow = sheet.getLastRow();
    for (var h=0; h<values[0].length; h++) {
      var cname = values[0][h]; 
      var type = null;
      var dataRange = sheet.getRange(2, h + 1, lastRow - 1);
      if (name == "project") {
        if (validationTemplate.project.project.hasOwnProperty(cname)) {
          type = validationTemplate.project.project[cname].type;
        }
      } else if (name == "sample") {
        if (validationTemplate.sample.sample.hasOwnProperty(cname)) {
          type = validationTemplate.sample.sample[cname].type;
        }
      } else if (name.match(/^library/)) {
        name = name.substr(8);
        if (validationTemplate.library[name].hasOwnProperty(cname)) {
          type = validationTemplate.library[name][cname].type;
        }
      } else if (name.match(/^ep/)) {
        name = name.substr(3);
        if (validationTemplate.ep[name].hasOwnProperty(cname)) {
          type = validationTemplate.ep[name][cname].type;
        }
      }
      if (type) {
        var rule = null;
        if (type == "select") {
          var sel = null;
          if (cname.match(/country/)) {
            sel = "country";
          } else if (cname.match(/continent/)) {
            sel = "continent"; 
          } else {
            sel = cname;
          }
          rule = SpreadsheetApp.newDataValidation().requireValueInList(validationData.select[sel], true).build();
        } else if (type == "ontology") {
          rule = SpreadsheetApp.newDataValidation().requireValueInList(validationData.ontology[cname], true).build();
        } else if (type == "email") {
          rule = SpreadsheetApp.newDataValidation().requireTextIsEmail().build();
        } else if (type == "url") {
          rule = SpreadsheetApp.newDataValidation().requireTextIsUrl().build();
        } else if (type == "boolean") {
          rule = SpreadsheetApp.newDataValidation().requireValueInList(["1", "0"], true).build();
        } else if (type == "float") {
          for (var j=2; j<lastRow+1; j++) {
            var d = sheet.getRange(j, h + 1);
            d.setNumberFormat('@STRING@');
            var r = SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=REGEXMATCH('+columnToLetter(h+1)+j+', "^-?[0-9]+(\.[0-9]+)?$")').setHelpText('Please enter a float, e.g. 12.45').build();
            d.setDataValidation(r);
          }
          continue;
        } else if (type == "int") {
          for (var j=2; j<lastRow+1; j++) {
            var d = sheet.getRange(j, h + 1);
            d.setNumberFormat('@STRING@');
            var r = SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=REGEXMATCH('+columnToLetter(h+1)+j+', "^[0-9]+$")').setHelpText('Please enter an integer (positive whole number)').build();
            d.setDataValidation(r);
          }
          continue;
        } else if (type == "date") {
          rule = SpreadsheetApp.newDataValidation().requireDate().build();
        } else if (type == "time") {
          for (var j=2; j<lastRow+1; j++) {
            var d = sheet.getRange(j, h + 1);
            d.setNumberFormat('@STRING@');
            var r = SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=REGEXMATCH('+columnToLetter(h+1)+j+', "^[0-9]{2}:[0-9]{2}(:[0-9]{2})?$")').setHelpText('Please enter a time, e.g. 13:22:43').build();
            d.setDataValidation(r);
          }
          continue;
        } else if (type == "timezone") {
          for (var j=2; j<lastRow+1; j++) {
            var d = sheet.getRange(j, h + 1);
            d.setNumberFormat('@STRING@');
            var r = SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=REGEXMATCH('+columnToLetter(h+1)+j+', "^UTC[-+]{1}[0-9]{2}:[0-9]{2}$")').setHelpText('Please enter a UTC timezone, e.g. UTC-12:00').build();
            d.setDataValidation(r);
          }
          continue;
        } else if (type == "coordinate") {
          for (var j=2; j<lastRow+1; j++) {
            var d = sheet.getRange(j, h + 1);
            d.setNumberFormat('@STRING@');
            var r = SpreadsheetApp.newDataValidation().requireFormulaSatisfied('=REGEXMATCH('+columnToLetter(h+1)+j+', "^-?[0-9]+\.[0-9]+$")').setHelpText('Please enter coordinate, e.g. 45.5').build();
            d.setDataValidation(r);
          }
          continue;
        } else if (type == "text") {
          continue;
        }
        dataRange.setDataValidation(rule);
      }
    }
  }
};

// put given data into a sheet
function dataSheet(spreadsheet, cols, data) {
  var headerRow = [];
  for (var i in cols) {
    headerRow[cols[i]] = i; 
  }
  var origLen = headerRow.length;
  var miscs = 0;
  var dataRows = [];
  for (var i=0; i<data.length; i++) {
    var dataRow = []
    for (var h in data[i]) {
      if (data[i].hasOwnProperty(h)) {
        if (cols.hasOwnProperty(h)) {
          dataRow[cols[h]] = data[i][h].value;
        }
        else if (h.match(/^misc_param_\d+/)) {
          var miscIndex = parseInt(/\d+/.exec(h)[0]);
          if (miscs < miscIndex) {
            for (var j=0; j<miscIndex - miscs; j++) {
              headerRow.push("misc_param_"+(j+miscs+1)); 
            }
            miscs = miscIndex;
          }
          dataRow[origLen - 1 + miscIndex] = data[i][h].value;
        }
      }
    }
    dataRows.push(dataRow);
  }
  
  // make sure there are no undefined values in the cells
  for (var i=0; i<dataRows.length; i++) {
    for  (var h=0; h<headerRow.length; h++) {
      if (typeof dataRows[i][h] === "undefined") {
       dataRows[i][h] = ""; 
      }
    }
  }
  
  // actually append the rows
  spreadsheet.appendRow(headerRow);
  for (var i=0; i<dataRows.length; i++) {
    spreadsheet.appendRow(dataRows[i]);
  }
};

function authCallback(request) {
  var mgrastService = getMGRASTService();
  var isAuthorized = mgrastService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('<div style="background-color: #d9edf7; border-color: #bce8f1; color: #3a87ad; width: 400px; margin-left: auto; margin-right: auto; margin-top: 100px; border-radius: 4px; padding: 8px 35px 8px 14px; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5); font-family: Helvetica,Arial,sans-serif; font-size: 14px; line-height: 20px;">You are authorized, please close this tab.</div>');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
};

function getMGRASTService() {
  return OAuth2.createService('mgrast')
   .setAuthorizationBaseUrl('https://mg-rast.org/oAuthPPO.cgi?action=dialog')
   .setTokenUrl('https://mg-rast.org/oAuthPPO.cgi')
   .setClientId('GoogleDocs')
   .setClientSecret('XUrGfCFE2aPxSnm7eXrQjwu5b')
   .setCallbackFunction('authCallback')
   .setPropertyStore(PropertiesService.getUserProperties());
};

function loadMD() {
  var ui = SpreadsheetApp.getUi();
  
  // get auth token
  var mgrastService = getMGRASTService();
  if (!mgrastService.hasAccess()) { 
    var authorizationUrl = mgrastService.getAuthorizationUrl();
    var template = HtmlService.createTemplate(
        'Please click the link below to authorize at MG-RAST.<br><br><a href="<?= authorizationUrl ?>" target="_blank">Authorize</a><br><br>Once authorization is complete, please select "load metadata" from the MG-RAST menu again.');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    ui.showSidebar(page);
    return;
  }
  var token = mgrastService.getAccessToken();

  // ask for project ID
  if (! projectID) {
    var response = ui.prompt('Select Project', 'Please Enter your project ID', ui.ButtonSet.OK);
    projectID = response.getResponseText();
  }
  
  // get the data from the API
  var response = UrlFetchApp.fetch("http://api.mg-rast.org/metadata/export/mgp"+projectID, {
    headers: {
      Authorization: token
    },
    muteHttpExceptions: true
  });
  
  var metadata = JSON.parse(response.getContentText());
   
  // if there is an error, do not continue
  if (metadata.hasOwnProperty("error") || metadata.hasOwnProperty("ERROR")) {
//    var s = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
//    s.clear();
//    s.getRange(0, 0).getCell(0, 0).setValue(JSON.stringify(metadata, null, 2));
    mgrastService.setPropertyStore(PropertiesService.getUserProperties())
    .reset();
    loadMD();
    return; 
  }
  
  // clear all sheets  
  while (SpreadsheetApp.getActiveSpreadsheet().getSheets().length > 1) {
    SpreadsheetApp.getActiveSpreadsheet().deleteActiveSheet();
  }
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  spreadsheet.clear();
  
  // create project sheet
  SpreadsheetApp.getActiveSpreadsheet().renameActiveSheet("project");
  metadata.data.project_id = { "value": metadata.id };
  var projectCols = {"project_name": 0,
                     "project_description": 1,
                     "project_funding": 2,
                     "project_id": 3,
                     "PI_email": 4,
                     "PI_firstname": 5,
                     "PI_lastname": 6,
                     "PI_organization": 7,
                     "PI_organization_country": 8,
                     "PI_organization_address": 9,
                     "PI_organization_url": 10,
                     "email": 11,
                     "firstname": 12,
                     "lastname": 13,
                     "organization": 14,
                     "organization_country": 15,
                     "organization_address": 16,
                     "organization_url": 17,
                     "submitted_to_insdc": 18,
                     "qiime_id": 19,
                     "vamps_id": 20,
                     "ncbi_id": 21,
                     "greengenes_id": 22};
  
  dataSheet(spreadsheet, projectCols, [ metadata.data ]);
  
  // create sample sheet
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("sample");
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(SpreadsheetApp.getActiveSpreadsheet().getSheets()[1]);
  var sampleCols = { "sample_name": 0,
                    "sample_id": 1,
                    "latitude": 2,
                    "longitude": 3,
                    "continent": 4,
                    "country": 5,
                    "location": 6,
                    "depth": 7,
                    "altitude": 8,
                    "elevation": 9,
                    "temperature": 10,
                    "ph": 11,
                    "collection_date": 12,
                    "collection_time": 13,
                    "collection_timezone": 14,
                    "experimental_factor": 15,
                    "isol_growth_condt": 16,
                    "samp_collect_device": 17,
                    "sample_size": 18,
                    "samp_mat_process": 19,
                    "sample_treatment": 20,
                    "sample_strategy": 21,
                    "biome": 22,
                    "feature": 23,
                    "material": 24,
                    "env_package": 25 };
  var sampleData = [];
  for (var i=0; i<metadata.samples.length; i++) {
    metadata.samples[i].data.sample_id = { "value": metadata.samples[i].id };
    sampleData.push(metadata.samples[i].data); 
  }
  
  dataSheet(spreadsheet, sampleCols, sampleData);
  
  // parse out library and EP data
  var libraryData = {};
  var epData = {};
  for (var i=0; i<metadata.samples.length; i++) {
    
    // ep parsing
    var ep = metadata.samples[i].envPackage;
    if (! epData.hasOwnProperty(ep.type)) {
      epData[ep.type] = { "cols": { "sample_name": 0 }, "data": [], "numCols": 1 };
    }
    for (var h in ep.data) {
      if (ep.data.hasOwnProperty(h)) {
        if (! epData[ep.type].cols.hasOwnProperty(h)) {
          epData[ep.type].cols[h] = epData[ep.type].numCols;
          epData[ep.type].numCols++;
        }
      }
    }
    epData[ep.type].data.push(ep.data);
    // library parsing
    for (var h=0; h<metadata.samples[i].libraries.length; h++) {
      var lib = metadata.samples[i].libraries[h];
      if (! libraryData.hasOwnProperty(lib.type)) {
        libraryData[lib.type] = { "cols": { "sample_name": 0 }, "data": [], "numCols": 1 };
      }
      for (var j in lib.data) {
        if (lib.data.hasOwnProperty(j)) {
          if (! libraryData[lib.type].cols.hasOwnProperty(j)) {
            libraryData[lib.type].cols[j] = libraryData[lib.type].numCols;
            libraryData[lib.type].numCols++;
          }
        }
      }
      libraryData[lib.type].data.push(lib.data);
    }
  }
  var sheetNum = 2;
  // create library sheets
  for (var i in libraryData) {
    if (libraryData.hasOwnProperty(i)) {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("library "+i);
      SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(SpreadsheetApp.getActiveSpreadsheet().getSheets()[sheetNum]);
      sheetNum++;
      dataSheet(spreadsheet, libraryData[i].cols, libraryData[i].data); 
    }
  }  
  // create the ep sheets
  for (var i in epData) {
    if (epData.hasOwnProperty(i)) {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("ep "+i);
      SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(SpreadsheetApp.getActiveSpreadsheet().getSheets()[sheetNum]);
      sheetNum++;
      dataSheet(spreadsheet, epData[i].cols, epData[i].data); 
    }
  }
};

function columnToLetter(column)
{
  var temp, letter = '';
  while (column > 0)
  {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
};
