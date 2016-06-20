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
var html;
var websites = "./Text Files/Pushup Communities - members_export_de65acef1b.csv";
//TODO Finish the inputs
var termsLink = "./Text Files/catregories.csv";
var counter = 0;
var categoryList = [];


function getCSVInfo(file) {
    var deferred = Q.defer();
    var tempData = [];
    csv.fromPath(file)
        .on("data", function (data) {
            tempData.push(data);
        })
        .on("end", function () {
            deferred.resolve(tempData);
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
                   // console.log("Updating!" + counter + ":" + i);
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

function writeToDB(result) {
    var deferred = Q.defer();
    console.log(JSON.stringify(result));
    deferred.resolve();
    return deferred.promise;
}

function getHTTPItems(website_data, category_data) {
    var defered = Q.defer();
    var categoryList = [];

    for (var i = 1; i < website_data.length; i++) {
        console.log(website_data[i]);
        var $url;


        if (!website_data[i][2].match(/http/i)) {
            $url = "http://" + data[i][2];
        }
        else if(true) {
            //do check for 'http:website' regex.
        }else {
                $url = website_data[i][2]
        }
        
            request.get($url,{timeout:1000}, function (err, res, body) {
                var divs = "";


                if (err) {
                    console.log(err);
                    console.log($url);
                    console.log(counter);
                    debugger;
                    
                    res.redirect("https://triceratops.top");
                }

                else {
                    html = churro.load(body);

                    debugger;
                    
                    if (html("h1"))
                        divs += html("h1").first().text();
                    else
                        console.log("Website: " + website_data[i][1] + " did not hae a h1 elemnt.");

                    if (html("title"))
                        divs += html("title").text();
                    else
                        console.log("Website: " + website_data[i][1] + " did not hae a title element.");

                    if (html('meta[property="og:description"]'))
                        divs += html('meta[property="og:description"]').attr('content');
                    else
                        console.log("Website: " + website_data[i][1] + " did not hae a meta discription for fb.");
                    categoryList[i] = setCategory(divs, category_data, website_data, i);
                    console.log("Category = " + JSON.stringify(categoryList[i]));
                }
                counter++;
                console.log(categoryList.length);

            });
    }//loop
    
    
    defered.resolve(categoryList);
    
    //console.log("data: " + JSON.stringify(categoryList));
    return defered.promise;

}

// getCSVInfo(termsLink).then(function (data) {
//     //console.log(data);
//     var terms = {};
//     for (var i = 0; i < data.length; i++) {
//         var category = data[i][0];
//         var subcategory = data[i][1].replace("'", "").trim().split(", ");
//         //debugger;
//         terms[category] = subcategory;
//         //terms[i].push(data[i][1].replace("'", "").trim().split(", "));
//         //console.log(data[i][1].replace("'", "").trim().split(", "));
//         //console.log(category);
//         //console.log(subcategory);
//
//
//         //console.log(subcategory);
//     }
//     //getCsvData(terms)
//     //debugger;
//     //console.log(terms);
//    
// });

getCSVInfo(websites).then(function(res1){
    var $res1 = res1;
    getCSVInfo(termsLink).then(function(res_terms){
        getHTTPItems($res1, res_terms).then(function (res2) {
            console.log(res2);
            console.log("This is res2");
            writeToDB(res2).then(function () {
                console.log("sorta Working with: " + data);
            });
        }).catch(function () {
            console.log("error")
        });
    })
});

