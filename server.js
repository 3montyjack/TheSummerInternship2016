/**
 * Created by Caleb on 6/16/2016.
 */
// server.js

// set up ========================
var request = require('request');
var churro = require("cheerio");
var util = require("util");
var Q = require("q");
var csv = require("fast-csv");

//reads text file of the URLs
var dataCSV = [[]];
var html;
var websites = "./Text Files/Testing CSV - members_export_de65acef1b.csv";
//TODO Finish the inputs
var termsLink = "./Text Files/catregories.csv";
var counter = 0;
var categoryList = [];


//console.log(dataCSV);

function getCSVInfo(file) {
//debugger
    var deferred = Q.defer();
    var tempData = [];
    csv.fromPath(file)
        .on("data", function (data) {
            tempData.push(data);
            //deferred.resolve(tempData);

        })
        .on("end", function () {
            deferred.resolve(tempData);
            console.log("done");
        }).on("error", function (err) {
        deferred.reject(err);
    });

    return deferred.promise;
}


function setCategory(div, categories, data, i) {
    for (var term in categories) {
        for (var word in term) {
            var regEx = new RegExp(word, "i")
            if (div.match(regEx)) {
                try {
                    data[i][4] = term;
                } catch (err) {
                    //debugger;
                }
                counter++;
                if (counter == data.length - 1) {
                    console.log("completed");
                } else {
                    console.log("Updating!" + counter + ":" + i);
                }
                return data[i][4];

            }
        }
    }
    counter++;
    if (counter == data.length - 1) {
        console.log("completed");
    } else {
        console.log("Updating!" + counter + ":" + i)

    }
    return data[i][4];
}

function getCsvData(terms) {
    var deferred = Q.defer();
    //var tempData=[];
    deferred.resolve(categoryList);

    debugger;
    return deferred.promise;
}

function getHTTPItems(terms) {
    var defered = Q.defer();
    var $processedData;
    getCSVInfo(websites).then(function (data) {
        //console.log(data);

        for (var i = 1; i < data.length - 1; i++) {
            var $url;


            if (!data[i][2].match(/http:\/\//i)) {
                //console.log(data[i][2]);
                $url = "http://" + data[i][2];

            } else {
                $url = data[i][2];

            }
            //console.log("making request: ", $url)
            (function ($url, i) {
                request.get($url, function (err, res, body) {
                    //console.log(body);
                    var divs = "";


                    if (err) {
                        //console.log($url);
                        //console.log(err);
                        //if ()
                        debugger;
                        counter++
                    }

                    else {
                        html = churro.load(body);

                        if (html("h1"))
                            divs += html("h1").first().text();
                        else
                            console.log("Website: " + data[i][1] + " did not hae a h1 elemnt.")

                        if (html("title"))
                            divs += html("title").text();
                        else
                            console.log("Website: " + data[i][1] + " did not hae a title element.")

                        if (html('meta[property="og:description"]'))
                            divs += html('meta[property="og:description"]').attr('content');
                        else
                            console.log("Website: " + data[i][1] + " did not hae a meta discription for fb.")
                        categoryList[i] = setCategory(divs, terms, data, i);
                        console.log("Category = " + JSON.stringify(categoryList[i]));
                        //debugger;
                    }
                    //console.log(divs);
                    //debugger;
                });
            })($url, i);
            //console.log(testingData);
            //debugger;

        }
        //console.log(data);
        debugger;
        $processedData = data;
        defered.resolve(categoryList);

    });
    console.log("data: " + JSON.stringify(categoryList));
    return defered.promise;

}

getCSVInfo(termsLink).then(function (data) {
    //console.log(data);
    var terms = {};
    for (var i = 0; i < data.length; i++) {
        var category = data[i][0];
        var subcategory = data[i][1].replace("'", "").trim().split(", ");
        //debugger;
        terms[category] = subcategory;
        //terms[i].push(data[i][1].replace("'", "").trim().split(", "));
        //console.log(data[i][1].replace("'", "").trim().split(", "));
        //console.log(category);
        //console.log(subcategory);


        //console.log(subcategory);
    }
    //getCsvData(terms)
    //debugger;
    //console.log(terms);
    getHTTPItems(terms).then(function (terms) {
        console.log(terms);
        getCsvData(terms).then(function (data) {
            debugger;
            console.log("sorta Working");
        });
    }).catch(function () {
        console.log("error")
    });


});
