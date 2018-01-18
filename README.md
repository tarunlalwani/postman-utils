# postman-utils
Postman utilities functions

if (typeof pmutil == "undefined") {
   var url = "https://raw.githubusercontent.com/tarunlalwani/postman-utils/master/pmutils.js";
   console.log("pmutil not found. loading from " + url);
   pm.sendRequest(url, function(err,res) {
      eval(res.text());
   }
}
