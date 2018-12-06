/**
 * handlers logic here
 */

/**
 * dependencies here
 */
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');



/**
 * request handlers
 */
var handlers = {};

/**
 * Users handler
 * @param {*} data 
 * @param {*} callback 
 */
handlers.users = function (data, callback) {

    //allowed methods
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        //method not allowed
        callback(405);
    }

}

//private user handlers
handlers._users = {};

/**
 * Post request
 * users - post
 * @param {*} data 
 * @param {*} callback
 * Requried: email,name,street,password
 * Optional:none 
 */
handlers._users.post = function (data, callback) {

    //check all required fields are filled out

    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ?
        data.payload.email.trim() : false;

    var name = typeof (data.payload.name) == 'string' && data.payload.name.trim().length > 0 ?
        data.payload.name.trim() : false;

    var street = typeof (data.payload.street) == 'string' && data.payload.street.trim().length > 0 ?
        data.payload.street.trim() : false;

    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;

    if (email && name && street && password) {

        //ensure does not already exist
        _data.read('users', email, function (err, data) {

            if (err) {

                //hash password
                var hashedPassword = helpers.hash(password);

                if (hashedPassword) {

                    //create the user object
                    var userObject = {
                        'email': email,
                        'name': name,
                        'street': street,
                        'hashedPassword': hashedPassword
                    };

                    //create record
                    _data.create('users', email, userObject, function (err) {
                        if (!err) {
                            callback(200, {
                                'Message': 'User successfuly created.'
                            });
                        } else {
                            console.log(err);
                            callback(500, {
                                'Error': 'Error while creating user'
                            });
                        }
                    });

                } else {
                    callback(500, {
                        'Error': 'Could not hash the user\'s password'
                    });
                }


            } else {
                callback(400, {
                    'Error': 'User with that email already exists'
                });
            }

        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        })
    }

}

/**
 * Get request
 * users - get
 * @param {*} data 
 * @param {*} callback 
 * Required:email
 * Optional:none
 * 
 */
handlers._users.get = function (data, callback) {

    //validate email
    // console.log(data);
    var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ?
        data.queryStringObject.email.trim() : false;

    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    if (email) {

        handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
            if (tokenIsValid) {

                _data.read('users', email, function (err, data) {

                    if (!err && data) {
// console.log(data);
                        //remove hashedPassword in response payload
                        delete data.hashedPassword;
                        callback(200, data);

                    } else {
                        callback(404)
                    }

                });

            } else {
                callback(403, {
                    'Error': 'Missing required token or provided token is invalid'
                });
            }
        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }

}

/**
 * Put request
 * users - put
 * @param {*} data 
 * @param {*} callback 
 * Required : email
 * Optional : firstName,lastName,password
 */
handlers._users.put = function (data, callback) {

    //check if email has been set
    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ?
        data.payload.email.trim() : false;

    var name = typeof (data.payload.name) == 'string' && data.payload.name.trim().length > 0 ?
        data.payload.name.trim() : false;

    var street = typeof (data.payload.street) == 'string' && data.payload.street.trim().length > 0 ?
        data.payload.street.trim() : false;

    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;

    //get token from header
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    //check required field is set
    if (email) {

        //check fields to update set
        if (name || street || password) {

            handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
                if (tokenIsValid) {

                    _data.read('users', email, function (err, userData) {
                        if (!err && userData) {

                            if (name) {
                                userData.name = name;
                            }

                            if (street) {
                                userData.street = street;
                            }

                            if (password) {
                                userData.password = helpers.hash(password);
                            }

                            //update
                            _data.update('users', email, userData, function (err) {
                                if (!err) {
                                    callback(200, {
                                        'Message': 'successfuly updated the user'
                                    });
                                } else {
                                    callback(500, {
                                        'Error': 'Error while updating user'
                                    });
                                }
                            });

                        } else {
                            callback(404, {
                                'Error': 'Specified user does not exist'
                            });
                        }
                    });

                } else {
                    callback(403, {
                        'Error': 'Missing required token or provided token is invalid'
                    });
                }
            });


        } else {
            callback(400, {
                'Error': 'Missing data to update'
            });
        }

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }


}

/**
 * Delete request
 * users - delete
 * @param {*} data 
 * @param {*} callback
 * Required :email
 */
