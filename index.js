/**
 * primary file for the api
 */

//dependencies
var server = require('./lib/server');

//declare the app
var app = {};

app.testStripe = function () {

  var helpers = require('./lib/helpers');

  var stripeCheckoutData = {
    amount: 2000,
    currency: 'KES',
    description: 'all list item description'
  };

  helpers.stripeCheckout(stripeCheckoutData, function (err) {
    if (err) {
      console.log(err);
    }
  });

}


//init function
app.init = function () {
  //start the server
  server.init();
  //app.testStripe();

};

//execute
app.init();

//export the app
module.exports = app;