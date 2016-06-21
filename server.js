/**
 * Created by Caleb on 6/16/2016.
 */
// server.js

// set up ========================
const request = require('request'),
  churro = require("cheerio"),
  util = require("util"),
  Q = require("q"),
  csv = require("fast-csv"),
  fs = require("fs");
var csvStream = csv.createWriteStream({headers: true}),
  ProgressBar = require('progress');


var html = "",
  websites_file_name = "./Text Files/members_export_de65acef1b.csv",
//websites_file_name = "./Text Files/Testing CSV - members_export_de65acef1b.csv",
  category_file_name = "./Text Files/catregories - Sheet1.csv",
  updated_file_name = "./Text Files/Final CSV.csv",
  CATEGORY_COLUMN = 16,
  WEBSITE_URL_COLUMN = 4;


function getCSVInfo(file) {
  var deferred = Q.defer();
  var tempData = [];
  csv.fromPath(file)
    .on("data", function (data) {
      tempData.push(data);
    })
    .on("end", function () {
      deferred.resolve(tempData);
    })
    .on("error", function (err) {
      deferred.reject(err);
    });

  return deferred.promise;
}

function getCategories($url, i, category_data, website_data) {
  var defered = Q.defer();

  if (website_data[i][CATEGORY_COLUMN] === "Category") {
    defered.resolve(website_data[i]);


  }
  else if (website_data[i][WEBSITE_URL_COLUMN].match(/demo\.pushup/i)) {
    website_data[i][CATEGORY_COLUMN] = "None"
    defered.resolve(website_data[i]);

  }
  else {
    request.get($url, {timeout: 20000}, function (err, res, body) {
      var divs = "";
      console.log($url);
      if (err) {
        //TODO Change this for the final copy
        website_data[i][CATEGORY_COLUMN] = '404'
        console.log(err);
      }


      else {
        html = churro.load(body);


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
          console.log("Website: " + website_data[i][WEBSITE_URL_COLUMN] + " did not hae a meta discription for fb.");
        website_data[i][CATEGORY_COLUMN] = determineCategory(divs, category_data);

      }
      defered.resolve(website_data[i]);
    });

  }

  return defered.promise;

}

function resolveWebsiteCategories(website_data, category_data) {
  var defered = Q.defer();
  var promises = [];

  for (var i = 0; i < website_data.length; i++) {

    //console.log(website_data[i]);
    var $url;

    if (website_data[i][WEBSITE_URL_COLUMN] != "") {
      $url = website_data[i][WEBSITE_URL_COLUMN].replace(/^https?[^a-zA-Z0-9]+/i, '');
    }
    $url = "http://" + $url;

    //loop
    (function ($url, i) {
      promises.push(getCategories($url, i, category_data, website_data));
    })($url, i)
  }
  Q.all(promises).then(function (results) {
    //console.log(results);
    defered.resolve(results);
  }).catch(function (err) {
    defered.resolve(err)
  });

  return defered.promise;
}

/**
 * determineCategory finds a category based on the div and the categories that are passed in
 * @param {String} div the html string of elements.
 * @param {Array} categories
 * @param data
 * @param i
 * @returns {*}
 */
function determineCategory(div, categories) {
  for (var term in categories) {
    for (var i = 0; i < categories[term].length; i++) {
      var regEx = new RegExp(categories[term][i], "i")
      if (div.match(regEx)) {
        return term;

      }
    }
  }
  //TODO Make this look better as well for the final copy
  return "Didnt Catorgize";
}

function writeToDB(final_website_data) {

  var writableStream = fs.createWriteStream(updated_file_name);

  writableStream.on("finish", function () {
    console.log("DONE!");
  });


  csvStream.pipe(writableStream);
  console.log("Staging Changes...");
  for (var i = 0; i < final_website_data.length; i++) {

    csvStream.write(final_website_data[i]);
  }
  console.log("writing to DB...");

  csvStream.end();
}


getCSVInfo(websites_file_name).then(function (website_data) {
  console.log("Getting Websites...")
  getCSVInfo(category_file_name).then(function (category_terms) {
    console.log("Getting Categories...");
    var terms = {};
    for (var i = 0; i < category_terms.length; i++) {
      var category = category_terms[i][0];
      var subcategory = category_terms[i][1].replace("'", "").trim().split(", ");
      terms[category] = subcategory;

    }
    console.log("Finalizing Categories...");
    resolveWebsiteCategories(website_data, terms).then(function (final_website_data) {
      //console.log(res2);
      //console.log("This is res2");

      writeToDB(final_website_data);


    });
  })
});