handlers._users.delete = function (data, callback) {

    //validate email
    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ?
        data.payload.email.trim() : false;

    //get token from header
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    if (email) {

        handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
            if (tokenIsValid) {

                _data.read('users', email, function (err, data) {

                    if (!err && data) {

                        //delete
                        _data.delete('users', email, function (err) {
                            if (!err) {

                                var userChecks = typeof (data.checks) == 'object' && data.checks instanceof Array ? data.checks : [];
                                var checksToDelete = userChecks.length;

                                if (checksToDelete > 0) {

                                    var checksDeleted = 0;
                                    var deletionErrors = false;
                                    //loop through the checks
                                    userChecks.forEach(checkId => {
                                        //delete the checks
                                        _data.delete('checks', checkId, function (err) {
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            if (checksDeleted == checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200);
                                                } else {
                                                    callback(500, {
                                                        'Error': 'Error while deleting user checks,all checks may not have been deleted successfuly'
                                                    })
                                                }
                                            }
                                        });
                                    });

                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, {
                                    'Error': 'error while deleting user'
                                });
                            }
                        });

                    } else {
                        callback(400, {
                            'Error': 'Could not find the specified user'
                        })
                    }

                });

            } else {
                callback(403, {
                    'Error': 'Missing required token or provided token is invalid'
                });
            }
        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }

}


/**
 * tokens handler
 * @param {*} data 
 * @param {*} callback 
 */
handlers.tokens = function (data, callback) {

    //allowed methods
    var acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        //method not allowed
        callback(405);
    }

}

//private token handlers
handlers._tokens = {};

/**
 * Create a token
 * @param {*} data 
 * @param {*} callback 
 * Required:email,password
 * optinal:none
 */
handlers._tokens.post = function (data, callback) {

    //validate user is valid
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;

        var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ?
        data.payload.email.trim() : false;

    if (password && email) {

        //lookup user that matches email
        _data.read('users', email, function (err, userData) {

            if (!err && userData) {

                //validate hashed passwords match
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {

                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + (1000 * 60 * 60); // add 1 hour

                    //token object
                    var tokenObject = {
                        'id': tokenId,
                        'email': userData.email,
                        'expires': expires
                    };

                    //create token
                    _data.create('tokens', tokenId, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {
                                'Error': 'Could not create the new token.'
                            })
                        }
                    });


                } else {
                    callback(400, {
                        'Error': 'Password did not match the user\'s stored password'
                    });
                }


            } else {
                callback(400, {
                    'Error': 'Could not find specified user'
                });
            }

        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        })
    }
}

/**
 * Get token data
 * @param {*} data 
 * @param {*} callback 
 * Required:id
 * Optinal :none
 */
handlers._tokens.get = function (data, callback) {
    //validate token id
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ?
        data.queryStringObject.id.trim() : false;

    if (id) {

        //lookup the token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
                //return token data
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }
}

/**
 * update token
 * @param {*} data 
 * @param {*} callback
 * Required:id,extend
 * Optional:none 
 */
handlers._tokens.put = function (data, callback) {

    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ?
        true : false;

    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ?
        data.payload.id : false;
// console.log(data.payload);
    if (extend && id) {

        //get token
        _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {

                //confirm if token has already exipired
                if (tokenData.expires > Date.now()) {

                    //update expiry time
                    tokenData.expires = Date.now() + (1000 * 60 * 60) //add 1 hour

                    _data.update('tokens', id, tokenData, function (err) {

                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {
                                'Error': 'Could not update the token\'s expiration'
                            });
                        }

                    });


                } else {
                    callback(400, {
                        'Error': 'Token has already expired and cannot be extended.'
                    });
                }

            } else {
                callback(400, {
                    'Error': 'Specified token does not exist'
                });
            }
        });

    } else {
        callback(400, {
            'Error': 'Missing required fields or field(s) are invalid'
        });
    }

}

/**
 * Delete token
 * @param {*} data 
 * @param {*} callback 
 * Required:id
 * Optinal :none
 */
handlers._tokens.delete = function (data, callback) {

    //validate id
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ?
        data.payload.id : false;

    if (id) {

        _data.read('tokens', id, function (err, data) {

            if (!err && data) {

                //delete
                _data.delete('tokens', id, function (err) {
                    if (!err) {
                        callback(200, {
                            'Message': 'successfuly deleted'
                        });
                    } else {
                        callback(500, {
                            'Error': 'error while deleting token'
                        });
                    }
                });

            } else {
                callback(400, {
                    'Error': 'Could not find the specified token'
                })
            }

        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }

}

/**
 * verify if a given tokend id is currently valid for a given user
 * @param {*} id 
 * @param {*} email 
 * @param {*} callback 
 */
handlers._tokens.verifyToken = function (id, email, callback) {

    //check tocken exists
    _data.read('tokens', id, function (err, tokenData) {
        if (!err && tokenData) {
            //confirm email is valid and token has not yet expired
            if (tokenData.email == email && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }

    });

}


/**
 * url not found
 * @param {*} data 
 * @param {*} callback 
 */
handlers.notFound = function (data, callback) {
    callback(404);
}


/**
 * export the module
 */
module.exports = handlers;