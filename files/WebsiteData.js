/**
 * Created by Jack on 7/22/2016.
 */

const Q = require("q"),
  churro = require("cheerio"),
  csv = require("fast-csv"),
  fs = require("file-system"),
  util = require("util"),
  ProgressBar = require('progress'),
  natural = require("natural"),
  request = require('request'),
  _ = require('lodash');


var
  nounInflector = new natural.NounInflector(),
  tokenizer = new natural.WordPunctTokenizer(),
  reWord = /\w+/,
  csvStream = csv.createWriteStream({headers: true}),
  updated_file_name = "./Text Files/Final CSV.csv",
  TfIdf = natural.TfIdf;


var CATEGORY_COLUMN = 16,
  WEBSITE_URL_COLUMN = 4,
  TAG_COLUMN = 18;


class WebsiteData {

  assignTagScore(tag, tfidf) {

    var score = 0;


    tag.forEach(function (word, index, array) {
      {
        tfidf.tfidfs(word, function (i, measure) {
          if (score < measure)
            score = measure;
        });
      }
    });
    return score;
  }


  getComparedTagsData(document, tag_list) {
    var words = tokenizer.tokenize(document);
    var tfidf = new TfIdf();
    var semiFinalString = "";
    var semiFinalJSON = [];
    var finalString = [];
    var output_length = 5;
    var repeat_length = output_length;

    words.forEach(function (word, index, array) {
      array[index] = nounInflector.singularize(word);
    });

    for (var i = 0; i < words.length; i++) {
      if (reWord.test(words[i]) && reWord.test(words[i + 1])) {
        semiFinalString += (words[i] + " ");
      } else if (!reWord.test(words[i])) {
        semiFinalString += (words[i] + " ");
      } else {
        semiFinalString += (words[i]);
      }
    }
    tfidf.addDocument(semiFinalString);
    for (var tag in tag_list) {
      semiFinalJSON.push({ name:tag, score:this.assignTagScore(tag_list[tag], tfidf)});

    }
    /*tfidf.listTerms(0).forEach(function (item) {
     //semiFinalArray.push([item.term, item.tfidf]);
     });
     if (output_length > semiFinalArray.length) {
     repeat_length = semiFinalArray.length;
     }*/
    finalString = _.map(_.take(_.orderBy(semiFinalJSON, "score", 'desc'), output_length), "name").join(", ");
    return finalString;
  }


  getCSVInfo(file) {
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

  getTags($url, i, tags_list, website_data, bar) {
    var $this = this;
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
        if (err) {
          //TODO Change this for the final copy
          website_data[i][CATEGORY_COLUMN] = '404';
        }

        else {
          var html = churro.load(body);
          if (html("h1"))
            html("h1").each(function (i, elm) {
              divs += html(this).text();
            });

          if (html("title"))
            html("title").each(function (i, elm) {
              divs += html(this).text();
            });

          if (html("p"))
            html("p").each(function (i, elm) {
              divs += html(this).text();
            });

          if (html('meta[property="og:description"]'))
            divs += html('meta[property="og:description"]').attr('content');

          website_data[i][TAG_COLUMN] = $this.getComparedTagsData(divs, tags_list);

        }
        deferred.resolve(website_data[i]);
        bar.tick();
      });

    }

    return deferred.promise;
  }


  getCategories($url, i, category_data, website_data, bar) {
    var $this = this;
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
        if (err) {
          //TODO Change this for the final copy
          website_data[i][CATEGORY_COLUMN] = '404';
        }


        else {
          var html = churro.load(body);


          if (html("h1"))
            divs += html("h1").first().text();

          if (html("title"))
            divs += html("title").text();

          if (html('meta[property="og:description"]'))
            divs += html('meta[property="og:description"]').attr('content');

          website_data[i][CATEGORY_COLUMN] = $this.determineCategory(divs, category_data);

        }
        deferred.resolve(website_data[i]);
        bar.tick();
      });

    }

    return deferred.promise;

  }

  resolveWebsiteTags(website_data, tag_data) {
    var deferred = Q.defer();
    var promises = [];

    var bar = new ProgressBar('Getting URLS [:bar] :percent :etas', {
      total: website_data.length,
      width: 20
    });

    for (var i = 0; i < website_data.length; i++) {
      var $url;

      if (website_data[i][WEBSITE_URL_COLUMN] != "") {
        $url = website_data[i][WEBSITE_URL_COLUMN].replace(/^https?[^a-zA-Z0-9]+/i, '');
      }

      $url = "http://" + $url;

      //loop
      (function ($url, i, $this, website_data, bar, tag_data) {
        setTimeout(function () {
          promises.push($this.getTags($url, i, tag_data, website_data, bar));
          if (i == website_data.length - 1) {
            Q.all(promises).then(function (results) {
              deferred.resolve(results);
            }).catch(function (err) {
              deferred.resolve(err)
            });
          }
        }, 60 * i);
      })($url, i, this, website_data, bar, tag_data)
    }

    return deferred.promise;
  }

  resolveWebsiteCategories(website_data, category_data) {

    var deferred = Q.defer();
    var promises = [];
    var bar = new ProgressBar('Getting URLS [:bar] :percent :etas', {
      total: website_data.length,
      width: 20
    });
    //console.log(website_data);
    for (var i = 1; i < website_data.length; i++) {

      //console.log(website_data[i]);
      var $url;

      if (website_data[i][WEBSITE_URL_COLUMN] != "") {
        $url = website_data[i][WEBSITE_URL_COLUMN].replace(/^https?[^a-zA-Z0-9]+/i, '');
      }
      $url = "http://" + $url;
      //loop
      (function ($url, i, $this, website_data, bar, category_data) {
        setTimeout(function () {
          promises.push($this.getCategories($url, i, category_data, website_data, bar));
        }, 50 * i)

      })($url, i, this, website_data, bar, category_data)
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
  determineCategory(div, categories) {
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

  determineTags(div, tags) {
    var finalTag = "";
    for (var term in tags) {
      for (var i = 0; i < tags[term].length; i++) {
        var regEx = new RegExp(tags[term][i], "i");
        if (div.match(regEx)) {
          finalTag += " " + tags[term];

        }
      }
    }
    //TODO Make this look better as well for the final copy
  }


  writeToDB(final_website_data) {
    debugger;
    var writableStream = fs.createWriteStream(updated_file_name);
    debugger;
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
}

module.exports = WebsiteData;