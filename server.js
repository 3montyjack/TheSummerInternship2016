/**
 * Created by Caleb on 6/16/2016.
 */
// server.js

// set up ========================
const
  Functionality = require("./files/WebsiteData.js"),
  fs = require("fs");
  ;

var args = process.argv;

var html = "",
  websites_file_name = "./Text Files/members_export_de65acef1b.csv",
  //websites_file_name = "./Text Files/Testing CSV - members_export_de65acef1b.csv",
  category_file_name = "./Text Files/catregories - Sheet1.csv",
  updated_file_name = "./Text Files/Final CSV.csv",
  tag_file_name = "./Text Files/catregories - Sheet1.csv",
  functionality = new Functionality();






if (args[2] == 1) {
  functionality.getCSVInfo(websites_file_name).then(function (website_data) {
    console.log("Getting Websites...");
    functionality.getCSVInfo(category_file_name).then(function (category_terms) {
      console.log("Getting Categories...");
      var terms = {};
      for (var i = 0; i < category_terms.length; i++) {
        var category = category_terms[i][0];
        var subcategory = category_terms[i][1].replace("'", "").trim().split(", ");
        terms[category] = subcategory;


      }
      console.log("Finalizing Categories...");
      functionality.resolveWebsiteCategories(website_data, terms).then(function (final_website_data) {
        console.log("Saving Data...");

        functionality.writeToDB(final_website_data);


      });
    })
  });
}
else if (args[2] == 2) {
  functionality.getCSVInfo(websites_file_name).then(function (website_data) {
    console.log("Getting Websites...");
    functionality.getCSVInfo(tag_file_name).then(function (tag_terms) {
      console.log("Getting Categories...");
      var terms = {};
      for (var i = 0; i < tag_terms.length; i++) {
        var tag = tag_terms[i][0];
        var subtag = tag_terms[i][1].replace("'", "").trim().split(", ");
        terms[tag] = subtag;
        //console.log(tag);

      }

      console.log("Finalizing Categories...");
      functionality.resolveWebsiteTags(website_data, terms).then(function (final_website_data) {
        console.log("Saving Data...");
        functionality.writeToDB(final_website_data);
        //console.log(functionality.getComparedTagsData("Hello Jack Jack Jack"));
      });



    })
  })
}
else {
  console.log("Please use a refrence");
  console.log("1 for getting Categories");
  console.log("2 for getting Tags");
}