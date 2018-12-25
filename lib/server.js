/**
 * server related tasks
 * 
 * 
 */

//dependencies
var config = require('./config');
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var path = require('path');
var util =require('util');
var debug =util.debuglog('server');

//instantiate the server module object
var server ={}; 

/**
 * https server create
 */
server.httpServer = http.createServer(function (req, res) {
    server.unifiedServer(req, res)
});


/**
 * https server options
 */
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
}


/**
 * https server create
 */
server.httpsServer = https.createServer(server.httpsServerOptions, function (req, res) {
    server.unifiedServer(req, res)
});

/**
 * Handles both http & https requests
 * @param {*} req 
 * @param {*} res 
 */
server.unifiedServer = function (req, res) {
    //get url and parse it
    var parsedUrl = url.parse(req.url, true);

    //get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as an object
    var queryStringObject = parsedUrl.query;

    //Get http method
    var method = req.method.toLowerCase();

    //Get headers
    var headers = req.headers;

    //Get payload
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function (data) {
        buffer += decoder.write(data);
    });


    req.on('end', function () {

        //chosen handler/router
        var chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        //data
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        }

        //call the handler
        chosenHandler(data, function (statusCode, payload) {
            //check statuscode is correct
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            //check payload is object
            payload = typeof (payload) == 'object' ? payload : {};

            //stringfy the object
            var payloadString = JSON.stringify(payload);

            //write statusCode to head
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            if(statusCode == 200){
                debug('\x1b[32m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
            }else{
                debug('\x1b[31m%s\x1b[0m',method.toUpperCase()+' /'+trimmedPath+' '+statusCode);
            }
           

        });

    });

}

/**
 * routes
 */
server.router = {
    'users':handlers.users,
    'tokens':handlers.tokens,
    'menus':handlers.menus,
    'cart':handlers.cart,
    'checkout':handlers.checkout,
};

//init script
server.init=function(){
    
/**
 * http server listening
 */
server.httpServer.listen(config.httpPort, function () {
    console.log('\x1b[36m%s\x1b[0m',"listening on port " + config.httpPort);
});


/**
 * https server listening
 */
server.httpsServer.listen(config.httpsPort, function () {
    console.log('\x1b[35m%s\x1b[0m',"listening on port " + config.httpsPort);
});



}

//export the module
module.exports=server;