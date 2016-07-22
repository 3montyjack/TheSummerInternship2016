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
  fs = require("fs"),
  natural = require("natural");


var csvStream = csv.createWriteStream({headers: true}),
  ProgressBar = require('progress'),
  args = process.argv,
  TfIdf = natural.TfIdf,
  nounInflector = new natural.NounInflector(),
  tokenizer = new natural.WordPunctTokenizer();
reWord = /\w+/;


function getMostUsedWords(document) {
  var tfidf = new TfIdf();
  var words = tokenizer.tokenize(document);
  var finalString = "";
  var semiFinalArray = [];
  var finalArray = ["firstObject"];
  var output_length = 5;
  var repeat_length = output_length;

  words.forEach(function (word, index, array) {
    array[index] = nounInflector.singularize(word);
  });

  for (var i = 0; i < words.length; i++) {
    if (reWord.test(words[i]) && reWord.test(words[i + 1])) {
      finalString += (words[i] + " ");
    } else if (!reWord.test(words[i])) {
      finalString += (words[i] + " ");
    } else {
      finalString += (words[i]);
    }
  }

  tfidf.addDocument(finalString);

  tfidf.listTerms(0).forEach(function (item) {
    semiFinalArray.push([item.term, item.tfidf]);
  });
  if (output_length > semiFinalArray.length) {
    repeat_length = semiFinalArray.length;
  }

  for (var word = 0; word < output_length; word++) {
    if (repeat_length > word) {
      console.log("got here");
      finalArray.push(semiFinalArray[word][0]);
    }
    console.log("im a hero" + word)
  }
  return finalArray;
}


var html = "",
  websites_file_name = "./Text Files/members_export_de65acef1b.csv",
  //websites_file_name = "./Text Files/Testing CSV - members_export_de65acef1b.csv",
  category_file_name = "./Text Files/catregories - Sheet1.csv",
  updated_file_name = "./Text Files/Final CSV.csv",
  tag_file_name = "./Text Files/catregories - Sheet1.csv",
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

function getTags($url, i, category_data, website_data, bar) {
  var deferred = Q.defer();

  if (website_data[i][CATEGORY_COLUMN] === "Category") {
    bar.tick();
    deferred.resolve(website_data[i]);


  }
  else if (website_data[i][WEBSITE_URL_COLUMN].match(/demo\.pushup/i)) {
    website_data[i][CATEGORY_COLUMN] = "None";
    bar.tick();
    deferred.resolve(website_data[i]);

  }
  else {
    request.get($url, {timeout: 20000}, function (err, res, body) {
      var divs = "";
      //console.log($url);
      if (err) {
        //TODO Change this for the final copy
        website_data[i][CATEGORY_COLUMN] = '404';
        //console.log(err);
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
      deferred.resolve(website_data[i]);
      bar.tick();
    });

  }

  return deferred.promise;

}


function getCategories($url, i, category_data, website_data, bar) {
  var deferred = Q.defer();

  if (website_data[i][CATEGORY_COLUMN] === "Category") {
    bar.tick();
    deferred.resolve(website_data[i]);


  }
  else if (website_data[i][WEBSITE_URL_COLUMN].match(/demo\.pushup/i)) {
    website_data[i][CATEGORY_COLUMN] = "None";
    bar.tick();
    deferred.resolve(website_data[i]);

  }
  else {
    request.get($url, {timeout: 20000}, function (err, res, body) {
      var divs = "";
      //console.log($url);
      if (err) {
        //TODO Change this for the final copy
        website_data[i][CATEGORY_COLUMN] = '404';
        //console.log(err);
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
      deferred.resolve(website_data[i]);
      bar.tick();
    });

  }

  return deferred.promise;

}

function resolveWebsiteTags(website_data, tag_data) {
  var deferred = Q.defer();
  var promises = [];
  var bar = new ProgressBar('Getting URLS [:bar] :percent :etas', {
    total: website_data.length,
    width: 20
  });

  for (var i = 0; i < website_data.length; i++) {

    //console.log(website_data[i]);
    var $url;

    if (website_data[i][WEBSITE_URL_COLUMN] != "") {
      $url = website_data[i][WEBSITE_URL_COLUMN].replace(/^https?[^a-zA-Z0-9]+/i, '');
    }
    $url = "http://" + $url;

    //loop
    (function ($url, i) {
      promises.push(getCategories($url, i, tag_data, website_data, bar));
    })($url, i)
  }
  Q.all(promises).then(function (results) {
    //console.log(results);
    deferred.resolve(results);
  }).catch(function (err) {
    deferred.resolve(err)
  });
  return deferred.promise;
}

function resolveWebsiteCategories(website_data, category_data) {
  var deferred = Q.defer();
  var promises = [];
  var bar = new ProgressBar('Getting URLS [:bar] :percent :etas', {
    total: website_data.length,
    width: 20
  });

  for (var i = 0; i < website_data.length; i++) {

    //console.log(website_data[i]);
    var $url;

    if (website_data[i][WEBSITE_URL_COLUMN] != "") {
      $url = website_data[i][WEBSITE_URL_COLUMN].replace(/^https?[^a-zA-Z0-9]+/i, '');
    }
    $url = "http://" + $url;

    //loop
    (function ($url, i) {
      promises.push(getCategories($url, i, category_data, website_data, bar));
    })($url, i)
  }
  Q.all(promises).then(function (results) {
    //console.log(results);
    deferred.resolve(results);
  }).catch(function (err) {
    deferred.resolve(err)
  });
  return deferred.promise;
}

/**
 * determineCategory finds a category based on the div and the categories that are passed in
 * @param {String} div the html string of elements.
 * @param {Array} categories
 * @returns {*}
 */
function determineCategory(div, categories) {
  for (var term in categories) {
    for (var i = 0; i < categories[term].length; i++) {
      var regEx = new RegExp(categories[term][i], "i");
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


if (args[2] == 1) {
  getCSVInfo(websites_file_name).then(function (website_data) {
    console.log("Getting Websites...");
    getCSVInfo(category_file_name).then(function (category_terms) {
      console.log("Getting Categories...");
      var terms = {};
      for (var i = 0; i < category_terms.length; i++) {
        var category = category_terms[i][0];
        var subcategory = category_terms[i][1].replace("'", "").trim().split(", ");
        terms[category] = subcategory;
        console.log(terms);

      }
      console.log("Finalizing Categories...");
      resolveWebsiteCategories(website_data, terms).then(function (final_website_data) {
        console.log("Saving Data...");

        writeToDB(final_website_data);


      });
    })
  });
}
else if (args[2] == 2) {
  getCSVInfo(websites_file_name).then(function (website_data) {
    console.log("Getting Websites...");
    getCSVInfo(tag_file_name).then(function (tag_terms) {
      console.log("Getting Categories...");
      var terms = {};
      for (var i = 0; i < tag_terms.length; i++) {
        var tag = tag_terms[i][0];
        var subtag = tag_terms[i][1].replace("'", "").trim().split(", ");
        terms[tag] = subtag;


      }
      console.log("Finalizing Categories...");
      resolveWebsiteTags(website_data, terms).then(function (final_website_data) {
       console.log("Saving Data...");

       writeToDB(final_website_data);


       });

      console.log(getMostUsedWords("Hello Jack Jack Jack"));

    })
  })
}
else {
  console.log("Please use a refrence");
  console.log("1 for getting Categories");
  console.log("2 for getting tags");
}