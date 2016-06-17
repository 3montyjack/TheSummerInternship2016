/**
 * Created by Caleb on 6/16/2016.
 */
// server.js

// set up ========================
var request = require('request');
var churro = require ("cheerio");
var util = require ("util");
var Q = require("q");
var csv = require("fast-csv");

//reads text file of the URLs
var dataCSV = [[]];
var html;
var divs;
var websites = "./Text Files/Testing CSV - members_export_de65acef1b.csv";
//TODO Finish the inputs
var termsLink = "./Text Files/catregories.csv";
var counter = 0;
var terms = [];

//console.log(dataCSV);

function getCSVInfo(file) {

    var deferred = Q.defer();
    var tempData= [];
    csv .fromPath(file)
        .on("data", function(data){
            tempData.push(data);
            //deferred.resolve(tempData);

        })
        .on("end", function(){
            deferred.resolve(tempData);
            console.log("done");
        }).on("error", function(err){
        deferred.reject(err);
    });

    return deferred.promise;
}

getCSVInfo(termsLink).then(function(data) {
    terms = data;
    console.log(data);
    
});



getCSVInfo(websites).then(function(data){
    //console.log(data);
    for (var i = 0; i < data.length; i++) {
        var $url;
        if (!data[i][2].match(/http:\/\//i)) {
            //console.log(data[i][2]);
           $url = "http://" + data[i][2];

        } else {
            $url = data[i][2];

        }
        //console.log("making request: ", $url)
        request.get($url, function (err, res, body) {
            //console.log(body);

            
            if (err) {
                //console.log($url);
                //console.log(err);
                //if ()
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
            }
            //console.log(divs);
        });

    }
    //console.log(counter);
});



function setCategory(category, data) {
    data[4] = category;
}