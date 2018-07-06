var Express = require('express');
var multer = require('multer');
var bodyParser = require('body-parser');
var fs = require('fs');
require('./htmlGenerator.js');
var app = Express();
app.use(bodyParser.json());
var templateName;
var srcDir;
var distDir;
var market;
var hasLink=false;
var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        templateName = req.body.templateName;
        market = req.body.market;
        console.log(market);
        srcDir = './src/' +req.body.market+"/"+ req.body.templateName;
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir);
        }    
        callback(null, srcDir);
    },
    filename: function (req, file, callback) {
        let fileName = req.body.templateName;
        if (file.fieldname === 'dataInputFile') fileName += "_data.xlsx";
        else if (file.fieldname === 'mappingInputFile') fileName += "_mapping.xlsx";
        else if (file.fieldname === 'linkInputFile'){
            fileName += "_link.xlsx";
        }
        else if (file.fieldname === 'templateInputFile') fileName += "_template.html";
        callback(null, fileName);
    }
});

var upload = multer({ storage: Storage }).fields([{
    name: 'dataInputFile', maxCount: 1
}, {
    name: 'mappingInputFile', maxCount: 1
}, {
    name: 'linkInputFile', maxCount: 1
}, {
    name: 'templateInputFile', maxCount: 1
}]);

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post("/api/Upload", function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end("Something went wrong!");
        }

        let linkXlsFilePath = srcDir+'\\'+templateName+'_link.xlsx';
        let linkJsonFilePath = srcDir+'\\'+templateName+'_link.json';
        if (fs.existsSync(linkXlsFilePath)) {
            generateLinkJsonFile(linkXlsFilePath, linkJsonFilePath);
            hasLink=true;
        }    
        let inputDataXlsFilePath = srcDir+'\\'+templateName+'_data.xlsx';
        let outputDataJsonFilePath = srcDir+'\\'+templateName+'_data.json';
        generateContentJsonFile(inputDataXlsFilePath,outputDataJsonFilePath,hasLink);

        let mappingXlsFilePath = srcDir+'\\'+templateName+'_mapping.xlsx';
        let mappingJsonFilePath = srcDir+'\\'+templateName+'_mapping.json';
        generateMappingJsonFile(mappingXlsFilePath, mappingJsonFilePath);
       
        var htmlTemplateFile = srcDir+'\\'+templateName+'_template.html';
        distDir = '..//tc-exp-landing-pages/src/OutputPages/'+market+'/'+ req.body.templateName;
        generateHtmlFile(distDir,htmlTemplateFile,outputDataJsonFilePath,mappingJsonFilePath);

        return res.end("HTML Files generate sucessfully!.");
    });
});

app.listen(2000, function (a) {
    console.log("Listening to port 2000");
});