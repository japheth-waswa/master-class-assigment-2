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
 * Export the module
 */
module.exports = helpers;