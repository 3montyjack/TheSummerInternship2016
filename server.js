/**
 * Created by Caleb on 6/16/2016.
 */
// server.js

// set up ========================
var express  = require('express');
var app      = express();                               // create our app w/ express
var request = require('request');
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var file = "./Text Files/Testing CSV - members_export_de65acef1b.csv";
var br = require ("binary-reader");
var churro = require ("cheerio");
var util = require ("util");
var Q = require("q");
var $dataCSV = [[]];
// configuration =================


app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

// listen (start app with node server.js) ======================================

//reads text file of the URLs
var csv = require("fast-csv");
var $j = 0;
var $html;

var deferred = Q.defer();

csv .fromPath(file)
    .on("data", function(data){
        $dataCSV.push(data);
        //console.log($dataCSV)
    })
    .on("end", function(){
        console.log($dataCSV);
        console.log("done");
    });

console.log($dataCSV);
request.get("http://pushup.com", function(err, res, body){
    //console.log(body);
    $html = churro.load(body);
    ($html("h1").first().text());
    ($html("title").text());
    try {
        ($html('meta[property="og:description"]').attr('content'));
    } catch(err) {
        console.log("website: " + err.message)
    }
});

function getCSVInfo() {
    
    var deferred = Q.defer();
    
    csv .fromPath(file)
        .on("data", function(data){
            deferred.resolve(data);
        })
        .on("end", function(){
            console.log("done");
        }).on("error", function(err){
            deferred.reject(err);
        });
    
    return deferred.promise;
}

getCSVInfo().then(function(data){
    console.log(data)
}).catch(function(err){
    console.log(err);
});


