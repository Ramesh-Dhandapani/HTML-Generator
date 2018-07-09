/**
 * Generate Data Json and Mapping Json files based on corresponding xlsx files.
 * AND
 * Generate HTML files based on HTML Template file, Data json and Mapping Json
 */

(function () {
    /** importing support lib */
    var XLSX = require('xlsx');
    var fs = require('fs');
    var cheerio = require('cheerio');

    var dataJsonArrObj, mappingJson;
    var xlData, linksData;

    generateContentJsonFile = function (srcFilePath, distFilePath, hasLink) {
        var workbook = XLSX.readFile(srcFilePath);
        var sheet_name_list = workbook.SheetNames;
        xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        if (hasLink)
            alterXData();
        fs.writeFileSync(distFilePath, JSON.stringify(xlData));
    }
    alterXData = function () {
        console.log("----alterData----");
        for (linkData of linksData) {
            let keyValArry = linkData["TEMP_MAP_KEY"].split(',');
            console.log(keyValArry);
            changeXData(linkData["NEW_KEY"], keyValArry, linkData['TEMPLATE'], linkData['LAST_TEMPLATE']);
        }
    }
    generateLinkJsonFile = function (srcFilePath, distFilePath) {
        var workbook = XLSX.readFile(srcFilePath);
        var sheet_name_list = workbook.SheetNames;
        linksData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
        fs.writeFileSync(distFilePath, JSON.stringify(linksData));
    }
    changeXData = function (newKey, keyValArry, templateContent, lastTemplate) {
        // console.log("***********newKey*********");
        // console.log(newKey);
        // console.log("***********keyValArry*********");
        // console.log(keyValArry);        
        // console.log("**********templateContent*********");
        // console.log(templateContent);      
        // console.log("***********lastTemplate*********");
        // console.log(lastTemplate);      
        for (var contObj of xlData) {
            let ulContent = '';
            let tempPlaceHolderVal = [];
            for (var keyval of keyValArry) {
                var key_val = keyval.split(':');
                tempPlaceHolderVal[key_val[0]] = formatToArray(contObj[key_val[1]]);
            }
            let tempPlaceHolderKeys = Object.keys(tempPlaceHolderVal);
            var i = 0;
            var isOuterBreak = false;
            while (true) {
                var temp = templateContent;
                for (let j = 0; j < tempPlaceHolderKeys.length; j++) {
                    let valArr = tempPlaceHolderVal[tempPlaceHolderKeys[j]];
                    //     console.log("place holder and text");
                    if (valArr[i]) {
                            console.log(1);
                        var palceHolder = new RegExp(tempPlaceHolderKeys[j], "g");
                        temp = temp.replace(palceHolder, valArr[i]);
                        //   console.log(temp);
                    } else {
                        if (tempPlaceHolderKeys[j] == "#LINK") {
                            temp = lastTemplate;
                            //  break;
                        } else if (j == tempPlaceHolderKeys.length - 1) {
                            console.log(2);
                            if (tempPlaceHolderKeys[j] == "#TEXT") {
                                console.log(3);
                                temp='';
                                isOuterBreak = true;
                                break;
                            }

                            var palceHolder = new RegExp(tempPlaceHolderKeys[j], "g");
                            //    console.log("--- temp ---");
                                console.log(4);
                            if (temp)
                                temp = temp.replace(palceHolder, '');
                            //     console.log(temp);
                            isOuterBreak = true;
                            break;
                        } else {
                            //     console.log(tempPlaceHolderKeys[j] + " --->>> " + valArr[i]);
                            var palceHolder = new RegExp(tempPlaceHolderKeys[j], "g");
                                  console.log(5);
                            if (temp)
                                temp = temp.replace(palceHolder, '');
                            //      console.log(temp);
                        }
                    }
                }
                //    console.log("--- temp ---");
                //    console.log(temp);
                ulContent += temp;
                if (isOuterBreak) break;
                i++;
            }
            console.log("-- ulContent --");
            console.log(ulContent);
            // let value = formatToArray(contObj[valueKey]); 
            // let link =  formatToArray(contObj[linkKey]);
            // let ulContent = '';
            // let linkCount;
            // linkCount = (lastTemplate == undefined) ? value.length : value.length - 1;
            // for (let i = 0; i < linkCount; i++) {
            //     ulContent += templateContent.replace(/#LINK/g, link[i]).replace(/#TEXT/g, value[i]);
            // }
            // if (lastTemplate) {
            //     ulContent += lastTemplate.replace(/#LINK/g, link[value.length - 1]).replace(/#TEXT/g, value[value.length - 1]);
            // }
            contObj[newKey] = ulContent;
        }
    }
    generateMappingJsonFile = function (srcFilePath, distFilePath) {
        var config_workbook = XLSX.readFile(srcFilePath);
        var config_sheet_name_list = config_workbook.SheetNames;
        var configData = XLSX.utils.sheet_to_json(config_workbook.Sheets[config_sheet_name_list[0]]);
        var configDataJson = traverseObject(configData);
        fs.writeFileSync(distFilePath, JSON.stringify(configDataJson));
    }

    traverseObject = function (configData) {
        let obj = {}
        for (var elem of configData) {
            obj[elem.Name] = elem;
        }
        return obj;
    }

    formatToArray = function (txt) {
        let value = [];
        console.log(txt);
        if (txt) {
            value = txt.replace(/\r|\n/g, '');
            value = value.split(";");
            if (value[value.length - 1] == "") value.pop();
        }
        return value;
    }

    generateHtmlFile = function (distDir, htmlTemplateFile, outputDataJsonFilePath, mappingJsonFilePath) {
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir);
        }
        setTimeout(function () {
            dataJsonArrObj = require("./" + outputDataJsonFilePath);
            mappingJson = require("./" + mappingJsonFilePath);
            let i = 1;
            for (let dataJson of dataJsonArrObj) {
                //  console.log(dataJson);
                //  console.log(dataJson['Meta_Title']);
                var outPath = distDir + '//' + dataJson['Meta_Title'].split('|')[0].replace(/ /g, '') + '.html';
                //   console.log(outPath)
                genHtmlFile(htmlTemplateFile, dataJson, mappingJson, outPath);
            }
        }, 1000);
    }

    genHtmlFile = function (htmlTemplateFile, dataJson, mappingJson, fileName) {
        fs.readFile(htmlTemplateFile, { encoding: 'utf8' }, function (error, data) {
            var $ = cheerio.load(data); // load in the HTML into cheerio
            for (var key in dataJson) {
                setContentToPlaceHolder($, key, mappingJson, dataJson);
            }
            fs.writeFile(fileName, $.html());
        });
    }

    setContentToPlaceHolder = function ($, key, mappingJson, dataJson) {
        let mapObj = mappingJson[key];
        if (mapObj) {
            let attr = mapObj['Attribute'];
            let id = mapObj['Element_ID'];
            let attrVal = dataJson[key];
            if (attr == 'innerHtml') {
                $('#' + id).html(attrVal);
            } else if (attr == 'src' || attr == 'content' || attr == 'alt' || attr == 'href' || attr == 'mUrl' || attr == 'hotel_cat') {
                $('#' + id).attr(attr, attrVal);
            } else if (attr == 'value') {
                $('#' + id).val(attrVal);
            } else if (attr === "keyValue") {
                let keyVal = attrVal.split("=");
                $('#' + id).attr(keyVal[0].trim(), keyVal[1].trim());
            } else {
                console.log(key + " ---- " + attr + "Attribute Type Not defined " + id)
            }
        }
    }

    replaceContent = function (str) {
        return str.replace(/</g, "").replace(/>/g, "");
    }

})();
