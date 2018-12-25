/**
 * handlers logic here
 */

/**
 * dependencies here
 */
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');
const pizzaMenu = 'pizzamenu';


/**
 * request handlers
 */
var handlers = {};

/**
 * private checkout handlers
 */
handlers._checkout = {};

/**
 * checkout handler
 * @param {*} data 
 * @param {*} callback 
 */
handlers.checkout = function (data, callback) {
    //allowed methods
    var acceptableMethods = ['post'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checkout[data.method](data, callback);
    } else {
        callback(405);
    }

};

/**
 * post order to stripe and email receipt to client
 * @param {*} data 
 * @param {*} callback 
 */
handlers._checkout.post = function (data, callback) {

    var email = typeof (data.payload.email) === 'string' && data.payload.email.trim().length > 0 ?
        data.payload.email.trim() : false;

    var cartId = typeof (data.payload.cartId) === 'string' && data.payload.cartId.trim().length > 0 ?
        data.payload.cartId.trim() : false;

    var token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

    if (email && token) {

        //verify token
        handlers._tokens.verifyToken(token, email, function (tokenIsValid) {

            if (tokenIsValid) {
                //get the cart
                _data.read('carts', cartId, function (err, cartData) {

                    if (!err && cartData) {
                        var grossTotal = 0;
                        var description = '';
                        var currency = 'usd';
                        var receiptDescription = '';
                        for (x in cartData) {
                            var cart = cartData[x];
                            var product = cart.product;
                            var quantity = cart.quantity;
                            var totalAmount = quantity * product.price;
                            grossTotal += totalAmount;
                            description += ',' + product.productname;
                            currency = product.currency.toLowerCase();
                            receiptDescription += product.productname + ' : ' + product.currency.toUpperCase() + ' ' + totalAmount+'\n';

                        }

                        if (grossTotal > 0) {

                            //stripe and mailgun
                            var stripeCheckoutData = {
                                amount: grossTotal,
                                currency: currency,
                                description: description
                            };

                            helpers.stripeCheckout(stripeCheckoutData, function (err) {

                                if (!err) {

                                    var emailContent = {
                                        'subject': 'Pizza Receipt',
                                        'text': receiptDescription
                                    };
                                    //send mailgun
                                    helpers.mailGunSender(email, emailContent, function (err) {
                                        if (!err) {
                                            callback(200);
                                        } else {
                                            callback(400, {
                                                'Error': 'Error while sending email'
                                            });
                                        }
                                    });


                                } else {
                                    callback(400, {
                                        'Error': err
                                    });
                                }

                            });

                        } else {
                            callback(400, {
                                'Error': 'Gross amount is 0 or less than 0'
                            })
                        }
                        
                    } else {
                        callback(400, {
                            'Error': 'The specified does not exist'
                        })
                    }

                });

            } else {
                callback(400, {
                    'Error': 'Missing required fields'
                })
            }

        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }

};

/**
 * private cart handlers
 */
handlers._cart = {};

/**
 * cart handler
 * @param {*} data 
 * @param {*} callback 
 */
handlers.cart = function (data, callback) {
    //allowed methods
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._cart[data.method](data, callback);
    } else {
        //method not allowed
        callback(405);
    }
}

/**
 * Delete cart
 * @param {*} data 
 * @param {*} callback 
 * Required: email,cartId
 * Headers: token
 */
handlers._cart.delete = function (data, callback) {
    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ?
        data.payload.email.trim() : false;

    var cartId = typeof (data.payload.cartId) == 'string' && data.payload.cartId.trim().length > 0 ?
        data.payload.cartId.trim() : false;

    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    if (email && cartId && token) {

        //verify token
        handlers._tokens.verifyToken(token, email, function (tokenIsValid) {

            if (tokenIsValid) {

                //delete the cart
                _data.delete('carts', cartId, function (err, ) {

                    if (!err) {
                        callback(200);
                    } else {
                        callback(404)
                    }

                });

            } else {
                callback(403, {
                    'Error': 'Missing token or provided token is invalid'
                });
            }

        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        });
    }
};

/**
 * Get cart items
 * @param {*} data 
 * @param {*} callback 
 * Required: email,cartId
 * Headers: token
 */
handlers._cart.get = function (data, callback) {

    var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ?
        data.queryStringObject.email.trim() : false;

    var cartId = typeof (data.queryStringObject.cartId) == 'string' && data.queryStringObject.cartId.trim().length > 0 ?
        data.queryStringObject.cartId.trim() : false;

    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    if (email && cartId && token) {

        //verify token
        handlers._tokens.verifyToken(token, email, function (tokenIsValid) {

            if (tokenIsValid) {

                //get the cart
                _data.read('carts', cartId, function (err, cartData) {

                    if (!err && cartData) {
                        callback(200, cartData);
                    } else {
                        callback(404)
                    }

                });

            } else {
                callback(403, {
                    'Error': 'Missing token or provided token is invalid'
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
 * update cart item
 * @param {*} data 
 * @param {*} callback 
 * Required:productId,email,cartId,quantity
 * Headers:token
 */
handlers._cart.put = function (data, callback) {

    var productId = typeof (data.payload.productId) == 'string' && data.payload.productId.trim().length > 0 ?
        data.payload.productId.trim() : false;

    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ?
        data.payload.email.trim() : false;

    var cartId = typeof (data.payload.cartId) == 'string' && data.payload.cartId.trim().length > 0 ?
        data.payload.cartId.trim() : false;

    var quantity = typeof (data.payload.quantity) == 'number' && data.payload.quantity >= 0 ?
        data.payload.quantity : false;

    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    if (productId && email && cartId && quantity !== false && token) {

        //verify token
        handlers._tokens.verifyToken(token, email, function (tokenIsValid) {

            if (tokenIsValid) {

                //get the cart
                _data.read('carts', cartId, function (err, cartData) {

                    if (!err && cartData) {
                        //check if product exists
                        if (cartData.hasOwnProperty(productId)) {
                            var productItem = cartData[productId];
                            if (quantity == 0) {
                                //remove from cart 
                                delete cartData[productId];
                            } else {
                                productItem['quantity'] = quantity;
                                cartData[productId] = productItem;
                            }

                            //update
                            _data.update('carts', cartId, cartData, function (err) {

                                if (!err) {
                                    callback(200, {
                                        'Message': 'Item added to cart successfuly',
                                        'cartId': cartId,
                                        'cartItems': cartData
                                    });
                                } else {
                                    callback(500, {
                                        'Error': 'Error while adding item to cart'
                                    });
                                }

                            });

                        } else {
                            callback(400, {
                                'Error': 'The provided product does not exist in this cart'
                            });
                        }

                    } else {
                        callback(400, {
                            'Error': 'Cart matching the provided cart id not found'
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
            'Error': 'Missing required fields'
        });
    }

}

/**
 * post cart item
 * @param {*} data 
 * @param {*} callback 
 * Required: productId,email
 * Optinal : cartId
 * Headers: token
 */
handlers._cart.post = function (data, callback) {

    var productId = typeof (data.payload.productId) == 'string' && data.payload.productId.trim().length > 0 ?
        data.payload.productId.trim() : false;

    var email = typeof (data.payload.email) == 'string' && data.payload.email.trim().length > 0 ?
        data.payload.email.trim() : false;

    var cartId = typeof (data.payload.cartId) == 'string' && data.payload.cartId.trim().length > 0 ?
        data.payload.cartId.trim() : false;

    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    if (email && productId && token) {

        //verify token
        handlers._tokens.verifyToken(token, email, function (tokenIsValid) {

            if (tokenIsValid) {

                //get the product
                _data.read('products', pizzaMenu, function (err, data) {
                    if (!err && data) {

                        //confirm the productid is part of the menu
                        if (data.hasOwnProperty(productId)) {

                            var product = data[productId];

                            //cart id set or not set

                            //cart id not set
                            var productItem = {
                                'product': product,
                                'quantity': 1,
                            };

                            var cartItem = {};
                            cartItem[productId] = productItem;


                            if (cartId == false) {
                                //if cart id not set
                                //create cartId

                                cartId = helpers.createCartId(email);

                                //create cart item
                                _data.create('carts', cartId, cartItem, function (err) {

                                    if (!err) {
                                        callback(200, {
                                            'Message': 'Item added to cart successfuly',
                                            'cartId': cartId,
                                            'cartItems': cartItem
                                        });
                                    } else {
                                        callback(500, {
                                            'Error': 'Error while adding item to cart'
                                        });
                                    }

                                });

                            } else {
                                //get the cart
                                //update/create the product(depends)
                                _data.read('carts', cartId, function (err, cartData) {

                                    if (!err && cartData) {

                                        //check if product id exists
                                        if (cartData.hasOwnProperty(productId)) {
                                            var prodItem = cartData[productId];
                                            //add quantity
                                            prodItem['quantity'] = prodItem['quantity'] + 1;
                                            cartData[productId] = prodItem;

                                        } else {
                                            //add product
                                            cartData[productId] = productItem;
                                        }

                                        //update
                                        _data.update('carts', cartId, cartData, function (err) {
                                            if (!err) {
                                                callback(200, {
                                                    'Message': 'Item added to cart successfuly',
                                                    'cartId': cartId,
                                                    'cartItems': cartData
                                                });
                                            } else {
                                                callback(500, {
                                                    'Error': 'Error while adding item to cart'
                                                });
                                            }
                                        });

                                    } else {
                                        callback(400, {
                                            'Error': 'The cart matching the provided cart id not found.'
                                        });
                                    }

                                });
                            }

                            //2 ways ie cartId is set
                            //2 ways ie cartId not set
                            //cartId = email_Date.now();


                        } else {
                            callback(400, {
                                'Error': 'Product with the provided product id does not exist'
                            });
                        }

                    } else {
                        callback(400, {
                            'Error': 'Missing menu items'
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
            'Error': 'Missing required fields'
        });
    }

}

/**
 * private menu handlers
 */
handlers._menus = {};

/**
 * Get all menu items
 * @param {*} data 
 * @param {*} callback 
 */
handlers._menus.get = function (data, callback) {

    //validate email
    var email = typeof (data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ?
        data.queryStringObject.email.trim() : false;

    //extract token
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    if (email) {

        //verify token
        handlers._tokens.verifyToken(token, email, function (tokenIsValid) {

            if (tokenIsValid) {

                //read all menu items
                _data.read('products', pizzaMenu, function (err, data) {

                    if (!err && data) {
                        callback(200, data);
                    } else {
                        callback(404)
                    }

                });

            } else {
                callback(403, {
                    'Error': 'Missing required token or provided token is invalid.'
                })
            }

        });

    } else {
        callback(400, {
            'Error': 'Missing required fields'
        })
    }

}


/**
 * Menu handler
 * @param {*} data 
 * @param {*} callback 
 */
handlers.menus = function (data, callback) {
    //allowed methods
    var acceptableMethods = ['get'];
    // var acceptableMethods = ['post','get','put','delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._menus[data.method](data, callback);
    } else {
        //method not allowed
        callback(405);
    }
}


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
                            // console.log(err);
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