/**
 * Helpers for various tasks
 */

/**
 * dependencies
 */
var crypto = require('crypto');
var config = require('./config');
var querystring = require('querystring');
var https = require('https');


/**
 * helpers container
 */
var helpers = {};

/**
 * Mailgun Email Sender
 * @param {*} receiverEmail 
 * @param {*} content 
 * @param {*} callback 
 */
helpers.mailGunSender = function (receiverEmail, content, callback) {

    var payload = {
        'from': '' + config.mailgun.email,
        'to': receiverEmail,
        'subject': content.subject,
        'text': content.text
    };

    var stringPayload = querystring.stringify(payload);

    var requestDetails = {
        'protocol': 'https:',
        'hostname': 'api.mailgun.net',
        'method': 'POST',
        'path': '/v3' + config.mailgun.email + '/messages',
        'auth': 'api:' + config.mailgun.key,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
        }
    };

    var req = https.request(requestDetails, function (res) {

        var status =  res.statusCode;
        if(status === 200 || status ===201){
            callback(false);
        }else{
            callback('Email status code returned was '+status);
        }

    });

    //Bind to error event
    req.on('error', function (e) {
        callback(e);
    });

    //add to payload
    req.write(stringPayload);

    //end the request
    req.end();

};


/**
 * checkout with stripe
 * @param {*} checkOutData 
 * @param {*} callback 
 */
helpers.stripeCheckout = function (checkOutData, callback) {

    //prepare payload
    var paylod = {
        'amount': checkOutData.amount,
        'currency': checkOutData.currency,
        'description': checkOutData.description
    };

    //prepare payload string
    var stringPayload = querystring.stringify(paylod);

    var requestDetails = {
        'protocol': 'https:',
        'hostname': 'api.stripe.com',
        'method': 'POST',
        'path': '/v1/charges',
        'auth': config.stripeKey,
        'header': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
        }
    };

    //instatiate request object
    var req = https.request(requestDetails, function (res) {

        //Grab the status code
        var status = res.statusCode;
        if (status === 200 || status === 201) {
            callback(false);
        } else {
            // console.log(res);
            callback('Payment status code returned was ' + status);
        }

    });

    //Bind to error event
    req.on('error', function (e) {
        callback(e);
    });

    //add to payload
    req.write(stringPayload);

    //end the request
    req.end();

};

/**
 * Hash string with sha256
 * @param {*} str 
 */
helpers.hash = function (str) {
    if (typeof (str) == 'string' && str.trim().length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
}

/**
 * parse json string to object
 * @param {*} str 
 */
helpers.parseJsonToObject = function (str) {

    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (err) {
        return {};
    }

}

/**
 * Generate random string of a specified length
 * @param {*} strLen 
 */
helpers.createRandomString = function (strLen) {
    var strLen = typeof (strLen) == 'number' && strLen > 0 ? strLen : 20;
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    var str = '';
    for (var i = 1; i <= strLen; i++) {
        //Get random character and append to final string
        str += possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
    }
    return str;
}

/**
 * Create cart id provided email
 * @param {*} email 
 */
helpers.createCartId = function (email) {
    var cartEmail = email.replace('.', '_');
    var cartId = cartEmail + '_' + Date.now();
    return cartId;
}



/**
 * Export the module
 */
module.exports = helpers;